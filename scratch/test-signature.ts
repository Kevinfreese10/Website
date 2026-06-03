import crypto from 'crypto';

// The payload received from PayFast for Order 9922
const payload: any = {
  m_payment_id: "9922",
  pf_payment_id: "304743269",
  payment_status: "COMPLETE",
  item_name: "Order #9922",
  item_description: "BEI Practice Setup & Onboarding Fee",
  amount_gross: "4950.00",
  amount_fee: "-184.46",
  amount_net: "4765.54",
  name_first: "Accountonme",
  name_last: "",
  email_address: "George@accountonme.co.za",
  merchant_id: "23836312",
  // Standard empty custom fields
  custom_str1: "",
  custom_str2: "",
  custom_str3: "",
  custom_str4: "",
  custom_str5: "",
  custom_int1: "",
  custom_int2: "",
  custom_int3: "",
  custom_int4: "",
  custom_int5: "",
};

const receivedSignature = "c5e48f27b53e6cac88e947f5e5dd1fcb";

// Try different passphrases and parameter orderings
const passphrases = [
  "Thinkestry10$",
  "KhaiFreese10",
  "", // no passphrase
];

// In notify/route.ts, verifyPayFastSignature does rawBody.split('&') and constructs the string.
// Let's emulate standard PayFast parameter order.
// Standard order is: merchant_id, merchant_key, return_url, etc.
// But PayFast posts them in a specific order:
// m_payment_id, pf_payment_id, payment_status, item_name, item_description, amount_gross, amount_fee, amount_net, name_first, name_last, email_address, merchant_id, etc.
// Let's try various key orderings or just the keys themselves.

function testPassphrases() {
  // Let's first build the string in standard alphabetical order (excluding signature)
  const keys = Object.keys(payload).sort();
  
  passphrases.forEach(passphrase => {
    let signatureString = '';
    keys.forEach(key => {
      if (key !== 'signature') {
        const val = payload[key];
        if (val !== undefined && val !== null && val !== '') {
          // PayFast only includes non-empty parameters in the signature generation string!
          signatureString += `${key}=${encodeURIComponent(val).replace(/%20/g, '+')}&`;
        }
      }
    });
    
    let finalString = signatureString.slice(0, -1);
    if (passphrase) {
      const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
      finalString += `&passphrase=${encodedPassphrase}`;
    }
    
    const calculated = crypto.createHash('md5').update(finalString).digest('hex');
    console.log(`[Alphabetical] Passphrase: "${passphrase}" -> Calculated: ${calculated} (Match: ${calculated === receivedSignature})`);
  });
  
  // Let's try matching in standard PayFast POST order
  // PayFast posts them in the order:
  const postOrder = [
    'm_payment_id',
    'pf_payment_id',
    'payment_status',
    'item_name',
    'item_description',
    'amount_gross',
    'amount_fee',
    'amount_net',
    'name_first',
    'name_last',
    'email_address',
    'merchant_id',
    'custom_str1',
    'custom_str2',
    'custom_str3',
    'custom_str4',
    'custom_str5',
    'custom_int1',
    'custom_int2',
    'custom_int3',
    'custom_int4',
    'custom_int5'
  ];
  
  passphrases.forEach(passphrase => {
    let signatureString = '';
    postOrder.forEach(key => {
      const val = payload[key];
      if (val !== undefined && val !== null && val !== '') {
        signatureString += `${key}=${encodeURIComponent(val).replace(/%20/g, '+')}&`;
      }
    });
    
    let finalString = signatureString.slice(0, -1);
    if (passphrase) {
      const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
      finalString += `&passphrase=${encodedPassphrase}`;
    }
    
    const calculated = crypto.createHash('md5').update(finalString).digest('hex');
    console.log(`[Post Order] Passphrase: "${passphrase}" -> Calculated: ${calculated} (Match: ${calculated === receivedSignature})`);
  });
}

testPassphrases();
