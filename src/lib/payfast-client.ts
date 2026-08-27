import { createPayFastPaymentSessionAction, PayFastPaymentRequest } from '@/app/actions/payfast-actions';

/**
 * Initiates a PayFast payment by requesting an MD5-signed payload from the server
 * and submitting the standard POST form directly to PayFast.
 */
export async function submitPayFastPayment(request: PayFastPaymentRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await createPayFastPaymentSessionAction(request);
    if (!session.success || !session.fields || !session.processUrl) {
      return { success: false, error: session.error || 'Failed to initialize PayFast payment.' };
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = session.processUrl;
    form.setAttribute('target', '_top');

    for (const [key, value] of Object.entries(session.fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    return { success: true };
  } catch (err: any) {
    console.error('submitPayFastPayment error:', err);
    return { success: false, error: err?.message || 'Error submitting to payment gateway.' };
  }
}
