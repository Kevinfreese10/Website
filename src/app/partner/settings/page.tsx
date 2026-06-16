'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Mail, ShieldCheck, Globe, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePartner } from "@/contexts/PartnerContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

export default function PartnerSettingsPage() {
  const { user } = useAuth();
  const { tier, isGrowthActive, limits, isOwner, partnerProfile } = usePartner();
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // We only show subscription to practice owners
  const showBilling = isOwner;

  // Formatting helper for Timestamps or Dates
  const formatPeriodDate = (timestampObj: any) => {
    if (!timestampObj) return "N/A";
    let date: Date;
    if (timestampObj.toDate) {
      date = timestampObj.toDate();
    } else if (timestampObj.seconds) {
      date = new Date(timestampObj.seconds * 1000);
    } else {
      date = new Date(timestampObj);
    }
    return format(date, "dd MMMM yyyy");
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      if (!user) return;
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication token not found.");
      
      const res = await fetch('/api/partner-subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been successfully cancelled. You will retain access until the end of your billing period.",
        });
        setIsCancelOpen(false);
        window.location.reload();
      } else {
        throw new Error(data.error || "Failed to cancel subscription");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Cancellation Failed",
        description: err.message || "An error occurred while cancelling your subscription.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const sub = partnerProfile?.partnerSubscription;
  const subStatus = sub?.status || 'inactive';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8 text-slate-950">Practice Configuration</h1>
        
        <div className="grid grid-cols-1 gap-6">
            {showBilling && (
              <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Subscription & Billing</CardTitle>
                            <CardDescription>Manage your practice plan and billing details.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-xl bg-slate-50/50">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Current Plan</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-slate-900">
                                    {tier === 'growth' ? 'Growth Practice' : 'Community Free'}
                                </span>
                                <Badge variant={isGrowthActive ? "default" : "secondary"}>
                                    {isGrowthActive ? "Growth Active" : "Free Tier"}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Subscription Status</span>
                            <div>
                                <Badge className={
                                    subStatus === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                    subStatus === 'lapsed' ? 'bg-red-100 text-red-800 border-red-200' :
                                    subStatus === 'cancelled' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-slate-100 text-slate-800'
                                }>
                                    {subStatus.charAt(0).toUpperCase() + subStatus.slice(1)}
                                </Badge>
                            </div>
                        </div>

                        {sub?.grandfatheredUntil && (
                            <div className="space-y-1 col-span-1 md:col-span-2 border-t pt-2 mt-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Grandfather Period</span>
                                <p className="text-sm font-medium text-slate-700">
                                    Your account is grandfathered free of charge until <strong className="text-primary">{formatPeriodDate(sub.grandfatheredUntil)}</strong>.
                                </p>
                            </div>
                        )}

                        {tier === 'growth' && subStatus === 'active' && sub?.currentPeriodEnd && !sub?.grandfatheredUntil && (
                            <div className="space-y-1 col-span-1 md:col-span-2 border-t pt-2 mt-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Next Renewal Date</span>
                                <p className="text-sm font-medium text-slate-700">
                                    Your subscription will automatically renew on <strong>{formatPeriodDate(sub.currentPeriodEnd)}</strong>.
                                </p>
                            </div>
                        )}

                        {subStatus === 'cancelled' && sub?.currentPeriodEnd && (
                            <div className="space-y-1 col-span-1 md:col-span-2 border-t pt-2 mt-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Access Expiry Date</span>
                                <p className="text-sm font-medium text-slate-700">
                                    Your subscription is cancelled. Access to Growth features will expire on <strong>{formatPeriodDate(sub.currentPeriodEnd)}</strong>.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase block">Plan Resource Limits</span>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="border p-3 rounded-lg bg-white">
                                <div className="text-2xl font-black text-primary">{limits.aiCompanies}</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">AI Accountant Cos</div>
                            </div>
                            <div className="border p-3 rounded-lg bg-white">
                                <div className="text-2xl font-black text-primary">{limits.aiPayroll}</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">AI Payroll Cos</div>
                            </div>
                            <div className="border p-3 rounded-lg bg-white">
                                <div className="text-2xl font-black text-primary">{limits.staffSeats}</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Staff Seats</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {tier === 'free' || subStatus === 'cancelled' ? (
                            <Button asChild className="font-bold">
                                <Link href="/become-a-partner">Upgrade to Growth Practice</Link>
                            </Button>
                        ) : (
                            subStatus === 'active' && (
                                <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" className="font-bold">
                                            Cancel Subscription
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                                <AlertTriangle className="h-5 w-5" />
                                                Cancel Practice Subscription?
                                            </DialogTitle>
                                            <DialogDescription className="space-y-3 pt-2">
                                                <p>
                                                    Are you sure you want to cancel your Growth practice subscription? 
                                                </p>
                                                <p className="font-semibold text-slate-800">
                                                    If you cancel:
                                                </p>
                                                <ul className="list-disc pl-5 space-y-1 text-slate-700 text-sm">
                                                    <li>Your white-labeled practice landing page will be deactivated.</li>
                                                    <li>Access to AI Accountant and AI Payroll features will be paused.</li>
                                                    <li>Your staff members will lose access to the practice dashboard.</li>
                                                    <li>Your limits will revert to Community Free (0 AI companies, 0 staff seats).</li>
                                                </ul>
                                                <p className="text-xs text-muted-foreground italic">
                                                    You will retain access to your Growth features until the end of the current billing cycle.
                                                </p>
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="gap-2 sm:gap-0">
                                            <Button variant="outline" onClick={() => setIsCancelOpen(false)} disabled={cancelling}>
                                                Keep My Subscription
                                            </Button>
                                            <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelling}>
                                                {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Confirm Cancellation
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )
                        )}
                    </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>White-Label Email Engine</CardTitle>
                            <CardDescription>Managed automated delivery for your practice.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        To ensure maximum reliability and ease of use, all practice emails are delivered using My Accountant's secure mail servers. 
                        <strong> White-labeling is automatically applied</strong> based on your company profile:
                    </p>
                    <ul className="space-y-3 pl-2">
                        <li className="flex items-start gap-3 text-sm font-medium">
                            <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span><strong>Display Name:</strong> Emails arrive from your Practice Name.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm font-medium">
                            <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span><strong>Reply Routing:</strong> All client replies are directed straight to your professional email address.</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-2 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle>Public Landing Page</CardTitle>
                            <CardDescription>Manage your practice's online presence.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Your public practice page is where clients browse your services and place orders. You can customize the branding, 
                        content, and layout in your profile settings.
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button asChild className="font-bold">
                            <Link href="/partner/profile">Customize Branding</Link>
                        </Button>
                        <Button variant="outline" asChild className="font-bold">
                            <Link href="/partner/services">Update Pricing & Markups</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
