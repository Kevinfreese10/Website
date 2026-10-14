'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  Briefcase,
  GraduationCap,
  Globe,
  Mail,
  XCircle,
  Wrench,
  Award,
  Sparkles,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, Service } from '@/lib/types';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminEmail } from '@/app/actions/email-gateway';
import { getAuth } from 'firebase/auth';
import PartnerProfile from '@/components/partner/PartnerProfile';
import {
  NormalizedPartnerTier,
  buildDefaultSubscriptionForTier,
  getPartnerTierPlan,
  normalizePartnerTier,
} from '@/lib/partner-pricing';

const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
  const token = await getAuth(firebaseApp).currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in to do this.');
  return token;
}

function getTierBadge(tierInput?: string | null) {
  const tier = normalizePartnerTier(tierInput as any);
  if (tier === 'enterprise') {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-[10px] uppercase font-bold w-fit">
        Enterprise · R4,950/pm (50% Off)
      </Badge>
    );
  }
  if (tier === 'practice') {
    return (
      <Badge className="bg-primary text-primary-foreground border-none text-[10px] uppercase font-bold w-fit">
        Practice · R950/pm (30% Off)
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] uppercase font-bold w-fit">
      Starter · Free (10% Off)
    </Badge>
  );
}

function PartnerProfileDialog({
  partner,
  allServices,
  open,
  onOpenChange,
}: {
  partner: User | null;
  allServices: Service[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  if (!partner) return null;

  const expertise =
    partner.capableServices?.map((id) => allServices.find((s) => s.id === id)?.title).filter(Boolean) || [];
  const tierPlan = getPartnerTierPlan(partner.partnerTier);

  const handleSetOverflowApproval = async (approved: boolean) => {
    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', partner.id);
      await updateDoc(userRef, {
        overflowApproved: approved,
        overflowApprovedAt: serverTimestamp(),
      });

      if (approved && partner.email) {
        try {
          const partnerName = partner.contactPerson || partner.name || 'Partner';
          const practiceName = partner.companyName || partner.name || 'Practice';
          const emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #059669; margin-top: 0;">🎉 Approved for Network Overflow Program!</h2>
              <p>Hi ${partnerName},</p>
              <p>Great news! Your practice <strong>${practiceName}</strong> has been officially approved for the <strong>My Accountant Network Overflow Program</strong>.</p>
              <p>Our operations team will assign client overflow jobs matching your certified skill sets directly to your practice dashboard.</p>
              <p style="margin-top: 30px; font-size: 13px; color: #64748b;">My Accountant Network Operations</p>
            </div>
          `;
          await sendAdminEmail({
            idToken: await getIdToken(),
            to: partner.email,
            subject: '🎉 Approved: My Accountant Network Overflow Program',
            html: emailHtml,
          });
        } catch (emailErr) {
          console.error('Failed to send overflow approval email:', emailErr);
        }
      }

      toast({
        title: approved ? 'Partner Approved' : 'Approval Revoked',
        description: `Successfully updated overflow program status for ${partner.companyName || partner.name}.`,
      });
    } catch (error) {
      console.error('Error setting overflow approval status:', error);
      toast({
        title: 'Operation Failed',
        description: 'Could not update the overflow program status.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold">{partner.companyName || partner.name}</DialogTitle>
              <DialogDescription>Professional Practice Back-Office Profile</DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge variant={partner.status === 'Active' ? 'success' : 'secondary'} className="uppercase font-bold w-fit">
                {partner.status}
              </Badge>
              {getTierBadge(partner.partnerTier)}
              {partner.wantsOutsourcedWork &&
                (partner.overflowApproved ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] w-fit font-bold">
                    Overflow Approved
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] w-fit font-bold">
                    Overflow Pending Approval
                  </Badge>
                ))}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow p-6">
          <div className="space-y-8 pb-4">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                <Building2 className="h-3.5 w-3.5" /> Back-Office Plan & Entitlements
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Wholesale Discount</p>
                  <p className="text-base font-black text-primary mt-0.5">{tierPlan.discountPercent}% Off</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">AI Accounting</p>
                  <p className="text-base font-black mt-0.5">
                    {tierPlan.id === 'enterprise' ? 'Unlimited' : `${tierPlan.aiCompanyLimit} Clients`}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">AI Payroll</p>
                  <p className="text-base font-black mt-0.5">
                    {tierPlan.id === 'enterprise' ? 'Unlimited' : `${tierPlan.aiPayrollLimit} Clients`}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Staff Seats</p>
                  <p className="text-base font-black mt-0.5">
                    {tierPlan.id === 'enterprise' ? 'Unlimited' : `${tierPlan.staffSeatLimit} Seats`}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                <Briefcase className="h-3.5 w-3.5" /> Outsourcing Application
              </div>
              <div
                className={cn(
                  'p-4 rounded-xl border flex items-start gap-4',
                  partner.wantsOutsourcedWork ? 'bg-green-50 border-green-100' : 'bg-muted border-muted'
                )}
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                    partner.wantsOutsourcedWork ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'
                  )}
                >
                  {partner.wantsOutsourcedWork ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {partner.wantsOutsourcedWork ? 'Applied for Overflow Program' : 'Internal Back-Office Only'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {partner.wantsOutsourcedWork
                      ? 'This practice is seeking outsourced work from the My Accountant network.'
                      : 'This practice uses the platform as their internal back office.'}
                  </p>
                </div>
              </div>
            </section>

            {partner.wantsOutsourcedWork && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                    <FileText className="h-3.5 w-3.5" /> Compliance Documents
                  </div>
                  <div className="flex gap-2">
                    {partner.overflowApproved ? (
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/5 font-semibold h-7"
                        onClick={() => handleSetOverflowApproval(false)}
                        disabled={isUpdating}
                      >
                        Revoke Overflow Approval
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold h-7"
                        onClick={() => handleSetOverflowApproval(true)}
                        disabled={isUpdating}
                      >
                        Approve for Overflow Pool
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="shadow-sm border-dashed">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold">Professional CV</span>
                      </div>
                      {partner.cvUrl ? (
                        <Button size="xs" variant="outline" className="h-7" asChild>
                          <a href={partner.cvUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" /> View
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] opacity-50">
                          Missing
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-dashed">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold">Certificates</span>
                      </div>
                      {partner.certificateUrl ? (
                        <Button size="xs" variant="outline" className="h-7" asChild>
                          <a href={partner.certificateUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" /> View
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] opacity-50">
                          Missing
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            {expertise.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                  <Globe className="h-3.5 w-3.5" /> Capabilities & Expertise
                </div>
                <div className="flex flex-wrap gap-2">
                  {expertise.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Contact Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-semibold">{partner.contactPerson || partner.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold">{partner.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cell:</span>
                    <span className="font-semibold">{partner.contactNumber || 'N/A'}</span>
                  </div>
                </div>
              </section>
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Banking (For Payouts)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="font-semibold">{partner.bankingDetails?.bankName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-semibold">{partner.bankingDetails?.accountNumber || 'N/A'}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/30 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartnerIdForProfile, setSelectedPartnerIdForProfile] = useState<string | null>(null);
  const [selectedPartnerIdForConfiguration, setSelectedPartnerIdForConfiguration] = useState<string | null>(null);

  const selectedPartnerForProfile = useMemo(
    () => partners.find((p) => p.id === selectedPartnerIdForProfile) || null,
    [partners, selectedPartnerIdForProfile]
  );
  const selectedPartnerForConfiguration = useMemo(
    () => partners.find((p) => p.id === selectedPartnerIdForConfiguration) || null,
    [partners, selectedPartnerIdForConfiguration]
  );

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '' });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleSetPartnerTier = async (partner: User, targetTier: NormalizedPartnerTier) => {
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', partner.id);
      const plan = getPartnerTierPlan(targetTier);
      const subscription = buildDefaultSubscriptionForTier(targetTier);

      await updateDoc(userRef, {
        partnerTier: targetTier,
        partnerSubscription: {
          ...subscription,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      toast({
        title: `Plan Updated: ${plan.name}`,
        description: `${partner.companyName || partner.name} is now on the ${plan.name} tier (${plan.discountPercent}% wholesale discount).`,
      });
    } catch (err) {
      console.error('Error updating partner tier:', err);
      toast({ title: 'Operation Failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const servicesQuery = query(collection(db, 'services'));
      const servicesSnap = await getDocs(servicesQuery);
      setAllServices(servicesSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Service)));
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const partnerQuery = query(collection(db, 'users'), where('role', '==', 'partner'));
    const unsubscribe = onSnapshot(
      partnerQuery,
      (snap) => {
        setPartners(snap.docs.map((d) => ({ ...d.data(), uid: d.id, id: d.id } as User)));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to partners:', error);
        setIsLoading(false);
        toast({ title: 'Error', description: 'Could not load practice records.', variant: 'destructive' });
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSendAssistanceEmail = async (partner: User) => {
    if (!currentUser) return;

    toast({ title: 'Sending...', description: `Drafting assistance offer for ${partner.email}.` });

    try {
      await sendAdminEmail({
        idToken: await getIdToken(),
        to: partner.email,
        subject: `Do you need assistance with your ${partner.companyName || 'practice'} back-office setup?`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <p>Hi ${partner.contactPerson?.split(' ')[0] || partner.name.split(' ')[0]},</p>
            <p>I hope you're having a great week.</p>
            <p>I'm reaching out to see if you need any assistance setting up your practice back office on My Accountant — including adding your first AI Accounting or AI Payroll client, configuring your Practice Task Manager, or ordering back-office services at your wholesale partner rate.</p>
            <p>If you have any questions, please feel free to reply to this email.</p>
            <br/>
            <p>Regards,</p>
            <p><strong>${currentUser.name}</strong><br/>My Accountant Partner Team</p>
          </div>
        `,
        replyTo: currentUser.email,
      });
      toast({ title: 'Email Sent', description: `Assistance offer sent to ${partner.email}.` });
    } catch (error) {
      console.error('Failed to send assistance email:', error);
      toast({ title: 'Email Failed', description: 'Could not send the assistance email.', variant: 'destructive' });
    }
  };

  const handleDelete = async (partnerId: string) => {
    setIsLoading(true);
    try {
      const walletLogsSnap = await getDocs(collection(db, 'users', partnerId, 'walletLogs'));
      const serviceOverridesSnap = await getDocs(collection(db, 'users', partnerId, 'serviceOverrides'));

      const deletePromises: Promise<void>[] = [];
      walletLogsSnap.forEach((d) => deletePromises.push(deleteDoc(d.ref)));
      serviceOverridesSnap.forEach((d) => deletePromises.push(deleteDoc(d.ref)));
      await Promise.all(deletePromises);

      await deleteDoc(doc(db, 'users', partnerId));
      toast({
        title: 'Partner Deleted',
        description: 'The partner account has been removed from Firestore.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({ title: 'Error', description: 'Could not delete partner.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Accounting Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage partner practice plans (Starter Free 10%, Practice R950/pm 30%, Enterprise R4,950/pm 50%).
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsInviteDialogOpen(true)} variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Invite Partner
          </Button>
          <Button asChild>
            <Link href="/partner-signup">Add New Partner</Link>
          </Button>
        </div>
      </div>

      <PartnerProfileDialog
        partner={selectedPartnerForProfile}
        allServices={allServices}
        open={isProfileDialogOpen}
        onOpenChange={(open) => {
          setIsProfileDialogOpen(open);
          if (!open) setSelectedPartnerIdForProfile(null);
        }}
      />

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Partner</DialogTitle>
            <DialogDescription>
              Send an email invitation for a prospective accounting firm to join the My Accountant Back-Office Partner network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                placeholder="partner@example.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                placeholder="John"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!inviteData.email || !inviteData.name) {
                  toast({ title: 'Validation Error', description: 'Email and name are required.', variant: 'destructive' });
                  return;
                }
                setIsLoading(true);
                try {
                  const { invitePartnerAction } = await import('@/app/actions/invite-partner');
                  const res = await invitePartnerAction(inviteData.email, inviteData.name);
                  if (res.success) {
                    toast({ title: 'Invite Sent', description: `Successfully invited ${inviteData.email}.` });
                    setIsInviteDialogOpen(false);
                    setInviteData({ email: '', name: '' });
                  } else {
                    toast({ title: 'Failed to Send', description: res.error, variant: 'destructive' });
                  }
                } catch (e) {
                  toast({ title: 'Error', variant: 'destructive' });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfigDialogOpen}
        onOpenChange={(open) => {
          setIsConfigDialogOpen(open);
          if (!open) setSelectedPartnerIdForConfiguration(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Configure Practice Details: {selectedPartnerForConfiguration?.companyName}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manage company contact details and banking details on behalf of this partner.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden bg-slate-50">
            <ScrollArea className="h-full">
              <div className="p-6">
                {selectedPartnerForConfiguration && <PartnerProfile partner={selectedPartnerForConfiguration} />}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-4 border-t bg-white shrink-0">
            <Button variant="ghost" onClick={() => setIsConfigDialogOpen(false)}>
              Close Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Partner Practices</CardTitle>
          <CardDescription>
            View and manage all accounting partner accounts, subscription tiers, and wholesale discount levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <span className="sr-only">Loading…</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Practice Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Subscription & Wholesale Tier</TableHead>
                  <TableHead>Client Limits (Acc / Payroll)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => {
                  const tierPlan = getPartnerTierPlan(partner.partnerTier);
                  return (
                    <TableRow key={partner.uid}>
                      <TableCell className="font-medium">{partner.companyName || partner.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{partner.contactPerson || partner.name}</span>
                          <span className="text-[10px] text-muted-foreground">{partner.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={partner.status === 'Active' ? 'success' : 'secondary'}
                              className="text-[10px] uppercase font-bold w-fit"
                            >
                              {partner.status}
                            </Badge>
                            {getTierBadge(partner.partnerTier)}
                          </div>
                          {partner.wantsOutsourcedWork &&
                            (partner.overflowApproved ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 text-[10px] w-fit font-bold"
                              >
                                Overflow Approved
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] w-fit font-bold"
                              >
                                Overflow Pending Approval
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {tierPlan.id === 'enterprise' ? (
                          <span className="text-emerald-700 font-bold">Unlimited Accounting · Unlimited Payroll</span>
                        ) : (
                          <span>
                            {tierPlan.aiCompanyLimit} Accounting · {tierPlan.aiPayrollLimit} Payroll
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Practice Management</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPartnerIdForConfiguration(partner.id);
                                  setIsConfigDialogOpen(true);
                                }}
                              >
                                <Wrench className="mr-2 h-4 w-4" /> Edit Practice Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPartnerIdForProfile(partner.id);
                                  setIsProfileDialogOpen(true);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" /> View Profile & Docs
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendAssistanceEmail(partner)}>
                                <Mail className="mr-2 h-4 w-4" /> Send Assistance Email
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Set Subscription Tier</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleSetPartnerTier(partner, 'starter')}>
                                <Circle className="mr-2 h-4 w-4 text-slate-500" /> Set Starter (Free · 10% Off)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetPartnerTier(partner, 'practice')}>
                                <GraduationCap className="mr-2 h-4 w-4 text-primary" /> Set Practice (R950/pm · 30% Off)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetPartnerTier(partner, 'enterprise')}>
                                <Sparkles className="mr-2 h-4 w-4 text-emerald-600" /> Set Enterprise (R4,950/pm · 50% Off)
                              </DropdownMenuItem>

                              {partner.wantsOutsourcedWork && (
                                <>
                                  <DropdownMenuSeparator />
                                  {partner.overflowApproved ? (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          const userRef = doc(db, 'users', partner.id);
                                          await updateDoc(userRef, {
                                            overflowApproved: false,
                                            overflowApprovedAt: serverTimestamp(),
                                          });
                                          toast({
                                            title: 'Approval Revoked',
                                            description: `Revoked overflow pool approval for ${partner.companyName}.`,
                                          });
                                        } catch (err) {
                                          toast({ title: 'Operation Failed', variant: 'destructive' });
                                        }
                                      }}
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-destructive" /> Revoke Overflow
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        try {
                                          const userRef = doc(db, 'users', partner.id);
                                          await updateDoc(userRef, {
                                            overflowApproved: true,
                                            overflowApprovedAt: serverTimestamp(),
                                          });
                                          toast({
                                            title: 'Overflow Approved',
                                            description: `Approved ${partner.companyName} for overflow pool.`,
                                          });
                                        } catch (err) {
                                          toast({ title: 'Operation Failed', variant: 'destructive' });
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Approve Overflow
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">Delete Partner</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the partner account for:
                                <span className="font-semibold"> {partner.companyName}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(partner.uid)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
