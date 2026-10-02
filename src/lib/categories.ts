export interface CategoryMeta {
  id: string;
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  order: number;
}

export const CATEGORIES_LIST: CategoryMeta[] = [
  {
    id: 'entity-registrations',
    name: 'Entity Registrations',
    slug: 'entity-registrations',
    description: 'From Companies to Non-Profits – We Handle All Entity Registrations',
    metaTitle: 'Company & Entity Registrations South Africa',
    metaDescription: 'Fast, online registration for Private Companies (Pty Ltd), Non-Profit Companies (NPC), Personal Liability Companies (Inc), and Co-operatives in South Africa.',
    order: 1,
  },
  {
    id: 'sars-registrations',
    name: 'SARS Registrations',
    slug: 'sars-registrations',
    description: 'Fast & Reliable SARS Registrations – Get Compliant Today',
    metaTitle: 'SARS Tax Registrations South Africa',
    metaDescription: 'Official SARS registrations for Income Tax, VAT, PAYE, Customs Import/Export Codes, and Public Officer appointments handled by registered practitioners.',
    order: 2,
  },
  {
    id: 'cipc-services',
    name: 'CIPC Services',
    slug: 'cipc-services',
    description: 'All-in-One CIPC Services – From Company Setup to Compliance',
    metaTitle: 'CIPC Secretarial & Compliance Services South Africa',
    metaDescription: 'Full-suite CIPC secretarial services: Annual Returns, Beneficial Ownership register, Director Changes, Address Updates, and Company Reinstatements.',
    order: 3,
  },
  {
    id: 'sars-services',
    name: 'SARS Services',
    slug: 'sars-services',
    description: 'Expert SARS Solutions – From Tax Returns to Clearance',
    metaTitle: 'SARS Tax Returns & Clearance Services South Africa',
    metaDescription: 'Expert SARS tax return submissions (ITR12, ITR14, VAT201, EMP201), Tax Clearance PINs, Section 104 Objections, and Penalty Remissions.',
    order: 4,
  },
  {
    id: 'accounting-services',
    name: 'Accounting Services',
    slug: 'accounting-services',
    description: 'Expert Accounting Support – Focus on Growth, We Handle the Numbers',
    metaTitle: 'Professional Accounting & Bookkeeping Services South Africa',
    metaDescription: 'Fixed-fee monthly accounting, bank reconciliations, management accounts, Annual Financial Statements (AFS), and payroll for South African businesses.',
    order: 5,
  },
  {
    id: 'ncr-registrations',
    name: 'NCR Registrations',
    slug: 'ncr-registrations',
    description: 'Register with the NCR & Grow Your Credit Business the Right Way',
    metaTitle: 'NCR Credit Provider Registration South Africa',
    metaDescription: 'National Credit Regulator (NCR) registration for credit providers, micro-lenders, Form 39 annual compliance submissions, and NCR Form 40 statutory reporting.',
    order: 6,
  },
  {
    id: 'cidb-services',
    name: 'CIDB Services',
    slug: 'cidb-services',
    description: 'CIDB Registration Made Easy – Get Your Construction Grading Fast',
    metaTitle: 'CIDB Contractor Registration & Upgrades South Africa',
    metaDescription: 'Fast CIDB contractor registrations (Grade 1), annual renewals, and contractor upgrades from Grade 2 to 9 for public and private construction tenders.',
    order: 7,
  },
  {
    id: 'coida-services',
    name: 'COIDA Services',
    slug: 'coida-services',
    description: 'Get COIDA Registered & Protect Your Employees with Ease',
    metaTitle: 'COIDA Registration & Letter of Good Standing South Africa',
    metaDescription: 'Compensation Fund (COIDA) registration, annual Return of Earnings (W.As.8) submissions, and rapid 24-hour Letters of Good Standing from DoEL.',
    order: 8,
  },
  {
    id: 'ncca-services',
    name: 'NCCA Services',
    slug: 'ncca-services',
    description: 'Professional NCCA Registrations – Stay Aligned with Industry Standards',
    metaTitle: 'NCCA Cleaning Industry Registration South Africa',
    metaDescription: 'National Contract Cleaners Association (NCCA) membership registration and compliance support for commercial and contract cleaning businesses in South Africa.',
    order: 9,
  },
  {
    id: 'nhbrc-registration',
    name: 'NHBRC Registration',
    slug: 'nhbrc-registration',
    description: 'NHBRC Registration for Builders & Developers',
    metaTitle: 'NHBRC Builder Registration South Africa',
    metaDescription: 'National Home Builders Registration Council (NHBRC) registration assistance for builders, general contractors, and residential property developers in SA.',
    order: 10,
  },
  {
    id: 'licences-permits',
    name: 'Licences & Permits',
    slug: 'licences-permits',
    description: 'Industry-Specific Operating Licences, Transport, Health, Energy & Trade Permits',
    metaTitle: 'Business Operating Licences & Permits South Africa',
    metaDescription: 'Applications for Liquor Licences, Transport Operating Licences (Form 1B), Cross-Border Permits (C-BRTA), Food Certificates of Acceptability, and DoEL registrations.',
    order: 11,
  },
  {
    id: 'compliance-governance',
    name: 'Compliance & Governance',
    slug: 'compliance-governance',
    description: 'POPIA Data Privacy, PAIA Statutory Reporting & Community Scheme Compliance',
    metaTitle: 'POPIA, PAIA & Corporate Governance Compliance South Africa',
    metaDescription: 'Comprehensive statutory governance packs: POPIA compliance manuals, Information Officer registration, PAIA Section 51 manuals, and CSOS scheme filings.',
    order: 12,
  },
];

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  const clean = slug.toLowerCase().trim();
  return CATEGORIES_LIST.find(
    (c) => c.slug === clean || c.slug.replace(/-/g, '') === clean.replace(/-/g, '')
  );
}

export function getCategorySlugByName(name: string): string {
  const clean = name.toLowerCase().trim();
  const match = CATEGORIES_LIST.find(
    (c) => c.name.toLowerCase() === clean || c.slug === clean || clean.includes(c.name.toLowerCase())
  );
  if (match) return match.slug;
  return clean.replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
