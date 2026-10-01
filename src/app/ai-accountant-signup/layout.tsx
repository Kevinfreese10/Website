import { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'AI Accountant Signup | My Accountant' },
  description: 'Create your AI Accountant account to automate bank reconciliations, 9-clue smart match allocation, and SARS tax filing for South African businesses.',
  alternates: {
    canonical: 'https://www.myacc.co.za/ai-accountant-signup',
  },
  openGraph: {
    title: 'AI Accountant Signup | My Accountant',
    description: 'Create your account to start automating your South African bookkeeping and tax compliance.',
    url: 'https://www.myacc.co.za/ai-accountant-signup',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
