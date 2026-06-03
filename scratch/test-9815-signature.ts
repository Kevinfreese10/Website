import crypto from 'crypto';

const payload: Record<string, string> = {
  "m_payment_id": "9815",
  "pf_payment_id": "305717021",
  "payment_status": "COMPLETE",
  "item_name": "Order #9815",
  "item_description": "Annual Returns",
  "amount_gross": "350.00",
  "amount_fee": "-15.18",
  "amount_net": "334.82",
  "custom_str1": "",
  "custom_str2": "",
  "custom_str3": "",
  "custom_str4": "",
  "custom_str5": "",
  "custom_int1": "",
  "custom_int2": "",
  "custom_int3": "",
  "custom_int4": "",
  "custom_int5": "",
  "name_first": "Kevin",
  "name_last": "Freese",
  "email_address": "freesekevin@gmail.com",
  "merchant_id": "23836312"
};

const receivedSignature = "25f277601993f27c3155dce727b75360";

const passphrases = [
  "KhaiFreese10",
  "KhaiFreese11",
  "Thinkestry10$",
  "Thinkestry10",
  "KhaiFreese",
  "freesekevin",
  "freesekevin10",
  "freesekevin11",
  ""
];

// PayFast standard parameter order:
const orderFromPayfast = [
  "m_payment_id",
  "pf_payment_id",
  "payment_status",
  "item_name",
  "item_description",
  "amount_gross",
  "amount_fee",
  "amount_net",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "name_first",
  "name_last",
  "email_address",
  "merchant_id"
];

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

function getEncodedValue(val: string, mode: 'raw' | 'percent' | 'plus') {
  if (mode === 'raw') return val;
  if (mode === 'percent') return encodeURIComponent(val);
  return rfc3986Encode(val);
}

console.log('--- TESTING PASSPHRASES AND MODES ---');

for (const passphrase of passphrases) {
  for (const mode of ['raw', 'percent', 'plus'] as const) {
    const parts = orderFromPayfast
      .filter(key => payload[key] !== undefined && payload[key] !== '')
      .map(key => `${key}=${getEncodedValue(payload[key], mode)}`);
    
    let paramString = parts.join('&');
    
    // We try both URL encoding the passphrase and raw passphrase
    for (const encodePass of [false, true]) {
      let finalString = paramString;
      if (passphrase) {
        const passVal = encodePass 
          ? encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')
          : passphrase.trim();
        finalString += `&passphrase=${passVal}`;
      }
      
      const hash = crypto.createHash('md5').update(finalString).digest('hex');
      if (hash === receivedSignature) {
        console.log(`🎉 SUCCESS! FOUND MATCH!`);
        console.log(`Passphrase: "${passphrase}"`);
        console.log(`Encoding Mode: ${mode}`);
        console.log(`URL Encoded Passphrase: ${encodePass}`);
        console.log(`Param String: ${finalString}`);
        process.exit(0);
      }
    }
  }
}

console.log('No match found with default list. Trying variations...');
// Let's print out what the expected signature was for KhaiFreese11 under different modes
const parts = orderFromPayfast
  .filter(key => payload[key] !== undefined && payload[key] !== '')
  .map(key => `${key}=${getEncodedValue(payload[key], 'plus')}`);
let paramString = parts.join('&');
console.log(`Param string (plus mode): ${paramString}`);

passphrases.forEach(p => {
  const hash = crypto.createHash('md5').update(paramString + (p ? `&passphrase=${p}` : '')).digest('hex');
  console.log(`Passphrase "${p}" (raw pass) -> ${hash}`);
});

process.exit(0);
