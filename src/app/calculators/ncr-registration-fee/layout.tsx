import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'NCR Registration Fee Calculator | My Accountant' },
  description: 'Estimate your National Credit Regulator (NCR) initial registration, branch, and application fees based on total credit book value.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/ncr-registration-fee',
  },
  openGraph: {
    title: 'NCR Registration Fee Calculator | My Accountant',
    description: 'Estimate National Credit Regulator (NCR) registration, branch, and application fees in South Africa.',
    url: 'https://www.myacc.co.za/calculators/ncr-registration-fee',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
