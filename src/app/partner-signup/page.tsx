import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import PartnerSignupForm from '@/components/auth/PartnerSignupForm';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Create Your Practice Account | My Accountant Back-Office Partner Program',
  description:
    'Start your free or paid My Accountant Back-Office Partner account with AI Accounting, AI Payroll, Practice Task Manager, and up to 50% wholesale discount on all statutory services.',
  alternates: { canonical: `${SITE_URL}/partner-signup` },
};

export default function PartnerSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create Your Accounting Practice Back-Office Account
          </h1>
          <CardDescription>
            Choose your practice plan — start free with 10% wholesale discount, or unlock 30%–50% off with AI Accounting & Payroll capacity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            }
          >
            <PartnerSignupForm />
          </Suspense>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
