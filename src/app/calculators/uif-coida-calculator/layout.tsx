import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UIF & COIDA Calculator South Africa | MyAcc',
  description: 'Calculate UIF contributions and estimate COIDA for employees in South Africa.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;}
