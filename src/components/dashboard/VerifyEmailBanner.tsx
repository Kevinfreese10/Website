'use client';

import { useEffect, useState } from 'react';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { MailCheck, Loader2 } from 'lucide-react';

/**
 * Prompts a signed-in client to verify their email address.
 *
 * Access to orders matched by email address now requires a verified address (see
 * `hasVerifiedEmail()` in firestore.rules). Customers who checked out as a guest and later
 * registered will not see those orders until they verify, so they need a clear, self-service way
 * to resolve it rather than contacting support.
 *
 * Renders nothing when the address is already verified.
 */
export default function VerifyEmailBanner() {
  const { claimVerifiedGuestOrders } = useAuth();
  const { toast } = useToast();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const current = getAuth(firebaseApp).currentUser;
    setNeedsVerification(!!current && !current.emailVerified);
  }, []);

  if (!needsVerification) return null;

  const handleResend = async () => {
    const current = getAuth(firebaseApp).currentUser;
    if (!current) return;
    setIsSending(true);
    try {
      await sendEmailVerification(current);
      toast({
        title: 'Verification email sent',
        description: `Check ${current.email} and click the link. It may take a minute to arrive.`,
      });
    } catch (err: any) {
      toast({
        title: 'Could not send the email',
        description: err?.message || 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAlreadyVerified = async () => {
    const current = getAuth(firebaseApp).currentUser;
    if (!current) return;
    setIsChecking(true);
    try {
      await current.reload();
      if (current.emailVerified) {
        const linked = await claimVerifiedGuestOrders();
        setNeedsVerification(false);
        toast({
          title: 'Email verified',
          description: linked > 0
            ? `Thanks — we've also linked ${linked} earlier order${linked === 1 ? '' : 's'} to your account.`
            : 'Thanks — your account is fully set up.',
        });
      } else {
        toast({
          title: 'Not verified yet',
          description: 'We could not see a verification yet. Click the link in the email, then try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-amber-900">Please confirm your email address</p>
            <p className="mt-0.5 text-xs text-amber-900/80">
              Some orders placed before you created this account stay hidden until we can confirm
              the address belongs to you.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleResend} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend email
          </Button>
          <Button size="sm" onClick={handleAlreadyVerified} disabled={isChecking}>
            {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I&apos;ve verified
          </Button>
        </div>
      </div>
    </div>
  );
}
