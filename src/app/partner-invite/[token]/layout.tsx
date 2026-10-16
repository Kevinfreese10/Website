import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Partner Invitation | My Accountant',
  robots: { index: false, follow: false },
};

export default function PartnerInviteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
