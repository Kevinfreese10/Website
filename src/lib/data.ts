import type { Service, BlogPost, FAQ, Order, User } from './types';

// IMPORTANT: This file is now deprecated for user data. Users should be managed in Firestore.
export const users: Omit<User, 'uid'>[] = [
  { id: 'user-1', name: 'John Doe', email: 'client@test.com', role: 'client' },
  { 
    id: 'user-2',
    name: 'Kevin Freese', 
    email: 'kev@thinkestry.co.za', 
    role: 'admin',
    department: 'Administration',
    smtpDetails: {
        host: 'mail.myacc.co.za',
        port: '465',
        user: 'info@myacc.co.za',
        pass: 'Thinkestry10$',
    }
  },
  {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@myacc.co.za',
    role: 'admin',
    department: 'Administration',
  },
  { 
    id: 'user-4',
    name: 'Reseller Pro', 
    email: 'reseller@test.com', 
    role: 'partner',
    companyName: 'Reseller Pro (Pty) Ltd',
    contactPerson: 'Alex King',
    contactNumber: '0721234567',
    address: {
        street: 'Clearwater Office Park Building 3 Millenium Road & Christiaan de Wet Road',
        city: 'Roodepoort',
        province: 'Gauteng',
        zip: '1724',
    },
    bankingDetails: {
        bankName: 'Capitec',
        accountHolder: 'Reseller Pro (Pty) Ltd',
        accountNumber: '1234567890',
        branchCode: '470010',
    },
    smtpDetails: {
        host: 'mail.thinkestry.co.za',
        port: '465',
        user: 'no-reply@thinkestry.co.za',
        pass: 'Thinkestry10$',
    }
  },
];

