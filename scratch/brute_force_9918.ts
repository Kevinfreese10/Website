import crypto from 'crypto';

const payload: any = {
  "m_payment_id": "9918",
  "pf_payment_id": "304092967",
  "custom_int4": "",
  "name_first": "Sean",
  "custom_str1": "",
  "amount_fee": "-37.26",
  "custom_int5": "",
  "amount_net": "912.74",
  "name_last": "Zimunya",
  "payment_status": "COMPLETE",
  "amount_gross": "950.00",
  "item_description": "Accountant's Letter",
  "merchant_id": "23836312",
  "custom_int3": "",
  "custom_str4": "",
  "custom_str5": "",
  "signature": "54fb24fb8935497659fe5f8fb94b0122",
  "email_address": "socialworkconsultant1@gmail.com",
  "custom_int2": "",
  "item_name": "Order #9918",
  "custom_str3": "",
  "custom_str2": "",
  "custom_int1": ""
};

const receivedSignature = payload.signature;

const passphrases = [
    "Thinkestry10$",
    "KhaiFreese10",
    "Thinkestry10",
    "Thinkestry10$1",
    "Thinkestry",
    "KhaiFreese",
    "info@myacc.co.za",
    "23836312",
    "h4fkhz6ouoksx",
    "Kevinfreese10",
    "Kevinfreese10$",
    ""
];

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

passphrases.forEach(passphrase => {
    // 1. Post Order (RFC 3986)
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
        if (hash === receivedSignature) {
            console.log(`MATCH Order 9918: Post Order (RFC 3986), Passphrase: "${passphrase}"`);
        }
    }

    // 2. Alphabetical (RFC 3986)
    {
        let parts: string[] = [];
        alphabeticalKeys.forEach(k => {
            parts.push(`${k}=${rfc3986Encode(payload[k])}`);
        });
        let baseStr = parts.join('&');
        if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
        const hash = crypto.createHash('md5').update(baseStr).digest('hex');
        if (hash === receivedSignature) {
            console.log(`MATCH Order 9918: Alphabetical (RFC 3986), Passphrase: "${passphrase}"`);
        }
    }

    // 3. Post Order (Std encode)
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
        if (hash === receivedSignature) {
            console.log(`MATCH Order 9918: Post Order (Std encode), Passphrase: "${passphrase}"`);
        }
    }

    // 4. Alphabetical (Std encode)
    {
        let parts: string[] = [];
        alphabeticalKeys.forEach(k => {
            parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
        });
        let baseStr = parts.join('&');
        if (passphrase) baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
        const hash = crypto.createHash('md5').update(baseStr).digest('hex');
        if (hash === receivedSignature) {
            console.log(`MATCH Order 9918: Alphabetical (Std encode), Passphrase: "${passphrase}"`);
        }
    }
    
    // 5. What if the passphrase is not URL-encoded but appended directly?
    {
        let parts: string[] = [];
        postOrder.forEach(k => {
            if (payload[k] !== undefined && payload[k] !== '') {
                parts.push(`${k}=${rfc3986Encode(payload[k])}`);
            }
        });
        let baseStr = parts.join('&');
        if (passphrase) baseStr += `&passphrase=${passphrase}`;
        const hash = crypto.createHash('md5').update(baseStr).digest('hex');
        if (hash === receivedSignature) {
            console.log(`MATCH Order 9918: Post Order (RFC 3986), Passphrase raw: "${passphrase}"`);
        }
    }
});

console.log("Brute force 9918 done.");
process.exit(0);
