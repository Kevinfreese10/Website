'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkExistingUserByEmail } from './auth-checks';
import { sendOrderConfirmationEmailAction } from './notifications';
import { Order, OrderServiceSnapshot, OrderChecklistItem } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getServiceChecklist, normalizeRequirementsWithIds, isPlaybookApproved, pickStepConfig } from '@/lib/services';

export async function validateDiscountCodeAction({
  code,
  email,
  subtotal,
}: {
  code: string;
  email?: string;
  subtotal: number;
}) {
  try {
    if (!code || !code.trim()) {
      return { success: false, error: 'Please enter a discount code.' };
    }
    const adminDb = getAdminDb();
    const cleanCode = code.trim().toUpperCase();
    const discountDoc = await adminDb.collection('discounts').doc(cleanCode).get();

    if (!discountDoc.exists) {
      return { success: false, error: 'Invalid discount code.' };
    }

    const data = discountDoc.data()!;
    if (data.status === 'used') {
      return { success: false, error: 'This discount code has already been used.' };
    }

    if (data.clientEmail && data.clientEmail.trim()) {
      const allowedEmail = data.clientEmail.toLowerCase().trim();
      const clientEmail = (email || '').toLowerCase().trim();
      if (clientEmail && allowedEmail !== clientEmail) {
        return { success: false, error: `This discount code is only valid for ${allowedEmail}.` };
      }
    }

    const percentage = Number(data.percentage) || 0;
    if (percentage <= 0 || percentage > 100) {
      return { success: false, error: 'Invalid discount percentage.' };
    }

    const discountAmount = Math.round((subtotal * percentage) / 100);
    const newTotal = Math.max(0, subtotal - discountAmount);

    return {
      success: true,
      code: cleanCode,
      percentage,
      discountAmount,
      newTotal,
      message: `${percentage}% discount applied! (-R ${discountAmount.toLocaleString('en-ZA')})`,
    };
  } catch (error: any) {
    console.error('Error validating discount code:', error);
    return { success: false, error: 'Could not validate discount code. Please try again.' };
  }
}

