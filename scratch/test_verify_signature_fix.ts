import crypto from 'crypto';

// Simulated raw bodies based on parsed Firestore payloads
// Note: we want to simulate the raw bodies as they would be received, in the correct order.
// Let's first construct the exact raw body string as it would be sent by PayFast.
// PayFast sends keys in standard order, including empty fields.
// For Order 9922:
const payload9922: any = {
  "m_payment_id": "9922",
  "pf_payment_id": "304743269",
  "payment_status": "COMPLETE",
  "item_name": "Order #9922",
  "item_description": "BEI Practice Setup & Onboarding Fee",
  "amount_gross": "4950.00",
  "amount_fee": "-184.46",
  "amount_net": "4765.54",
  "name_first": "Accountonme",
  "name_last": "",
  "email_address": "George@accountonme.co.za",
  "merchant_id": "23836312",
  "custom_str1": "",
  "custom_str2": "",
  "custom_str3": "",
  "custom_str4": "",
  "custom_str5": "",
  "custom_int1": "",
  "custom_int2": "",
  "custom_int3": "",
  "custom_int4": "",
  "custom_int5": "",
  "signature": "c5e48f27b53e6cac88e947f5e5dd1fcb"
};

const payload9918: any = {
  "m_payment_id": "9918",
  "pf_payment_id": "304092967",
  "payment_status": "COMPLETE",
  "item_name": "Order #9918",
  "item_description": "Accountant's Letter",
  "amount_gross": "950.00",
  "amount_fee": "-37.26",
  "amount_net": "912.74",
  "name_first": "Sean",
  "name_last": "Zimunya",
  "email_address": "socialworkconsultant1@gmail.com",
  "merchant_id": "23836312",
  "custom_str1": "",
  "custom_str2": "",
  "custom_str3": "",
  "custom_str4": "",
  "custom_str5": "",
  "custom_int1": "",
  "custom_int2": "",
  "custom_int3": "",
  "custom_int4": "",
  "custom_int5": "",
  "signature": "54fb24fb8935497659fe5f8fb94b0122"
};

const passphrases = [
    "Thinkestry10$",
    "KhaiFreese10",
    "Thinkestry10",
    ""
];

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

// Simulated rawBody from PayFast (in standard POST order)
const postOrder = [
    'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
    'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
    'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
    'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
    'email_address', 'merchant_id'
];

function testPayload(payload: any, orderId: string, receivedSignature: string) {
    console.log(`\n==========================================`);
    console.log(`Testing Order ${orderId} | Received Signature: ${receivedSignature}`);
    
    // Simulate rawBody in post order
    let rawBodyParts: string[] = [];
    postOrder.forEach(k => {
        if (payload[k] !== undefined) {
            rawBodyParts.push(`${k}=${rfc3986Encode(payload[k])}`);
        }
    });
    const simulatedRawBody = rawBodyParts.join('&') + `&signature=${receivedSignature}`;
    console.log(`Simulated Raw Body: ${simulatedRawBody.substring(0, 100)}...`);

    // Let's test the FIXED verifyPayFastSignature logic:
    // It splits rawBody, but skips keys where value is empty!
    passphrases.forEach(passphrase => {
        const params = simulatedRawBody.split('&');
        let signatureString = '';

        for (const param of params) {
            const eqIndex = param.indexOf('=');
            if (eqIndex === -1) continue;
            const key = param.substring(0, eqIndex);
            const value = param.substring(eqIndex + 1);

            // KEY FIX: Skip 'signature' and ALSO skip if the value is empty!
            if (key !== 'signature' && value !== '') {
                signatureString += `${key}=${value}&`;
            }
        }

        let finalString = signatureString.slice(0, -1);
        
        if (passphrase) {
            const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
            finalString += `&passphrase=${encodedPassphrase}`;
        }

        const calculatedSignature = crypto.createHash('md5').update(finalString).digest('hex');
        const isMatch = calculatedSignature === receivedSignature;
        
        console.log(`  Passphrase: "${passphrase}" -> Calculated: ${calculatedSignature} (Match: ${isMatch})`);
    });
}

testPayload(payload9922, "9922", payload9922.signature);
testPayload(payload9918, "9918", payload9918.signature);
process.exit(0);
