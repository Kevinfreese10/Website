import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'CIDB Fee & Grade Requirements Calculator | My Accountant' },
  description: 'Verify financial turnover, available capital, and project track record requirements for CIDB Grades 1 to 9, or check contractor eligibility instantly.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/cidb-fee-and-grade',
  },
  openGraph: {
    title: 'CIDB Fee & Grade Requirements Calculator | My Accountant',
    description: 'Verify financial and track record requirements for CIDB contractor grading in South Africa.',
    url: 'https://www.myacc.co.za/calculators/cidb-fee-and-grade',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
