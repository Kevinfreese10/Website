const net = require('net');
const tls = require('tls');
const dns = require('dns');
const nodemailer = require('nodemailer');

async function testHost(host, port, secure, user, pass) {
  console.log(`\n=== Testing ${host}:${port} (secure: ${secure}) ===`);
  
  // DNS
  await new Promise((resolve) => {
    dns.lookup(host, (err, address, family) => {
      if (err) console.error(`DNS Error:`, err.message);
      else console.log(`DNS Resolved: ${address}`);
      resolve();
    });
  });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
  });

  try {
    const res = await transporter.verify();
    console.log(`✅ Nodemailer verify SUCCESS for ${user} on ${host}:${port}!`);
  } catch (e) {
    console.error(`❌ Nodemailer verify FAILED:`, e.code, e.message);
  }
}

async function run() {
  console.log('--- Testing thinkestry.co.za settings ---');
  await testHost('mail.thinkestry.co.za', 465, true, 'kev@thinkestry.co.za', 'KhaiFreese10$');
  await testHost('mail.thinkestry.co.za', 587, false, 'kev@thinkestry.co.za', 'KhaiFreese10$');
  await testHost('mail.thinkestry.co.za', 465, true, 'kev@thinkestry.co.za', 'KhaiFreese104');

  console.log('\n--- Testing myacc.co.za settings ---');
  await testHost('mail.myacc.co.za', 465, true, 'no_reply@myacc.co.za', 'MikeOxlong10$');
  await testHost('mail.myacc.co.za', 587, false, 'no_reply@myacc.co.za', 'MikeOxlong10$');
}

run();
