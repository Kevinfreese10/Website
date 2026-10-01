import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Small Business Corporation (SBC) Tax Savings Estimator | My Accountant' },
  description: 'Estimate your corporate tax savings by qualifying for SARS Section 12E Small Business Corporation (SBC) preferential tax rates.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/sbc-tax-estimator',
  },
  openGraph: {
    title: 'Small Business Corporation (SBC) Tax Savings Estimator | My Accountant',
    description: 'Estimate corporate tax savings by qualifying as a SARS Small Business Corporation.',
    url: 'https://www.myacc.co.za/calculators/sbc-tax-estimator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
