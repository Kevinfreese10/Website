'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Users, Loader2, Wallet2, Plus, Minus, CheckCircle2, Circle, Info, FileText, Download, Briefcase, GraduationCap, Globe, Mail, ExternalLink, XCircle, Settings, Wrench, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Service } from '@/lib/types';
import { getFirestore, collection, getDocs, doc, deleteDoc, query, where, updateDoc, increment, orderBy, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { sendAdminEmail } from '@/app/actions/email-gateway';
import { getAuth } from 'firebase/auth';
import PartnerProfile from '@/components/partner/PartnerProfile';
import React from 'react';
import { render } from '@react-email/components';
import PartnerOnboardingEmail from '@/components/emails/PartnerOnboardingEmail';

const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

function PartnerProfileDialog({ 
    partner, 
    allServices, 
    open, 
    onOpenChange 
}: { 
    partner: User | null, 
    allServices: Service[], 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
}) {
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    if (!partner) return null;

    const expertise = partner.capableServices?.map(id => allServices.find(s => s.id === id)?.title).filter(Boolean) || [];

    const handleSetOverflowApproval = async (approved: boolean) => {
        setIsUpdating(true);
        try {
            const userRef = doc(db, 'users', partner.id);
            await updateDoc(userRef, {
                overflowApproved: approved,
                overflowApprovedAt: serverTimestamp()
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
                title: approved ? "Partner Approved" : "Approval Revoked",
                description: `Successfully updated overflow program status for ${partner.companyName || partner.name}.`
            });
        } catch (error) {
            console.error("Error setting overflow approval status:", error);
            toast({
                title: "Operation Failed",
                description: "Could not update the overflow program status.",
                variant: "destructive"
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
                            <DialogDescription>Professional Practice Profile</DialogDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <Badge variant={partner.status === 'Active' ? 'success' : 'secondary'} className="uppercase font-bold w-fit">
                                {partner.status}
                            </Badge>
                            <Badge variant={partner.platformFeePaid ? 'default' : 'outline'} className={cn("uppercase font-bold w-fit text-[10px]", partner.platformFeePaid ? "bg-emerald-600 text-white border-none" : "bg-amber-50 text-amber-700 border-amber-200")}>
                                {partner.platformFeePaid ? 'Storefront Unlocked (R1,950 Paid)' : 'Free Outsource Only'}
                            </Badge>
                            {partner.wantsOutsourcedWork && (
                                partner.overflowApproved ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] w-fit font-bold">
                                        Overflow Approved
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] w-fit font-bold">
                                        Overflow Pending Approval
                                    </Badge>
                                )
                            )}
                        </div>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-grow p-6">
                    <div className="space-y-8 pb-4">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                                <Briefcase className="h-3.5 w-3.5" /> Outsourcing Application
                            </div>
                            <div className={cn(
                                "p-4 rounded-xl border flex items-start gap-4",
                                partner.wantsOutsourcedWork ? "bg-green-50 border-green-100" : "bg-muted border-muted"
                            )}>
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                    partner.wantsOutsourcedWork ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-400"
                                )}>
                                    {partner.wantsOutsourcedWork ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">
                                        {partner.wantsOutsourcedWork ? 'Applied for Overflow Program' : 'Internal Management Only'}
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {partner.wantsOutsourcedWork 
                                            ? 'This practice is seeking outsourced work from the My Accountant network.' 
                                            : 'This practice only uses the platform to manage their own clients.'}
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
                                                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                                                <span className="text-xs font-semibold">Professional CV</span>
                                            </div>
                                            {partner.cvUrl ? (
                                                <Button size="xs" variant="outline" className="h-7" asChild>
                                                    <a href={partner.cvUrl} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3 mr-1" /> View</a>
                                                </Button>
                                            ) : <Badge variant="secondary" className="text-[10px] opacity-50">Missing</Badge>}
                                        </CardContent>
                                    </Card>
                                    <Card className="shadow-sm border-dashed">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-purple-50 text-purple-600 rounded flex items-center justify-center"><GraduationCap className="h-4 w-4" /></div>
                                                <span className="text-xs font-semibold">Certificates</span>
                                            </div>
                                            {partner.certificateUrl ? (
                                                <Button size="xs" variant="outline" className="h-7" asChild>
                                                    <a href={partner.certificateUrl} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3 mr-1" /> View</a>
                                                </Button>
                                            ) : <Badge variant="secondary" className="text-[10px] opacity-50">Missing</Badge>}
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
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close Profile</Button>
                    {partner.landingPage?.slug && (
                        <Button asChild className="gap-2">
                            <Link href={`/p/${partner.landingPage.slug}`} target="_blank">
                                View Landing Page <ExternalLink className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ManualCreditDialog({ partner, onUpdate, open, onOpenChange }: { partner: User | null, onUpdate: () => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [amount, setAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    if (!partner) return null;

    const handleUpdateBalance = async (type: 'add' | 'deduct') => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Please enter a positive numeric value.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        try {
            const finalAmount = type === 'add' ? numericAmount : -numericAmount;
            const userRef = doc(db, 'users', partner.uid);
            await updateDoc(userRef, {
                creditBalance: increment(finalAmount)
            });

            // Write to walletLogs subcollection
            const logsRef = collection(db, 'users', partner.uid, 'walletLogs');
            const newLogRef = doc(logsRef);
            await setDoc(newLogRef, {
                amount: finalAmount,
                type: 'manual_adjustment',
                description: type === 'add' ? 'Manual credit allocation by Admin' : 'Manual credit deduction by Admin',
                date: serverTimestamp()
            });

            if (type === 'add' && partner.email) {
                try {
                    const partnerName = partner.contactPerson || partner.name || 'Partner';
                    const practiceName = partner.companyName || partner.name || 'Practice';
                    const newTotalBalance = (partner.creditBalance || 0) + numericAmount;
                    const emailHtml = `
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #214392; margin-top: 0;">Wallet Credit Allocation Receipt</h2>
                            <p>Hi ${partnerName},</p>
                            <p>A manual credit top-up has been allocated to your practice account <strong>${practiceName}</strong>.</p>
                            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #214392;">
                                <p style="margin: 4px 0;"><strong>Credit Added:</strong> R${numericAmount.toFixed(2)}</p>
                                <p style="margin: 4px 0;"><strong>New Wallet Balance:</strong> R${newTotalBalance.toFixed(2)}</p>
                            </div>
                            <p style="margin-top: 30px; font-size: 13px; color: #64748b;">My Accountant Partner Team</p>
                        </div>
                    `;
                    await sendAdminEmail({
                        idToken: await getIdToken(),
                        to: partner.email,
                        subject: `Credit Allocation Receipt (R${numericAmount.toFixed(2)})`,
                        html: emailHtml
                    });
                } catch (emailErr) {
                    console.error('Failed to send wallet topup receipt email:', emailErr);
                }
            }

            toast({ title: 'Balance Updated', description: `Successfully ${type === 'add' ? 'added' : 'deducted'} ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(numericAmount)}.` });
            onUpdate();
            onOpenChange(false);
            setAmount('');
        } catch (error) {
            console.error("Error updating credits:", error);
            toast({ title: 'Update Failed', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Credits: {partner.companyName || partner.name}</DialogTitle>
                    <DialogDescription>
                        Manually adjust the practice's credit balance. Current balance: <strong>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(partner.creditBalance || 0)}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="adj-amount">Adjustment Amount (ZAR)</Label>
                        <Input 
                            id="adj-amount" 
                            type="number" 
                            placeholder="e.g. 500" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleUpdateBalance('deduct')} disabled={isProcessing}>
                        <Minus className="mr-2 h-4 w-4" /> Deduct
                    </Button>
                    <Button onClick={() => handleUpdateBalance('add')} disabled={isProcessing}>
                        <Plus className="mr-2 h-4 w-4" /> Add Credits
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function WalletHistoryDialog({ partner, open, onOpenChange }: { partner: User | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!partner || !open) return;
        
        setIsLoading(true);
        const logsRef = collection(db, 'users', partner.uid, 'walletLogs');
        const q = query(logsRef, orderBy('date', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snap) => {
            setLogs(snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
            })));
            setIsLoading(false);
        }, (err) => {
            console.error("Error loading wallet logs:", err);
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [partner, open]);

    if (!partner) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(price);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b bg-muted/20 shrink-0">
                    <DialogTitle>Wallet History: {partner.companyName || partner.name}</DialogTitle>
                    <DialogDescription>
                        Audit trail of credits and adjustments for this practice.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No wallet transaction history found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(log.date, 'dd/MM/yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            <p>{log.description || 'Adjustment'}</p>
                                            <Badge variant="secondary" className="text-[8px] uppercase tracking-wider scale-90 -ml-1 mt-0.5 w-fit">
                                                {log.type?.replace('_', ' ') || 'Adjustment'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono font-bold text-xs",
                                            log.amount >= 0 ? "text-green-600" : "text-destructive"
                                        )}>
                                            {log.amount >= 0 ? '+' : ''}{formatPrice(log.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <DialogFooter className="p-4 border-t bg-muted/10 shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartnerIdForCredits, setSelectedPartnerIdForCredits] = useState<string | null>(null);
  const [selectedPartnerIdForProfile, setSelectedPartnerIdForProfile] = useState<string | null>(null);
  const [selectedPartnerIdForConfiguration, setSelectedPartnerIdForConfiguration] = useState<string | null>(null);
  const [selectedPartnerIdForHistory, setSelectedPartnerIdForHistory] = useState<string | null>(null);

  const selectedPartnerForCredits = useMemo(() => partners.find(p => p.id === selectedPartnerIdForCredits) || null, [partners, selectedPartnerIdForCredits]);
  const selectedPartnerForProfile = useMemo(() => partners.find(p => p.id === selectedPartnerIdForProfile) || null, [partners, selectedPartnerIdForProfile]);
  const selectedPartnerForConfiguration = useMemo(() => partners.find(p => p.id === selectedPartnerIdForConfiguration) || null, [partners, selectedPartnerIdForConfiguration]);
  const selectedPartnerForHistory = useMemo(() => partners.find(p => p.id === selectedPartnerIdForHistory) || null, [partners, selectedPartnerIdForHistory]);

  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '' });
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleToggleTier = async (partner: User) => {
    const newTier = partner.partnerTier === 'free' ? 'growth' : 'free';
    const isUpgrading = newTier === 'growth';
    
    setIsLoading(true);
    try {
        const userRef = doc(db, 'users', partner.id);
        const updates: any = {
            partnerTier: newTier,
        };
        
        if (isUpgrading) {
            updates.partnerSubscription = {
                status: 'active',
                aiCompanyLimit: 5,
                aiPayrollLimit: 5,
                staffSeatLimit: 3,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            };
        } else {
            updates.partnerSubscription = {
                status: 'cancelled',
                aiCompanyLimit: 0,
                aiPayrollLimit: 0,
                staffSeatLimit: 0,
                cancelledAt: new Date(),
            };
        }
        
        await updateDoc(userRef, updates);
        toast({
            title: isUpgrading ? 'Upgraded to Growth' : 'Downgraded to Free',
            description: `Successfully updated plan tier for ${partner.companyName || partner.name}.`
        });
    } catch (err) {
        console.error("Error toggling partner tier:", err);
        toast({ title: 'Operation Failed', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGrant3MonthsFree = async (partner: User) => {
    setIsLoading(true);
    try {
        const userRef = doc(db, 'users', partner.id);
        const updates: any = {
            partnerTier: 'growth',
        };
        
        updates.partnerSubscription = {
            status: 'active',
            aiCompanyLimit: 5,
            aiPayrollLimit: 5,
            staffSeatLimit: 3,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            grandfatheredUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
        };
        
        await updateDoc(userRef, updates);
        toast({
            title: 'Granted 3 Months Free',
            description: `Successfully granted 3 months free Premium for ${partner.companyName || partner.name}.`
        });
    } catch (err) {
        console.error("Error granting 3 months free:", err);
        toast({ title: 'Operation Failed', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleTogglePlatformFee = async (partner: User) => {
    const isPaid = !!partner.platformFeePaid;
    const newStatus = !isPaid;
    
    setIsLoading(true);
    try {
        const userRef = doc(db, 'users', partner.id);
        await updateDoc(userRef, {
            platformFeePaid: newStatus,
            ...(!newStatus ? { 'landingPage.enabled': false } : {})
        });

        if (newStatus && partner.email) {
            try {
                const partnerName = partner.contactPerson || partner.name || 'Partner';
                const loginUrl = 'https://myacc.co.za/partner/onboarding';
                const emailHtml = render(React.createElement(PartnerOnboardingEmail, {
                    partnerName,
                    email: partner.email,
                    creditAmount: partner.creditBalance || 0,
                    loginUrl
                }));
                await sendAdminEmail({
                    idToken: await getIdToken(),
                    to: partner.email,
                    subject: '🎉 Your Practice Storefront & Landing Page is Unlocked!',
                    html: emailHtml,
                });
            } catch (emailErr) {
                console.error('Failed to send storefront welcome email:', emailErr);
            }
        }

        toast({
            title: newStatus ? 'Storefront Access Granted' : 'Storefront Access Revoked',
            description: `Successfully updated platform fee status for ${partner.companyName || partner.name}.`
        });
    } catch (err) {
        console.error("Error toggling platform fee:", err);
        toast({ title: 'Operation Failed', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
        const servicesQuery = query(collection(db, "services"));
        const servicesSnap = await getDocs(servicesQuery);
        setAllServices(servicesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service)));
    } catch (error) {
        console.error("Error fetching services:", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Listen to partners list in real-time
    const partnerQuery = query(collection(db, "users"), where('role', '==', 'partner'));
    const unsubscribe = onSnapshot(partnerQuery, (snap) => {
        setPartners(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User)));
        setIsLoading(false);
    }, (error) => {
        console.error("Error listening to partners:", error);
        setIsLoading(false);
        toast({ title: 'Error', description: 'Could not load practice records.', variant: 'destructive'});
    });

    return () => unsubscribe();
  }, []);

  const handleSendAssistanceEmail = async (partner: User) => {
    if (!currentUser) return;
    
    toast({ title: 'Sending...', description: `Drafting assistance offer for ${partner.email}.` });
    
    try {
        await sendAdminEmail({
            idToken: await getIdToken(),
            to: partner.email,
            subject: `Do you need assistance with your ${partner.companyName || 'practice'} setup?`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <p>Hi ${partner.contactPerson?.split(' ')[0] || partner.name.split(' ')[0]},</p>
                    <p>I hope you're having a great week.</p>
                    <p>I noticed that your practice setup on the My Accountant BEI platform isn't quite complete yet. I'm reaching out to see if you need any assistance with the configuration, such as setting up your practice banking details or customizing your landing page content.</p>
                    <p>Our goal is to make sure you have everything you need to start scaling your firm efficiently. If you have any questions, please feel free to reply to this email.</p>
                    <br/>
                    <p>Regards,</p>
                    <p><strong>${currentUser.name}</strong><br/>My Accountant Support Team</p>
                </div>
            `,
            replyTo: currentUser.email,
        });
        toast({ title: 'Email Sent', description: `Assistance offer sent to ${partner.email}.` });
    } catch (error) {
        console.error("Failed to send assistance email:", error);
        toast({ title: 'Email Failed', description: 'Could not send the assistance email.', variant: 'destructive' });
    }
  };

  const handleDelete = async (partnerId: string) => {
    setIsLoading(true);
    try {
        // Delete associated subcollections to prevent orphaned documents (partner pages/overrides, wallet logs)
        const walletLogsSnap = await getDocs(collection(db, 'users', partnerId, 'walletLogs'));
        const serviceOverridesSnap = await getDocs(collection(db, 'users', partnerId, 'serviceOverrides'));
        
        const deletePromises: Promise<void>[] = [];
        walletLogsSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        serviceOverridesSnap.forEach(d => deletePromises.push(deleteDoc(d.ref)));
        await Promise.all(deletePromises);

        await deleteDoc(doc(db, "users", partnerId));
        toast({
            title: 'Partner Deleted',
            description: 'The partner and their custom pages/data have been removed from Firestore.',
            variant: 'destructive',
        });
    } catch (error) {
        console.error("Error deleting partner:", error);
        toast({ title: 'Error', description: 'Could not delete partner.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage Partners</h1>
        <div className="flex gap-3">
            <Button onClick={() => setIsInviteDialogOpen(true)} variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Invite Partner
            </Button>
            <Button asChild>
                <Link href="/partner-signup">
                    Add New Partner
                </Link>
            </Button>
        </div>
      </div>

      <ManualCreditDialog 
        partner={selectedPartnerForCredits}
        open={isCreditDialogOpen}
        onOpenChange={(open) => {
            setIsCreditDialogOpen(open);
            if (!open) setSelectedPartnerIdForCredits(null);
        }}
        onUpdate={fetchInitialData}
      />

      <WalletHistoryDialog
        partner={selectedPartnerForHistory}
        open={isHistoryDialogOpen}
        onOpenChange={(open) => {
            setIsHistoryDialogOpen(open);
            if (!open) setSelectedPartnerIdForHistory(null);
        }}
      />

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
                <DialogDescription>Send an email invitation for a prospective partner to set up their practice.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                        placeholder="partner@example.com" 
                        value={inviteData.email}
                        onChange={e => setInviteData({...inviteData, email: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input 
                        placeholder="John" 
                        value={inviteData.name}
                        onChange={e => setInviteData({...inviteData, name: e.target.value})}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
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

      {/* Admin Full Practice Configuration Modal */}
      <Dialog open={isConfigDialogOpen} onOpenChange={(open) => {
          setIsConfigDialogOpen(open);
          if (!open) setSelectedPartnerIdForConfiguration(null);
      }}>
          <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
                  <DialogTitle className="text-xl flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      Configure Practice Settings: {selectedPartnerForConfiguration?.companyName}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                      Manage branding, banking, and landing page details on behalf of this partner.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 min-h-0 overflow-hidden bg-slate-50">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        {selectedPartnerForConfiguration && (
                            <PartnerProfile partner={selectedPartnerForConfiguration} />
                        )}
                    </div>
                </ScrollArea>
              </div>

              <DialogFooter className="p-4 border-t bg-white shrink-0">
                  <Button variant="ghost" onClick={() => setIsConfigDialogOpen(false)}>Close Editor</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Partners</CardTitle>
          <CardDescription>View and manage all approved partner accounts and their setup progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Wallet Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map(partner => (
                <TableRow key={partner.uid}>
                  <TableCell className="font-medium">{partner.companyName}</TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                          <span>{partner.contactPerson || partner.name}</span>
                          <span className="text-[10px] text-muted-foreground">{partner.email}</span>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                          <Badge variant={partner.status === 'Active' ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold w-fit">
                              {partner.status}
                          </Badge>
                          <Badge variant={partner.platformFeePaid ? 'default' : 'outline'} className={cn("text-[10px] uppercase font-bold w-fit", partner.platformFeePaid ? "bg-emerald-600 text-white border-none" : "bg-amber-50 text-amber-700 border-amber-200")}>
                              {partner.platformFeePaid ? 'Storefront Unlocked' : 'Outsource Only'}
                          </Badge>
                          {partner.wantsOutsourcedWork && (
                              partner.overflowApproved ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] w-fit font-bold">
                                      Overflow Approved
                                  </Badge>
                              ) : (
                                  <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[10px] w-fit font-bold">
                                      Overflow Pending Approval
                                  </Badge>
                              )
                          )}
                      </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                      {formatPrice(partner.creditBalance || 0)}
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
                            <DropdownMenuLabel>Management</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setSelectedPartnerIdForConfiguration(partner.id); setIsConfigDialogOpen(true); }}>
                                <Wrench className="mr-2 h-4 w-4" /> Configure Practice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedPartnerIdForProfile(partner.id); setIsProfileDialogOpen(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> View Profile & Docs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendAssistanceEmail(partner)}>
                                <Mail className="mr-2 h-4 w-4" /> Send Assistance Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedPartnerIdForCredits(partner.id); setIsCreditDialogOpen(true); }}>
                                <Wallet2 className="mr-2 h-4 w-4" /> Manage Credits
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedPartnerIdForHistory(partner.id); setIsHistoryDialogOpen(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> Wallet History
                            </DropdownMenuItem>
                             {partner.platformFeePaid ? (
                                 <DropdownMenuItem onClick={() => handleTogglePlatformFee(partner)}>
                                     <XCircle className="mr-2 h-4 w-4 text-amber-600" /> Revoke Storefront Access
                                 </DropdownMenuItem>
                             ) : (
                                 <DropdownMenuItem onClick={() => handleTogglePlatformFee(partner)}>
                                     <Award className="mr-2 h-4 w-4 text-emerald-600" /> Grant Storefront Access (R1,950 Paid)
                                 </DropdownMenuItem>
                             )}
                            {partner.partnerTier === 'free' ? (
                                <>
                                    <DropdownMenuItem onClick={() => handleToggleTier(partner)}>
                                        <GraduationCap className="mr-2 h-4 w-4 text-primary" /> Upgrade to Premium
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleGrant3MonthsFree(partner)}>
                                        <Award className="mr-2 h-4 w-4 text-emerald-500" /> Grant 3 Months Free
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <DropdownMenuItem onClick={() => handleToggleTier(partner)}>
                                    <Circle className="mr-2 h-4 w-4 text-muted-foreground" /> Downgrade to Freemium
                                </DropdownMenuItem>
                            )}
                             {partner.wantsOutsourcedWork && (
                                 partner.overflowApproved ? (
                                     <DropdownMenuItem onClick={async () => {
                                         try {
                                             const userRef = doc(db, 'users', partner.id);
                                             await updateDoc(userRef, {
                                                 overflowApproved: false,
                                                 overflowApprovedAt: serverTimestamp()
                                             });
                                             toast({ title: 'Approval Revoked', description: `Revoked overflow pool approval for ${partner.companyName}.` });
                                         } catch (err) {
                                             toast({ title: 'Operation Failed', variant: 'destructive' });
                                         }
                                     }}>
                                         <XCircle className="mr-2 h-4 w-4 text-destructive" /> Revoke Overflow
                                     </DropdownMenuItem>
                                 ) : (
                                     <DropdownMenuItem onClick={async () => {
                                         try {
                                             const userRef = doc(db, 'users', partner.id);
                                             await updateDoc(userRef, {
                                                 overflowApproved: true,
                                                 overflowApprovedAt: serverTimestamp()
                                             });
                                             toast({ title: 'Overflow Approved', description: `Approved ${partner.companyName} for overflow pool.` });
                                         } catch (err) {
                                             toast({ title: 'Operation Failed', variant: 'destructive' });
                                         }
                                     }}>
                                         <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Approve Overflow
                                     </DropdownMenuItem>
                                 )
                             )}
                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">
                                    Delete Partner
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the partner account for:
                                <span className="font-semibold"> {partner.companyName}</span>. This only removes them from Firestore.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(partner.uid)}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
