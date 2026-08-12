import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VAT Calculator South Africa 2024/2025 | MyAcc',
  description: 'Calculate South African Value Added Tax (VAT) at 15%. Easily add or remove VAT from any amount.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;}
