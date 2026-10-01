import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Total Cost to Employer (TCOE) Calculator | My Accountant' },
  description: 'Calculate your company full payroll overhead, including employer UIF, SDL, and COIDA estimations on top of gross salary.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/total-cost-to-employer',
  },
  openGraph: {
    title: 'Total Cost to Employer (TCOE) Calculator | My Accountant',
    description: 'Calculate company payroll overhead, including employer UIF, SDL, and COIDA estimations.',
    url: 'https://www.myacc.co.za/calculators/total-cost-to-employer',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
