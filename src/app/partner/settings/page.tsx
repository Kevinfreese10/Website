'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CreditCard,
  Loader2,
  AlertTriangle,
  Check,
  Sparkles,
  ArrowRight,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import {
  PARTNER_TIER_PLANS,
  NormalizedPartnerTier,
} from '@/lib/partner-pricing';
import { submitPayFastPayment } from '@/lib/payfast-client';
import Link from 'next/link';

export default function PartnerSettingsPage() {
  const { user, reauthenticate } = useAuth();
  const {
    tier,
    tierPlan,
    discountPercent,
    limits,
    usage,
    isOwner,
    partnerProfile,
  } = usePartner();
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [upgradingTier, setUpgradingTier] =
    useState<NormalizedPartnerTier | null>(null);

  const showBilling = isOwner;

  const formatPeriodDate = (timestampObj: any) => {
    if (!timestampObj) return 'N/A';
    let date: Date;
    if (timestampObj.toDate) {
      date = timestampObj.toDate();
    } else if (timestampObj.seconds) {
      date = new Date(timestampObj.seconds * 1000);
    } else {
      date = new Date(timestampObj);
    }
    return format(date, 'dd MMMM yyyy');
  };

  const handleUpgradeToTier = async (targetTier: NormalizedPartnerTier) => {
    if (!user) return;
    const plan = PARTNER_TIER_PLANS[targetTier];
    if (plan.monthlyPrice <= 0) return;

    setUpgradingTier(targetTier);
    try {
      const partnerId =
        user.role === 'partner' ? user.uid : user.partnerId || user.uid;
      const todayStr = new Date().toISOString().split('T')[0];

      const res = await submitPayFastPayment({
        orderId: partnerId,
        amount: plan.monthlyPrice,
        itemName: `My Accountant Partner - ${plan.name} Tier`,
        itemDescription: `${plan.name} Back-Office Subscription (${plan.discountPercent}% wholesale discount, ${plan.aiCompanyLabel}, ${plan.aiPayrollLabel})`,
        customerName: user.companyName || user.name,
        customerEmail: user.email,
        customerPhone: user.contactNumber || '',
        returnPath: '/partner/settings?sub_success=true',
        cancelPath: '/partner/settings',
        customStr1: 'partner_subscription',
        customStr2: plan.id,
        subscription: {
          subscription_type: '1',
          billing_date: todayStr,
          recurring_amount: plan.monthlyPrice,
          frequency: '3',
          cycles: '0',
        },
      });

      if (!res.success) {
        toast({
          title: 'Payment Gateway Error',
          description: res.error || 'Could not redirect to PayFast.',
          variant: 'destructive',
        });
        setUpgradingTier(null);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Upgrade Error',
        description: err.message || 'Could not initiate subscription upgrade.',
        variant: 'destructive',
      });
      setUpgradingTier(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      if (!user) return;
      const auth = getAuth(firebaseApp);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Authentication token not found.');

      const res = await fetch('/api/partner-subscription/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Subscription Cancelled',
          description:
            'Your subscription has been cancelled. Your account will revert to the Starter (Free) tier at the end of your billing period.',
        });
        setIsCancelOpen(false);
        if (auth.currentUser) {
          await reauthenticate(auth.currentUser);
        }
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Cancellation Failed',
        description:
          err.message ||
          'An error occurred while cancelling your subscription.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const sub = partnerProfile?.partnerSubscription;
  const subStatus = sub?.status || 'active';
  const formatLimit = (val: number) => (val >= 999999 ? 'Unlimited' : val);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Subscription & Practice Plan
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your back-office subscription tier, wholesale discount level, and practice client quotas.
        </p>
      </div>

      {showBilling && (
        <>
          {/* Current Plan Overview */}
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{tierPlan.name} Tier</CardTitle>
                      <Badge variant="default" className="font-bold">
                        {discountPercent}% Wholesale Discount
                      </Badge>
                    </div>
                    <CardDescription>{tierPlan.tagline}</CardDescription>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-extrabold text-primary">
                    {tierPlan.monthlyPrice === 0
                      ? 'R0 / month'
                      : `R${tierPlan.monthlyPrice.toLocaleString('en-ZA')} / month`}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      subStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }
                  >
                    Status: {subStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="border p-4 rounded-xl bg-slate-50/70">
                  <div className="text-2xl font-black text-primary">
                    {usage.aiCompanies} / {formatLimit(limits.aiCompanies)}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase mt-1">
                    AI Accounting Clients
                  </div>
                </div>
                <div className="border p-4 rounded-xl bg-slate-50/70">
                  <div className="text-2xl font-black text-primary">
                    {usage.aiPayroll} / {formatLimit(limits.aiPayroll)}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase mt-1">
                    AI Payroll Clients
                  </div>
                </div>
                <div className="border p-4 rounded-xl bg-slate-50/70">
                  <div className="text-2xl font-black text-primary">
                    {usage.staffSeats} / {formatLimit(limits.staffSeats)}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground uppercase mt-1">
                    Practice Staff Seats
                  </div>
                </div>
              </div>

              {tier !== 'starter' &&
                subStatus === 'active' &&
                sub?.currentPeriodEnd && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t pt-4 text-sm">
                    <span className="text-muted-foreground">
                      Next renewal date:{' '}
                      <strong className="text-foreground">
                        {formatPeriodDate(sub.currentPeriodEnd)}
                      </strong>
                    </span>
                    <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Cancel Paid Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Cancel {tierPlan.name} Subscription?
                          </DialogTitle>
                          <DialogDescription className="space-y-3 pt-2">
                            <p>
                              Are you sure you want to cancel your {tierPlan.name} subscription?
                            </p>
                            <p className="font-semibold text-slate-800">
                              If you cancel:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-sm">
                              <li>
                                Your wholesale service discount will revert to Starter (10% off).
                              </li>
                              <li>
                                Your AI Accounting and AI Payroll limits will revert to 1 client each.
                              </li>
                              <li>
                                Your staff seat limit will revert to 1 seat.
                              </li>
                            </ul>
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button
                            variant="outline"
                            onClick={() => setIsCancelOpen(false)}
                            disabled={cancelling}
                          >
                            Keep My Subscription
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCancelSubscription}
                            disabled={cancelling}
                          >
                            {cancelling && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirm Cancellation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Compare & Upgrade Tiers */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Available Practice Back-Office Tiers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(
                ['starter', 'practice', 'enterprise'] as NormalizedPartnerTier[]
              ).map((tierKey) => {
                const plan = PARTNER_TIER_PLANS[tierKey];
                const isCurrent = tier === tierKey;

                return (
                  <Card
                    key={plan.id}
                    className={`flex flex-col justify-between ${
                      isCurrent
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border shadow-sm'
                    }`}
                  >
                    <div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          <Badge
                            variant={isCurrent ? 'default' : 'secondary'}
                            className="font-bold"
                          >
                            {plan.discountPercent}% Off
                          </Badge>
                        </div>
                        <CardDescription className="min-h-[36px]">
                          {plan.tagline}
                        </CardDescription>
                        <div className="pt-2">
                          <span className="text-3xl font-extrabold">
                            {plan.monthlyPrice === 0
                              ? 'R0'
                              : `R${plan.monthlyPrice.toLocaleString('en-ZA')}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {' '}
                            / month
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5 text-xs">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>
                    <CardFooter>
                      {isCurrent ? (
                        <Button
                          variant="secondary"
                          className="w-full font-bold"
                          disabled
                        >
                          Current Active Plan
                        </Button>
                      ) : plan.monthlyPrice === 0 ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled
                        >
                          Included in Base Account
                        </Button>
                      ) : (
                        <Button
                          className="w-full font-bold"
                          disabled={upgradingTier !== null}
                          onClick={() => handleUpgradeToTier(plan.id)}
                        >
                          {upgradingTier === plan.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Switch to {plan.name} (R
                          {plan.monthlyPrice.toLocaleString('en-ZA')}/pm)
                          <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Team & Profile Link Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Practice Profile & Team Seats
                </CardTitle>
                <CardDescription>
                  Update your practice contact details, staff invitations, and overflow work preferences.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline" className="font-semibold">
              <Link href="/partner/profile">Manage Profile & Staff</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
