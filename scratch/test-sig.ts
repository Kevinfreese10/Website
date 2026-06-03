import crypto from 'crypto';

const payload: Record<string, string> = {
  "m_payment_id": "9943",
  "amount_fee": "-9.66",
  "pf_payment_id": "305649245",
  "item_name": "Order #9943",
  "custom_str3": "",
  "custom_str1": "",
  "custom_int3": "",
  "merchant_id": "23836312",
  "custom_int4": "",
  "payment_status": "COMPLETE",
  "amount_gross": "200.00",
  "custom_int2": "",
  "custom_str4": "",
  "custom_int1": "",
  "name_first": "Kevin",
  "custom_int5": "",
  "custom_str5": "",
  "item_description": "EMP201 Return Submission (Nil)",
  "amount_net": "190.34",
  "custom_str2": "",
  "email_address": "freesekevin@gmail.com",
  "name_last": "Freese"
};

const passphrases = ["Thinkestry10$", "KhaiFreese10", ""];

// Let's test if we do NOT urlencode the passphrase, i.e., just append it raw as &passphrase=Passphrase
// We will test both standard order and alphabetical order, and different encoding modes for the values.

const orderFromPayfast = [
  "m_payment_id",
  "pf_payment_id",
  "payment_status",
  "item_name",
  "item_description",
  "amount_gross",
  "amount_fee",
  "amount_net",
  "name_first",
  "name_last",
  "email_address",
  "merchant_id",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5"
];

function getEncodedValue(val: string, mode: 'raw' | 'percent' | 'plus') {
  if (mode === 'raw') return val;
  if (mode === 'percent') return encodeURIComponent(val);
  return encodeURIComponent(val).replace(/%20/g, '+');
}

console.log('--- TESTING RAW PASSPHRASE ---');

for (const passphrase of passphrases) {
  for (const mode of ['raw', 'percent', 'plus'] as const) {
    const parts = orderFromPayfast
      .filter(key => payload[key] !== undefined && payload[key] !== '')
      .map(key => `${key}=${getEncodedValue(payload[key], mode)}`);
    
    let paramString = parts.join('&');
    if (passphrase) {
        paramString += `&passphrase=${passphrase.trim()}`;
    }
    const hash = crypto.createHash('md5').update(paramString).digest('hex');
    if (hash === '369a0df86613167ecc3f3f2aaf82f6e7') {
      console.log(`FOUND SERVER MATCH FOR 369a0df86613167ecc3f3f2aaf82f6e7!`);
      console.log(`Passphrase: "${passphrase}" (RAW)`);
      console.log(`Encoding mode: ${mode}`);
      console.log(`Param string: ${paramString}`);
    }
    if (hash === '07c52fd82f98cdc00aa66cddfe50b069') {
      console.log(`FOUND PAYFAST MATCH FOR 07c52fd82f98cdc00aa66cddfe50b069!`);
      console.log(`Passphrase: "${passphrase}" (RAW)`);
      console.log(`Encoding mode: ${mode}`);
      console.log(`Param string: ${paramString}`);
    }
  }
}
