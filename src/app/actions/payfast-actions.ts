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
 * PayFast official canonical parameter ordering for payment initiation.
 * Parameters must be strictly in this order when constructing the signature
 * and the submitted form payload.
 */
const PAYFAST_CANONICAL_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'email_confirmation',
  'confirmation_address',
  'payment_method',
  'subscription_type',
  'billing_date',
  'recurring_amount',
  'frequency',
  'cycles',
] as const;

function rfc3986Encode(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');
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
    const passphrase = (process.env.PAYFAST_PASSPHRASE || '').trim();

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

    const cleanItemName = (req.itemName || `Order #${req.orderId}`).replace(/[\r\n\t]/g, ' ').trim().slice(0, 100);
    const cleanItemDesc = (req.itemDescription || cleanItemName).replace(/[\r\n\t]/g, ' ').trim().slice(0, 255);
    const cleanPhone = (req.customerPhone || '').replace(/[^0-9+]/g, '').trim();

    const rawData: Record<string, string | undefined> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: (req.customerEmail || 'client@myacc.co.za').trim(),
      cell_number: cleanPhone || undefined,
      m_payment_id: String(req.orderId),
      amount: Number(req.amount).toFixed(2),
      item_name: cleanItemName,
      item_description: cleanItemDesc,
    };

    if (req.subscription) {
      rawData.subscription_type = req.subscription.subscription_type || '1';
      rawData.billing_date = req.subscription.billing_date;
      rawData.recurring_amount = req.subscription.recurring_amount !== undefined 
        ? Number(req.subscription.recurring_amount).toFixed(2) 
        : undefined;
      rawData.frequency = req.subscription.frequency || '3';
      rawData.cycles = req.subscription.cycles || '0';
    }

    // Build URL-encoded query string in exact canonical PayFast order (RFC 3986)
    const fields: Record<string, string> = {};
    let pfOutput = '';

    for (const key of PAYFAST_CANONICAL_ORDER) {
      const val = rawData[key];
      if (val !== undefined && val !== null && val.trim() !== '') {
        const trimmedVal = val.trim();
        fields[key] = trimmedVal;
        pfOutput += `${key}=${rfc3986Encode(trimmedVal)}&`;
      }
    }

    let finalString = pfOutput.slice(0, -1);
    if (passphrase) {
      finalString += `&passphrase=${rfc3986Encode(passphrase)}`;
    }

    const signature = crypto.createHash('md5').update(finalString).digest('hex');
    fields.signature = signature;

    return {
      success: true,
      processUrl,
      fields,
    };
  } catch (error: any) {
    console.error('Error generating PayFast payment session:', error);
    return {
      success: false,
      error: error?.message || 'Could not generate PayFast payment session.',
    };
  }
}
