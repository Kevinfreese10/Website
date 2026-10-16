import BecomeAPartnerPageClient from '@/components/become-a-partner/BecomeAPartnerPageClient';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Accounting Practice Partner Program South Africa',
  description:
    'Run your accounting practice on one platform: AI Accounting, AI Payroll, Task Manager, and up to 50% wholesale discount on 80+ SARS, CIPC & statutory filings.',
  alternates: { canonical: `${SITE_URL}/become-a-partner` },
};

export default function BecomeAPartnerPage() {
  return <BecomeAPartnerPageClient />;
}
