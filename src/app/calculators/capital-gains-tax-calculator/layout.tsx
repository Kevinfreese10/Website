import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Capital Gains Tax (CGT) Calculator South Africa | MyAcc',
  description: 'Calculate Capital Gains Tax for individuals and companies in South Africa.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;}
