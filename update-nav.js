const fs = require('fs');

// 1. Update Header.tsx
let headerContent = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Add to Calculators
const newCalculators = `        { label: 'CIDB Fee & Grade', href: '/calculators/cidb-fee-and-grade' },
        { label: 'VAT Calculator', href: '/calculators/vat-calculator' },
        { label: 'Provisional Tax', href: '/calculators/provisional-tax-estimator' },
        { label: 'Capital Gains Tax', href: '/calculators/capital-gains-tax-calculator' },
        { label: 'UIF / COIDA Calculator', href: '/calculators/uif-coida-calculator' },
        { label: 'BEE Scorecard', href: '/calculators/bee-scorecard-estimator' },`;
headerContent = headerContent.replace(/{ label: 'CIDB Fee & Grade', href: '\/calculators\/cidb-fee-and-grade' },/, newCalculators);

// Add to Accounting (Local SEO)
const newAccounting = `        { label: 'Accountant Randburg', href: '/accountant-randburg' },
        { label: 'Accountant Sandton', href: '/accountant/sandton' },
        { label: 'Accountant Fourways', href: '/accountant/fourways' },
        { label: 'Accountant Bryanston', href: '/accountant/bryanston' },
        { label: 'Accountant Centurion', href: '/accountant/centurion' },
        { label: 'Accountant Port Elizabeth', href: '/accountant/port-elizabeth-gqeberha' },
        { label: 'Accountant Bloemfontein', href: '/accountant/bloemfontein' },
        { label: 'Accountant East London', href: '/accountant/east-london' },
        { label: 'Accountant Nelspruit', href: '/accountant/nelspruit' },
        { label: 'Accountant Stellenbosch', href: '/accountant/stellenbosch' },`;
headerContent = headerContent.replace(/{ label: 'Accountant Randburg', href: '\/accountant-randburg' },/, newAccounting);

// Add to Tax
const newTax = `      { label: 'Remission of Fines', href: '/remission-of-fines' },
      { label: 'Freelancer Tax Hub', href: '/freelancer-gig-economy-tax-hub' },
      { label: 'Tax Deadlines 2026', href: '/tax-deadlines-calendar-2026' },
      { label: 'Tax Glossary', href: '/tax-glossary' },`;
headerContent = headerContent.replace(/{ label: 'Remission of Fines', href: '\/remission-of-fines' },/, newTax);

fs.writeFileSync('src/components/layout/Header.tsx', headerContent);

// 2. Update BlogPageClient.tsx (Avatars)
let blogClientContent = fs.readFileSync('src/components/blog/BlogPageClient.tsx', 'utf8');
blogClientContent = blogClientContent.replace(/https:\/\/ui-avatars\.com\/api\/\?name=Kevin\+Freese&background=0D8ABC&color=fff/g, '/images/kevin.jpeg');
fs.writeFileSync('src/components/blog/BlogPageClient.tsx', blogClientContent);

// 3. Update blog page.tsx (Avatar)
let blogPageContent = fs.readFileSync('src/app/blog/[slug]/page.tsx', 'utf8');
blogPageContent = blogPageContent.replace(/https:\/\/ui-avatars\.com\/api\/\?name=Kevin\+Freese&background=0D8ABC&color=fff/g, '/images/kevin.jpeg');
fs.writeFileSync('src/app/blog/[slug]/page.tsx', blogPageContent);

console.log("Updated navigation and avatars successfully.");
