import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Provisional Tax Estimator South Africa 2025/2026 | My Accountant' },
  description: 'Estimate your first and second period SARS provisional tax payable based on the latest tax brackets and primary rebates.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/provisional-tax-estimator',
  },
  openGraph: {
    title: 'Provisional Tax Estimator South Africa 2025/2026 | My Accountant',
    description: 'Estimate your provisional tax payable in South Africa based on current SARS tax brackets.',
    url: 'https://www.myacc.co.za/calculators/provisional-tax-estimator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
