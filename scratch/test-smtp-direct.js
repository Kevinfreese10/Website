const net = require('net');
const tls = require('tls');
const dns = require('dns');

async function testConnection(host, port, isTls) {
  console.log(`\n--- Testing ${host}:${port} (TLS: ${isTls}) ---`);
  
  // 1. DNS Lookup
  await new Promise((resolve) => {
    dns.lookup(host, (err, address, family) => {
      if (err) {
        console.error(`DNS lookup failed for ${host}:`, err.message);
      } else {
        console.log(`DNS lookup resolved: ${address} (IPv${family})`);
      }
      resolve();
    });
  });

  // 2. TCP Socket Connection
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = isTls
      ? tls.connect({ host, port, rejectUnauthorized: false, timeout: 8000 })
      : net.connect({ host, port, timeout: 8000 });

    socket.on('connect', () => {
      console.log(`✅ Connected in ${Date.now() - start}ms!`);
      if (!isTls) {
        socket.on('data', (chunk) => {
          console.log(`Banner received: ${chunk.toString().trim()}`);
          socket.end();
          resolve(true);
        });
      }
    });

    if (isTls) {
      socket.on('secureConnect', () => {
        console.log(`✅ TLS Handshake succeeded in ${Date.now() - start}ms!`);
        socket.on('data', (chunk) => {
          console.log(`Banner received over TLS: ${chunk.toString().trim()}`);
          socket.end();
          resolve(true);
        });
      });
    }

    socket.on('timeout', () => {
      console.error(`❌ Connection TIMEOUT after ${Date.now() - start}ms`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.error(`❌ Connection ERROR: ${err.message} (${err.code})`);
      resolve(false);
    });
  });
}

async function run() {
  for (const host of ['mail.myacc.co.za', 'myacc.co.za']) {
    for (const port of [465, 587, 2525, 25]) {
      await testConnection(host, port, port === 465);
    }
  }
}

run();
