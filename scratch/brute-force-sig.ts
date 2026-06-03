import crypto from 'crypto';

const payload: Record<string, string> = {
  "merchant_id": "23836312",
  "name_first": "Kevin",
  "name_last": "Freese",
  "email_address": "freesekevin@gmail.com",
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

// We keep "merchant_id" as the first parameter.
// We keep "name_first", "name_last", "email_address" in their standard relative order.
// Let's generate permutations of the rest:
// m_payment_id, item_name, item_description, payment_status, pf_payment_id, amount_gross, amount_fee, amount_net

const fixedStart = ["merchant_id", "name_first", "name_last", "email_address"];
const rest = ["m_payment_id", "item_name", "item_description", "payment_status", "pf_payment_id", "amount_gross", "amount_fee", "amount_net"];

function permute(arr: string[]): string[][] {
  if (arr.length === 0) return [[]];
  const result: string[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const subPerms = permute(remaining);
    for (const sub of subPerms) {
      result.push([current].concat(sub));
    }
  }
  return result;
}

const restPermutations = permute(rest);
console.log(`Generated ${restPermutations.length} permutations of the rest of the keys.`);

const passphrases = ["Thinkestry10$", "KhaiFreese10", ""];

// Let's check how special characters are encoded.
// Spaces: +
// Special chars: urlencoded (upper case)
// Parentheses: %28, %29 or raw? Let's check both.
const valEncodings = [
  // Mode 1: Standard URL Encoding with + for spaces and uppercase escape
  (val: string) => encodeURIComponent(val).replace(/%20/g, '+'),
  // Mode 2: Parentheses raw, others urlencoded with +
  (val: string) => encodeURIComponent(val).replace(/%20/g, '+').replace(/%28/g, '(').replace(/%29/g, ')'),
  // Mode 3: Raw values
  (val: string) => val
];

let found = false;

for (const passphrase of passphrases) {
  for (const getVal of valEncodings) {
    for (const p of restPermutations) {
      const keys = [...fixedStart, ...p];
      const parts = keys.map(k => `${k}=${getVal(payload[k])}`);
      
      const passCandidates = passphrase ? [passphrase, encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')] : [""];
      
      for (const pass of passCandidates) {
        let finalString = parts.join('&');
        if (pass) {
          finalString += `&passphrase=${pass}`;
        }
        
        const hash = crypto.createHash('md5').update(finalString).digest('hex');
        if (hash === targetSig) {
          console.log(`MATCH FOUND!`);
          console.log(`Passphrase: "${pass}"`);
          console.log(`Param string: ${finalString}`);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }
  if (found) break;
}

if (!found) {
  console.log("No match found with fixed start keys. Let's try alphabetical order of all keys with both passphrases just to be absolutely sure.");
  // Alphabetical
  const keys = Object.keys(payload).sort();
  for (const passphrase of passphrases) {
    for (const getVal of valEncodings) {
      const parts = keys.map(k => `${k}=${getVal(payload[k])}`);
      const passCandidates = passphrase ? [passphrase, encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')] : [""];
      for (const pass of passCandidates) {
        let finalString = parts.join('&');
        if (pass) {
          finalString += `&passphrase=${pass}`;
        }
        const hash = crypto.createHash('md5').update(finalString).digest('hex');
        if (hash === targetSig) {
          console.log(`MATCH FOUND (Alphabetical)!`);
          console.log(`Passphrase: "${pass}"`);
          console.log(`Param string: ${finalString}`);
          found = true;
          break;
        }
      }
    }
  }
}
