import fetch from 'node-fetch'; // wait, node 18+ has global fetch

async function main() {
  const url = 'https://www.myacc.co.za/products/export-licence';
  console.log(`Fetching HTML from ${url}...`);
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1'
    }
  });
  
  const html = await res.text();
  
  console.log("Analyzing meta tags...");
  const lines = html.split('\n');
  
  const metaTags = lines.filter(line => line.includes('<meta') || line.includes('<title'));
  
  console.log("\nFound Meta Tags:");
  metaTags.forEach(tag => {
    if (tag.includes('og:') || tag.includes('twitter:') || tag.includes('title') || tag.includes('description')) {
      console.log(tag.trim());
    }
  });
}

main().catch(console.error);
