import crypto from 'crypto';

// Non-empty fields in POST order for 9922 and 9918
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
  "email_address": "George@accountonme.co.za",
  "merchant_id": "23836312"
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
  "merchant_id": "23836312"
};

const received9922 = "c5e48f27b53e6cac88e947f5e5dd1fcb";
const received9918 = "54fb24fb8935497659fe5f8fb94b0122";

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

const postOrder = [
    'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
    'amount_gross', 'amount_fee', 'amount_net', 'name_first', 'name_last',
    'email_address', 'merchant_id'
];

// Generate variations of passphrases
const baseWords = [
    "Thinkestry", "thinkestry", "KhaiFreese", "khaifreese", "KevinFreese", "kevinfreese",
    "MyAcc", "myacc", "MyAccountant", "myaccountant"
];
const suffixes = [
    "10", "10$", "10$1", "10$2", "10!", "10#", "2025", "2026", "1", "2", "3", "0", "$", "",
    "10$!", "10$#", "10$@", "10$*", "10$%", "10$-", "10$="
];

const passphrases: string[] = [];
baseWords.forEach(w => {
    suffixes.forEach(s => {
        passphrases.push(w + s);
    });
});

console.log(`Generated ${passphrases.length} candidate passphrases to test.`);

function verify(payload: any, received: string, orderId: string) {
    let rawBodyParts: string[] = [];
    postOrder.forEach(k => {
        if (payload[k] !== undefined && payload[k] !== '') {
            rawBodyParts.push(`${k}=${rfc3986Encode(payload[k])}`);
        }
    });
    const baseStr = rawBodyParts.join('&');

    passphrases.forEach(passphrase => {
        const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
        
        // 1. With URL-encoded passphrase
        {
            const testStr = baseStr + `&passphrase=${encodedPassphrase}`;
            const hash = crypto.createHash('md5').update(testStr).digest('hex');
            if (hash === received) {
                console.log(`🎉 MATCH FOUND for Order ${orderId}! Passphrase: "${passphrase}" (URL-encoded)`);
            }
        }
        
        // 2. With raw passphrase
        {
            const testStr = baseStr + `&passphrase=${passphrase}`;
            const hash = crypto.createHash('md5').update(testStr).digest('hex');
            if (hash === received) {
                console.log(`🎉 MATCH FOUND for Order ${orderId}! Passphrase: "${passphrase}" (raw)`);
            }
        }
    });
}

verify(payload9922, received9922, "9922");
verify(payload9918, received9918, "9918");
console.log("Variations test completed.");
process.exit(0);
