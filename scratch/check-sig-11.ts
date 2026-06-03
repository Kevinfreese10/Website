import crypto from 'crypto';

const payload: Record<string, string> = {
  "m_payment_id": "9943",
  "amount_fee": "-9.66",
  "pf_payment_id": "305649245",
  "item_name": "Order #9943",
  "custom_str3": "",
  "custom_str1": "",
  "custom_int3": "",
  "merchant_id": "23836312",
  "custom_int4": "",
  "payment_status": "COMPLETE",
  "amount_gross": "200.00",
  "custom_int2": "",
  "custom_str4": "",
  "custom_int1": "",
  "name_first": "Kevin",
  "custom_int5": "",
  "custom_str5": "",
  "item_description": "EMP201 Return Submission (Nil)",
  "amount_net": "190.34",
  "custom_str2": "",
  "email_address": "freesekevin@gmail.com",
  "name_last": "Freese"
};

const targetSig = "07c52fd82f98cdc00aa66cddfe50b069";

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

function generateSignature(data: { [key: string]: any }, passphrase?: string): string {
    let pfOutput = '';
    
    const orderedKeys = [
        'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
        'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
        'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
        'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
        'email_address', 'merchant_id'
    ];

    orderedKeys.forEach(key => {
        if (data.hasOwnProperty(key) && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
             pfOutput += `${key}=${rfc3986Encode(String(data[key]).trim())}&`;
        }
    });

    let getString = pfOutput.slice(0, -1);
    
    if (passphrase) {
        getString += `&passphrase=${rfc3986Encode(passphrase.trim())}`;
    }

    return crypto.createHash('md5').update(getString).digest('hex');
}

const signature = generateSignature(payload, "KhaiFreese11");
console.log(`Expected signature with KhaiFreese11: ${signature}`);
console.log(`Target signature: ${targetSig}`);
if (signature === targetSig) {
    console.log("MATCH FOUND!");
} else {
    console.log("No match.");
}
