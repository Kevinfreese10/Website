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
        console.log("Fetching order 9945 with client-side SDK...");
        const docRef = doc(db, 'orders', '9945');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            console.log("Order 9945 not found!");
            return;
        }
        
        const orderData = docSnap.data();
        if (!orderData.itnHistory || orderData.itnHistory.length === 0) {
            console.log("No ITN history found for order 9945!");
            return;
        }
        
        // Find the ITN history entry that has the failed mismatch signature we saw
        const failedItn = orderData.itnHistory.find((itn: any) => itn.status === 'Failed' && itn.payload);
        if (!failedItn) {
            console.log("No failed ITN history entry with payload found!");
            return;
        }
        
        const payload = failedItn.payload;
        const receivedSignature = payload.signature;
        console.log("Received Signature in payload:", receivedSignature);
        
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
            console.log(`\nTesting with passphrase: "${passphrase}"`);
            
            // Test standard PayFast POST order with encodeURIComponent + replace %20 with +
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
                const signature = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`  Post Order (Std URL):   ${signature} (Match: ${signature === receivedSignature})`);
            }
        });

        process.exit(0);

    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();
