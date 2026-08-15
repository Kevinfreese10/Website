'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { PartnerInvite } from '@/lib/types';
import { acceptPartnerInviteAction } from '@/app/actions/account-provisioning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export default function AcceptInviteForm({ invite }: { invite: PartnerInvite }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Name Required', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Weak Password', description: 'Password must be at least 8 characters long.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1. Log out any currently logged in user to avoid conflicts
      await signOut(auth);

      // 2. Create the user authentication record
      const credential = await createUserWithEmailAndPassword(auth, invite.invitedEmail, password);
      const uid = credential.user.uid;

      // 3. Update displayName in Auth
      await updateProfile(credential.user, { displayName: name });

      // 4. Create the Firestore user document with the non-privileged profile fields.
      // role/partnerId/permissions are intentionally NOT set here — firestore.rules blocks
      // clients from self-assigning those fields. They're granted server-side in step 5,
      // after the invite token, its expiry, and the invited email are re-verified.
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        uid: uid,
        name: name,
        email: invite.invitedEmail,
        createdAt: serverTimestamp(),
        source: 'Partner Management',
        status: 'Active',
      });

      // 5. Redeem the invite server-side: validates status/expiry/email match, then grants
      // role, partnerId, and permissions and marks the invite accepted.
      const idToken = await credential.user.getIdToken();
      const result = await acceptPartnerInviteAction(idToken, invite.token);
      if (!result.success) {
        throw new Error(result.error || 'Could not complete account setup.');
      }

      toast({ title: 'Welcome!', description: 'Your account has been created successfully.' });
      
      // 6. Redirect to dashboard
      router.push('/partner/dashboard');
    } catch (err: any) {
      console.error('Error accepting invite:', err);
      let errMsg = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email address is already in use by another account.';
      }
      toast({ title: 'Registration Failed', description: errMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full border-primary/20 shadow-xl">
      <CardHeader className="bg-primary/5 border-b border-primary/10 rounded-t-lg text-center">
        <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-2" />
        <CardTitle className="text-primary font-black text-2xl">Join {invite.partnerCompanyName}</CardTitle>
        <CardDescription>
          You have been invited by {invite.partnerName} to join their practice as a {invite.staffRole === 'partner_admin' ? 'Partner Admin' : 'Staff Member'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
            <Input id="email" type="email" value={invite.invitedEmail} disabled className="bg-muted font-semibold" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Your Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pass" className="text-xs font-bold uppercase text-muted-foreground">Choose Password</Label>
            <Input
              id="pass"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirm" className="text-xs font-bold uppercase text-muted-foreground">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-md font-bold gap-2 mt-4 shadow-md">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Setting up Account...
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5" />
                Accept & Create Account
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t justify-center py-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          By creating an account, you agree to join this practice dashboard on My Accountant.
        </p>
      </CardFooter>
    </Card>
  );
}
