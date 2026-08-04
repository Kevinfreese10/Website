'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkExistingUserByEmail } from './auth-checks';
import { sendOrderConfirmationEmailAction } from './notifications';
import { Order } from '@/lib/types';

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
}) {
  try {
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

    const finalPaymentMethod = paymentMethod || (resellerData?.bankingDetails?.bankName ? 'EFT' : 'PayFast');

    const { getNextOrderId } = await import('@/lib/sequence');
    const orderId = await getNextOrderId();

    const orderData = {
      id: orderId,
      userId: finalUserId,
      customerName: `${firstName} ${lastName}`,
      customerEmail: cleanEmail,
      customerPhone: phone,
      items,
      total,
      discountCode: null,
      discountAmount: null,
      paymentMethod: finalPaymentMethod,
      status: 'Pending Payment',
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
