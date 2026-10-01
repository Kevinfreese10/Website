import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'CIPC Annual Return Fee Calculator | My Accountant' },
  description: 'Calculate company CIPC annual return filing fees and check for late penalties based on annual turnover for private and public companies.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/cipc-annual-return-fee',
  },
  openGraph: {
    title: 'CIPC Annual Return Fee Calculator | My Accountant',
    description: 'Calculate your company CIPC annual return filing fees and late penalties instantly.',
    url: 'https://www.myacc.co.za/calculators/cipc-annual-return-fee',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
