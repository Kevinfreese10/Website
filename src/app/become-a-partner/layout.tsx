import { ReactNode } from 'react';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'Become a Partner | Bookkeeper Empowerment Initiative | My Accountant' },
  description: "Join South Africa's fastest-growing accountant network. Get a white-label practice, AI tools, and outsourcing backend from R950/month.",
  alternates: { canonical: `${SITE_URL}/become-a-partner` },
};

export default function BecomeAPartnerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
