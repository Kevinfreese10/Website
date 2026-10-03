export interface CityData {
  slug: string;
  name: string;
  province: string;
  region: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  latitude: number;
  longitude: number;
  suburbs: string[];
  keyIndustries: string[];
  faqs: { q: string; a: string }[];
}

export const CITIES_DATA: Record<string, CityData> = {
  johannesburg: {
    slug: 'johannesburg',
    name: 'Johannesburg',
    province: 'Gauteng',
    region: 'City of Johannesburg Metropolitan Municipality',
    metaTitle: 'Accountant Johannesburg | Tax & Accounting',
    metaDescription: 'Top-rated digital accountants and registered SARS tax practitioners in Johannesburg. Monthly bookkeeping, VAT, payroll, and CIPC compliance for SMEs.',
    heroHeadline: 'Professional Online Accountants in Johannesburg',
    heroSubheadline: 'Certified CIBA & SAIT tax practitioners providing fixed-fee bookkeeping, SARS compliance, and financial management for Johannesburg businesses.',
    latitude: -26.2041,
    longitude: 28.0473,
    suburbs: ['Sandton', 'Rosebank', 'Randburg', 'Midrand', 'Bedfordview', 'Roodepoort', 'Johannesburg CBD', 'Fourways', 'Melrose', 'Parktown'],
    keyIndustries: ['Financial & Professional Services', 'Information Technology', 'Retail & Wholesale', 'Manufacturing', 'Logistics & Supply Chain'],
    faqs: [
      {
        q: 'Do you offer online accounting services across all of Johannesburg?',
        a: 'Yes. Headquartered in Darrenwood, Randburg, we operate as a modern digital accounting firm serving clients across Sandton, Rosebank, Midrand, Johannesburg CBD, and all surrounding areas with 100% cloud workflows.'
      },
      {
        q: 'Are your Johannesburg accountants registered with SARS and professional bodies?',
        a: 'Absolutely. Our team is led by Kevin Freese, a licensed SARS Registered Tax Practitioner (PR-0098553) and member of CIBA (Chartered Institute for Business Accountants) and SAIT.'
      },
      {
        q: 'How quickly can you bring our Johannesburg company tax up to date?',
        a: 'Most overdue tax returns (ITR14, VAT201, EMP201) and CIPC annual returns can be reconciled and submitted to SARS within 48 to 72 hours once we receive your bank statements.'
      }
    ]
  },
  pretoria: {
    slug: 'pretoria',
    name: 'Pretoria',
    province: 'Gauteng',
    region: 'City of Tshwane Metropolitan Municipality',
    metaTitle: 'Accountant Pretoria | Tax & Accounting',
    metaDescription: 'Trusted online accountants and registered tax practitioners in Pretoria & Tshwane. Fixed pricing for monthly bookkeeping, annual returns, and SARS eFiling.',
    heroHeadline: 'Expert Online Accountants in Pretoria & Tshwane',
    heroSubheadline: 'Empowering Pretoria entrepreneurs and established companies with stress-free bookkeeping, payroll administration, and SARS tax optimization.',
    latitude: -25.7479,
    longitude: 28.2293,
    suburbs: ['Menlyn', 'Brooklyn', 'Hatfield', 'Centurion', 'Silver Lakes', 'Faerie Glen', 'Pretoria East', 'Montana', 'Lynnwood', 'Waterkloof'],
    keyIndustries: ['Government Contracting & Tenderers', 'Construction & Engineering', 'Medical & Healthcare', 'Legal & Professional Services'],
    faqs: [
      {
        q: 'Can you assist Pretoria businesses with tender-ready compliance documents?',
        a: 'Yes. We prepare full tender packs including SARS Tax Clearance PINs, CIPC COR14.3 certificates, B-BBEE affidavits, and COIDA Letters of Good Standing within 24–48 hours.'
      },
      {
        q: 'How does your online accounting service work for Pretoria companies?',
        a: 'Everything is managed securely online. You upload your bank statements and invoices to our client portal, and our automated systems and registered accountants handle the reconciliations, VAT, and financial statements.'
      }
    ]
  },
  'cape-town': {
    slug: 'cape-town',
    name: 'Cape Town',
    province: 'Western Cape',
    region: 'City of Cape Town Metropolitan Municipality',
    metaTitle: 'Accountant Cape Town | Tax & Accounting',
    metaDescription: 'Leading digital accounting firm serving Cape Town businesses. Monthly accounting, VAT registration, tax disputes, and annual financial statements.',
    heroHeadline: 'Forward-Thinking Online Accountants in Cape Town',
    heroSubheadline: 'Tailored financial management, cloud accounting, and tax advisory for Cape Town startups, creative agencies, e-commerce, and established SMEs.',
    latitude: -33.9249,
    longitude: 18.4241,
    suburbs: ['Cape Town CBD', 'Century City', 'Claremont', 'Bellville', 'Durbanville', 'Foreshore', 'Woodstock', 'Green Point', 'Somerset West', 'Stellenbosch'],
    keyIndustries: ['Tech & Startups', 'E-commerce & Digital Agencies', 'Tourism & Hospitality', 'Wine & Agriculture', 'Renewable Energy'],
    faqs: [
      {
        q: 'Do you support cloud accounting software popular in Cape Town like Xero and Sage?',
        a: 'Yes, we are certified specialists in Xero, Sage Business Cloud, and Zoho Books, providing seamless automated feeds and monthly management accounts.'
      },
      {
        q: 'Can you help with Section 12E Small Business Corporation (SBC) tax incentives in Cape Town?',
        a: 'Yes. We ensure eligible businesses claim maximum Section 12E preferential tax rates (paying 0% on first R95,750 of taxable income and accelerated depreciation on assets).'
      }
    ]
  },
  durban: {
    slug: 'durban',
    name: 'Durban',
    province: 'KwaZulu-Natal',
    region: 'eThekwini Metropolitan Municipality',
    metaTitle: 'Accountant Durban | Tax & Accounting',
    metaDescription: 'Experienced online accountants and tax consultants in Durban & Umhlanga. Bookkeeping, VAT201, payroll outsourcing, and CIPC services at fixed rates.',
    heroHeadline: 'Dedicated Online Accountants in Durban & eThekwini',
    heroSubheadline: 'Fixed-price accounting, SARS tax clearance, and payroll outsourcing built for Durban logistics, maritime, manufacturing, and retail businesses.',
    latitude: -29.8587,
    longitude: 31.0218,
    suburbs: ['Umhlanga', 'Durban North', 'Morningside', 'Westville', 'Pinetown', 'Berea', 'Ballito', 'Amanzimtoti', 'Durban CBD', 'Hillcrest'],
    keyIndustries: ['Logistics & Freight Forwarding', 'Manufacturing & Warehousing', 'Import & Export', 'Hospitality & Tourism', 'Retail'],
    faqs: [
      {
        q: 'Do you assist Durban import/export companies with SARS Customs registration?',
        a: 'Yes. We assist with SARS Customs Code registration, RLA registration, Certificates of Origin (SADC/EUR.1), and import/export VAT compliance.'
      },
      {
        q: 'What are your monthly accounting fees in Durban?',
        a: 'Our monthly packages start from R950/month for micro businesses up to R3,500/month for trading companies, with all software, VAT, and payroll included.'
      }
    ]
  },
  randburg: {
    slug: 'randburg',
    name: 'Randburg',
    province: 'Gauteng',
    region: 'City of Johannesburg - Region B',
    metaTitle: 'Accountant Randburg | Tax & Accounting',
    metaDescription: 'Headquartered in Darrenwood, Randburg. Expert accounting, bookkeeping, and SARS tax services for Randburg businesses with personal, rapid support.',
    heroHeadline: 'Trusted Local Accountants in Randburg',
    heroSubheadline: 'Your local accounting partners based right here in Stonemill Office Park, Darrenwood, Randburg. Delivering cutting-edge digital accounting with real practitioner care.',
    latitude: -26.0936,
    longitude: 27.9947,
    suburbs: ['Darrenwood', 'Ferndale', 'Cresta', 'Linden', 'Blairgowrie', 'Fontainebleau', 'Northcliff', 'Robindale', 'Randpark Ridge', 'Bordeaux'],
    keyIndustries: ['Film & Media Production', 'Professional Consulting', 'Automotive Services', 'Retail & Dining', 'Medical Practices'],
    faqs: [
      {
        q: 'Where in Randburg are you located?',
        a: 'Our registered office is at Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Randburg, 2195.'
      },
      {
        q: 'Can Randburg clients drop off documents or meet in person?',
        a: 'While our workflows are 100% online for speed and security, in-person consultations with Kevin Freese are available by appointment at our Darrenwood office.'
      }
    ]
  },
  sandton: {
    slug: 'sandton',
    name: 'Sandton',
    province: 'Gauteng',
    region: 'City of Johannesburg - Region E',
    metaTitle: 'Accountant Sandton | Tax & Accounting',
    metaDescription: 'High-caliber corporate accounting, Annual Financial Statements (AFS), and tax structuring for Sandton businesses and high-net-worth directors.',
    heroHeadline: 'Premium Financial & Tax Accounting in Sandton',
    heroSubheadline: 'Strategic corporate tax consulting, IFRS for SMEs financial statements, and digital bookkeeping for Sandton enterprises.',
    latitude: -26.1076,
    longitude: 28.0567,
    suburbs: ['Sandton CBD', 'Morningside', 'Bryanston', 'Inanda', 'Sandhurst', 'Rivonia', 'Hyde Park', 'Illovo', 'Atholl', 'Riverclub'],
    keyIndustries: ['Corporate Finance & Investments', 'Legal Practices', 'Management Consulting', 'Real Estate Development', 'Technology & Fintech'],
    faqs: [
      {
        q: 'Do you prepare Annual Financial Statements for Sandton companies?',
        a: 'Yes. We compile audit-ready Annual Financial Statements compliant with IFRS for SMEs, complete with Independent Reviewer or Accounting Officer sign-off.'
      }
    ]
  },
  fourways: {
    slug: 'fourways',
    name: 'Fourways',
    province: 'Gauteng',
    region: 'City of Johannesburg - Region A',
    metaTitle: 'Accountant Fourways | Tax & Accounting',
    metaDescription: 'Local accounting and SARS tax compliance for Fourways and Dainfern businesses. Fixed monthly retainers, VAT201, and company registrations.',
    heroHeadline: 'Modern Online Accounting for Fourways Businesses',
    heroSubheadline: 'Eliminate paperwork with online bookkeeping, automated payroll, and proactive tax planning tailored to Fourways entrepreneurs.',
    latitude: -26.0189,
    longitude: 28.0056,
    suburbs: ['Fourways', 'Dainfern', 'Broadacres', 'Lonehill', 'Beverley', 'Craigavon', 'Cedar Lakes', 'Paulshof', 'Witkoppen', 'Steyn City'],
    keyIndustries: ['Retail & Commercial', 'Hospitality & Events', 'Healthcare & Wellness', 'Home Services & Contracting'],
    faqs: [
      {
        q: 'How does monthly bookkeeping work for Fourways businesses?',
        a: 'We connect directly to your bank accounts to automatically ingest transaction data, code your expenses, reconcile VAT, and deliver clean monthly management reports.'
      }
    ]
  },
  bryanston: {
    slug: 'bryanston',
    name: 'Bryanston',
    province: 'Gauteng',
    region: 'City of Johannesburg - Region B',
    metaTitle: 'Accountant Bryanston | Tax & Accounting',
    metaDescription: 'Experienced accountants serving Bryanston enterprises. Comprehensive tax consulting, monthly payroll, and annual statutory compliance.',
    heroHeadline: 'Reliable Accounting & Tax Services in Bryanston',
    heroSubheadline: 'Supporting Bryanston business parks and professional practices with precision accounting, SARS audit representation, and tax efficiency.',
    latitude: -26.0561,
    longitude: 28.0244,
    suburbs: ['Bryanston East', 'Bryanston West', 'Mill Hill', 'Riverclub', 'Petervale', 'Bramley Park', 'Epsom Downs'],
    keyIndustries: ['Marketing & Advertising', 'IT & Telecoms', 'Medical Specialists', 'Boutique Consultancies'],
    faqs: [
      {
        q: 'Can you help resolve SARS audits or penalties for Bryanston businesses?',
        a: 'Yes. We specialize in Section 104 Notices of Objection, Section 200 Tax Debt Compromises, and Remission of Penalties (RFR01) directly on SARS eFiling.'
      }
    ]
  },
  centurion: {
    slug: 'centurion',
    name: 'Centurion',
    province: 'Gauteng',
    region: 'City of Tshwane Metropolitan Municipality',
    metaTitle: 'Accountant Centurion | Tax & Accounting',
    metaDescription: 'Professional accounting, tax advisory, and payroll services in Centurion. Fast company registrations, VAT submissions, and SARS clearance.',
    heroHeadline: 'Comprehensive Accounting Services in Centurion',
    heroSubheadline: 'Fixed-fee bookkeeping, CIPC statutory filings, and SARS tax management designed for high-growth Centurion businesses.',
    latitude: -25.8603,
    longitude: 28.1894,
    suburbs: ['Centurion Central', 'Lyttelton', 'Eldoraigne', 'Zwartkop', 'Highveld', 'Irene', 'Clubview', 'Rooihuiskraal', 'Midstream', 'Doringkloof'],
    keyIndustries: ['Technology & Defense', 'Aviation & Engineering', 'Light Manufacturing', 'Distribution & Retail'],
    faqs: [
      {
        q: 'Do you handle CIPC Annual Returns and Beneficial Ownership for Centurion firms?',
        a: 'Yes. We ensure your CIPC Annual Returns and Beneficial Ownership register are filed on time to prevent CIPC deregistration penalties.'
      }
    ]
  },
  'port-elizabeth-gqeberha': {
    slug: 'port-elizabeth-gqeberha',
    name: 'Gqeberha (Port Elizabeth)',
    province: 'Eastern Cape',
    region: 'Nelson Mandela Bay Metropolitan Municipality',
    metaTitle: 'Accountant Gqeberha | Tax & Accounting',
    metaDescription: 'Affordable online accountants in Gqeberha (Port Elizabeth). Monthly bookkeeping, payroll, and SARS tax services for Eastern Cape businesses.',
    heroHeadline: 'Trusted Online Accountants in Gqeberha / Port Elizabeth',
    heroSubheadline: 'Streamlined online accounting and SARS compliance for automotive, manufacturing, logistics, and retail businesses across Nelson Mandela Bay.',
    latitude: -33.9608,
    longitude: 25.6022,
    suburbs: ['Walmer', 'Summerstrand', 'Newton Park', 'Mill Park', 'Greenacres', 'Coega IDZ', 'Mount Croix', 'Humewood'],
    keyIndustries: ['Automotive & Component Manufacturing', 'Renewable Energy', 'Logistics & Harbour Freight', 'Tourism & Hospitality'],
    faqs: [
      {
        q: 'Can Eastern Cape businesses manage all their accounting 100% online?',
        a: 'Yes. Our digital platform allows Gqeberha businesses to upload documents, review monthly accounts, and approve tax submissions effortlessly from any device.'
      }
    ]
  },
  bloemfontein: {
    slug: 'bloemfontein',
    name: 'Bloemfontein',
    province: 'Free State',
    region: 'Mangaung Metropolitan Municipality',
    metaTitle: 'Accountant Bloemfontein | Tax & Accounting',
    metaDescription: 'Dedicated digital accountants for Bloemfontein and Mangaung businesses. Complete bookkeeping, tax returns, and CIPC company compliance.',
    heroHeadline: 'Professional Accounting Services in Bloemfontein',
    heroSubheadline: 'Supporting Free State entrepreneurs, agricultural suppliers, and professional firms with accurate, fixed-price online accounting and tax.',
    latitude: -29.0852,
    longitude: 26.1596,
    suburbs: ['Westdene', 'Dan Pienaar', 'Langenhovenpark', 'Universitas', 'Waverley', 'Brandwag', 'Fichardtpark', 'Noordhoek'],
    keyIndustries: ['Agriculture & Agribusiness', 'Legal & Judicial', 'Healthcare & Medical', 'Education & Transport'],
    faqs: [
      {
        q: 'Do you assist Bloemfontein sole proprietors converting to a Pty Ltd?',
        a: 'Yes. We register your new Pty Ltd with CIPC, obtain your tax number, register for VAT, and transfer your accounting structure seamlessly.'
      }
    ]
  },
  'east-london': {
    slug: 'east-london',
    name: 'East London',
    province: 'Eastern Cape',
    region: 'Buffalo City Metropolitan Municipality',
    metaTitle: 'Accountant East London | Tax & Accounting',
    metaDescription: 'Online accountants in East London (Buffalo City). Fixed monthly bookkeeping packages, VAT returns, and employee payroll compliance.',
    heroHeadline: 'Expert Online Accountants in East London',
    heroSubheadline: 'Delivering hassle-free bookkeeping, monthly SARS compliance, and annual financial statements for Buffalo City enterprises.',
    latitude: -33.0153,
    longitude: 27.9116,
    suburbs: ['Nahoon', 'Beacon Bay', 'Vincent', 'Bunkers Hill', 'Stirling', 'Southernwood', 'East London CBD', 'Gonubie'],
    keyIndustries: ['Automotive Assembly', 'Food Processing & Agriculture', 'Maritime & Harbour Services', 'Tourism & Retail'],
    faqs: [
      {
        q: 'Can you handle monthly EMP201 payroll filing for East London employers?',
        a: 'Yes. We compute monthly PAYE, UIF, and SDL, issue compliant payslips to your staff, and submit the EMP201 return directly to SARS before the 7th.'
      }
    ]
  },
  nelspruit: {
    slug: 'nelspruit',
    name: 'Mbombela (Nelspruit)',
    province: 'Mpumalanga',
    region: 'City of Mbombela Local Municipality',
    metaTitle: 'Accountant Nelspruit | Tax & Accounting',
    metaDescription: 'Leading online accountants in Nelspruit / Mbombela. Fixed-fee bookkeeping, tourism tax consulting, and CIPC compliance across Mpumalanga.',
    heroHeadline: 'Modern Accounting Solutions in Mbombela / Nelspruit',
    heroSubheadline: 'Empowering Mpumalanga businesses in agriculture, eco-tourism, forestry, and retail with transparent, high-speed digital accounting.',
    latitude: -25.4753,
    longitude: 30.9694,
    suburbs: ['Sonheuwel', 'Steiltes', 'West Acres', 'Riverside', 'Nelspruit CBD', 'White River', 'Vintonia'],
    keyIndustries: ['Citrus & Subtropical Agriculture', 'Eco-Tourism & Lodges', 'Forestry & Timber', 'Cross-Border Trade (Mozambique)'],
    faqs: [
      {
        q: 'Do you provide cross-border tax and customs guidance for Nelspruit businesses?',
        a: 'Yes. We assist with Cross-Border Road Transport Permits (C-BRTA), SARS customs registrations, and SADC Certificate of Origin documentation.'
      }
    ]
  },
  stellenbosch: {
    slug: 'stellenbosch',
    name: 'Stellenbosch',
    province: 'Western Cape',
    region: 'Cape Winelands District Municipality',
    metaTitle: 'Accountant Stellenbosch | Tax & Accounting',
    metaDescription: 'Specialist online accountants in Stellenbosch. Cloud bookkeeping, startup advisory, VAT, and financial statements for Winelands businesses.',
    heroHeadline: 'Innovative Accounting & Tax in Stellenbosch',
    heroSubheadline: 'Dynamic financial management and proactive tax consulting for Stellenbosch tech innovators, wine estates, and growing enterprises.',
    latitude: -33.9321,
    longitude: 18.8602,
    suburbs: ['Stellenbosch Central', 'Technopark', 'Die Boord', 'Rozendal', 'Paradyskloof', 'Klapmuts', 'Franschhoek'],
    keyIndustries: ['Technology & Software', 'Viticulture & Winemaking', 'Hospitality & Luxury Tourism', 'Biotech & Research'],
    faqs: [
      {
        q: 'Do you support Stellenbosch Technopark tech startups with R&D incentives and structuring?',
        a: 'Yes. We advise startups on optimal company structures, Section 12E SBC tax relief, intellectual property holding, and investor-ready financial models.'
      }
    ]
  }
};
