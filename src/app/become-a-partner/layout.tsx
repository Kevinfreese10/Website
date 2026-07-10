import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: { absolute: 'Become a Partner | Bookkeeper Empowerment Initiative | My Accountant' },
    description: "Join South Africa's fastest-growing accountant network. Get a white-label practice, AI tools, and outsourcing backend for free.",
  };
  return getStaticPageMetadata('become-a-partner', defaults);
}

export default function BecomeAPartnerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
