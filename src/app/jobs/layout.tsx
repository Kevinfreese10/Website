import { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Careers & Job Board | My Accountant South Africa',
  description:
    'Explore accounting, bookkeeping, tax practitioner, and article clerk career opportunities at My Accountant and partner firms across South Africa.',
  alternates: {
    canonical: `${SITE_URL}/jobs`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
