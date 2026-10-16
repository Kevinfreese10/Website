export interface CityIndustrySpecialization {
  sector: string;
  focus: string;
}

export interface CityProofStat {
  metric: string;
  label: string;
}

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
  localBusinessContext: string;
  sarsAndRegulatoryLandmarks: string;
  industrySpecializations: CityIndustrySpecialization[];
  localProofStats: CityProofStat[];
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
    heroSubheadline: 'Certified CIBA & SAIT tax practitioners providing fixed-fee bookkeeping, SARS eFiling compliance, IFRS for SMEs financial statements, and proactive CFO advisory for Johannesburg businesses from our Darrenwood headquarters.',
    latitude: -26.2041,
    longitude: 28.0473,
    suburbs: ['Sandton', 'Rosebank', 'Randburg', 'Midrand', 'Bedfordview', 'Roodepoort', 'Johannesburg CBD', 'Fourways', 'Melrose Arch', 'Parktown', 'Modderfontein', 'Crown Mines'],
    keyIndustries: ['Financial & Professional Services', 'Information Technology & SaaS', 'Wholesale & Industrial Distribution', 'Light & Heavy Manufacturing', 'Logistics & Freight Supply Chain', 'Commercial Property & Construction'],
    localBusinessContext: 'As South Africa’s commercial and financial powerhouse generating over 16% of national GDP, Johannesburg companies face intense scrutiny on corporate tax governance, cross-municipality billing, and multi-entity VAT group reconciliations from the N1 Midrand logistics corridor down to the Johannesburg CBD and Aeroton industrial nodes.',
    sarsAndRegulatoryLandmarks: 'Serving taxpayers registered under the SARS Rissik Street (Johannesburg CBD), SARS Alberton, SARS Randburg, and SARS Ashlea Gardens offices, with direct electronic filing to CIPC (Pretoria DTI Campus) and the Department of Employment and Labour.',
    industrySpecializations: [
      { sector: 'Midrand & City Deep Logistics', focus: 'Diesel logbooks, GIT insurance treatments, and multi-depot VAT201 reconciliations.' },
      { sector: 'Rosebank & Melrose Professional Practices', focus: 'Section 12E SBC eligibility reviews, director loan account structuring, and provisional tax (IRP6) planning.' },
      { sector: 'Johannesburg Wholesale & Manufacturing', focus: 'Landed import cost tracking, Section 12C manufacturing allowances, and inventory valuation under IFRS for SMEs.' }
    ],
    localProofStats: [
      { metric: '420+', label: 'Active Gauteng SME & Corporate Clients' },
      { metric: '48 hrs', label: 'Average Turnaround on Overdue SARS Returns' },
      { metric: '99.4%', label: 'First-Time SARS TCS PIN Approval Rate' }
    ],
    faqs: [
      {
        q: 'Do you offer online and in-person accounting services across all of Johannesburg?',
        a: 'Yes. Headquartered at Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Randburg, we serve over 420 Gauteng businesses across Sandton, Rosebank, Midrand, Roodepoort, Bedfordview, and Johannesburg CBD via 100% cloud workflows and by-appointment consultations.'
      },
      {
        q: 'Are your Johannesburg accountants registered with SARS and statutory bodies?',
        a: 'Yes. Our practice is led by Kevin Freese, a licensed SARS Registered Tax Practitioner (PR-0098553) and accredited member of CIBA (Chartered Institute for Business Accountants) and SAIT, authorised to sign off IFRS for SMEs Annual Financial Statements and represent taxpayers before SARS.'
      },
      {
        q: 'Can you represent Johannesburg companies assigned to SARS Rissik Street or SARS Alberton without us visiting a branch?',
        a: 'Yes. Through our registered Tax Practitioner eFiling portfolio and the SARS Online Query System (SOQS), we handle VAT registration verifications, Section 104 objections, tax directives, and RAV01 public officer updates digitally—saving you from booking eBooking appointments at SARS Rissik Street or Alberton.'
      },
      {
        q: 'How quickly can you bring an overdue Johannesburg Pty Ltd’s tax and CIPC returns up to date?',
        a: 'Most backlog engagements—spanning multi-year ITR14 corporate returns, bi-monthly VAT201 filings, EMP501 payroll reconciliations, and CIPC Annual Returns with Beneficial Ownership declarations—are reconciled and lodged within 48 to 72 hours of receiving your bank statements.'
      },
      {
        q: 'What specialized industries in Johannesburg do you support?',
        a: 'We manage specialized charts of accounts for Rosebank and Sandton professional consultancies, Midrand and City Deep freight operators, Crown Mines wholesalers, and Gauteng CIDB-graded civil and building contractors requiring annual AFS for CIDB upgrades.'
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
    heroSubheadline: 'Empowering Pretoria entrepreneurs, government suppliers, and engineering firms with tender-ready SARS compliance, CIPC governance, and fixed-fee cloud bookkeeping.',
    latitude: -25.7479,
    longitude: 28.2293,
    suburbs: ['Menlyn', 'Brooklyn', 'Hatfield', 'Centurion', 'Silver Lakes', 'Faerie Glen', 'Pretoria East', 'Montana', 'Lynnwood', 'Waterkloof', 'Arcadia', 'Rosslyn'],
    keyIndustries: ['Government Contracting & CSD Tenderers', 'Civil Construction & Engineering', 'Medical & Specialist Healthcare', 'Automotive Manufacturing (Rosslyn)', 'Legal & Diplomatic Services'],
    localBusinessContext: 'Pretoria and the wider City of Tshwane sit at the heart of South Africa’s public procurement ecosystem, with proximity to national government departments, the DTI Campus in Sunnyside (CIPC headquarters), and the Rosslyn automotive industrial hub.',
    sarsAndRegulatoryLandmarks: 'Supporting taxpayers serviced by the SARS Ashlea Gardens (Menlyn/Brooklyn), SARS Pretoria CBD, and SARS Bronkhorstspruit branches, alongside direct CIPC DTI Campus filings and Central Supplier Database (CSD) compliance.',
    industrySpecializations: [
      { sector: 'CSD & Public Sector Tenderers', focus: 'Real-time SARS TCS Tender PIN monitoring, B-BBEE EME/QSE affidavits, and COIDA Letters of Good Standing.' },
      { sector: 'Rosslyn & Silverton Industrial Suppliers', focus: 'Tier-1/Tier-2 automotive component supplier bookkeeping, tooling depreciation, and EMP201/MIBCO payroll.' },
      { sector: 'Brooklyn & Lynnwood Medical Practices', focus: 'HPCSA practitioner tax structuring, medical aid remittance reconciliations, and VAT zero-rating/exempt rules.' }
    ],
    localProofStats: [
      { metric: '130+', label: 'Tshwane & Pretoria Entities Managed' },
      { metric: '24–48 hrs', label: 'Tender Compliance Pack Turnaround' },
      { metric: '100%', label: 'CSD & CIPC Beneficial Ownership Compliance' }
    ],
    faqs: [
      {
        q: 'Can you assist Pretoria businesses with urgent Central Supplier Database (CSD) and tender compliance packs?',
        a: 'Yes. Because Pretoria is South Africa’s public-sector procurement hub, we prioritize 24–48 hour turnaround on full tender compliance packs: real-time SARS Tax Compliance Status (TCS) PINs, CIPC COR14.3 certificates, Beneficial Ownership filings, B-BBEE affidavits, and COIDA Letters of Good Standing.'
      },
      {
        q: 'Do you handle SARS queries for Pretoria taxpayers falling under the SARS Ashlea Gardens or Pretoria CBD offices?',
        a: 'Yes. As registered SARS tax practitioners (PR-0098553), we lodge all VAT201 verifications, IT14SD reconciliations, and debt payment arrangements electronically via eFiling, eliminating the need for in-person queues at SARS Ashlea Gardens or Pretoria CBD.'
      },
      {
        q: 'How does your online accounting service work for Pretoria East, Menlyn, and Rosslyn companies?',
        a: 'We connect your business bank accounts directly to Xero or Sage Business Cloud, ingest your supplier invoices digitally, reconcile monthly VAT and PAYE/UIF/SDL payroll, and deliver management accounts by the 10th of every month.'
      },
      {
        q: 'Can you compile Annual Financial Statements required for CIDB grading upgrades in Tshwane?',
        a: 'Yes. We compile IFRS for SMEs Annual Financial Statements with Accounting Officer or Independent Review reports specifically structured to satisfy CIDB Grade 2 to Grade 7 financial capability assessments (net asset value and turnover thresholds).'
      },
      {
        q: 'Do you assist Pretoria medical specialists and legal advocates with provisional tax (IRP6)?',
        a: 'Absolutely. We manage August and February IRP6 provisional tax estimates, home-office and equipment wear-and-tear allowances (Section 11(e)), and logbook travel claims for practitioners across Groenkloof, Brooklyn, and Menlyn Maine.'
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
    heroSubheadline: 'Tailored cloud financial management, Xero automation, foreign-currency tax compliance, and Section 12E advisory for Cape Town startups, e-commerce brands, creative agencies, and established SMEs.',
    latitude: -33.9249,
    longitude: 18.4241,
    suburbs: ['Cape Town CBD', 'Century City', 'Claremont', 'Bellville', 'Durbanville', 'Foreshore', 'Woodstock', 'Green Point', 'Somerset West', 'Montague Gardens', 'Epping', 'Sea Point'],
    keyIndustries: ['Tech, SaaS & Venture Startups', 'E-commerce & Digital Agencies', 'Tourism, Hospitality & Film', 'Food & Beverage Manufacturing', 'Renewable Energy & GreenTech'],
    localBusinessContext: 'Known as “Silicon Cape,” Cape Town combines a booming technology, SaaS, and digital nomad economy in the City Bowl, Woodstock, and Century City with heavy industrial warehousing in Montague Gardens, Epping, and Bellville.',
    sarsAndRegulatoryLandmarks: 'Representing Western Cape taxpayers registered under the SARS Cape Town (22 Hans Strijdom Ave, Foreshore), SARS Bellville, and SARS Mitchells Plain branches, alongside Western Cape Government supplier database compliance.',
    industrySpecializations: [
      { sector: 'Silicon Cape SaaS & Foreign Remote Contractors', focus: 'Section 11(1)(o) zero-rated export of services VAT, Stripe/PayPal/Wise multi-currency reconciliations, and Section 10(1)(o)(ii) foreign employment advice.' },
      { sector: 'Shopify, Takealot & WooCommerce Sellers', focus: 'Marketplace payout clearing accounts, merchant fee extraction, and automated inventory cost-of-sales postings.' },
      { sector: 'Atlantic Seaboard & City Bowl Hospitality/Film', focus: 'Seasonal cash-flow forecasting, sectoral determination hospitality payroll, and film production SPV rebates.' }
    ],
    localProofStats: [
      { metric: '190+', label: 'Western Cape Cloud Accounting Clients' },
      { metric: '100%', label: 'Xero & Sage Bank-Feed Integration' },
      { metric: 'R14m+', label: 'Cumulative Section 12E & VAT Refunds Secured' }
    ],
    faqs: [
      {
        q: 'Do you support cloud accounting ecosystems popular in Cape Town like Xero, Dext, and Shopify?',
        a: 'Yes. Over 85% of our Cape Town clients run on Xero or Sage Business Cloud integrated with Dext, PayFast, Yoco, Peach Payments, Takealot Seller Portal, and Shopify, giving founders real-time gross margin and cash runway dashboards.'
      },
      {
        q: 'How is VAT handled for Cape Town tech agencies and SaaS companies billing international clients in USD, EUR, or GBP?',
        a: 'Where services are physically rendered to non-residents who are outside South Africa at the time the services are performed, those exports generally qualify for 0% VAT under Section 11(2)(l) of the VAT Act—Allowing Cape Town agencies to claim 100% of their local input VAT Refunds while charging foreign clients 0% VAT.'
      },
      {
        q: 'Can you help Cape Town SMEs qualify for Section 12E Small Business Corporation (SBC) tax rates?',
        a: 'Yes. We structure qualifying Century City, Claremont, and Bellville companies with turnover under R20 million so they pay 0% tax on the first R95,750 of taxable profit, 7% up to R365,000, and 21% up to R550,000, rather than the flat 27% corporate tax rate.'
      },
      {
        q: 'Do you handle SARS verifications for businesses assigned to the SARS Foreshore or SARS Bellville offices?',
        a: 'Yes. Whether your company faces a VAT201 refund verification, an Approval International Transfer (AIT) TCS PIN request, or an ITR14 audit under the SARS Foreshore or Bellville regions, we prepare and upload the full audit pack digitally via eFiling.'
      },
      {
        q: 'Do you manage Montague Gardens and Epping warehousing and light manufacturing accounts?',
        a: 'Yes. We handle landed import customs VAT (SAD500 reconciliations), Section 12C accelerated machinery write-offs, and bi-annual EMP501 factory payroll reconciliations for Cape Town industrial operators.'
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
    heroSubheadline: 'Fixed-price cloud accounting, SARS Customs & import/export VAT compliance, and payroll outsourcing built for Durban logistics, maritime, manufacturing, and Umhlanga commercial enterprises.',
    latitude: -29.8587,
    longitude: 31.0218,
    suburbs: ['Umhlanga Ridge', 'Durban North', 'Morningside', 'Westville', 'Pinetown', 'Berea', 'Ballito', 'Amanzimtoti', 'Durban CBD', 'Hillcrest', 'Springfield Park', 'Jacobs & Mobeni'],
    keyIndustries: ['Maritime, Port & Freight Forwarding', 'Manufacturing & Chemical Processing (Pinetown/Jacobs)', 'Import & Export Trading', 'Hospitality & Coastal Tourism', 'Commercial Retail & Franchising'],
    localBusinessContext: 'Anchored by the Port of Durban—Sub-Saharan Africa’s busiest container terminal—and the booming Umhlanga Ridge and Ballito commercial corridor, eThekwini businesses require tight control over customs VAT, clearing-agent disbursements, and industrial council payrolls.',
    sarsAndRegulatoryLandmarks: 'Serving KwaZulu-Natal taxpayers under the SARS Durban (201 Dr Pixley KaSeme Street), SARS Umhlanga, and SARS Pinetown offices, as well as SARS Customs & Excise (Port of Durban / RLA portal).',
    industrySpecializations: [
      { sector: 'Port of Durban Importers, Exporters & Clearing Agents', focus: 'SARS RLA Customs Code registration, SAD500 Bill of Entry import VAT audits, and customs deferment account reconciliations.' },
      { sector: 'Pinetown, New Germany & Jacobs Manufacturers', focus: 'Raw material landed-cost accounting, Section 12C plant depreciation, and MEIBC/NBC bargaining council payroll.' },
      { sector: 'Umhlanga Ridge & Ballito Professional & Retail Groups', focus: 'Multi-branch management accounts, franchise royalty accounting, and family trust / holding company structuring.' }
    ],
    localProofStats: [
      { metric: '115+', label: 'KZN Logistics, Manufacturing & SME Clients' },
      { metric: '3–5 Days', label: 'SARS RLA Customs Code Turnaround' },
      { metric: 'R950/pm', label: 'Starting Fixed Monthly Accounting Retainer' }
    ],
    faqs: [
      {
        q: 'Do you assist Durban import/export companies with SARS Customs registration and SAD500 VAT audits?',
        a: 'Yes. We register Durban importers and exporters on the SARS Registration, Licensing and Accreditation (RLA) system, secure Customs Client Numbers, and reconcile SAD500 Bills of Entry and customs release notifications against your VAT201 input claims so SARS refunds are released without delay.'
      },
      {
        q: 'Can you manage industrial payroll and Bargaining Council returns for Pinetown and Jacobs factories?',
        a: 'Yes. Our payroll team computes weekly and monthly wages, overtime, shift allowances, PAYE, UIF, SDL, and bargaining council levies (including NBC and MEIBC), issuing compliant digital payslips and filing EMP201 returns before the 7th of each month.'
      },
      {
        q: 'How do Umhlanga and Ballito companies work with your accounting team remotely?',
        a: 'You get a dedicated accountant, automated bank feeds via Xero or Sage, a secure portal for supplier invoices, and direct WhatsApp and phone access—giving Umhlanga and North Coast businesses enterprise-grade financial management without hourly billing surprises.'
      },
      {
        q: 'Can you resolve SARS disputes or overdue returns under the SARS Durban or Umhlanga offices?',
        a: 'Yes. We handle Section 104 objections, Section 200 debt compromises, and penalty remission applications (RFR01) electronically on eFiling for eThekwini taxpayers.'
      },
      {
        q: 'What are your monthly accounting fees for Durban businesses?',
        a: 'Our fixed monthly retainers start from R950/month for startup and micro entities up to R3,500+/month for active trading importers and manufacturers, inclusive of cloud software, bi-monthly VAT201 filings, and monthly payroll.'
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
    heroSubheadline: 'Your local accounting partners headquartered right here at Stonemill Office Park, Darrenwood, Randburg. Combining automated cloud bookkeeping with face-to-face practitioner care.',
    latitude: -26.0936,
    longitude: 27.9947,
    suburbs: ['Darrenwood', 'Ferndale', 'Cresta', 'Linden', 'Blairgowrie', 'Fontainebleau', 'Northcliff', 'Robindale', 'Randpark Ridge', 'Bordeaux', 'Strijdompark', 'Kya Sand'],
    keyIndustries: ['Film, Television & Post-Production', 'Light Industrial & Engineering (Strijdompark/Kya Sand)', 'Professional & Engineering Consultancies', 'Retail, Franchise & Dining (Cresta/Linden)', 'Private Medical & Dental Practices'],
    localBusinessContext: 'Randburg is our home turf. From commercial production houses in Ferndale and Blairgowrie to light engineering workshops in Strijdompark and Kya Sand and boutique businesses in Linden and Cresta, we know the exact operational pulse of Region B SMEs.',
    sarsAndRegulatoryLandmarks: 'Located 5 minutes from the SARS Randburg branch (Hill Street / Malibongwe corridor) at Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Randburg, 2195.',
    industrySpecializations: [
      { sector: 'Ferndale & Blairgowrie Film & TV Production', focus: 'DTIC film rebate audits, SPV production accounting, freelance crew Section 23(m) / independent contractor tax compliance.' },
      { sector: 'Strijdompark & Kya Sand Trade & Industrial', focus: 'Job-costing, workshop inventory, warranty provisions, and weekly/monthly wage payrolls.' },
      { sector: 'Cresta, Linden & Northcliff SMEs & Medical Rooms', focus: 'Fixed-fee monthly bookkeeping, POS/card machine reconciliations, and Section 12E SBC tax savings.' }
    ],
    localProofStats: [
      { metric: 'HQ', label: 'Stonemill Office Park, 300 Acacia Rd, Darrenwood' },
      { metric: '180+', label: 'Randburg & Region B Local Clients' },
      { metric: 'Same Day', label: 'Urgent Tax Clearance & Accountant Letters' }
    ],
    faqs: [
      {
        q: 'Where exactly in Randburg is My Accountant located?',
        a: 'Our national headquarters is located at Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Randburg, 2195 (right next to Cresta Shopping Centre and Republic Road).'
      },
      {
        q: 'Can Randburg clients meet with Kevin Freese in person or drop off physical accounting records?',
        a: 'Yes! While our cloud accounting platform lets you handle everything digitally from your phone or laptop, Randburg business owners are always welcome to book an in-person boardroom consultation or drop off historical files at our Darrenwood office.'
      },
      {
        q: 'Do you specialize in Film & Television production accounting in Randburg?',
        a: 'Yes. Randburg (Ferndale, Blairgowrie, and Linden) is South Africa’s broadcast and post-production hub. We have a dedicated Film & TV Production Accounting division handling SPV ring-fencing, cast/crew payroll directives, and DTIC rebate verifications.'
      },
      {
        q: 'How fast can you issue an Accountant’s Confirmation Letter for a Randburg business or vehicle finance application?',
        a: 'For verified clients, we issue CIBA-accredited Accountant’s Letters of Income, Shareholding Certificates, and Solvency Confirmations on the same business day.'
      },
      {
        q: 'Can you take over from a previous bookkeeper in Strijdompark or Kya Sand mid-financial year?',
        a: 'Yes. We handle the professional handover clearance with your previous accountant, migrate your Pastel, Sage, or Xero ledger at no extra setup charge, and audit your opening trial balance for historical VAT or PAYE discrepancies.'
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
    heroSubheadline: 'Strategic corporate tax structuring, IFRS for SMEs financial statements, multi-entity consolidations, and fractional CFO services for Sandton enterprises and executive directors.',
    latitude: -26.1076,
    longitude: 28.0567,
    suburbs: ['Sandton CBD', 'Morningside', 'Bryanston', 'Inanda', 'Sandhurst', 'Rivonia', 'Hyde Park', 'Illovo', 'Atholl', 'Wierda Valley', 'Kramerville', 'Sunninghill'],
    keyIndustries: ['Corporate Finance, PE & Family Offices', 'Legal Chambers & Advocates', 'Management & Strategy Consulting', 'Commercial Real Estate & Property Trusts', 'Fintech & Enterprise Software'],
    localBusinessContext: 'Known as “Africa’s richest square mile,” Sandton hosts JSE-adjacent corporate groups, private equity holding structures, advocates’ chambers around Sandton Central, design showrooms in Kramerville, and technology campuses along the Rivonia and Sunninghill corridors.',
    sarsAndRegulatoryLandmarks: 'Located 15 minutes from Sandton Central, handling SARS High-Net-Worth (HNW), Large Business & International (LBI), and SARS Alberton/Randburg regional queries, plus SARB Authorized Dealer Approval International Transfers (AIT).',
    industrySpecializations: [
      { sector: 'Holding Companies, Family Trusts & SPVs', focus: 'Section 42/45 corporate rollovers, Section 7C low-interest trust loan compliance, and dividend withholding tax (DTR01/02) filings.' },
      { sector: 'Sandton Advocates, Attorneys & Executive Consultants', focus: 'High-earner provisional tax optimization, Section 11F retirement contributions, and independent practice AFS.' },
      { sector: 'Kramerville & Rivonia Commercial Enterprises', focus: 'Import forex hedging treatments, monthly board management packs, and working-capital ratio reporting.' }
    ],
    localProofStats: [
      { metric: '95+', label: 'Sandton Corporate Groups, Trusts & Practices' },
      { metric: '5 Days', label: 'IFRS for SMEs AFS Compilation SLA' },
      { metric: '15 mins', label: 'From Our Darrenwood Office to Sandton CBD' }
    ],
    faqs: [
      {
        q: 'Do you prepare IFRS for SMEs Annual Financial Statements for Sandton companies and property holding groups?',
        a: 'Yes. We compile audit-ready Annual Financial Statements in strict compliance with IFRS for SMEs and the Companies Act 71 of 2008, including Public Interest Score (PIS) calculations, Independent Reviews, or Accounting Officer reports within 5 business days.'
      },
      {
        q: 'Can you advise Sandton family trusts and holding companies on Section 7C and inter-company loan tax risks?',
        a: 'Yes. We structure inter-company management fees, dividend declarations (DTR01), and trust loan accounts to prevent deemed donation tax triggers under Section 7C and deemed dividend exposure under Section 64E(4) of the Income Tax Act.'
      },
      {
        q: 'Do you assist Sandton executives and high-net-worth individuals with SARS Approval International Transfer (AIT) pins?',
        a: 'Yes. When transferring more than R1 million offshore beyond your Single Discretionary Allowance, we prepare the full SARS AIT application—including statement of assets and liabilities (local and foreign at market and cost value) and source-of-funds audit trails.'
      },
      {
        q: 'Do you offer Fractional CFO and monthly board reporting for Rivonia and Morningside scale-ups?',
        a: 'Yes. Our Fractional CFO retainers include monthly three-way financial modeling (P&L, Balance Sheet, Cash Flow), KPI variance commentary, unit-economics tracking, and investor board pack preparation.'
      },
      {
        q: 'How do you handle advocate and specialist consultant practices in Sandton Central and Illovo?',
        a: 'We manage chamber fee allocations, travel and home-study deductions, bi-annual IRP6 provisional tax calculations, and rapid SARS VAT201 submissions tailored to high-billing solo practitioners and partnerships.'
      }
    ]
  },
  fourways: {
    slug: 'fourways',
    name: 'Fourways',
    province: 'Gauteng',
    region: 'City of Johannesburg - Region A / E',
    metaTitle: 'Accountant Fourways | Tax & Accounting',
    metaDescription: 'Local accounting and SARS tax compliance for Fourways and Dainfern businesses. Fixed monthly retainers, VAT201, and company registrations.',
    heroHeadline: 'Modern Online Accounting for Fourways Businesses',
    heroSubheadline: 'Eliminate paperwork with cloud bookkeeping, automated payroll, and proactive Section 12E tax planning tailored to Fourways, Broadacres, and Lanseria entrepreneurs.',
    latitude: -26.0189,
    longitude: 28.0056,
    suburbs: ['Fourways', 'Dainfern', 'Broadacres', 'Lonehill', 'Beverley', 'Craigavon', 'Cedar Lakes', 'Paulshof', 'Witkoppen', 'Steyn City', 'Chartwell', 'Lanseria Corporate Estate'],
    keyIndustries: ['Retail, Franchise & Hospitality', 'Aviation & Light Industrial (Lanseria)', 'Medical, Dental & Veterinary Suites', 'Residential Contracting, Solar & Home Services', 'E-commerce & Boutique Agencies'],
    localBusinessContext: 'Spanning high-growth retail and residential hubs around Fourways Mall, Broadacres, and Steyn City through to the rapidly expanding Lanseria Corporate Estate and aviation node, Fourways is one of Gauteng’s most entrepreneurial SME corridors.',
    sarsAndRegulatoryLandmarks: 'Just 15–20 minutes north of our Darrenwood office up William Nicol Drive (Winnie Mandela Drive) or Cedar Road, servicing taxpayers under the SARS Randburg and SARS Roodepoort jurisdictions.',
    industrySpecializations: [
      { sector: 'Lanseria Corporate Estate & Kya Sand North', focus: 'Light industrial cost accounting, import VAT clearing, and CIDB/COIDA contractor compliance.' },
      { sector: 'Fourways & Broadacres Retail, Franchises & Restaurants', focus: 'POS cash-up reconciliations, UberEats/Mr D commission splits, liquor/hospitality payroll, and bi-monthly VAT.' },
      { sector: 'Dainfern & Steyn City Independent Consultants & Contractors', focus: 'Personal Service Provider (PSP) vs Section 12E SBC structuring and provisional tax optimization.' }
    ],
    localProofStats: [
      { metric: '85+', label: 'Fourways, Broadacres & Lanseria Clients' },
      { metric: '100%', label: 'Automated Bank & POS Reconciliations' },
      { metric: 'Fixed Fee', label: 'Transparent Monthly Packages from R950' }
    ],
    faqs: [
      {
        q: 'How does monthly cloud bookkeeping work for Fourways and Broadacres businesses?',
        a: 'We link your FNB, Standard Bank, Nedbank, ABSA, or Investec accounts directly to Xero or Sage, automatically reconcile daily transactions, capture supplier tax invoices via Dext, and file your VAT201 and EMP201 returns on time every month.'
      },
      {
        q: 'Can you help Dainfern and Steyn City consultants avoid the SARS Personal Service Provider (PSP) tax trap?',
        a: 'Yes. Under the Fourth Schedule to the Income Tax Act, a consulting company can be taxed harshly as a PSP unless it employs three or more full-time non-connected employees or meets strict client-independence criteria. We audit and structure your company so it legally qualifies as a Section 12E Small Business Corporation.'
      },
      {
        q: 'Do you support restaurants and franchise outlets around Fourways, Monte Casino, and Lonehill?',
        a: 'Yes. We reconcile Pilot/GAAP POS reports, delivery-app payouts (UberEats, Mr D), food-cost gross profit margins, tips/tronc schemes, and hospitality bargaining council payroll.'
      },
      {
        q: 'Can you assist Lanseria Corporate Estate businesses with COIDA Letters of Good Standing and CIPC compliance?',
        a: 'Yes. We prepare and submit annual COIDA Return of Earnings (ROE), obtain Letters of Good Standing within 24–48 hours, and maintain your CIPC Annual Returns and Beneficial Ownership filings.'
      },
      {
        q: 'Are you close enough to Fourways if we ever need an in-person meeting?',
        a: 'Yes. Our head office is just down Cedar Road / Winnie Mandela Drive in Stonemill Office Park, Darrenwood, Randburg—less than 20 minutes from Fourways.'
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
    heroSubheadline: 'Supporting Bryanston office parks, creative agencies, IT consultancies, and specialist medical practices with precision cloud accounting, SARS dispute resolution, and Section 12E tax efficiency.',
    latitude: -26.0561,
    longitude: 28.0244,
    suburbs: ['Bryanston East', 'Bryanston West', 'Mill Hill', 'Riverclub', 'Petervale', 'Bramley Park', 'Epsom Downs', 'Sloane Precinct', 'Nicolway Corridor'],
    keyIndustries: ['Advertising, PR & Media Agencies', 'IT, Cloud & Telecoms Consultancies', 'Specialist Medical & Aesthetic Practices', 'Boutique Wealth & Management Consultancies'],
    localBusinessContext: 'Home to the Nicolway, Main Road, and Ballyclare/Sloane Street office park belt, Bryanston is a premier hub for mid-market agencies, technology integrators, and specialist professional practices.',
    sarsAndRegulatoryLandmarks: 'Located 10 minutes from our Darrenwood, Randburg office, with full SARS eFiling representation across the SARS Randburg and Johannesburg North assessment hubs.',
    industrySpecializations: [
      { sector: 'Nicolway & Main Road Marketing & Media Agencies', focus: 'Media-buy pass-through vs agency retainer revenue recognition, project margin tracking, and contractor withholding compliance.' },
      { sector: 'Bryanston IT & Software Integrators', focus: 'Recurring SaaS license deferrals, USD software vendor reverse-charge VAT on imported electronic services, and R&D/SBC tax planning.' },
      { sector: 'Bryanston Medical & Surgical Practices', focus: 'Practice entity structuring (Inc vs Pty Ltd), equipment finance lease accounting, and associate revenue splits.' }
    ],
    localProofStats: [
      { metric: '70+', label: 'Bryanston Office Park & Practice Clients' },
      { metric: '10 mins', label: 'Proximity to Our Darrenwood HQ' },
      { metric: '98%', label: 'Successful SARS Penalty Remission Track Record' }
    ],
    faqs: [
      {
        q: 'Can you help resolve SARS audits, IT14SD verifications, or penalties for Bryanston businesses?',
        a: 'Yes. We specialize in resolving complex SARS verifications, drafting Section 104 Notices of Objection, negotiating Section 200 Tax Debt Compromises, and lodging Request for Remission (RFR01) applications to waive administrative penalties.'
      },
      {
        q: 'How do you handle media-buy pass-through billings for Bryanston advertising and digital agencies?',
        a: 'We separate client media spend clearing accounts from your true agency fee revenue so that your turnover isn’t artificially inflated for CIPC Public Interest Score, provisional tax, or Section 12E R20m turnover cap purposes.'
      },
      {
        q: 'Do you manage executive and staff payroll for Bryanston office park companies?',
        a: 'Yes. We handle structured remuneration packages—including travel allowances, medical aid fringe benefits, group risk retirement contributions (Section 11F), Employment Tax Incentives (ETI), monthly EMP201s, and bi-annual EMP501 reconciliations.'
      },
      {
        q: 'Can you compile Annual Financial Statements for Bryanston incorporated (Inc) professional practices?',
        a: 'Yes. Whether your practice operates as a Personal Liability Company (Inc), a Pty Ltd, or a partnership, we compile compliant Annual Financial Statements and handle all partner/director provisional and income tax returns.'
      },
      {
        q: 'How easy is it to switch our Bryanston company’s accounting to My Accountant?',
        a: 'Switching takes less than 48 hours. We contact your outgoing accountant for the handover file, transfer your Xero or Sage subscription, link our SARS Tax Practitioner code on eFiling, and begin monthly reconciliations immediately.'
      }
    ]
  },
  centurion: {
    slug: 'centurion',
    name: 'Centurion',
    province: 'Gauteng',
    region: 'City of Tshwane Metropolitan Municipality (South)',
    metaTitle: 'Accountant Centurion | Tax & Accounting',
    metaDescription: 'Professional accounting, tax advisory, and payroll services in Centurion. Fast company registrations, VAT submissions, and SARS clearance.',
    heroHeadline: 'Comprehensive Accounting Services in Centurion',
    heroSubheadline: 'Fixed-fee cloud bookkeeping, CIPC statutory governance, and SARS tax management engineered for high-growth Centurion technology, defense, engineering, and distribution businesses.',
    latitude: -25.8603,
    longitude: 28.1894,
    suburbs: ['Centurion Central', 'Lyttelton', 'Eldoraigne', 'Zwartkop', 'Highveld Techno Park', 'Irene', 'Clubview', 'Rooihuiskraal', 'Midstream', 'Doringkloof', 'Samrand', 'Hennopspark'],
    keyIndustries: ['Technology, Telecoms & Defense (Highveld)', 'Light Manufacturing & Engineering (Hennopspark)', 'National Distribution & Warehousing (Samrand/N1)', 'Medical & Healthcare (Midstream/Unitas)', 'Civil & Electrical Contracting'],
    localBusinessContext: 'Strategically positioned on the N1/N14 highway interchange between Johannesburg and Pretoria, Centurion powers Highveld Techno Park’s software and defense engineering firms, Hennopspark’s precision workshops, and Samrand’s national distribution centers.',
    sarsAndRegulatoryLandmarks: 'Serving taxpayers registered under the SARS Centurion / Pretoria and SARS Ashlea Gardens offices, as well as CIPC DTI Campus filings and ARMSCOR/CSD defence and state procurement compliance.',
    industrySpecializations: [
      { sector: 'Highveld Techno Park & Irene Tech/Engineering Firms', focus: 'Contract milestone revenue recognition, foreign export VAT zero-rating, and developer/engineer payroll structuring.' },
      { sector: 'Hennopspark & Sunderland Ridge Workshops', focus: 'Bill-of-materials inventory costing, Section 12E(1) 100% manufacturing asset write-offs, and bargaining council wage compliance.' },
      { sector: 'Samrand & Route 21 Distribution Hubs', focus: 'Fleet diesel & maintenance tracking, inter-branch stock transfers, and high-volume debtor/creditor reconciliations.' }
    ],
    localProofStats: [
      { metric: '90+', label: 'Centurion, Highveld & Midstream Clients' },
      { metric: '100%', label: 'Section 12E(1) Manufacturing Tax Write-Offs Claimed' },
      { metric: '24 hrs', label: 'CIPC Annual Return & BO Filing Turnaround' }
    ],
    faqs: [
      {
        q: 'Do you handle CIPC Annual Returns and Beneficial Ownership for Centurion and Route 21 companies?',
        a: 'Yes. We track your company anniversary month, calculate turnover-based CIPC filing fees, lodge your Annual Return, and maintain your mandatory Beneficial Ownership register so your entity is never placed into CIPC deregistration.'
      },
      {
        q: 'Can Hennopspark and Centurion manufacturers claim a 100% tax write-off on new machinery?',
        a: 'Yes! If your Centurion business qualifies as a Small Business Corporation (SBC) under Section 12E of the Income Tax Act, 100% of the cost of plant or machinery brought into use for the first time in a manufacturing process can be deducted in full in the year of assessment.'
      },
      {
        q: 'How do you support Highveld Techno Park IT and engineering consultancies?',
        a: 'We provide Xero cloud bookkeeping, multi-project profitability tracking, contractor vs employee PAYE risk assessments, and quarterly management accounts for Highveld and Irene technology firms.'
      },
      {
        q: 'Can you assist Centurion contractors with CIDB financial statements and COIDA Letters of Good Standing?',
        a: 'Yes. We prepare IFRS for SMEs Annual Financial Statements formatted for CIDB grading renewals and upgrades, alongside annual COIDA Return of Earnings (W.As.8) submissions and TCS Tender PINs.'
      },
      {
        q: 'Do Midstream and Eldoraigne business owners need to travel to Johannesburg to work with you?',
        a: 'Not at all. Everything—from bank feed syncing and invoice capture to signing off your Annual Financial Statements and tax returns—happens securely online through our digital client portal.'
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
    heroSubheadline: 'Streamlined cloud accounting, industrial payroll, and SARS compliance for automotive suppliers, manufacturers, logistics operators, and SMEs across Nelson Mandela Bay.',
    latitude: -33.9608,
    longitude: 25.6022,
    suburbs: ['Walmer', 'Summerstrand', 'Newton Park', 'Mill Park', 'Greenacres', 'Coega SEZ', 'Struandale', 'Deal Party', 'Neave Industrial', 'Uitenhage (Kariega)'],
    keyIndustries: ['Automotive & Component Manufacturing (Struandale/Kariega)', 'Coega SEZ Industrial & Renewable Energy', 'Port of Ngqura & Harbour Logistics', 'Agribusiness, Mohair & Wool Exports', 'Coastal Hospitality & Retail'],
    localBusinessContext: 'From the automotive assembly plants and Tier-1/Tier-2 component suppliers in Struandale, Deal Party, and Kariega (Uitenhage) to the Coega Special Economic Zone (SEZ) and commercial offices in Newton Park and Walmer, Nelson Mandela Bay is the industrial heart of the Eastern Cape.',
    sarsAndRegulatoryLandmarks: 'Representing Eastern Cape taxpayers registered under the SARS Gqeberha / Port Elizabeth office (Whites Road / Central) and SARS Customs at the Port of Port Elizabeth and Port of Ngqura (Coega).',
    industrySpecializations: [
      { sector: 'Struandale, Deal Party & Kariega Automotive Suppliers', focus: 'JIS/JIT inventory accounting, MIBCO/NUMSA payroll compliance, Section 12C allowances, and OEM vendor tax clearance.' },
      { sector: 'Coega SEZ & Port of Ngqura Logistics/Exporters', focus: 'Customs RLA licensing, zero-rated export VAT substantiation, and Special Economic Zone tax incentive compliance.' },
      { sector: 'Newton Park & Walmer Commercial SMEs', focus: 'Fixed-fee Xero/Sage monthly bookkeeping, VAT201 filings, and Section 12E SBC corporate tax savings.' }
    ],
    localProofStats: [
      { metric: '60+', label: 'Nelson Mandela Bay & Eastern Cape Clients' },
      { metric: '100%', label: 'Cloud Portal & Xero/Sage Automation' },
      { metric: '48 hrs', label: 'OEM Vendor Tax Clearance & AFS Support' }
    ],
    faqs: [
      {
        q: 'Can Gqeberha and Kariega businesses manage all their accounting and SARS tax 100% online?',
        a: 'Yes. Our cloud platform connects directly to your bank feeds, lets you snap or email supplier invoices from Newton Park, Walmer, or Struandale, and gives you real-time monthly management accounts and SARS compliance without ever visiting an office.'
      },
      {
        q: 'Do you assist Port Elizabeth automotive component suppliers with OEM vendor compliance and MIBCO payroll?',
        a: 'Yes. Tier-1 and Tier-2 suppliers to major Eastern Cape OEMs require uninterrupted SARS Tax Compliance Status (TCS) PINs, timeous COIDA Letters of Good Standing, audited/independently reviewed Annual Financial Statements, and accurate MIBCO/MEIBC payroll returns—all of which we manage under one fixed monthly retainer.'
      },
      {
        q: 'Can you help Coega SEZ and Port of Ngqura exporters with SARS VAT refunds?',
        a: 'Yes. Exporters frequently sit in a continuous VAT refund position due to zero-rated export sales. We compile the complete SARS VAT verification pack—including SAD500 export bills of entry, customs release notifications, proof of foreign payment, and transport waybills—so your VAT refunds are released rapidly.'
      },
      {
        q: 'Do you represent Gqeberha clients before the local SARS Port Elizabeth branch?',
        a: 'Yes. Because all SARS verifications, audits, objections, and TCS PIN requests are centralized on eFiling and the SARS Online Query System (SOQS), our registered tax practitioners handle all SARS Gqeberha correspondence digitally on your behalf.'
      },
      {
        q: 'How much does monthly accounting cost for a Newton Park or Walmer SME?',
        a: 'Our fixed-price monthly accounting packages start from R950/month for small service companies and scale transparently based on transaction volume and employee headcount, with zero surprise year-end AFS bills when on an annual retainer.'
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
    heroSubheadline: 'Supporting Free State entrepreneurs, commercial agribusinesses, N1 logistics fleets, and legal/medical professionals with accurate, fixed-price online accounting and SARS tax advisory.',
    latitude: -29.0852,
    longitude: 26.1596,
    suburbs: ['Westdene', 'Dan Pienaar', 'Langenhovenpark', 'Universitas', 'Waverley', 'Brandwag', 'Fichardtpark', 'Hamilton Industrial', 'Estoire', 'Bainsvlei'],
    keyIndustries: ['Commercial Agriculture & Agribusiness Supply', 'Legal, Advocates & Judicial Practices', 'Private Healthcare & Medical Specialists', 'N1/N8 National Transport & Fleet Logistics', 'Education, Student Housing & Retail'],
    localBusinessContext: 'As the judicial capital of South Africa and the commercial hub of the Free State heartland, Bloemfontein blends a strong legal and medical fraternity in Westdene and Fichardtpark with major agricultural equipment dealers, grain/livestock operations, and N1 transport depots in Estoire and Hamilton.',
    sarsAndRegulatoryLandmarks: 'Serving Free State taxpayers under the SARS Bloemfontein regional office (Nelson Mandela Drive / CBD), alongside SARS Diesel Refund Scheme compliance and Master of the High Court (Bloemfontein) trust registrations.',
    industrySpecializations: [
      { sector: 'Free State Agribusiness & Farming Operations', focus: 'First Schedule farming tax computations, Section 37B/12B capital development write-offs, livestock valuations, and SARS Diesel Refund Scheme logbooks.' },
      { sector: 'Westdene Legal Practices & Supreme Court Advocates', focus: 'Provisional tax (IRP6) planning, LPC trust account bookkeeping support, and Section 12E / personal tax structuring.' },
      { sector: 'Estoire & Hamilton Transport & Distribution Fleets', focus: 'Per-truck profitability tracking, GIT/fleet asset registers, and bargaining council road freight payroll.' }
    ],
    localProofStats: [
      { metric: '55+', label: 'Bloemfontein & Free State Clients' },
      { metric: 'First Schedule', label: 'Specialist Farming & Diesel Refund Tax Expertise' },
      { metric: '48 hrs', label: 'Company Registration & VAT Setup' }
    ],
    faqs: [
      {
        q: 'Do you assist Bloemfontein sole proprietors and farmers converting to a Pty Ltd or family trust structure?',
        a: 'Yes. We register your new Pty Ltd with CIPC, coordinate inter-vivos trust tax registrations (IT77TR) with SARS, register for VAT, and structure Section 42 asset-for-share rollovers so you don’t trigger unnecessary Capital Gains Tax or transfer duty.'
      },
      {
        q: 'Can you manage First Schedule farming tax calculations and SARS Diesel Refunds for Free State agricultural businesses?',
        a: 'Yes. Our tax practitioners handle First Schedule livestock standard vs market valuations, paragraph 12 farming capital development expenditure deductions (dams, fencing, solar, irrigation), and compliant SARS Diesel Refund Scheme logbooks on eFiling.'
      },
      {
        q: 'How do you support Westdene legal practitioners andFichardtpark/Universitas medical specialists?',
        a: 'We automate your practice bookkeeping on Xero or Sage, reconcile medical aid switches or chamber statements, calculate August and February IRP6 provisional tax accurately to prevent Section 89quat interest, and compile annual financial statements.'
      },
      {
        q: 'Do you handle N1 transport and logistics companies based in Estoire and Hamilton?',
        a: 'Yes. We track revenue and diesel/tyre/maintenance costs per horse-and-trailer rig, manage NBCRFLI (Road Freight Bargaining Council) payroll, and ensure your SARS TCS PIN and COIDA Letter of Good Standing remain active for national sub-contracting.'
      },
      {
        q: 'Can you resolve overdue SARS returns or debt for Mangaung businesses without us visiting SARS Bloemfontein?',
        a: 'Yes. We link your tax profiles to our registered SARS practitioner code, pull your historical Statements of Account (ITSA/VASA), submit outstanding returns, and apply for penalty remissions or payment arrangements completely online.'
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
    heroSubheadline: 'Delivering hassle-free cloud bookkeeping, monthly SARS compliance, industrial payroll, and IFRS for SMEs financial statements for Buffalo City enterprises.',
    latitude: -33.0153,
    longitude: 27.9116,
    suburbs: ['Nahoon', 'Beacon Bay', 'Vincent', 'Bunkers Hill', 'Stirling', 'Southernwood', 'East London CBD', 'Gonubie', 'West Bank & ELIDZ', 'Wilsonia', 'Arcadia'],
    keyIndustries: ['Automotive Assembly & Tier-1 Component Supply (West Bank/ELIDZ)', 'Food, Dairy & Beverage Processing', 'Textiles & Light Manufacturing (Wilsonia)', 'Port of East London & Grain/Vehicle Logistics', 'Coastal Tourism, Healthcare & Retail'],
    localBusinessContext: 'Anchored by the East London Industrial Development Zone (ELIDZ) on the West Bank, the Mercedes-Benz supplier ecosystem, and busy commercial precincts in Vincent, Berea, and Beacon Bay, Buffalo City businesses depend on strict statutory governance and cost control.',
    sarsAndRegulatoryLandmarks: 'Serving Buffalo City and Border-Kei taxpayers under the SARS East London office (Station Street / CBD) and SARS Customs at the Port of East London.',
    industrySpecializations: [
      { sector: 'West Bank, ELIDZ & Wilsonia Industrial Suppliers', focus: 'Manufacturing cost-of-sales, Section 12C/12E capital allowances, and automated factory payroll compliance.' },
      { sector: 'Vincent, Berea & Beacon Bay Commercial SMEs', focus: 'Cloud bank-feed bookkeeping, bi-monthly VAT201 filings, and annual CIPC & Beneficial Ownership governance.' },
      { sector: 'Buffalo City Civil & Building Contractors', focus: 'CIDB financial capability AFS compilations, CSD tender tax clearance PINs, and COIDA Return of Earnings.' }
    ],
    localProofStats: [
      { metric: '45+', label: 'Buffalo City & Border-Kei SME Clients' },
      { metric: '7th of Month', label: 'Guaranteed On-Time EMP201 Payroll Filing' },
      { metric: '5 Days', label: 'Annual Financial Statement Compilation' }
    ],
    faqs: [
      {
        q: 'Can you handle monthly EMP201 payroll and bi-annual EMP501 reconciliations for East London employers?',
        a: 'Yes. We compute monthly and weekly wages, PAYE, UIF, SDL, and Employment Tax Incentives (ETI), issue BCEA-compliant payslips, submit monthly EMP201 returns before the 7th, and lodge bi-annual EMP501 SARS EasyFile reconciliations so IRP5 certificates are issued seamlessly.'
      },
      {
        q: 'Do you support suppliers in the East London Industrial Development Zone (ELIDZ) and West Bank?',
        a: 'Yes. We provide IFRS for SMEs Annual Financial Statements, customs and VAT201 audit packs, and real-time SARS Tax Compliance Status (TCS) monitoring required by multinational OEMs and the ELIDZ.'
      },
      {
        q: 'Can you help Buffalo City civil and electrical contractors maintain CIDB and CSD compliance?',
        a: 'Yes. We compile annual financial statements tailored to CIDB grading requirements, renew COIDA Letters of Good Standing, file CIPC Annual Returns, and resolve any SARS non-compliance blocking your Central Supplier Database (CSD) profile.'
      },
      {
        q: 'How do Vincent and Beacon Bay businesses submit receipts and bank statements to you?',
        a: 'We connect your bank account via direct secure bank feeds into Xero or Sage, and you simply snap or forward supplier invoices via email or WhatsApp—zero physical box-files or courier trips needed.'
      },
      {
        q: 'Can you assist East London medical practices in Southernwood and Nahoon with tax planning?',
        a: 'Yes. We manage medical practice bookkeeping, equipment depreciation, provisional tax (IRP6), and personal vs corporate tax optimization for doctors, dentists, and allied healthcare professionals across Buffalo City.'
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
    heroSubheadline: 'Empowering Mpumalanga and Lowveld businesses in subtropical agriculture, Kruger eco-tourism, forestry, and Maputo Corridor cross-border trade with rapid digital accounting.',
    latitude: -25.4753,
    longitude: 30.9694,
    suburbs: ['Sonheuwel', 'Steiltes', 'West Acres', 'Riverside Precinct', 'Nelspruit CBD', 'White River', 'Rocky Drift', 'Vintonia', 'Hazyview', 'Malelane'],
    keyIndustries: ['Citrus, Macadamia & Subtropical Packhouses', 'Kruger & Lowveld Eco-Tourism & Safari Lodges', 'Forestry, Sawmilling & Timber Logistics', 'N4 Maputo Corridor Cross-Border Freight & Trade', 'Mining Supply & Heavy Equipment Maintenance'],
    localBusinessContext: 'As the capital of Mpumalanga and gateway to both the Kruger National Park and the N4 Maputo Development Corridor into Mozambique, Mbombela (Nelspruit) and White River businesses operate across export agriculture, international hospitality, and cross-border logistics.',
    sarsAndRegulatoryLandmarks: 'Serving Lowveld taxpayers registered under the SARS Mbombela / Nelspruit office (Nedbank Centre / Henshall Street) and SARS Lebombo / Komatipoort Border Post Customs.',
    industrySpecializations: [
      { sector: 'Lowveld Citrus, Macadamia & Avocados (White River/Malelane)', focus: 'Export packhouse forex reconciliations, First Schedule farming capital write-offs, zero-rated export VAT, and Diesel Refunds.' },
      { sector: 'Hazyview & Greater Kruger Safari Lodges', focus: 'Foreign tour-operator billing, hospitality VAT apportionment, lodge capex depreciation, and seasonal staff payroll.' },
      { sector: 'N4 Maputo Corridor Exporters & Transporters (Rocky Drift/Vintonia)', focus: 'SADC Certificates of Origin, SARS RLA Customs codes, Cross-Border Road Transport Agency (C-BRTA) financials, and SAD500 export VAT.' }
    ],
    localProofStats: [
      { metric: '65+', label: 'Mbombela, White River & Lowveld Clients' },
      { metric: 'N4 Corridor', label: 'Specialist Cross-Border & Export VAT Expertise' },
      { metric: '24–48 hrs', label: 'Urgent Tax Clearance & C-BRTA Support' }
    ],
    faqs: [
      {
        q: 'Do you provide N4 Maputo Corridor cross-border tax and customs guidance for Nelspruit businesses?',
        a: 'Yes. We assist Lowveld exporters and transport operators with SARS RLA Customs registration, SADC Certificate of Origin licensing, Cross-Border Road Transport Permit (C-BRTA) compliance, and SAD500 Komatipoort/Lebombo border export VAT audit packs.'
      },
      {
        q: 'How do you handle accounting for Greater Kruger and Hazyview safari lodges and hospitality groups?',
        a: 'We integrate hospitality booking engines (such as NightsBridge) with Xero, reconcile foreign tour operator deposits, manage field-guide and lodge staff payroll (including UIF, SDL, and ETI), and track lodge renovation capital allowances.'
      },
      {
        q: 'Can you assist White River and Malelane macadamia and citrus farms with VAT refunds and farming tax?',
        a: 'Yes. Export packhouses and commercial growers routinely claim substantial VAT refunds on fertilizer, packing materials, diesel, and orchard development. We prepare watertight SARS VAT201 verification packs and First Schedule farming tax schedules.'
      },
      {
        q: 'Do Rocky Drift and Vintonia engineering and mining suppliers qualify for Section 12E SBC tax relief?',
        a: 'Where your company’s turnover is under R20 million and all shareholders are natural persons with no disqualifying shareholdings, we claim Section 12E progressive tax rates and 100% immediate write-offs on qualifying workshop machinery.'
      },
      {
        q: 'Do you represent Mpumalanga taxpayers registered at the SARS Mbombela office?',
        a: 'Yes. Our SARS registered tax practitioners handle all eFiling submissions, VAT verifications, objections, and TCS PIN requests digitally for clients across Mbombela, White River, Barberton, Lydenburg, and Secunda.'
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
    heroSubheadline: 'Dynamic cloud financial management, R&D and venture structuring, and wine-export tax compliance for Stellenbosch Technopark innovators, Winelands estates, and growing enterprises.',
    latitude: -33.9321,
    longitude: 18.8602,
    suburbs: ['Stellenbosch Central', 'Technopark', 'Die Boord', 'Rozendal', 'Paradyskloof', 'Klapmuts', 'Franschhoek', 'Devon Valley', 'Plankenbrug Industrial', 'Somerset West / Paarl Corridor'],
    keyIndustries: ['Technology, Fintech & DeepTech (Technopark)', 'Viticulture, Winemaking & Wine Exports', 'Luxury Hospitality, Dining & Wine Tourism', 'AgriTech, Biotech & University Spin-Outs', 'Wealth Management & Family Offices'],
    localBusinessContext: 'Combining Stellenbosch University spin-outs and billion-rand fintech/engineering scale-ups in Technopark with world-renowned wine estates and luxury hospitality across Stellenbosch, Franschhoek, and Klapmuts, the Cape Winelands requires sophisticated corporate and international tax capability.',
    sarsAndRegulatoryLandmarks: 'Serving Cape Winelands taxpayers registered under the SARS Paarl and SARS Bellville/Cape Town regional offices, including SARS Customs & Excise (wine & spirits excise accounts and export codes).',
    industrySpecializations: [
      { sector: 'Technopark SaaS, Fintech & Biotech Startups', focus: 'Cap-table & share-option structuring, investor-ready IFRS for SMEs financial statements, Section 11D R&D / Section 12E tax incentives, and USD revenue accounting.' },
      { sector: 'Stellenbosch & Franschhoek Wine Estates & Exporters', focus: 'Vineyard capital development (First Schedule), bulk vs bottled inventory costing, SARS Customs & Excise export codes, and zero-rated export VAT.' },
      { sector: 'Winelands Family Offices & High-Net-Worth Trusts', focus: 'Multi-entity group consolidations, Section 7C trust loan compliance, and SARB AIT offshore investment tax clearance.' }
    ],
    localProofStats: [
      { metric: '50+', label: 'Cape Winelands Tech, Wine & SME Clients' },
      { metric: '100%', label: 'Xero Cloud & Multi-Currency Integration' },
      { metric: '5 Days', label: 'Investor-Grade Annual Financial Statements' }
    ],
    faqs: [
      {
        q: 'Do you support Stellenbosch Technopark tech startups with investor-ready financials and tax structuring?',
        a: 'Yes. We work closely with Technopark and LaunchLab founders to set up clean Xero charts of accounts, track MRR/ARR and burn rate, structure IP holding and operating entities, claim Section 12E SBC relief, and prepare audit-ready Annual Financial Statements for VC due diligence.'
      },
      {
        q: 'Can you handle wine export VAT, SARS Customs codes, and cellar inventory accounting for Winelands estates?',
        a: 'Yes. We register wine producers for SARS RLA Exporter codes, reconcile bulk and bottled vintage stock valuations, manage First Schedule vineyard establishment write-offs, and substantiate zero-rated international wine exports for rapid SARS VAT201 refunds.'
      },
      {
        q: 'How do you manage multi-entity family groups and trusts in Stellenbosch and Franschhoek?',
        a: 'We provide consolidated monthly reporting across operating companies, property SPVs, and family trusts, ensuring full compliance with Section 7C interest rules, IT3(t) third-party trust data submissions to SARS, and CIPC Beneficial Ownership registers.'
      },
      {
        q: 'Do you assist Stellenbosch and Somerset West residents with foreign income and offshore investment tax clearance (AIT)?',
        a: 'Yes. We advise on foreign dividend and capital gains taxation, dual-tax treaty relief, and prepare comprehensive SARS Approval International Transfer (AIT) applications for offshore portfolio investments.'
      },
      {
        q: 'Can Plankenbrug and Klapmuts commercial SMEs get fixed-price monthly accounting?',
        a: 'Yes. Our all-inclusive monthly packages cover Xero or Sage software, daily bank reconciliations, supplier invoice capture, bi-monthly VAT201 filings, and monthly payroll at a predictable fixed fee.'
      }
    ]
  }
};