export const services: Service[] = [
  {
    id: 'personal-tax-return',
    title: 'Personal Tax Return (ITR12) Filing',
    description: 'Professional annual tax return filing with SARS for individuals, freelancers, and provisional taxpayers.',
    longDescription:
      'Ensure your annual SARS tax filing is accurate, compliant, and optimized for maximum refunds. We handle everything from document review to submitting the final ITR12 tax return on SARS eFiling, providing professional tax practitioner oversight to reduce auditing risks and secure all eligible deductions.',
    price: 750,
    resellerPrice: 500,
    imageUrl: 'https://picsum.photos/seed/101/600/400',
    imageHint: 'tax forms',
    category: 'SARS Services',
    department: 'Accounting and Tax',
    whatsIncluded: [
        'Complete review of tax-deductible expenses (medical, retirement, home office)',
        'Preparation of your annual ITR12 tax return',
        'Direct, secure submission to SARS via eFiling',
        'Basic audit support and handling of SARS queries',
    ],
    turnaroundTime: '5-7 working days',
    clientRequirements: [
        'IRP5/IT3(a) certificates',
        'Medical aid tax certificate',
        'Retirement annuity fund certificate',
        'Logbook for travel claims (if applicable)',
    ],
    informationToProvide: [
      { label: 'Copy of ID Document', type: 'pdf' },
      { label: 'Proof of Address', type: 'pdf' },
      { label: 'SARS eFiling Login Details', type: 'text' },
    ],
    metaTitle: 'SARS Personal Tax Return Filing (ITR12) | My Accountant',
    metaDescription: 'Professional SARS personal tax return (ITR12) filing services for South African individuals and provisional taxpayers. We ensure eFiling compliance and maximize your returns.',
    metaKeywords: ['personal tax return', 'ITR12', 'SARS eFiling', 'South Africa tax', 'tax practitioner'],
    slug: 'personal-tax-return',
    seoImageUrl: 'https://picsum.photos/seed/101/600/400'
  },
  {
    id: 'company-registration',
    title: 'New Company Registration (Pty Ltd)',
    description: 'Complete CIPC company registration for South African Pty (Ltd) companies. Includes name reservation, tax number, and MOI.',
    longDescription:
      'Start your business journey with standard-setting compliance. We manage the entire company registration process with the CIPC, including up to 4 name reservations, drafting your Memorandum of Incorporation (MOI), and securing your official SARS tax registration certificate, all in a rapid 3-to-5 day window.',
    price: 950,
    resellerPrice: 650,
    imageUrl: 'https://picsum.photos/seed/102/600/400',
    imageHint: 'business documents',
    category: 'Entity Registrations',
    department: 'Administration',
    whatsIncluded: [
        'CIPC Company Name Reservation (COR 9.1)',
        'Company Registration Certificate (COR 14.3)',
        'Automatic SARS Income Tax Number Registration',
        'Standard Memorandum of Incorporation (MOI)',
    ],
    turnaroundTime: '3-5 working days',
    clientRequirements: [
        '4 unique proposed company names in order of preference',
        'Certified ID or Smart Card copies of all proposed directors',
    ],
    informationToProvide: [],
    metaTitle: 'CIPC Company Registration (Pty Ltd) | South Africa',
    metaDescription: 'Fast and professional Pty (Ltd) company registration services with CIPC in South Africa. Includes name reservation, SARS tax number, and official MOI.',
    metaKeywords: ['company registration', 'CIPC', 'Pty Ltd', 'start a business', 'South Africa', 'register company'],
    slug: 'new-company-registration',
    seoImageUrl: 'https://picsum.photos/seed/102/600/400'
  },
  {
    id: 'monthly-bookkeeping',
    title: 'Monthly Bookkeeping Services (Basic)',
    description: 'Monthly bookkeeping, bank reconciliation, and management reporting for South African SMEs and startups.',
    longDescription:
      'Maintain financial visibility and keep your books SARS-compliant. Our monthly bookkeeping service provides professional recording of up to 50 transactions, monthly bank and credit card reconciliations, and structured management accounts (Income Statement and Balance Sheet), letting you focus on scaling your business.',
    price: 1500,
    resellerPrice: 1200,
    imageUrl: 'https://picsum.photos/seed/103/600/400',
    imageHint: 'accounting ledger',
    category: 'Accounting Services',
    department: 'Accounting and Tax',
    whatsIncluded: [
        'Processing of up to 50 monthly ledger transactions',
        'Bank and credit card reconciliations',
        'Standard Monthly Management Accounts (Income Statement & Balance Sheet)',
        'Dedicated VAT201 filing and submission support',
    ],
    turnaroundTime: 'Ongoing monthly service',
    clientRequirements: [
        'Monthly bank and credit card statements (PDF/CSV)',
        'Supplier purchase invoices and cash slips',
        'Customer sales invoices',
    ],
    informationToProvide: [
      { label: 'Monthly Bank Statements (PDF)', type: 'pdf' },
      { label: 'All Sales Invoices for the month', type: 'pdf' },
      { label: 'All Purchase Invoices/Slips for the month', type: 'pdf' },
    ],
    metaTitle: 'Bookkeeping Services for South African Small Businesses | My Accountant',
    metaDescription: 'Affordable monthly bookkeeping and accounting services for SMEs and startups in South Africa. Maintain accurate ledger reconciliation and monthly management accounts.',
    metaKeywords: ['bookkeeping services', 'small business accounting', 'monthly bookkeeping', 'accountant South Africa', 'management accounts'],
    slug: 'monthly-bookkeeping-basic',
    seoImageUrl: 'https://picsum.photos/seed/103/600/400'
  },
  {
    id: 'cipc-annual-returns',
    title: 'CIPC Annual Returns Filing',
    description: 'Mandated annual returns filing with the CIPC to keep your South African company active and compliant.',
    longDescription:
      'Prevent automatic company deregistration by filing your mandatory annual returns with the CIPC on time. We calculate your exact turnover-based CIPC return fees, complete the CIPC lodgment on your behalf, and secure your official filing confirmation certificate to keep your company in active, good standing.',
    price: 450,
    resellerPrice: 300,
    imageUrl: 'https://picsum.photos/seed/104/600/400',
    imageHint: 'compliance calendar',
    category: 'CIPC Services',
    department: 'Administration',
    whatsIncluded: [
        'Turnover-based CIPC return fee calculation',
        'Secure filing of the return with the CIPC',
        'Confirmation of filing certificate delivery',
    ],
    turnaroundTime: '1-2 working days',
    clientRequirements: [
        'Active CIPC company registration number',
        'Total annual turnover figure for the preceding financial year',
    ],
    informationToProvide: [
       { label: 'Company Registration Number', type: 'text' },
    ],
    metaTitle: 'File CIPC Annual Returns Online | South Africa Compliance',
    metaDescription: 'Quick and easy CIPC annual return filing service to keep your South African company compliant. Avoid administrative penalties and company deregistration.',
    metaKeywords: ['CIPC annual returns', 'company compliance', 'CIPC filing', 'South Africa', 'annual returns fee'],
    slug: 'cipc-annual-returns',
    seoImageUrl: 'https://picsum.photos/seed/104/600/400'
  },
  {
    id: 'coida-registration',
    title: 'COIDA Registration (Workman\'s Compensation)',
    description: 'Register your business for Workman\'s Compensation under the COIDA Act with the Department of Labour.',
    longDescription:
      'Protect your employees and safeguard your business. We handle your complete registration for Workman\'s Compensation under the Compensation for Occupational Injuries and Diseases Act (COIDA) with the Department of Labour, securing the mandatory cover for work-related injuries and illnesses.',
    price: 800,
    resellerPrice: 550,
    imageUrl: 'https://picsum.photos/seed/105/600/400',
    imageHint: 'health safety',
    category: 'COIDA Services',
    department: 'Administration',
    whatsIncluded: [
        'Preparation of registration documents and forms',
        'Submission to the Department of Labour Compensation Commissioner',
        'Delivery of your official COIDA registration certificate',
    ],
    turnaroundTime: '10-15 working days',
    clientRequirements: [
        'Company registration certificate (COR 14.3)',
        'Certified ID copies of all active directors',
        'Proof of physical business address',
        'Employee details and estimated total earnings',
    ],
    informationToProvide: [
       { label: 'Nature of Business', type: 'text' },
       { label: 'Estimated Annual Employee Earnings', type: 'text' },
       { label: 'Company Registration Certificate', type: 'pdf' },
    ],
    metaTitle: 'COIDA Registration Service South Africa | Workman\'s Compensation',
    metaDescription: 'Complete your COIDA registration for Workman\'s Compensation with the Department of Labour in South Africa. Keep your employees covered and comply with labour laws.',
    metaKeywords: ['COIDA registration', 'Compensation Fund', 'Department of Labour', 'workmans compensation', 'South Africa labour law'],
    slug: 'coida-registration',
    seoImageUrl: 'https://picsum.photos/seed/105/600/400'
  },
  {
    id: 'co-operative-society',
    title: 'Co-operative Society Registration',
    description: 'Legal CIPC registration of primary or secondary co-operative societies in South Africa.',
    longDescription:
      'Register a primary or secondary co-operative society legally at the CIPC. We handle the entire constitution drafting process, register the minimum of 7 founder members, submit official COR 9.1 name reservations, and secure your SARS tax number for full legal compliance under the SA Co-operatives Act.',
    price: 2450,
    resellerPrice: 1850,
    imageUrl: 'https://picsum.photos/seed/106/600/400',
    imageHint: 'community cooperative',
    category: 'Entity Registrations',
    department: 'Administration',
    whatsIncluded: [
        'CIPC Co-operative Name Reservation',
        'Drafting of CR1 Constitution aligned with the Co-operatives Act',
        'Registration of a minimum of 7 founder members (CR2 Register)',
        'Lodging of physical address registers (CR4 Form)',
        'Automatic SARS Income Tax Number generation',
    ],
    turnaroundTime: '10-15 working days',
    clientRequirements: [
        'Certified ID or Smart Card copies of all 7 founder members (certified within 3 months)',
        '4 unique proposed names in order of preference',
        'Physical and postal addresses for all founder members',
    ],
    informationToProvide: [],
    metaTitle: 'Co-operative Society Registration SA | Register a Co-op at CIPC',
    metaDescription: 'Legal CIPC registration services for primary and secondary co-operatives in South Africa. We manage name reservations, constitution CR1 drafting, and SARS registration.',
    metaKeywords: ['co-operative registration', 'CIPC co-op', 'primary co-operative', 'South Africa co-op', 'register cooperative'],
    slug: 'co-operative-society',
    seoImageUrl: 'https://picsum.photos/seed/106/600/400'
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: '5-essential-tax-tips-for-sa-freelancers',
    title: '5 Essential Tax Tips for South African Freelancers',
    excerpt:
      'Navigating the world of tax as a freelancer can be daunting. Here are five essential tips to help you stay compliant and a a freelancer can be daunting. Here are five essential tips to help you stay compliant and maximize your earnings.',
    content: `
      <p>Being a freelancer in South Africa offers incredible flexibility, but it also comes with the responsibility of managing your own taxes. Here are five tips to keep you on the right track:</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">1. Register as a Provisional Taxpayer</h3>
      <p>If you earn income other than a salary, you're likely a provisional taxpayer. This means you need to pay tax in advance, twice a year. Registering with SARS is the first and most crucial step.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">2. Keep Meticulous Records</h3>
      <p>Track every invoice and every expense. Use a spreadsheet or accounting software to keep your financial records organized. This will be invaluable when it's time to file.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">3. Separate Business and Personal Finances</h3>
      <p>Open a separate bank account for your business. This makes tracking income and expenses much easier and demonstrates professionalism to SARS.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">4. Understand Deductible Expenses</h3>
      <p>You can reduce your taxable income by deducting legitimate business expenses. This includes costs like internet, office supplies, software subscriptions, and a portion of your home office costs.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">5. Set Aside Money for Tax</h3>
      <p>A good rule of thumb is to set aside 25-30% of every invoice for your tax payments. This way, you won't be caught off guard when it's time to pay SARS.</p>
    `,
    imageUrl: 'https://picsum.photos/seed/201/800/400',
    imageHint: 'financial advice',
    author: 'Jane Doe',
    date: '2024-07-15',
  },
  {
    id: '2',
    slug: 'understanding-vat-in-south-africa',
    title: 'A Simple Guide to Understanding VAT in South Africa',
    excerpt:
      "VAT can be complex, but it's a critical component of many businesses. Here's a simple guide to what it is and when you need to register.",
    content: `
      <p>Value-Added Tax (VAT) is an indirect tax on the consumption of goods and services in the economy. Here's what South African business owners need to know.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">What is VAT?</h3>
      <p>Currently set at 15%, VAT is added to the price of most goods and services. Businesses that are registered for VAT (known as vendors) collect this tax on behalf of the government.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">When Do You Need to Register?</h3>
      <p>VAT registration is compulsory if the total value of your taxable supplies (income) is more than R1 million in any consecutive 12-month period, or is expected to exceed this amount. You can also register voluntarily if your income is more than R50,000 in a 12-month period.</p>
      <h3 class="font-headline text-xl font-semibold mt-4 mb-2">Input vs. Output VAT</h3>
      <p><strong>Output VAT</strong> is the tax you collect on your sales. <strong>Input VAT</strong> is the tax you pay on your business purchases. As a vendor, you pay the difference between your output and input VAT to SARS. If your input VAT is more than your output VAT, SARS will refund you the difference.</p>
    `,
    imageUrl: 'https://picsum.photos/seed/202/800/400',
    imageHint: 'shopping receipt',
    author: 'John Smith',
    date: '2024-06-28',
  },
];

export const faqs: FAQ[] = [
  {
    id: 'faq1',
    question: 'What documents do I need for my personal tax return?',
    answer:
      'You will typically need your IRP5/IT3(a) from your employer, medical aid tax certificate, retirement annuity contribution certificates, and details of any other income or deductible expenses.',
  },
  {
    id: 'faq2',
    question: 'How long does company registration take?',
    answer:
      'The company registration process with CIPC, including name reservation, usually takes between 3 to 7 business days, provided all documentation is in order.',
  },
  {
    id: 'faq3',
    question: 'Can I purchase a service online?',
    answer:
      'Yes, you can add any of our services to your cart and complete the purchase securely through our website. You will receive an order confirmation and further instructions via email.',
  },
  {
    id: 'faq4',
    question: 'How do I upload my documents securely?',
    answer:
      'Once you have created an account and purchased a service, you can log in to your client portal. There, you will find a secure section for each of your orders where you can upload the required information.',
  },
];

export const orders: Order[] = [];