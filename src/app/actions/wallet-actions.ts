'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from '@/lib/email';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WalletActionSuccess<T extends Record<string, unknown>> {
  success: true;
  error?: never;
  [key: string]: unknown;
}

type InsufficientFundsError = {
  success?: never;
  error: 'INSUFFICIENT_FUNDS';
  required: number;
  balance: number;
};

type GenericError = {
  success?: never;
  error: string;
};

// ---------------------------------------------------------------------------
// Action 1: completeOrderWithRoyalty
// ---------------------------------------------------------------------------

/**
 * Deducts a platform royalty fee from the partner's credit balance and marks
 * the order as Processing.  Must be called after an order is ready to fulfil.
 *
 * @param orderId   - Firestore document ID of the order.
 * @param partnerId - Firestore document ID of the partner (= user UID).
 */
export async function completeOrderWithRoyalty(
  orderId: string,
  partnerId: string,
): Promise<
  | { success: true; royalty: number }
  | InsufficientFundsError
  | GenericError
> {
  try {
    const db = getAdminDb();

    const partnerRef = db.collection('users').doc(partnerId);
    const orderRef = db.collection('orders').doc(orderId);

    // -----------------------------------------------------------------------
    // Firestore transaction – read, validate, then write atomically
    // -----------------------------------------------------------------------
    let royalty = 0;

    const result = await db.runTransaction(async (transaction) => {
      const [partnerSnap, orderSnap] = await Promise.all([
        transaction.get(partnerRef),
        transaction.get(orderRef),
      ]);

      if (!partnerSnap.exists) {
        throw new Error(`Partner document not found: ${partnerId}`);
      }
      if (!orderSnap.exists) {
        throw new Error(`Order document not found: ${orderId}`);
      }

      const partnerData = partnerSnap.data()!;
      const orderData = orderSnap.data()!;

      const orderTotal: number = orderData.total ?? 0;
      const creditBalance: number = partnerData.creditBalance ?? 0;

      royalty = Math.max(100, Math.min(500, orderTotal * 0.1));

      if (creditBalance < royalty) {
        // Return a sentinel so we can surface this outside the transaction
        return {
          error: 'INSUFFICIENT_FUNDS' as const,
          required: royalty,
          balance: creditBalance,
        };
      }

      // Writes – only reached when balance is sufficient
      transaction.update(partnerRef, {
        creditBalance: creditBalance - royalty,
      });

      transaction.update(orderRef, {
        status: 'Processing',
      });

      return null; // success sentinel
    });

    // Surface insufficient-funds error that was raised inside the transaction
    if (result !== null) {
      return result as InsufficientFundsError;
    }

    // -----------------------------------------------------------------------
    // Wallet log – written outside the transaction (non-critical audit trail)
    // -----------------------------------------------------------------------
    await partnerRef.collection('walletLogs').add({
      amount: -royalty,
      type: 'royalty',
      orderId,
      description: `Platform royalty fee for Order #${orderId}`,
      date: new Date(),
    });

    return { success: true, royalty };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Action 2: outsourceOrderFromWallet
// ---------------------------------------------------------------------------

/**
 * Deducts the wholesale cost for all items in the order from the partner's
 * credit balance, marks the order as outsourced, and appends a system note.
 *
 * @param orderId         - Firestore document ID of the order.
 * @param partnerId       - Firestore document ID of the partner (= user UID).
 * @param documentContact - Whether docs should be addressed to 'partner' or 'client'.
 */
export async function outsourceOrderFromWallet(
  orderId: string,
  partnerId: string,
  documentContact: 'partner' | 'client',
): Promise<
  | { success: true; cost: number }
  | InsufficientFundsError
  | GenericError
> {
  try {
    const db = getAdminDb();

    const partnerRef = db.collection('users').doc(partnerId);
    const orderRef = db.collection('orders').doc(orderId);

    // -----------------------------------------------------------------------
    // Firestore transaction – read, validate, then write atomically
    // -----------------------------------------------------------------------
    let cost = 0;

    const result = await db.runTransaction(async (transaction) => {
      const [partnerSnap, orderSnap] = await Promise.all([
        transaction.get(partnerRef),
        transaction.get(orderRef),
      ]);

      if (!partnerSnap.exists) {
        throw new Error(`Partner document not found: ${partnerId}`);
      }
      if (!orderSnap.exists) {
        throw new Error(`Order document not found: ${orderId}`);
      }

      const partnerData = partnerSnap.data()!;
      const orderData = orderSnap.data()!;
      const creditBalance: number = partnerData.creditBalance ?? 0;

      // Fetch all service docs in parallel (reads must occur before writes)
      const items: Array<{ id: string; price: number; quantity: number }> =
        orderData.items ?? [];

      const serviceSnaps = await Promise.all(
        items.map((item) =>
          transaction.get(db.collection('services').doc(item.id)),
        ),
      );

      // Calculate wholesale cost
      cost = items.reduce((acc, item, idx) => {
        const serviceData = serviceSnaps[idx].data();
        const unitPrice: number =
          serviceData?.resellerPrice ?? item.price * 0.8;
        return acc + unitPrice * (item.quantity ?? 1);
      }, 0);

      if (creditBalance < cost) {
        return {
          error: 'INSUFFICIENT_FUNDS' as const,
          required: cost,
          balance: creditBalance,
        };
      }

      // Writes
      transaction.update(partnerRef, {
        creditBalance: creditBalance - cost,
      });

      transaction.update(orderRef, {
        isOutsourced: true,
        status: 'Processing',
        documentContact,
      });

      return null; // success sentinel
    });

    // Surface insufficient-funds error raised inside the transaction
    if (result !== null) {
      return result as InsufficientFundsError;
    }

    // -----------------------------------------------------------------------
    // Post-transaction writes – wallet log + order note + email notification
    // -----------------------------------------------------------------------
    await Promise.all([
      // Wallet audit log
      partnerRef.collection('walletLogs').add({
        amount: -cost,
        type: 'outsource',
        orderId,
        description: `Outsource fee for Order #${orderId} to My Accountant`,
        date: new Date(),
      }),

      // System note appended to the order
      orderRef.update({
        notes: FieldValue.arrayUnion({
          text: 'Order outsourced to My Accountant. Cost deducted from partner wallet.',
          authorId: 'system',
          date: new Date(),
          type: 'note',
          subject: null,
          attachments: null,
        }),
      }),
    ]);

    // Send email notification to partner practice owner
    try {
      const partnerSnap = await partnerRef.get();
      if (partnerSnap.exists) {
        const partnerData = partnerSnap.data()!;
        const remainingBalance = partnerData.creditBalance ?? 0;
        const partnerEmail = partnerData.email;

        if (partnerEmail) {
          const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #214392; margin-top: 0;">Order #${orderId} Outsourced</h2>
              <p>Hi ${partnerData.name || 'Partner'},</p>
              <p>Your order <strong>#${orderId}</strong> has been successfully outsourced to <strong>My Accountant</strong> for fulfillment.</p>
              
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #214392;">
                <p style="margin: 4px 0;"><strong>Wholesale Cost Deducted:</strong> R${cost.toFixed(2)}</p>
                <p style="margin: 4px 0;"><strong>Remaining Wallet Balance:</strong> R${remainingBalance.toFixed(2)}</p>
                <p style="margin: 4px 0;"><strong>Document Contact Preference:</strong> ${documentContact === 'client' ? 'Contact client directly' : 'Contact partner practice'}</p>
              </div>

              <p>Our team will review the requirements and begin processing work immediately.</p>
              <p style="margin-top: 30px; font-size: 13px; color: #64748b;">My Accountant Operations Team</p>
            </div>
          `;

          await sendEmail({
            to: partnerEmail,
            subject: `Confirmation: Order #${orderId} Outsourced to My Accountant`,
            html: emailHtml,
          });
        }
      }
    } catch (emailErr) {
      console.error('[wallet-actions] Failed to send outsource confirmation email:', emailErr);
    }

    return { success: true, cost };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    return { error: message };
  }
}
