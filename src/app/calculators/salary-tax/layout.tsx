import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Salary Tax (PAYE) Calculator 2025/2026 | My Accountant' },
  description: 'Calculate monthly SARS pay-as-you-earn (PAYE) deductions, medical aid credits, and net take-home salary based on the latest tax rates.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/salary-tax',
  },
  openGraph: {
    title: 'Salary Tax (PAYE) Calculator 2025/2026 | My Accountant',
    description: 'Estimate your monthly SARS PAYE deductions and net take-home salary.',
    url: 'https://www.myacc.co.za/calculators/salary-tax',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