export async function createCheckoutOrderAction({
  firstName,
  lastName,
  email,
  phone,
  items,
  total,
  paymentMethod,
  partnerId,
  userId,
  discountCode,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
  total: number;
  paymentMethod?: 'EFT' | 'PayFast';
  partnerId?: string;
  userId?: string | null;
  discountCode?: string | null;
}) {
  try {
    const rateLimit = await checkRateLimit('checkout', 5, 60000); // max 5 orders per minute per IP
    if (!rateLimit.success) {
      return {
        success: false,
        error: 'rate-limit-exceeded',
        message: 'Too many order attempts from your connection. Please wait a minute before trying again.',
      };
    }

    const adminDb = getAdminDb();

    const adminAuth = getAdminAuth();
    const cleanEmail = email.toLowerCase().trim();

    let finalUserId = userId || null;
    let isNewUser = false;
    let generatedPassword = null;

    if (!finalUserId) {
      const existing = await checkExistingUserByEmail(cleanEmail);
      if (existing.exists && existing.id) {
        return {
          success: false,
          error: 'auth/email-already-in-use',
          message: 'An account already exists with this email address. Please log in to continue.',
        };
      }

      isNewUser = true;
      const { customAlphabet } = await import('nanoid');
      const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
      generatedPassword = nanoid();

      const userRecord = await adminAuth.createUser({
        email: cleanEmail,
        password: generatedPassword,
        displayName: `${firstName} ${lastName}`,
      });
      finalUserId = userRecord.uid;

      await adminDb.collection('users').doc(finalUserId).set({
        id: finalUserId,
        uid: finalUserId,
        name: `${firstName} ${lastName}`,
        email: cleanEmail,
        contactNumber: phone,
        role: 'client',
        source: partnerId ? 'Partner Landing Page' : 'Website',
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    let resellerData: any = undefined;
    let resellerIdToSet = partnerId || undefined;

    if (partnerId) {
      const partnerSnap = await adminDb.collection('users').doc(partnerId).get();
      if (partnerSnap.exists) {
        resellerData = { ...partnerSnap.data(), id: partnerSnap.id };
      }
    } else if (finalUserId) {
      const userSnap = await adminDb.collection('users').doc(finalUserId).get();
      if (userSnap.exists) {
        const uData = userSnap.data();
        if (uData?.role === 'partner' || uData?.role === 'partner_staff') {
          resellerIdToSet = finalUserId;
        }
      }
    }

    const { getNextOrderId } = await import('@/lib/sequence');
    const orderId = await getNextOrderId();

    const paymentConfigDoc = await adminDb.collection('settings').doc('payment_methods').get();
    let finalPaymentMethod = paymentMethod || (resellerData?.bankingDetails?.bankName ? 'EFT' : 'PayFast');
    if (!paymentMethod && paymentConfigDoc.exists) {
      const config = paymentConfigDoc.data();
      if (config?.defaultMethod === 'EFT') {
        finalPaymentMethod = 'EFT';
      }
    }

    let calculatedTotal = 0;
    const serviceSnapshots: OrderServiceSnapshot[] = [];
    const initialChecklist: OrderChecklistItem[] = [];

    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const serviceDoc = await adminDb.collection('services').doc(item.id).get();
        if (!serviceDoc.exists) {
          throw new Error(`Service ${item.id} not found.`);
        }
        const serviceData = serviceDoc.data()!;
        let finalUnitPrice = serviceData.price || 0;

        if (partnerId) {
          const retailFloor = serviceData.retailPrice || serviceData.price || 0;
          const overrideSnap = await adminDb
            .collection('users')
            .doc(partnerId)
            .collection('serviceOverrides')
            .doc(item.id)
            .get();

          if (overrideSnap.exists) {
            const overrideData = overrideSnap.data()!;
            if (typeof overrideData.price === 'number') {
              finalUnitPrice = Math.max(overrideData.price, retailFloor);
            }
          }
        }

        // Allow legitimate 20% bundle package discount when prerequisites are purchased together
        const isBundleDiscounted = items.length > 1 && item.price && Math.abs(item.price - Math.round(finalUnitPrice * 0.8)) <= 2;
        if (isBundleDiscounted) {
          finalUnitPrice = Math.round(finalUnitPrice * 0.8);
        }

        const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
        calculatedTotal += finalUnitPrice * qty;

        const normalizedReqs = normalizeRequirementsWithIds(serviceData.informationToProvide || []);
        const serviceChecklist = getServiceChecklist(serviceData);

        // Freeze playbook approval state at checkout so later edits to the service
        // never change what the agent is allowed to do on an in-flight order.
        const playbookApproved = isPlaybookApproved(serviceData);

        serviceSnapshots.push({
          serviceId: item.id,
          title: serviceData.title || item.title,
          department: serviceData.department || 'Administration',
          requirements: normalizedReqs,
          checklist: serviceChecklist,
          playbookApproved,
          ...(serviceData.playbookVersion ? { playbookVersion: serviceData.playbookVersion } : {}),
          ...(serviceData.playbookEntity ? { playbookEntity: serviceData.playbookEntity } : {}),
        });

        serviceChecklist.forEach((step, idx) => {
          const stepConfig = pickStepConfig(step);
          initialChecklist.push({
            id: `chk_${item.id}_${step.id || idx}`,
            serviceId: item.id,
            serviceTitle: serviceData.title || item.title,
            title: step.title,
            description: step.description || '',
            type: step.type || 'manual',
            status: 'pending',
            // Previously dropped here — the agent needs these on the order (plan §3.3).
            ...(step.aiInstructions ? { aiInstructions: step.aiInstructions } : {}),
            ...(step.templateIds && step.templateIds.length ? { templateIds: step.templateIds } : {}),
            ...(stepConfig ? { stepConfig } : {}),
          });
        });

        return {
          id: item.id,
          title: serviceData.title || item.title,
          price: finalUnitPrice,
          quantity: qty,
        };
      })
    );

    // Validate promo / discount code server-side if provided
    let appliedDiscountCode: string | null = null;
    let appliedDiscountAmount: number | null = null;

    if (discountCode && discountCode.trim()) {
      const codeClean = discountCode.trim().toUpperCase();
      const discountRef = adminDb.collection('discounts').doc(codeClean);

      // Claim the code atomically as part of validating it.
      //
      // Previously this was a plain read followed by a separate write elsewhere (and no write at
      // all on the EFT path), which meant (a) the same single-use code could be applied to any
      // number of concurrent or sequential orders before one of them was paid, and (b) EFT orders
      // never consumed the code at all. A transaction closes the check-then-act window.
      //
      // It also used to fail SILENTLY: an expired, used or wrong-customer code was simply ignored
      // and the order was created at full price, so the customer saw a discounted total at
      // checkout and was charged a different one. Now it returns an explicit error.
      let discountError: string | null = null;
      try {
        const claimed = await adminDb.runTransaction(async (tx) => {
          const snap = await tx.get(discountRef);
          if (!snap.exists) {
            discountError = 'That discount code is not valid.';
            return null;
          }
          const dData = snap.data()!;

          if (dData.status === 'used') {
            discountError = 'That discount code has already been used.';
            return null;
          }

          const expiresAt = dData.expiresAt?.toDate ? dData.expiresAt.toDate() : (dData.expiresAt ? new Date(dData.expiresAt) : null);
          if (expiresAt && expiresAt.getTime() < Date.now()) {
            discountError = 'That discount code has expired.';
            return null;
          }

          const allowedEmail = (dData.clientEmail || '').toLowerCase().trim();
          if (allowedEmail && allowedEmail !== cleanEmail) {
            discountError = 'That discount code is not valid for this email address.';
            return null;
          }

          const pct = Number(dData.percentage);
          if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
            discountError = 'That discount code is not valid.';
            return null;
          }

          // Mark consumed within the same transaction so a concurrent checkout cannot also claim it.
          tx.update(discountRef, {
            status: 'used',
            usedByEmail: cleanEmail,
            usedAt: new Date(),
            usedOnOrderId: orderId,
          });

          return pct;
        });

        if (claimed !== null) {
          appliedDiscountCode = codeClean;
          appliedDiscountAmount = Math.round((calculatedTotal * (claimed as number)) / 100);
          calculatedTotal = Math.max(0, calculatedTotal - appliedDiscountAmount);
        }
      } catch (e: any) {
        console.error('[checkout] Discount claim failed:', e);
        discountError = 'Could not apply that discount code. Please try again.';
      }

      if (discountError) {
        return { success: false, error: discountError };
      }
    }

    const orderData = {
      id: orderId,
      userId: finalUserId,
      customerName: `${firstName} ${lastName}`,
      customerEmail: cleanEmail,
      customerPhone: phone,
      items: validatedItems,
      total: calculatedTotal,
      discountCode: appliedDiscountCode,
      discountAmount: appliedDiscountAmount,
      paymentMethod: finalPaymentMethod,
      status: 'Pending Payment',
      fulfillmentStatus: 'Awaiting Documents',
      serviceSnapshots,
      checklist: initialChecklist,
      date: new Date(),
      source: partnerId ? 'Partner Landing Page' : 'Client',
      originalOrderId: null,
      ...(resellerIdToSet ? { resellerId: resellerIdToSet } : {}),
    };

    await adminDb.collection('orders').doc(orderId).set(orderData);

    try {
      const serializableOrder = JSON.parse(JSON.stringify(orderData));
      const serializableReseller = resellerData ? JSON.parse(JSON.stringify(resellerData)) : undefined;

      await sendOrderConfirmationEmailAction({
        orderData: serializableOrder,
        resellerData: serializableReseller,
        isNewUser,
        generatedPassword: generatedPassword || undefined,
        showPaymentButton: !resellerData?.bankingDetails?.bankName,
      });
    } catch (emailError) {
      console.error("Non-blocking order email send error in action:", emailError);
    }

    return {
      success: true,
      orderId,
      userId: finalUserId,
      isNewUser,
      generatedPassword,
    };
  } catch (error: any) {
    console.error("Error in createCheckoutOrderAction:", error);
    return {
      success: false,
      error: error.code || 'error',
      message: error.message || 'There was a problem saving your order.',
    };
  }
}
