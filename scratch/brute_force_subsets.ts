import crypto from 'crypto';

const payload: any = {
  "m_payment_id": "9918",
  "pf_payment_id": "304092967",
  "name_first": "Sean",
  "amount_fee": "-37.26",
  "amount_net": "912.74",
  "name_last": "Zimunya",
  "payment_status": "COMPLETE",
  "amount_gross": "950.00",
  "item_description": "Accountant's Letter",
  "merchant_id": "23836312",
  "email_address": "socialworkconsultant1@gmail.com",
  "item_name": "Order #9918",
  "signature": "54fb24fb8935497659fe5f8fb94b0122"
};

const receivedSignature = payload.signature;

const passphrases = [
    "Thinkestry10$",
    "KhaiFreese10",
    "Thinkestry10",
    "Kevinfreese10",
    "Kevinfreese10$",
    ""
];

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

const keys = [
    "m_payment_id",
    "pf_payment_id",
    "name_first",
    "amount_fee",
    "amount_net",
    "name_last",
    "payment_status",
    "amount_gross",
    "item_description",
    "merchant_id",
    "email_address",
    "item_name"
];

// Helper to generate all subsets of an array
function getSubsets<T>(array: T[]): T[][] {
    const result: T[][] = [[]];
    for (const element of array) {
        const length = result.length;
        for (let i = 0; i < length; i++) {
            result.push([...result[i], element]);
        }
    }
    return result;
}

const subsets = getSubsets(keys);
console.log(`Generated ${subsets.length} subsets to test.`);

let matchFound = false;

passphrases.forEach(passphrase => {
    subsets.forEach(subset => {
        if (subset.length === 0) return;

        // Try Alphabetical Order
        {
            const sortedSubset = [...subset].sort();
            let parts: string[] = [];
            sortedSubset.forEach(k => {
                parts.push(`${k}=${rfc3986Encode(payload[k])}`);
            });
            let baseStr = parts.join('&');
            
            // Try with &passphrase=
            let baseStrWithPass = baseStr;
            if (passphrase) baseStrWithPass += `&passphrase=${rfc3986Encode(passphrase)}`;
            let hash = crypto.createHash('md5').update(baseStrWithPass).digest('hex');
            if (hash === receivedSignature) {
                console.log(`🎉 MATCH FOUND! Passphrase: "${passphrase}" | Order: Alphabetical | Enc: RFC3986 | Keys:`, sortedSubset);
                matchFound = true;
            }

            // Try with raw passphrase
            let baseStrWithRawPass = baseStr;
            if (passphrase) baseStrWithRawPass += `&passphrase=${passphrase}`;
            hash = crypto.createHash('md5').update(baseStrWithRawPass).digest('hex');
            if (hash === receivedSignature) {
                console.log(`🎉 MATCH FOUND! Passphrase: "${passphrase}" (raw) | Order: Alphabetical | Enc: RFC3986 | Keys:`, sortedSubset);
                matchFound = true;
            }
        }

        // Try standard encode (encodeURIComponent + replace %20 with +)
        {
            const sortedSubset = [...subset].sort();
            let parts: string[] = [];
            sortedSubset.forEach(k => {
                parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
            });
            let baseStr = parts.join('&');
            
            let baseStrWithPass = baseStr;
            if (passphrase) baseStrWithPass += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
            let hash = crypto.createHash('md5').update(baseStrWithPass).digest('hex');
            if (hash === receivedSignature) {
                console.log(`🎉 MATCH FOUND! Passphrase: "${passphrase}" | Order: Alphabetical | Enc: Std URL | Keys:`, sortedSubset);
                matchFound = true;
            }
        }
    });
});

if (!matchFound) {
    console.log("No subset combination matched the received signature.");
}
process.exit(0);
