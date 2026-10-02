import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'SARS Turnover Tax Calculator 2026/2027 | My Accountant' },
  description: 'Calculate estimated SARS Turnover Tax payable for micro-businesses with annual gross revenue up to R2.3 million (effective 1 April 2026).',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/turnover-tax-calculator',
  },
  openGraph: {
    title: 'SARS Turnover Tax Calculator 2026/2027 | My Accountant',
    description: 'Calculate your estimated SARS Turnover Tax payable for micro-businesses up to R2.3 million in South Africa.',
    url: 'https://www.myacc.co.za/calculators/turnover-tax-calculator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
