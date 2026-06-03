const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9222,
  path: '/json/version',
  method: 'GET',
  headers: {
    'Host': 'localhost:9222'
  }
};

http.get(options, (res) => {
    let data = '';
    console.log("Status Code:", res.statusCode);
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("Response:", data);
    });
}).on('error', (err) => {
    console.error("Error connecting to Chrome:", err);
});
