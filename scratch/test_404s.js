const fs = require('fs');

async function checkUrl(path) {
  try {
    const res = await fetch('http://localhost:3000' + path, { method: 'HEAD', redirect: 'manual' });
    return res.status;
  } catch (err) {
    return 0; // Error
  }
}

async function main() {
  const products = JSON.parse(fs.readFileSync('scratch/404_products.json'));
  const blog = JSON.parse(fs.readFileSync('scratch/404_blog.json'));
  const other = JSON.parse(fs.readFileSync('scratch/404_other.json'));
  
  const allUrls = [...products, ...blog, ...other];
  console.log(`Testing ${allUrls.length} URLs...`);
  
  const results = {
    redirects: [], // 301, 302, 307, 308
    success: [], // 200
    notFound: [], // 404
    other: [] // 500, etc
  };

  const batchSize = 10;
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize);
    const promises = batch.map(async (url) => {
      const status = await checkUrl(url);
      if (status === 200) results.success.push(url);
      else if (status === 404) results.notFound.push(url);
      else if (status >= 300 && status < 400) results.redirects.push(url);
      else results.other.push({url, status});
    });
    await Promise.all(promises);
  }
  
  console.log('--- TEST RESULTS ---');
  console.log('200 OK (Actually Working):', results.success.length);
  console.log('Redirecting (Already Fixed):', results.redirects.length);
  console.log('404 Not Found (Needs Fix):', results.notFound.length);
  console.log('Other Errors:', results.other.length);
  
  fs.writeFileSync('scratch/still_404.json', JSON.stringify(results.notFound, null, 2));
  console.log('Still 404s written to scratch/still_404.json');
}

main();
