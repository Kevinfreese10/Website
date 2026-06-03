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
        console.log("Fetching order 9469...");
        const docSnap = await getDoc(doc(db, 'orders', '9469'));
        if (!docSnap.exists()) {
            console.log("Order 9469 not found!");
            return;
        }
        
        const itn = docSnap.data().itnHistory.find((x: any) => x.payload && x.payload.signature === '7afec059c3d6de3318df8a3080280b74');
        const payload = itn.payload;
        const receivedSignature = payload.signature;
        console.log("Received signature:", receivedSignature);

        const passphrases = [
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

        passphrases.forEach(passphrase => {
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
            console.log(`Passphrase: "${passphrase}" | Sig: ${sig} (Match: ${sig === receivedSignature})`);
        });

        process.exit(0);
    } catch (e: any) {
        console.error(e);
        process.exit(1);
    }
}

main();
