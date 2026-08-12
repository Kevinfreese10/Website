import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BEE Scorecard Estimator South Africa | MyAcc',
  description: 'Estimate your B-BBEE level and score based on generic elements.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;}
