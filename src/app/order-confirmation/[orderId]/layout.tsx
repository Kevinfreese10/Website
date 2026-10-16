import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Order Confirmation | My Accountant',
  robots: { index: false, follow: false },
};

export default function OrderConfirmationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
