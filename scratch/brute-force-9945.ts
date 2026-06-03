import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

async function main() {
    const docSnap = await getDoc(doc(db, 'orders', '9945'));
    const itn = docSnap.data().itnHistory.find((x: any) => x.payload && x.payload.signature === '2d8836017bfe0412d1731165f2b11a2e');
    const payload = itn.payload;
    const receivedSignature = payload.signature;

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
            parts.push(`${k}=${rfc3986Encode(payload[k])}`);
        }
    });
    const baseStr = parts.join('&');

    const candidates = [
        "KhaiFreese11",
        "KhaiFreese10",
        "KhaiFreese",
        "Khai",
        "Freese",
        "Thinkestry10$",
        "Thinkestry10",
        "Thinkestry",
        "KhaiFreese11$",
        "KhaiFreese10$",
        "KhaiFreese11!",
        "khaifreese11",
        "khaifreese10",
        "KhaiFreese 11",
        "KhaiFreese 10",
        "Khai Freese 11",
        "Khai Freese 10",
        "23836312",
        "h4fkhz6ouoksx",
        ""
    ];

    candidates.forEach(pass => {
        let finalStr = baseStr;
        if (pass) {
            finalStr += `&passphrase=${rfc3986Encode(pass)}`;
        }
        const sig = crypto.createHash('md5').update(finalStr).digest('hex');
        if (sig === receivedSignature) {
            console.log(`🎉 MATCH FOUND! Passphrase is: "${pass}"`);
        }
    });

    process.exit(0);
}

main();
