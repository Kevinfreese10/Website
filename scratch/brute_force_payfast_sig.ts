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
        console.log("Fetching order 9922...");
        const docRef = doc(db, 'orders', '9922');
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            console.log("Order 9922 not found!");
            return;
        }
        
        const orderData = docSnap.data();
        const itn = orderData.itnHistory[0];
        const payload = itn.payload;
        const receivedSignature = payload.signature;
        
        // Non-empty fields
        const allFields: { [key: string]: string } = {};
        Object.keys(payload).forEach(k => {
            if (k !== 'signature' && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                allFields[k] = payload[k];
            }
        });
        
        const keys = Object.keys(allFields);
        console.log("Non-empty keys:", keys);
        
        // Passphrases to try
        const passphrases = [
            "Thinkestry10$",
            "KhaiFreese10",
            "Thinkestry10",
            "Thinkestry10$1",
            "Thinkestry",
            "KhaiFreese",
            "info@myacc.co.za",
            "23836312",
            "h4fkhz6ouoksx",
            "Kevinfreese10",
            "Kevinfreese10$",
            ""
        ];

        // Standard PayFast POST order
        const postOrder = [
            'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
            'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
            'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
            'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
            'email_address', 'merchant_id'
        ];

        // Let's try matching with different combinations
        passphrases.forEach(passphrase => {
            // Let's try standard Post Order with all non-empty fields in postOrder
            {
                let parts: string[] = [];
                postOrder.forEach(k => {
                    if (allFields[k] !== undefined) {
                        parts.push(`${k}=${rfc3986Encode(allFields[k])}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                if (sig === receivedSignature) {
                    console.log(`🎉 MATCH! Passphrase: "${passphrase}" | Method: Standard Post Order (RFC3986)`);
                }
            }

            // Let's try standard Alphabetical with all non-empty fields
            {
                let parts: string[] = [];
                keys.sort().forEach(k => {
                    parts.push(`${k}=${rfc3986Encode(allFields[k])}`);
                });
                let baseStr = parts.join('&');
                if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                if (sig === receivedSignature) {
                    console.log(`🎉 MATCH! Passphrase: "${passphrase}" | Method: Alphabetical (RFC3986)`);
                }
            }

            // PayFast sometimes does not sign custom fields or transaction fee/net
            // Let's try excluding amount_fee and amount_net from Post Order
            {
                let parts: string[] = [];
                postOrder.forEach(k => {
                    if (k !== 'amount_fee' && k !== 'amount_net' && allFields[k] !== undefined) {
                        parts.push(`${k}=${rfc3986Encode(allFields[k])}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                if (sig === receivedSignature) {
                    console.log(`🎉 MATCH! Passphrase: "${passphrase}" | Method: Post Order excluding fee/net`);
                }
            }

            // Let's try standard Post Order with encodeURIComponent (lowercase hex or uppercase)
            {
                let parts: string[] = [];
                postOrder.forEach(k => {
                    if (allFields[k] !== undefined) {
                        parts.push(`${k}=${encodeURIComponent(allFields[k]).replace(/%20/g, '+')}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
                const sig = crypto.createHash('md5').update(baseStr).digest('hex');
                if (sig === receivedSignature) {
                    console.log(`🎉 MATCH! Passphrase: "${passphrase}" | Method: Post Order (Std URL encode)`);
                }
            }
        });

        console.log("Brute force completed.");
        process.exit(0);
    } catch (e: any) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

main();
