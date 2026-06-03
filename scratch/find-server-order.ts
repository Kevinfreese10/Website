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

// Let's find out how the server generated 369a0df86613167ecc3f3f2aaf82f6e7.
// Since the server used `rawBody.split('&')`, the order is EXACTLY the order PayFast sends it.
// The order of keys in the raw body sent by PayFast is standard. Let's find what it is.
// Let's test a few common orders:
// Order 1: Alphabetical
// Order 2: The order they appear in the JSON payload if we just object-key it? No, JSON maps are unordered.
// Order 3: The order PayFast typically uses in ITN posts:
// merchant_id, merchant_key, return_url, cancel_url, notify_url, name_first, name_last, email_address, cell_number, m_payment_id, amount, item_name, item_description, custom_str1, custom_str2, custom_str3, custom_str4, custom_str5, custom_int1, custom_int2, custom_int3, custom_int4, custom_int5, payment_status, pf_payment_id, amount_gross, amount_fee, amount_net
// Let's test this order!

const order1 = [
  "merchant_id",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "item_name",
  "item_description",
  "payment_status",
  "pf_payment_id",
  "amount_gross",
  "amount_fee",
  "amount_net"
];

const order2 = [
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
  "merchant_id"
];

// Let's check standard alphabetical order
const order3 = [...Object.keys(payload)].sort();

// Let's check another common order where custom fields are last:
const order4 = [
  "merchant_id",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "amount_gross",
  "amount_fee",
  "amount_net",
  "item_name",
  "item_description",
  "payment_status",
  "pf_payment_id"
];

const orders = [order1, order2, order3, order4];

// Let's check how the server decodes/encodes values:
// In notify/route.ts:
// value = param.substring(eqIndex + 1);
// So it is the URL-encoded string directly from the body.
// For "Order #9943", in the raw POST body it would be "Order+%239943" (plus and uppercase %23).
// For "EMP201 Return Submission (Nil)", it would be "EMP201+Return+Submission+%28Nil%29" or "EMP201+Return+Submission+(Nil)".
// Let's test these exact raw encoded values!

const encodedValues: Record<string, string> = {
  "m_payment_id": "9943",
  "amount_fee": "-9.66",
  "pf_payment_id": "305649245",
  "item_name": "Order+%239943", // PayFast encodes spaces as + and # as %23
  "payment_status": "COMPLETE",
  "amount_gross": "200.00",
  "name_first": "Kevin",
  "item_description": "EMP201+Return+Submission+%28Nil%29", // spaces as +, parentheses as %28 and %29
  "amount_net": "190.34",
  "email_address": "freesekevin%40gmail.com", // @ as %40
  "name_last": "Freese",
  "merchant_id": "23836312"
};

// Let's test other variations of encoding:
const encodedValues2: Record<string, string> = {
  ...encodedValues,
  "item_name": "Order+%239943",
  "item_description": "EMP201+Return+Submission+(Nil)", // parentheses not encoded
  "email_address": "freesekevin@gmail.com", // not encoded
};

const encodedValues3: Record<string, string> = {
  ...encodedValues,
  "item_name": "Order%20%239943", // spaces as %20
  "item_description": "EMP201%20Return%20Submission%20%28Nil%29",
  "email_address": "freesekevin%40gmail.com",
};

const encs = [encodedValues, encodedValues2, encodedValues3];

for (const passphrase of passphrases) {
  for (const ord of orders) {
    for (const enc of encs) {
      const parts = ord
        .filter(key => enc[key] !== undefined && enc[key] !== '')
        .map(key => `${key}=${enc[key]}`);
      
      let paramString = parts.join('&');
      
      // Try both raw passphrase and urlencoded passphrase
      const passCandidates = passphrase ? [
        passphrase,
        encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')
      ] : [""];
      
      for (const pass of passCandidates) {
        let finalString = paramString;
        if (pass) {
          finalString += `&passphrase=${pass}`;
        }
        const hash = crypto.createHash('md5').update(finalString).digest('hex');
        if (hash === '369a0df86613167ecc3f3f2aaf82f6e7') {
          console.log(`FOUND SERVER MATCH FOR 369a0df86613167ecc3f3f2aaf82f6e7!`);
          console.log(`Passphrase used: "${pass}"`);
          console.log(`Param string: ${finalString}`);
        }
        if (hash === '07c52fd82f98cdc00aa66cddfe50b069') {
          console.log(`FOUND PAYFAST MATCH FOR 07c52fd82f98cdc00aa66cddfe50b069!`);
          console.log(`Passphrase used: "${pass}"`);
          console.log(`Param string: ${finalString}`);
        }
      }
    }
  }
}
