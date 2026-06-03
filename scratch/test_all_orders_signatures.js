const admin = require('firebase-admin');
const crypto = require('crypto');

// Standard RFC 3986 encoding helper from backup code
function rfc3986Encode(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

async function main() {
    try {
        admin.initializeApp({
            projectId: "studio-2604127518-57889"
        });
        const db = admin.firestore();
        const docRef = db.collection('orders').doc('9922');
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            console.log("Order 9922 not found!");
            return;
        }
        
        const orderData = docSnap.data();
        if (!orderData.itnHistory || orderData.itnHistory.length === 0) {
            console.log("No ITN history found for order 9922!");
            return;
        }
        
        const itn = orderData.itnHistory[0];
        const payload = itn.payload;
        const receivedSignature = payload.signature;
        console.log("Received Signature in payload:", receivedSignature);
        console.log("Payload:", JSON.stringify(payload, null, 2));
        
        const passphrases = [
            "Thinkestry10$",
            "KhaiFreese10",
            "Thinkestry10",
            ""
        ];
        
        // Let's test multiple parameter orderings
        
        // 1. Post Order (using the keys of the payload directly, since JS objects might retain insertion order,
        // or we can try various permutations).
        // Let's try standard PayFast POST order:
        const postOrder = [
            'm_payment_id', 'pf_payment_id', 'payment_status', 'item_name', 'item_description',
            'amount_gross', 'amount_fee', 'amount_net', 'custom_str1', 'custom_str2',
            'custom_str3', 'custom_str4', 'custom_str5', 'custom_int1', 'custom_int2',
            'custom_int3', 'custom_int4', 'custom_int5', 'name_first', 'name_last',
            'email_address', 'merchant_id'
        ];
        
        // Let's try sorting keys alphabetically
        const alphabeticalKeys = Object.keys(payload).filter(k => k !== 'signature').sort();
        
        // Let's try matching in standard PayFast POST order but filtering for present values
        passphrases.forEach(passphrase => {
            console.log(`\nTesting with passphrase: "${passphrase}"`);
            
            // Test 1: Alphabetical sorting with rfc3986Encode
            {
                let parts = [];
                alphabeticalKeys.forEach(k => {
                    if (payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${rfc3986Encode(payload[k])}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                }
                const signature = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`  Alphabetical (RFC3986): ${signature} (Match: ${signature === receivedSignature})`);
            }
            
            // Test 2: Alphabetical sorting with encodeURIComponent + replace %20 with +
            {
                let parts = [];
                alphabeticalKeys.forEach(k => {
                    if (payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${encodeURIComponent(payload[k]).replace(/%20/g, '+')}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
                }
                const signature = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`  Alphabetical (Std URL): ${signature} (Match: ${signature === receivedSignature})`);
            }
            
            // Test 3: Post Order with rfc3986Encode
            {
                let parts = [];
                postOrder.forEach(k => {
                    if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${rfc3986Encode(payload[k])}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${rfc3986Encode(passphrase)}`;
                }
                const signature = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`  Post Order (RFC3986):   ${signature} (Match: ${signature === receivedSignature})`);
            }
            
            // Test 4: Post Order with encodeURIComponent + replace %20 with +
            {
                let parts = [];
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
            
            // Test 5: What if we don't URL encode at all (raw values as received)?
            {
                let parts = [];
                postOrder.forEach(k => {
                    if (payload.hasOwnProperty(k) && payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${payload[k]}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${passphrase}`;
                }
                const signature = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`  Post Order (No encode): ${signature} (Match: ${signature === receivedSignature})`);
            }
            
            // Test 6: Alphabetical, No encode
            {
                let parts = [];
                alphabeticalKeys.forEach(k => {
                    if (payload[k] !== '' && payload[k] !== null && payload[k] !== undefined) {
                        parts.push(`${k}=${payload[k]}`);
                    }
                });
                let baseStr = parts.join('&');
                if (passphrase) {
                    baseStr += `&passphrase=${passphrase}`;
                }
                const signature = crypto.createHash('md5').update(baseStr).digest('hex');
                console.log(`  Alphabetical (No enc):  ${signature} (Match: ${signature === receivedSignature})`);
            }
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
