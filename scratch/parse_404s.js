const xlsx = require('xlsx');

const filePath = 'C:\\Users\\kev\\Downloads\\myacc.co.za-Coverage-Drilldown-2026-07-06.xlsx';

try {
  const workbook = xlsx.readFile(filePath);
  console.log('Sheet Names:', workbook.SheetNames);
  let sheetName = workbook.SheetNames.find(n => n.includes('Table')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(sheet);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  }
  
  const urls = data.map(row => row['URL'] || Object.values(row)[0]).filter(url => typeof url === 'string' && url.startsWith('http'));
  
  console.log(`Found ${urls.length} URLs.`);
  
  const categories = {
    products: [],
    blog: [],
    wordpress: [],
    other: []
  };

  urls.forEach(url => {
    const pathname = new URL(url).pathname;
    if (pathname.startsWith('/product/') || pathname.startsWith('/products/')) {
      categories.products.push(pathname);
    } else if (pathname.startsWith('/blog/')) {
      categories.blog.push(pathname);
    } else if (pathname.includes('wp-content') || pathname.includes('wp-admin')) {
      categories.wordpress.push(pathname);
    } else {
      categories.other.push(pathname);
    }
  });

  console.log('Categories:');
  const fs = require('fs');
  fs.writeFileSync('scratch/404_products.json', JSON.stringify(categories.products, null, 2));
  fs.writeFileSync('scratch/404_blog.json', JSON.stringify(categories.blog, null, 2));
  fs.writeFileSync('scratch/404_other.json', JSON.stringify(categories.other, null, 2));
  console.log('JSON files written.');
  
} catch (err) {
  console.error("Error reading file:", err);
}
