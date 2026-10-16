import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: { absolute: 'Accounting Practice Partner Program | My Accountant' },
    description:
      'Run your accounting practice on one platform: AI Accounting, AI Payroll, Task Manager, and up to 50% wholesale discount on 80+ SARS, CIPC & statutory filings.',
  };
  return getStaticPageMetadata('become-a-partner', defaults);
}

export default function BecomeAPartnerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
