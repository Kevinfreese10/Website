import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Capital Gains Tax (CGT) Calculator | My Accountant' },
  description: 'Calculate South African Capital Gains Tax for individuals and companies, including annual exclusions and inclusion rates.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/capital-gains-tax-calculator',
  },
  openGraph: {
    title: 'Capital Gains Tax (CGT) Calculator | My Accountant',
    description: 'Calculate Capital Gains Tax for individuals and companies in South Africa.',
    url: 'https://www.myacc.co.za/calculators/capital-gains-tax-calculator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
