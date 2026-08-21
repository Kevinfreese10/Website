const { GoogleAuth } = require('google-auth-library');

async function updateSecretVersion() {
  console.log('Attempting to add new version to Secret Manager via REST API...');
  const auth = new GoogleAuth({
    keyFile: 'C:\\Users\\kev\\Downloads\\studio-2604127518-57889-firebase-adminsdk-fbsvc-3e5d57757b.json',
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const url = 'https://secretmanager.googleapis.com/v1/projects/studio-2604127518-57889/secrets/SMTP_PASS:addVersion';
  
  const newSecretValue = 'W0=LP2i_yVzQ8EQL';
  const base64Data = Buffer.from(newSecretValue, 'utf8').toString('base64');

  try {
    const res = await client.request({
      url,
      method: 'POST',
      data: {
        payload: {
          data: base64Data
        }
      }
    });
    console.log('✅ Secret Manager version added successfully!');
    console.log('Response:', res.data);
    return true;
  } catch (err) {
    console.error('❌ Failed to add secret version:', err.message);
    if (err.response && err.response.data) {
      console.error('API Error Details:', JSON.stringify(err.response.data, null, 2));
    }
    return false;
  }
}

updateSecretVersion();
