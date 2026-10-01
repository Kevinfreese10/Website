import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'BEE Scorecard Estimator South Africa | My Accountant' },
  description: 'Estimate your B-BBEE recognition level and scorecard points based on ownership, management, skills development, and procurement.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/bee-scorecard-estimator',
  },
  openGraph: {
    title: 'BEE Scorecard Estimator South Africa | My Accountant',
    description: 'Estimate your B-BBEE recognition level and scorecard points based on generic elements.',
    url: 'https://www.myacc.co.za/calculators/bee-scorecard-estimator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
