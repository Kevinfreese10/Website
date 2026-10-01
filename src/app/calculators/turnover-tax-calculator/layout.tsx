import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'SARS Turnover Tax Calculator | My Accountant' },
  description: 'Calculate estimated SARS Turnover Tax payable for micro-businesses with annual gross revenue up to R1 million.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/turnover-tax-calculator',
  },
  openGraph: {
    title: 'SARS Turnover Tax Calculator | My Accountant',
    description: 'Calculate your estimated SARS Turnover Tax payable for micro-businesses in South Africa.',
    url: 'https://www.myacc.co.za/calculators/turnover-tax-calculator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
