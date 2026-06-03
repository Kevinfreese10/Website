import { db } from '../src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

// Generate case permutations for a string
function generateCasePermutations(str: string): string[] {
    if (str.length === 0) return [""];
    const char = str[0];
    const rest = str.slice(1);
    const subPerms = generateCasePermutations(rest);
    const results: string[] = [];
    
    const uppercase = char.toUpperCase();
    const lowercase = char.toLowerCase();
    
    subPerms.forEach(sub => {
        results.push(uppercase + sub);
        if (uppercase !== lowercase) {
            results.push(lowercase + sub);
        }
    });
    return Array.from(new Set(results));
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

    const baseWords = ["KhaiFreese11", "KhaiFreese10", "Thinkestry10$"];
    let candidates: string[] = [];
    baseWords.forEach(w => {
        candidates = candidates.concat(generateCasePermutations(w));
        // Add variants with special characters at the end
        candidates.push(w + "$");
        candidates.push(w + "!");
        candidates.push(w.toLowerCase() + "$");
        candidates.push(w.toLowerCase() + "!");
    });

    // Add some other potential passphrases
    candidates.push("KhaiFreese11");
    candidates.push("KhaiFreese10");
    candidates.push("Thinkestry10$");
    candidates.push("KhaiFreese11 ");
    candidates.push(" KhaiFreese11");
    candidates.push("KhaiFreese10 ");
    candidates.push(" KhaiFreese10");

    candidates = Array.from(new Set(candidates));
    console.log(`Testing ${candidates.length} candidate passphrases...`);

    let matched = false;
    candidates.forEach(pass => {
        let finalStr = baseStr;
        if (pass) {
            finalStr += `&passphrase=${rfc3986Encode(pass)}`;
        }
        const sig = crypto.createHash('md5').update(finalStr).digest('hex');
        if (sig === receivedSignature) {
            console.log(`🎉 MATCH FOUND! Passphrase is: "${pass}"`);
            matched = true;
        }
    });

    if (!matched) {
        console.log("No match found in permutations.");
    }

    process.exit(0);
}

main();
