import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'VAT Calculator South Africa 2026/2027 | My Accountant' },
  description: 'Calculate South African Value Added Tax (VAT) at 15%. Easily add or remove VAT from any amount with current SARS tax rates.',
  alternates: {
    canonical: 'https://www.myacc.co.za/calculators/vat-calculator',
  },
  openGraph: {
    title: 'VAT Calculator South Africa 2026/2027 | My Accountant',
    description: 'Calculate South African Value Added Tax (VAT) at 15%. Easily add or remove VAT from any amount.',
    url: 'https://www.myacc.co.za/calculators/vat-calculator',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
