import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

async function main() {
    try {
        console.log("Fetching order 9945...");
        const docSnap = await getDoc(doc(db, 'orders', '9945'));
        if (!docSnap.exists()) {
            console.log("Order 9945 not found!");
            return;
        }
        
        const itn = docSnap.data().itnHistory.find((x: any) => x.payload && x.payload.signature);
        const payload = itn.payload;
        const receivedSignature = payload.signature;
        console.log("Received signature from PayFast:", receivedSignature);

        const passphrases = [
            "KhaiFreese11",
            "Thinkestry10$",
            "KhaiFreese10",
            ""
        ];

        const postOrder = [
            'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
            'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
            'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
            'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
            'email_address', 'merchant_id'
        ];

        const alphabeticalKeys = Object.keys(payload).filter(k => k !== 'signature').sort();

        passphrases.forEach(passphrase => {
            // Post Order (Std URL)
            {
                let parts: string[] = [];
                postOrder.forEach(k => {
                    if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
                }
                const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`Passphrase: "${passphrase}" | Post Order (Std URL): ${sig} (Match: ${sig === receivedSignature})`);
            }

            // Alphabetical (Std URL)
            {
                let parts: string[] = [];
                alphabeticalKeys.forEach(k => {
                    if (payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
                }
                const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`Passphrase: "${passphrase}" | Alphabetical (Std URL): ${sig} (Match: ${sig === receivedSignature})`);
            }

            // Let's also check if PayFast sent empty fields as field= in raw body, but the server verifyPayFastSignature strips them
            // In the server route, we split by & and filter out if value === '':
            // if (key !== 'signature' && value !== '') { signatureString += `${key}=${value}&`; }
            // Since value is already URL decoded? No, rawBody is URL encoded parameters!
            // Wait, in verifyPayFastSignature, it parses directly from rawBody split by &:
            // key = param.substring(0, eqIndex); value = param.substring(eqIndex + 1);
            // This means key and value are STILL URL ENCODED!
            // So if PayFast sent `item_name=Order+%239945`, key is `item_name`, value is `Order+%239945`.
            // Let's test that! If the keys are in alphabetical order or postOrder, what order does PayFast send them in?
            // PayFast sends them in standard POST order (which matches postOrder).
            // Let's check if the standard POST order signature string matches.
        });

        process.exit(0);
    } catch (e: any) {
        console.error(e);
        process.exit(1);
    }
}

main();
