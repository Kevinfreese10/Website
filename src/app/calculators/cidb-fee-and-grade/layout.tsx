import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'CIDB Fee & Grade Calculator (2026) | My Accountant' },
  description: 'Verify financial turnover, available capital, and project track record requirements for CIDB Grades 1 to 9, or check contractor eligibility instantly.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/cidb-fee-and-grade',
  },
  openGraph: {
    title: 'CIDB Fee & Grade Calculator (2026) | My Accountant',
    description: 'Verify financial and track record requirements for CIDB contractor grading in South Africa.',
    url: 'https://www.myacc.co.za/calculators/cidb-fee-and-grade',
  },
};

const cidbFaqs = [
  {
    question: 'How do I log in to the CIDB Contractor portal?',
    answer: 'To log in, visit registers.cidb.org.za or cidb.org.za and navigate to Contractor Registration. Use your registered email address and password. Once logged in, you can view your active CRS number, download certificates, and check renewal dates.',
  },
  {
    question: 'What is the CIDB i-Tender portal and how do I log in?',
    answer: 'The CIDB i-Tender portal (itender.cidb.org.za) is the official public procurement platform where government departments advertise construction tenders. Contractors can browse tenders filtered by CIDB Grade (e.g. 1GB, 3CE, 7ME) and class of works.',
  },
  {
    question: 'How do I find my CIDB CRS number?',
    answer: 'Your CRS (Contractor Registration System) number is printed on your official CIDB certificate and registration confirmation letter. You can also search your company name on the public CIDB Register of Contractors at registers.cidb.org.za.',
  },
  {
    question: 'What documents are required to register for CIDB Grade 1?',
    answer: 'CIDB Grade 1 requires company registration documents (CIPC CoR14.3), certified director ID copies, proof of business address, and an active SARS Tax Compliance Status (TCS) PIN. No prior project track record or audited financials are required for Grade 1.',
  },
  {
    question: 'How often do I need to renew my CIDB registration?',
    answer: 'CIDB contractor registrations must be renewed annually by paying the annual renewal fee and submitting a valid SARS TCS PIN. Registrations are valid for a three-year cycle before full re-assessment.',
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cidbFaqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
