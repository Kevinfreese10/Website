/**
 * Deeper signature diagnosis — tries the exact raw body encoding
 * that PayFast would have sent, including URL-encoded special chars.
 */
import crypto from 'crypto';

const receivedSignature = 'a110fab3660c6c84e4436fbae1cf4bce';

// The raw body as PayFast would have sent it (URL-encoded form)
// Based on the ITN payload fields
const fields: [string, string][] = [
    ['m_payment_id', '9955'],
    ['pf_payment_id', '3200023'],
    ['payment_status', 'COMPLETE'],
    ['item_name', 'Order+%239955'],             // "Order #9955" URL-encoded
    ['item_description', 'EMP201+Return+Submission+%28Nil%29'], // special chars
    ['amount_gross', '200.00'],
    ['amount_fee', '-4.60'],
    ['amount_net', '195.40'],
    ['custom_str1', ''],
    ['custom_str2', ''],
    ['custom_str3', ''],
    ['custom_str4', ''],
    ['custom_str5', ''],
    ['custom_int1', ''],
    ['custom_int2', ''],
    ['custom_int3', ''],
    ['custom_int4', ''],
    ['custom_int5', ''],
    ['name_first', 'Kevin'],
    ['name_last', 'Freese'],
    ['email_address', 'freesekevin%40gmail.com'], // @ encoded
    ['merchant_id', '10049800'],
    ['signature', receivedSignature],
];

const passphrases: (string | undefined)[] = [
    'KhaiFreese10',
    'KhaiFreese11',
    '',
    undefined,
];

function verifySignatureFromRaw(rawBody: string, passphrase?: string): string {
    const params = rawBody.split('&');
    let signatureString = '';
    for (const param of params) {
        const eqIndex = param.indexOf('=');
        if (eqIndex === -1) continue;
        const key = param.substring(0, eqIndex);
        const value = param.substring(eqIndex + 1);
        if (key !== 'signature' && value !== '') {
            signatureString += `${key}=${value}&`;
        }
    }
    let finalString = signatureString.slice(0, -1);
    if (passphrase) {
        const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        finalString += `&passphrase=${encodedPassphrase}`;
    }
    return crypto.createHash('md5').update(finalString).digest('hex');
}

const rawBody = fields.map(([k, v]) => `${k}=${v}`).join('&');
console.log('Raw body built:', rawBody.substring(0, 120) + '...');
console.log('');
console.log(`Target signature: ${receivedSignature}`);
console.log('');

for (const pp of passphrases) {
    const sig = verifySignatureFromRaw(rawBody, pp);
    const label = pp === undefined ? '(no passphrase)' : pp === '' ? '(empty)' : `"${pp}"`;
    console.log(`${label}: ${sig} ${sig === receivedSignature ? '✅ MATCH!' : '❌'}`);
}

// Also try without URL-encoding on item_name and item_description
console.log('\n--- Without special URL-encoding on item fields ---');
const fieldsPlain: [string, string][] = [
    ['m_payment_id', '9955'],
    ['pf_payment_id', '3200023'],
    ['payment_status', 'COMPLETE'],
    ['item_name', 'Order+%239955'],
    ['item_description', 'EMP201+Return+Submission+%28Nil%29'],
    ['amount_gross', '200.00'],
    ['amount_fee', '-4.60'],
    ['amount_net', '195.40'],
    ['name_first', 'Kevin'],
    ['name_last', 'Freese'],
    ['email_address', 'freesekevin%40gmail.com'],
    ['merchant_id', '10049800'],
    ['signature', receivedSignature],
];
const rawBodyPlain = fieldsPlain.map(([k, v]) => `${k}=${v}`).join('&');
for (const pp of passphrases) {
    const sig = verifySignatureFromRaw(rawBodyPlain, pp);
    const label = pp === undefined ? '(no passphrase)' : pp === '' ? '(empty)' : `"${pp}"`;
    console.log(`${label}: ${sig} ${sig === receivedSignature ? '✅ MATCH!' : '❌'}`);
}
