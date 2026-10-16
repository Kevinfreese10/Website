import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import DashboardClientLayout from './DashboardClientLayout';

export const metadata: Metadata = {
  title: 'Client Dashboard | My Accountant',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
