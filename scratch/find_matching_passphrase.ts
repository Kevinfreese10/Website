import { db } from '../src/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import crypto from 'crypto';

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

async function main() {
    try {
        const q = collection(db, 'orders');
        const snap = await getDocs(q);
        
        const ordersWithITN: any[] = [];
        snap.forEach(doc => {
            const data = doc.data();
            if (data.itnHistory && data.itnHistory.length > 0) {
                data.itnHistory.forEach((itn: any) => {
                    if (itn.payload && itn.payload.signature) {
                        ordersWithITN.push({
                            id: data.id,
                            payload: itn.payload,
                            receivedSignature: itn.payload.signature
                        });
                    }
                });
            }
        });
        
        console.log(`Found ${ordersWithITN.length} ITN payloads to test.`);
        if (ordersWithITN.length === 0) return;
        
        const candidatePassphrases = [
            "Thinkestry10$",
            "KhaiFreese10",
            "Thinkestry10",
            "Thinkestry10$1",
            "Thinkestry",
            "KhaiFreese",
            "info@myacc.co.za",
            "23836312",
            "h4fkhz6ouoksx",
            ""
        ];
        
        const postOrder = [
            'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
            'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
            'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
            'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
            'email_address', 'merchant_id'
        ];
        
        for (const item of ordersWithITN) {
            console.log(`\n-----------------------------------`);
            console.log(`Order ${item.id} | Received Signature: ${item.receivedSignature}`);
            const payload = item.payload;
            const alphabeticalKeys = Object.keys(payload).filter(k => k !== 'signature').sort();
            
            // Check candidate passphrases
            candidatePassphrases.forEach(passphrase => {
                // Sorting 1: Alphabetical (RFC3986)
                {
                    let parts: string[] = [];
                    alphabeticalKeys.forEach(k => {
                        if (payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                            parts.push(`${k}=${rfc3986Encode(payload[k])}`);
                        }
                    });
                    let baseStr = parts.join('&');
                    if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                    const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                    if (sig === item.receivedSignature) {
                        console.log(`🎉 MATCH FOUND! Order ${item.id} | Passphrase: "${passphrase}" | Method: Alphabetical (RFC3986)`);
                    }
                }
                
                // Sorting 2: Post Order (RFC3986)
                {
                    let parts: string[] = [];
                    postOrder.forEach(k => {
                        if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                            parts.push(`${k}=${rfc3986Encode(payload[k])}`);
                        }
                    });
                    let baseStr = parts.join('&');
                    if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                    const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                    if (sig === item.receivedSignature) {
                        console.log(`🎉 MATCH FOUND! Order ${item.id} | Passphrase: "${passphrase}" | Method: Post Order (RFC3986)`);
                    }
                }
                
                // Sorting 3: Post Order (No encode)
                {
                    let parts: string[] = [];
                    postOrder.forEach(k => {
                        if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                            parts.push(`${k}=${payload[k]}`);
                        }
                    });
                    let baseStr = parts.join('&');
                    if (passphrase) baseStr += `&passphrase=${passphrase}`;
                    const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                    if (sig === item.receivedSignature) {
                        console.log(`🎉 MATCH FOUND! Order ${item.id} | Passphrase: "${passphrase}" | Method: Post Order (No encode)`);
                    }
                }
            });
        }
        
        console.log(`\nDone checking signatures.`);
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();
