import fetch from 'node-fetch'; // wait, node-fetch might not be installed, we can use global fetch if Node is >= 18

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
  "merchant_id": "23836312",
  "signature": "25f277601993f27c3155dce727b75360"
};

const postOrder = [
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
  "merchant_id",
  "signature"
];

function rfc3986Encode(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    }).replace(/%20/g, '+');
}

async function testValidation() {
  const parts = postOrder.map(k => `${k}=${rfc3986Encode(payload[k] || '')}`);
  const rawBody = parts.join('&');
  
  console.log(`Raw Body to validate: ${rawBody}`);
  
  try {
    const res = await fetch('https://www.payfast.co.za/eng/query/validate', {
      method: 'POST',
      body: rawBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MyAccountant-NextJS-ITN-Handler/1.0',
      }
    });
    
    const text = await res.text();
    console.log(`Validation result from PayFast: "${text}"`);
  } catch (error) {
    console.error('Error validation:', error);
  }
}

testValidation().then(() => process.exit(0));
