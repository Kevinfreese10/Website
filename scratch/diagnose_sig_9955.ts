/**
 * Diagnose PayFast ITN signature mismatch for Order 9955
 * 
 * We'll re-compute the signature using the exact raw body from the ITN payload
 * and try different passphrases to find which one matches the received signature.
 */

import crypto from 'crypto';

// Exact payload received from PayFast ITN for Order 9955
const itnPayload = {
    m_payment_id: '9955',
    pf_payment_id: '3200023',
    payment_status: 'COMPLETE',
    item_name: 'Order #9955',
    item_description: 'EMP201 Return Submission (Nil)',
    amount_gross: '200.00',
    amount_fee: '-4.60',
    amount_net: '195.40',
    custom_str1: '',
    custom_str2: '',
    custom_str3: '',
    custom_str4: '',
    custom_str5: '',
    custom_int1: '',
    custom_int2: '',
    custom_int3: '',
    custom_int4: '',
    custom_int5: '',
    name_first: 'Kevin',
    name_last: 'Freese',
    email_address: 'freesekevin@gmail.com',
    merchant_id: '10049800',
    signature: 'a110fab3660c6c84e4436fbae1cf4bce'
};

const receivedSignature = 'a110fab3660c6c84e4436fbae1cf4bce';

function computeSignature(payload: Record<string, string>, passphrase?: string): string {
    // Build param string excluding 'signature' and empty values
    let str = Object.entries(payload)
        .filter(([k, v]) => k !== 'signature' && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
        .join('&');

    if (passphrase) {
        const encodedPass = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        str += `&passphrase=${encodedPass}`;
    }

    return crypto.createHash('md5').update(str).digest('hex');
}

// Also try the raw-body approach (no re-encoding) which is what the server uses
function computeSignatureRaw(payload: Record<string, string>, passphrase?: string): string {
    let str = Object.entries(payload)
        .filter(([k, v]) => k !== 'signature' && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

    if (passphrase) {
        const encodedPass = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        str += `&passphrase=${encodedPass}`;
    }

    return crypto.createHash('md5').update(str).digest('hex');
}

const passphrases = [
    'KhaiFreese10',
    'KhaiFreese11',
    '',
    undefined,
];

console.log('🔍 PayFast Signature Diagnosis for Order 9955');
console.log('='.repeat(60));
console.log(`Received Signature: ${receivedSignature}`);
console.log('');

for (const pp of passphrases) {
    const encoded = computeSignature(itnPayload, pp as string | undefined);
    const raw = computeSignatureRaw(itnPayload, pp as string | undefined);
    const label = pp === undefined ? '(no passphrase)' : pp === '' ? '(empty string)' : `"${pp}"`;
    
    console.log(`Passphrase ${label}:`);
    console.log(`  Re-encoded approach : ${encoded} ${encoded === receivedSignature ? '✅ MATCH!' : '❌'}`);
    console.log(`  Raw-value approach  : ${raw} ${raw === receivedSignature ? '✅ MATCH!' : '❌'}`);
    console.log('');
}
