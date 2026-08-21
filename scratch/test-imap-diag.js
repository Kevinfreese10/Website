const imaps = require('imap-simple');

async function testImap(host, port, user, pass) {
  console.log(`\nTesting IMAP for ${user} on ${host}:${port}...`);
  const config = {
    imap: {
      user: user,
      password: pass,
      host: host,
      port: port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 8000,
    }
  };

  try {
    const connection = await imaps.connect(config);
    console.log(`✅ IMAP Connected successfully for ${user}!`);
    await connection.end();
    return true;
  } catch (err) {
    console.error(`❌ IMAP Failed for ${user}:`, err.message);
    return false;
  }
}

async function run() {
  await testImap('mail.myacc.co.za', 993, 'no_reply@myacc.co.za', 'MikeOxlong10$');
  await testImap('mail.thinkestry.co.za', 993, 'kev@thinkestry.co.za', 'KhaiFreese10$');
  await testImap('mail.thinkestry.co.za', 993, 'kev@thinkestry.co.za', 'KhaiFreese104');
  await testImap('mail.myacc.co.za', 993, 'info@myacc.co.za', 'MikeOxlong10$');
}

run();
