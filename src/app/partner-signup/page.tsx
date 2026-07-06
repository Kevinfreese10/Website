
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import PartnerSignupForm from '@/components/auth/PartnerSignupForm';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Become a Partner',
  description: 'Join the My Accountant partner program to grow your practice, access new opportunities, and leverage our expert team and technology.',
  alternates: { canonical: `${SITE_URL}/partner-signup` },
};

export default function PartnerSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Become a Partner</CardTitle>
          <CardDescription>Fill out the form below to join our partner program.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }>
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
