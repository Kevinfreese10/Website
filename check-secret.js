const { GoogleAuth } = require('google-auth-library');

async function checkSecret() {
  const auth = new GoogleAuth({
    keyFile: 'C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const url = 'https://secretmanager.googleapis.com/v1/projects/studio-2604127518-57889/secrets/SMTP_PASS/versions/latest:access';
  
  try {
    const res = await client.request({ url });
    const payload = res.data.payload.data;
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    
    console.log("Secret length:", decoded.length);
    console.log("Secret hex:", Buffer.from(decoded).toString('hex'));
    console.log("Secret string:", decoded);
    if (decoded.includes('\n')) console.log("WARNING: Contains newline!");
  } catch (err) {
    console.error(err);
  }
}

checkSecret();
