import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Provisional Tax Estimator South Africa | MyAcc',
  description: 'Estimate your provisional tax payable in South Africa based on current SARS tax brackets.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;}
