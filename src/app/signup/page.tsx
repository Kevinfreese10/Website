
'use client';
import SignupForm from '@/components/auth/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

function SignupFormWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }
      if (user.role === 'admin' || user.role === 'staff' || user.role === 'cap_staff' || user.role === 'cap_supervisor') {
        router.push('/admin/dashboard');
      } else if (user.role === 'partner' || user.role === 'partner_staff' || user.role === 'partner_admin') {
        router.push('/partner/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router, searchParams]);

  return (
    <Suspense fallback={<div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" /><span className="sr-only">Loading…</span></div>}>
      <SignupForm />
    </Suspense>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join My Accountant to manage your services and orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" /><span className="sr-only">Loading…</span></div>}>
            <SignupFormWrapper />
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
