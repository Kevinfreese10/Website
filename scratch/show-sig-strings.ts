import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

async function main() {
    const docSnap = await getDoc(doc(db, 'orders', '9945'));
    const itn = docSnap.data().itnHistory.find((x: any) => x.payload && x.payload.signature === '2d8836017bfe0412d1731165f2b11a2e');
    const payload = itn.payload;

    const postOrder = [
        'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
        'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
        'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
        'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
        'email_address', 'merchant_id'
    ];

    let parts: string[] = [];
    postOrder.forEach(k => {
        if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
            parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
        }
    });
    let baseStr = parts.join('&');
    console.log("=== Base Param String ===");
    console.log(baseStr);

    const passphrase = "KhaiFreese11";
    const finalStr = baseStr + `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
    console.log("\n=== Final String with KhaiFreese11 ===");
    console.log(finalStr);
    console.log("Hash:", crypto.createHash('md5').update(finalStr).digest('hex'));
    console.log("Target Signature:", payload.signature);

    process.exit(0);
}

main();
