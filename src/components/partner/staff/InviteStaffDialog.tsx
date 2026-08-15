'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PermissionsEditor } from './PermissionsEditor';
import { sendStaffInvite } from '@/app/actions/staff';
import { DEFAULT_STAFF_PERMISSIONS, ADMIN_STAFF_PERMISSIONS, StaffPermissions } from '@/lib/types';
import { Loader2, UserPlus } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

async function getIdToken(): Promise<string> {
  const token = await getAuth(firebaseApp).currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in to do this.');
  return token;
}

type InviteStaffDialogProps = {
  partnerId: string;
  partnerName: string;
  partnerCompanyName: string;
  currentSeatCount: number;
  seatLimit: number;
  onInviteSent: () => void;
  trigger?: React.ReactNode;
};

export function InviteStaffDialog({
  partnerId,
  partnerName,
  partnerCompanyName,
  currentSeatCount,
  seatLimit,
  onInviteSent,
  trigger,
}: InviteStaffDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'partner_admin' | 'partner_staff'>('partner_staff');
  const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_STAFF_PERMISSIONS);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole: 'partner_admin' | 'partner_staff') => {
    setRole(newRole);
    if (newRole === 'partner_admin') {
      setPermissions(ADMIN_STAFF_PERMISSIONS);
    } else {
      setPermissions(DEFAULT_STAFF_PERMISSIONS);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    if (currentSeatCount >= seatLimit) {
      toast({ title: 'Limit Reached', description: 'You have reached your seat limit. Please upgrade.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await sendStaffInvite({
        partnerId,
        invitedByName: partnerName,
        invitedEmail: email,
        staffRole: role,
        permissions,
        idToken: await getIdToken(),
      });

      if (res.success) {
        toast({ title: 'Invitation Sent', description: `An invite has been emailed to ${email}.` });
        setEmail('');
        handleRoleChange('partner_staff');
        setOpen(false);
        onInviteSent();
      } else {
        toast({ title: 'Invite Failed', description: res.error || 'Failed to send invitation.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Invite Failed', description: err.message || 'An error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button disabled={currentSeatCount >= seatLimit} className="gap-2">
      <UserPlus className="h-4 w-4" />
      Invite Staff Member
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invite Staff Member</DialogTitle>
          <DialogDescription>
            Invite a staff member or administrator to join your practice on My Accountant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="staff@yourfirm.co.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold block">Select Role</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="invite-role"
                  value="partner_staff"
                  checked={role === 'partner_staff'}
                  onChange={() => handleRoleChange('partner_staff')}
                  disabled={loading}
                  className="h-4 w-4 accent-primary"
                />
                <div>
                  <div className="text-sm font-bold text-foreground">Staff Member</div>
                  <div className="text-xs text-muted-foreground">Standard access to workflow.</div>
                </div>
              </label>
              <label className="flex items-center gap-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="invite-role"
                  value="partner_admin"
                  checked={role === 'partner_admin'}
                  onChange={() => handleRoleChange('partner_admin')}
                  disabled={loading}
                  className="h-4 w-4 accent-primary"
                />
                <div>
                  <div className="text-sm font-bold text-foreground">Partner Admin</div>
                  <div className="text-xs text-muted-foreground">Full access + service management.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold block">Customize Permissions</Label>
            <PermissionsEditor
              permissions={permissions}
              onChange={setPermissions}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Invite...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
