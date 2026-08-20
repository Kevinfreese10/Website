'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkExistingUserByEmail } from './auth-checks';
import { sendOrderConfirmationEmailAction } from './notifications';
import { Order, OrderServiceSnapshot, OrderChecklistItem } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getServiceChecklist, normalizeRequirementsWithIds } from '@/lib/services';

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

        serviceSnapshots.push({
          serviceId: item.id,
          title: serviceData.title || item.title,
          department: serviceData.department || 'Administration',
          requirements: normalizedReqs,
          checklist: serviceChecklist,
        });

        serviceChecklist.forEach((step, idx) => {
          initialChecklist.push({
            id: `chk_${item.id}_${step.id || idx}`,
            serviceId: item.id,
            serviceTitle: serviceData.title || item.title,
            title: step.title,
            description: step.description || '',
            type: step.type || 'manual',
            status: 'pending',
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
      const discountDoc = await adminDb.collection('discounts').doc(codeClean).get();
      if (discountDoc.exists) {
        const dData = discountDoc.data()!;
        const isValidStatus = dData.status !== 'used';
        const isClientAllowed = !dData.clientEmail || !dData.clientEmail.trim() || dData.clientEmail.toLowerCase().trim() === cleanEmail;

        if (isValidStatus && isClientAllowed && typeof dData.percentage === 'number' && dData.percentage > 0) {
          appliedDiscountCode = codeClean;
          appliedDiscountAmount = Math.round((calculatedTotal * dData.percentage) / 100);
          calculatedTotal = Math.max(0, calculatedTotal - appliedDiscountAmount);
        }
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
