'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getFirestore, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { InviteStaffDialog } from './InviteStaffDialog';
import { PermissionsEditor } from './PermissionsEditor';
import { deactivateStaffMember, reactivateStaffMember, updateStaffPermissions, revokeInvite } from '@/app/actions/staff';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Shield, UserX, UserCheck, KeyRound, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { StaffPermissions } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
  const token = await getAuth(firebaseApp).currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in to do this.');
  return token;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  permissions?: StaffPermissions;
  lastLogin?: any;
}

interface PendingInvite {
  id: string;
  invitedEmail: string;
  staffRole: string;
  status: string;
  createdAt: any;
  permissions: StaffPermissions;
}

export default function StaffManager() {
  const { user: currentUser } = useAuth();
  const { limits, tier, isGrowthActive } = usePartner();
  const { toast } = useToast();

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // States for actions
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<StaffPermissions | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const [deactivatingStaff, setDeactivatingStaff] = useState<StaffUser | null>(null);
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const partnerId = currentUser?.partnerId || currentUser?.uid || '';
  const isOwner = currentUser?.role === 'partner';

  // 1. Listen for staff users
  useEffect(() => {
    if (!partnerId) return;

    // Get all users who belong to this partner
    const q = query(
      collection(db, 'users'),
      where('partnerId', '==', partnerId),
      where('role', 'in', ['partner_staff', 'partner_admin'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staff: StaffUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        staff.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'partner_staff',
          isActive: data.isActive !== false,
          permissions: data.permissions,
          lastLogin: data.lastLogin,
        });
      });
      setStaffList(staff);
      setLoading(false);
    }, (error) => {
      console.error('Error listening for staff:', error);
      toast({ title: 'Error', description: 'Failed to load staff list.', variant: 'destructive' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, toast]);

  // 2. Listen for pending invites
  useEffect(() => {
    if (!partnerId) return;

    const q = query(
      collection(db, 'partnerInvites'),
      where('partnerId', '==', partnerId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invites: PendingInvite[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Check if expired
        const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        if (expiresAt > new Date()) {
          invites.push({
            id: doc.id,
            invitedEmail: data.invitedEmail || '',
            staffRole: data.staffRole || 'partner_staff',
            status: data.status || 'pending',
            createdAt: data.createdAt,
            permissions: data.permissions,
          });
        }
      });
      setPendingInvites(invites);
    }, (error) => {
      console.error('Error listening for invites:', error);
    });

    return () => unsubscribe();
  }, [partnerId]);

  // Calculate seat stats
  const activeStaffCount = staffList.filter(s => s.isActive).length + 1; // +1 for the owner
  const pendingInviteCount = pendingInvites.length;
  const totalUsedSeats = activeStaffCount + pendingInviteCount;
  const seatLimit = limits?.staffSeats ?? 0;

  const handleEditPermissions = (staff: StaffUser) => {
    setEditingStaff(staff);
    setEditingPermissions(staff.permissions || null);
  };

  const handleSavePermissions = async () => {
    if (!editingStaff || !editingPermissions || !partnerId) return;
    setSavingPermissions(true);
    try {
      const res = await updateStaffPermissions({
        callerPartnerId: partnerId,
        staffUid: editingStaff.id,
        permissions: editingPermissions,
        idToken: await getIdToken(),
      });

      if (res.success) {
        toast({ title: 'Permissions Updated', description: `Successfully updated permissions for ${editingStaff.name}.` });
        setEditingStaff(null);
        setEditingPermissions(null);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to update permissions.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred.', variant: 'destructive' });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingStaff || !partnerId) return;
    setDeactivatingLoading(true);
    try {
      const res = await deactivateStaffMember({
        callerPartnerId: partnerId,
        staffUid: deactivatingStaff.id,
        idToken: await getIdToken(),
      });

      if (res.success) {
        toast({ title: 'Staff Deactivated', description: `${deactivatingStaff.name} is now inactive.` });
        setDeactivatingStaff(null);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to deactivate.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred.', variant: 'destructive' });
    } finally {
      setDeactivatingLoading(false);
    }
  };

  const handleReactivate = async (staff: StaffUser) => {
    if (!partnerId) return;
    if (totalUsedSeats >= seatLimit) {
      toast({ title: 'Seat Limit Reached', description: 'Please upgrade or remove standard staff to reactivate.', variant: 'destructive' });
      return;
    }
    setActionLoading(staff.id);
    try {
      const res = await reactivateStaffMember({
        callerPartnerId: partnerId,
        staffUid: staff.id,
        idToken: await getIdToken(),
      });

      if (res.success) {
        toast({ title: 'Staff Reactivated', description: `${staff.name} is now active.` });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to reactivate.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvite = async (invite: PendingInvite) => {
    if (!partnerId) return;
    setActionLoading(invite.id);
    try {
      const res = await revokeInvite({
        callerPartnerId: partnerId,
        token: invite.id,
        idToken: await getIdToken(),
      });

      if (res.success) {
        toast({ title: 'Invite Revoked', description: `Invitation to ${invite.invitedEmail} has been cancelled.` });
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to revoke invite.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'An error occurred.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md text-center">
          Only the practice owner can manage staff and permissions. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Seat Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Invite colleagues, manage roles, and control access permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tier === 'starter' ? (
            <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 font-bold" onClick={() => window.location.href = '/partner/settings'}>
              <Sparkles className="h-4 w-4" />
              Upgrade to Practice Plan to Add Staff
            </Button>
          ) : (
            <InviteStaffDialog
              partnerId={partnerId}
              partnerName={currentUser?.name || ''}
              partnerCompanyName={currentUser?.companyName || ''}
              currentSeatCount={totalUsedSeats}
              seatLimit={seatLimit}
              onInviteSent={() => {}}
            />
          )}
        </div>
      </div>

      {tier !== 'starter' && (
        <div className="p-4 bg-muted/40 border rounded-lg max-w-md space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Seats Used</span>
            <span>{totalUsedSeats} / {seatLimit >= 999999 ? 'Unlimited' : `${seatLimit} Seats`}</span>
          </div>
          <Progress value={seatLimit >= 999999 ? 5 : (totalUsedSeats / seatLimit) * 100} className="h-2" />
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            {seatLimit >= 999999
              ? 'Your Enterprise tier includes Unlimited staff seats.'
              : `Your Practice tier includes ${seatLimit} seats (1 Owner + ${seatLimit - 1} Staff members/admins). Pending invites count towards your limit.`}
          </div>
        </div>
      )}

      {/* Staff & Invite Table */}
      <div className="border rounded-lg bg-card">
        {loading ? (
          <div role="status" aria-live="polite" aria-busy="true" className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Owner Row */}
              <TableRow>
                <TableCell className="font-semibold">{currentUser?.name} (You)</TableCell>
                <TableCell className="text-muted-foreground">{currentUser?.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-primary/30 text-primary">Owner</Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Active</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">Always active</TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Active / Inactive Staff Rows */}
              {staffList.map((staff) => {
                const lastLoginStr = staff.lastLogin
                  ? `${formatDistanceToNow(staff.lastLogin?.toDate ? staff.lastLogin.toDate() : new Date(staff.lastLogin))} ago`
                  : 'Never logged in';

                return (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name || 'Unnamed Staff'}</TableCell>
                    <TableCell className="text-muted-foreground">{staff.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {staff.role === 'partner_admin' ? 'Partner Admin' : 'Staff Member'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {staff.isActive ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {actionLoading === staff.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        lastLoginStr
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPermissions(staff)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Edit Permissions
                          </DropdownMenuItem>
                          {staff.isActive ? (
                            <DropdownMenuItem
                              className="text-destructive font-semibold"
                              onClick={() => setDeactivatingStaff(staff)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600 font-semibold"
                              onClick={() => handleReactivate(staff)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Pending Invite Rows */}
              {pendingInvites.map((invite) => (
                <TableRow key={invite.id} className="bg-yellow-500/5 hover:bg-yellow-500/10">
                  <TableCell className="italic text-muted-foreground font-medium">Pending Invite</TableCell>
                  <TableCell className="text-muted-foreground">{invite.invitedEmail}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {invite.staffRole === 'partner_admin' ? 'Partner Admin' : 'Staff Member'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-500/10">Pending</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">Invite sent</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-label="More actions" variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive font-semibold"
                          onClick={() => handleRevokeInvite(invite)}
                          disabled={actionLoading === invite.id}
                        >
                          {actionLoading === invite.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4 mr-2" />
                          )}
                          Revoke Invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {staffList.length === 0 && pendingInvites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No staff members invited yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Permissions Dialog */}
      <Dialog open={editingStaff !== null} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Staff Permissions</DialogTitle>
            <DialogDescription>
              Configure granular access limits for {editingStaff?.name || 'staff member'}.
            </DialogDescription>
          </DialogHeader>

          {editingPermissions && (
            <div className="space-y-6 pt-2">
              <PermissionsEditor
                permissions={editingPermissions}
                onChange={setEditingPermissions}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingStaff(null)} disabled={savingPermissions}>
                  Cancel
                </Button>
                <Button onClick={handleSavePermissions} disabled={savingPermissions} className="gap-2">
                  {savingPermissions ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Deactivate Alert Dialog */}
      <AlertDialog open={deactivatingStaff !== null} onOpenChange={(open) => !open && setDeactivatingStaff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for <strong>{deactivatingStaff?.name}</strong>. Their account and logs will be preserved, but they will not be able to sign in or perform any actions inside your practice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivatingLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deactivatingLoading}
              onClick={handleDeactivate}
            >
              {deactivatingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
