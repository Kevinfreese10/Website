import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Payroll Cost Calculator | My Accountant' },
  description: 'Estimate monthly outsourced payroll administration and SARS/Department of Labour compliance fees based on employee count.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/payroll-cost',
  },
  openGraph: {
    title: 'Payroll Cost Calculator | My Accountant',
    description: 'Estimate your monthly outsourced payroll administration and compliance fees instantly.',
    url: 'https://www.myacc.co.za/calculators/payroll-cost',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
