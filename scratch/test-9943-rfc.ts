import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

async function main() {
    const docSnap = await getDoc(doc(db, 'orders', '9943'));
    const itn = docSnap.data().itnHistory.find((x: any) => x.payload && x.payload.signature === '07c52fd82f98cdc00aa66cddfe50b069');
    const payload = itn.payload;
    const receivedSignature = payload.signature;

    const postOrder = [
        'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
        'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
        'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
        'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
        'email_address', 'merchant_id'
    ];

    const passphrases = [
        "KhaiFreese11",
        "KhaiFreese10",
        "Thinkestry10$",
        ""
    ];

    passphrases.forEach(passphrase => {
        let parts: string[] = [];
        postOrder.forEach(k => {
            if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                parts.push(`${k}=${rfc3986Encode(payload[k])}`);
            }
        });
        let baseStr = parts.join('&');
        if (passphrase) {
            baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
        }
        const sig = crypto.createHash('md5').update(baseStr).digest('hex');
        console.log(`Passphrase: "${passphrase}" | Post Order (RFC3986): ${sig} (Match: ${sig === receivedSignature})`);
    });

    process.exit(0);
}

main();
