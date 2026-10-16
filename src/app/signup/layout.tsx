import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create Client Account | My Accountant',
  description: 'Register for a My Accountant client portal account.',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
