import BecomeAPartnerPageClient from '@/components/become-a-partner/BecomeAPartnerPageClient';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All-Inclusive Back Office for Accounting Practices | My Accountant Partner Program',
  description:
    'Run your entire accounting practice from one platform: AI Accounting, AI Payroll, Practice Task Manager, and up to 50% wholesale discount on 80+ SARS, CIPC, COIDA, and statutory services.',
  alternates: { canonical: `${SITE_URL}/become-a-partner` },
};

export default function BecomeAPartnerPage() {
  return <BecomeAPartnerPageClient />;
}
