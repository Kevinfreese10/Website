import { ReactNode } from 'react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Become a Partner | Bookkeeper Empowerment Initiative | My Accountant',
  description: "Join South Africa's fastest-growing accountant network. Get a white-label practice, AI tools, and outsourcing backend from R950/month.",
  alternates: { canonical: 'https://www.myacc.co.za/become-a-partner' },
};

export default function BecomeAPartnerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
