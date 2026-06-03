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

// Generate candidate list
const baseWords = [
  "KhaiFreese", "Khai", "Freese", "Thinkestry", "MyAcc", "MyAccountant",
  "freesekevin", "kevin", "KevinFreese", "KhaiFreese11", "KhaiFreese10",
  "Thinkestry10$", "Thinkestry10", "KhaiFreese11$", "KhaiFreese10$",
  "KhaiFreese11!", "KhaiFreese10!", "KhaiFreese11#", "KhaiFreese10#",
  "KhaiFreese2026", "KhaiFreese2025"
];

const suffixes = [
  "", "1", "2", "3", "10", "11", "12", "2026", "2025", "10$", "11$", "10$1", "10!", "11!", "$", "!", "#", "@",
  "10#", "11#", " 11", " 10"
];

const candidates = new Set<string>();
baseWords.forEach(w => {
  suffixes.forEach(s => {
    candidates.add(w + s);
    candidates.add((w + s).toLowerCase());
    candidates.add((w + s).toUpperCase());
    candidates.add(w.toLowerCase() + s);
    candidates.add(w.toUpperCase() + s);
    candidates.add(" " + w + s);
    candidates.add(w + s + " ");
  });
});

// Let's add other possible keys from env
candidates.add("KhaiFreese11");
candidates.add("KhaiFreese10");
candidates.add("Thinkestry10$");
candidates.add("h4fkhz6ouoksx");
candidates.add("qqci9vis4sszy");

console.log(`Testing ${candidates.size} passphrase candidates...`);

let found = false;
for (const passphrase of candidates) {
  const parts = orderFromPayfast
    .filter(key => payload[key] !== undefined && payload[key] !== '')
    .map(key => `${key}=${rfc3986Encode(payload[key])}`);
  
  let paramString = parts.join('&');
  if (passphrase) {
    const encodedPass = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
    paramString += `&passphrase=${encodedPass}`;
  }
  
  const hash = crypto.createHash('md5').update(paramString).digest('hex');
  if (hash === receivedSignature) {
    console.log(`🎉 SUCCESS MATCH FOUND!`);
    console.log(`Passphrase: "${passphrase}"`);
    console.log(`Param String: ${paramString}`);
    found = true;
    break;
  }
  
  // Try raw passphrase
  let paramStringRaw = parts.join('&');
  if (passphrase) {
    paramStringRaw += `&passphrase=${passphrase}`;
  }
  const hashRaw = crypto.createHash('md5').update(paramStringRaw).digest('hex');
  if (hashRaw === receivedSignature) {
    console.log(`🎉 SUCCESS MATCH FOUND (raw passphrase)!`);
    console.log(`Passphrase: "${passphrase}"`);
    console.log(`Param String: ${paramStringRaw}`);
    found = true;
    break;
  }
}

if (!found) {
  console.log("No matching passphrase found in generated set.");
}
process.exit(0);
