import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'UIF & COIDA Calculator South Africa | My Accountant' },
  description: 'Calculate monthly employer and employee UIF contributions (capped at R17,712) and estimate annual COIDA compensation fund assessment fees.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/uif-coida-calculator',
  },
  openGraph: {
    title: 'UIF & COIDA Calculator South Africa | My Accountant',
    description: 'Calculate UIF contributions and estimate COIDA for employees in South Africa.',
    url: 'https://www.myacc.co.za/calculators/uif-coida-calculator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
