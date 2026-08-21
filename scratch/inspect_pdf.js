const https = require('https');

const poaUrl = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712302062-Power%20of%20Attorney.pdf?alt=media&token=a233f79e-2fa1-4adf-8b88-f7614a0db881";
const resUrl = "https://firebasestorage.googleapis.com/v0/b/studio-2604127518-57889.firebasestorage.app/o/orders%2F10036%2Fnotes%2F1784712527209-Resolution.pdf?alt=media&token=80d18f6d-d2ad-4810-8fad-ae5b6fe8b463";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve(buffer.toString('utf-8'));
      });
      res.on('error', reject);
    });
  });
}

async function run() {
  const poaRaw = await fetchText(poaUrl);
  console.log('--- POA RAW STREAM SNIPPET ---');
  console.log(poaRaw.substring(0, 3000));
}

run().catch(console.error);
