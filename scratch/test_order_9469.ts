import crypto from 'crypto';

const payload: any = {
  "amount_net": "245.00",
  "pf_payment_id": "SIM_1760713918722",
  "payment_status": "COMPLETE",
  "signature": "7afec059c3d6de3318df8a3080280b74",
  "name_first": "Kevin",
  "item_name": "Order #9469",
  "m_payment_id": "9469",
  "name_last": "Freese",
  "amount_fee": "-5.00",
  "email_address": "freesekevin@gmail.com",
  "merchant_id": "10042278",
  "item_description": "Simulated Payment",
  "amount_gross": "250.00"
};

const receivedSignature = payload.signature;
const passphrase = "KhaiFreese10";

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

const postOrder = [
    'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
    'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
    'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
    'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
    'email_address', 'merchant_id'
];

const alphabeticalKeys = Object.keys(payload).filter(k => k !== 'signature' && payload[k] !== '').sort();

// Let's test all methods
console.log("Received Signature:", receivedSignature);

// Method 1: Alphabetical (RFC 3986)
{
    let parts: string[] = [];
    alphabeticalKeys.forEach(k => {
        parts.push(`${k}=${rfc3986Encode(payload[k])}`);
    });
    let baseStr = parts.join('&');
    if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
    const hash = crypto.createHash('md5').update(baseStr).digest('hex');
    console.log(`Method 1: Alphabetical (RFC 3986) -> ${hash} (Match: ${hash === receivedSignature})`);
}

// Method 2: Alphabetical (Std encode)
{
    let parts: string[] = [];
    alphabeticalKeys.forEach(k => {
        parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
    });
    let baseStr = parts.join('&');
    if (passphrase) baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
    const hash = crypto.createHash('md5').update(baseStr).digest('hex');
    console.log(`Method 2: Alphabetical (Std encode) -> ${hash} (Match: ${hash === receivedSignature})`);
}

// Method 3: Post Order (RFC 3986)
{
    let parts: string[] = [];
    postOrder.forEach(k => {
        if (payload[k] !== undefined && payload[k] !== '') {
            parts.push(`${k}=${rfc3986Encode(payload[k])}`);
        }
    });
    let baseStr = parts.join('&');
    if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
    const hash = crypto.createHash('md5').update(baseStr).digest('hex');
    console.log(`Method 3: Post Order (RFC 3986) -> ${hash} (Match: ${hash === receivedSignature})`);
}

// Method 4: Post Order (Std encode)
{
    let parts: string[] = [];
    postOrder.forEach(k => {
        if (payload[k] !== undefined && payload[k] !== '') {
            parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
        }
    });
    let baseStr = parts.join('&');
    if (passphrase) baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
    const hash = crypto.createHash('md5').update(baseStr).digest('hex');
    console.log(`Method 4: Post Order (Std encode) -> ${hash} (Match: ${hash === receivedSignature})`);
}

// Method 5: Alphabetical (Raw passphrase)
{
    let parts: string[] = [];
    alphabeticalKeys.forEach(k => {
        parts.push(`${k}=${rfc3986Encode(payload[k])}`);
    });
    let baseStr = parts.join('&');
    if (passphrase) baseStr += `&passphrase=${passphrase}`;
    const hash = crypto.createHash('md5').update(baseStr).digest('hex');
    console.log(`Method 5: Alphabetical (Raw passphrase) -> ${hash} (Match: ${hash === receivedSignature})`);
}
