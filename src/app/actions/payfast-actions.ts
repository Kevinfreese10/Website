'use server';

import crypto from 'crypto';

export interface PayFastPaymentRequest {
  orderId: string;
  amount: number;
  itemName: string;
  itemDescription?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  returnPath?: string;
  cancelPath?: string;
  subscription?: {
    subscription_type?: '1';
    billing_date?: string;
    recurring_amount?: number;
    frequency?: '3' | '6';
    cycles?: '0' | string;
  };
}

export interface PayFastSessionResult {
  success: boolean;
  processUrl?: string;
  fields?: Record<string, string>;
  error?: string;
}

/**
 * Server action to generate an authenticated, MD5-signed PayFast checkout payload.
 * Strictly adheres to official PayFast integration requirements.
 */
export async function createPayFastPaymentSessionAction(req: PayFastPaymentRequest): Promise<PayFastSessionResult> {
  try {
    if (!req.orderId || req.amount === undefined || isNaN(Number(req.amount)) || Number(req.amount) <= 0) {
      return { success: false, error: 'Invalid order ID or payment amount.' };
    }

    const merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '23836312';
    const merchantKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || 'h4fkhz6ouoksx';
    const processUrl = process.env.NEXT_PUBLIC_PAYFAST_PROCESS_URL || 'https://www.payfast.co.za/eng/process';
    const passphrase = process.env.PAYFAST_PASSPHRASE || 'MikeOxlong10';

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.myacc.co.za').replace(/\/+$/, '');
    
    const returnPath = req.returnPath 
      ? (req.returnPath.startsWith('/') ? req.returnPath : `/${req.returnPath}`) 
      : `/payment-success/${req.orderId}`;
      
    const cancelPath = req.cancelPath 
      ? (req.cancelPath.startsWith('/') ? req.cancelPath : `/${req.cancelPath}`) 
      : `/cart`;

    const returnUrl = `${baseUrl}${returnPath}`;
    const cancelUrl = `${baseUrl}${cancelPath}`;
    const notifyUrl = `${baseUrl}/api/payfast/notify`;

    const fullName = (req.customerName || 'Valued Customer').trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Valued';
    const lastName = nameParts.slice(1).join(' ') || (firstName === 'Valued' ? 'Customer' : 'Client');

    const cleanItemName = (req.itemName || `Order #${req.orderId}`).slice(0, 100);
    const cleanItemDesc = (req.itemDescription || cleanItemName).slice(0, 255);
    const cleanPhone = (req.customerPhone || '').replace(/[^0-9+]/g, '').trim();

    const data: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: (req.customerEmail || 'client@myacc.co.za').trim(),
      m_payment_id: String(req.orderId),
      amount: Number(req.amount).toFixed(2),
      item_name: cleanItemName,
      item_description: cleanItemDesc,
    };

    if (cleanPhone) {
      data.cell_number = cleanPhone;
    }

    if (req.subscription) {
      data.subscription_type = req.subscription.subscription_type || '1';
      data.frequency = req.subscription.frequency || '3';
      data.cycles = req.subscription.cycles || '0';
      if (req.subscription.billing_date) {
        data.billing_date = req.subscription.billing_date;
      }
      if (req.subscription.recurring_amount !== undefined) {
        data.recurring_amount = Number(req.subscription.recurring_amount).toFixed(2);
      }
    }

    // Build URL encoded query string in exact order for PayFast MD5 signature
    let pfOutput = '';
    for (const key in data) {
      const val = data[key];
      if (val !== undefined && val !== null && val !== '') {
        pfOutput += `${key}=${encodeURIComponent(val).replace(/%20/g, '+')}&`;
      }
    }

    let finalString = pfOutput.slice(0, -1);
    if (passphrase && passphrase.trim() !== '') {
      finalString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    }

    const signature = crypto.createHash('md5').update(finalString).digest('hex');
    data.signature = signature;

    return {
      success: true,
      processUrl,
      fields: data,
    };
  } catch (error: any) {
    console.error('Error generating PayFast payment session:', error);
    return {
      success: false,
      error: error?.message || 'Could not generate PayFast payment session.',
    };
  }
}
