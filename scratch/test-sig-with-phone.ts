import crypto from 'crypto';

const payload: Record<string, string> = {
  "merchant_id": "23836312",
  "name_first": "Kevin",
  "name_last": "Freese",
  "email_address": "freesekevin@gmail.com",
  "cell_number": "0727936412", // Phone number from order
  "m_payment_id": "9943",
  "item_name": "Order #9943",
  "item_description": "EMP201 Return Submission (Nil)",
  "payment_status": "COMPLETE",
  "pf_payment_id": "305649245",
  "amount_gross": "200.00",
  "amount_fee": "-9.66",
  "amount_net": "190.34"
};

const targetSig = "07c52fd82f98cdc00aa66cddfe50b069";

// Let's test standard PayFast ordering including cell_number
const standardOrder = [
  "merchant_id", "name_first", "name_last", "email_address", "cell_number",
  "m_payment_id", "item_name", "item_description",
  "payment_status", "pf_payment_id", "amount_gross", "amount_fee", "amount_net"
];

const passphrases = ["Thinkestry10$", "KhaiFreese10", ""];

// Value encoding
const getVal = (val: string) => encodeURIComponent(val).replace(/%20/g, '+');

for (const passphrase of passphrases) {
  const parts = standardOrder
    .filter(k => payload[k] !== undefined && payload[k] !== '')
    .map(k => `${k}=${getVal(payload[k])}`);
    
  let paramString = parts.join('&');
  
  const passCandidates = passphrase ? [passphrase, encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')] : [""];
  for (const pass of passCandidates) {
    let finalString = paramString;
    if (pass) {
      finalString += `&passphrase=${pass}`;
    }
    const hash = crypto.createHash('md5').update(finalString).digest('hex');
    console.log(`With Phone standard, passphrase: "${pass}", hash: ${hash}`);
    if (hash === targetSig) {
      console.log("MATCH FOUND!");
    }
  }
}
