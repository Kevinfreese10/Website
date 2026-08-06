'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Wallet2,
  ArrowRight,
  CheckCircle2,
  Store,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Order, Service } from '@/lib/types';

interface ProcessOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  walletBalance: number;
  allServices: Service[];
  hasPlatformFee: boolean;
  onConfirm: (choice: 'complete' | 'outsource', documentContact?: 'partner' | 'client') => Promise<void>;
}

const formatZAR = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

export function ProcessOrderModal({
  open,
  onOpenChange,
  order,
  walletBalance,
  allServices,
  hasPlatformFee,
  onConfirm,
}: ProcessOrderModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [docContactPreference, setDocContactPreference] = useState<'partner' | 'client'>('partner');

  // --- Cost calculations ---
  const royalty = Math.max(100, Math.min(500, (order?.total ?? 0) * 0.10));

  const wholesaleCost = (order?.items ?? []).reduce((sum, item) => {
    const matchedService = allServices.find((s) => s.id === item.id);
    const unitCost = matchedService?.resellerPrice ?? item.price * 0.80;
    return sum + unitCost * item.quantity;
  }, 0);

  // --- Balance shortfall helpers ---
  const royaltyShortfall = Math.max(0, royalty - walletBalance);
  const wholesaleShortfall = Math.max(0, wholesaleCost - walletBalance);

  const canComplete = walletBalance >= royalty;
  const canOutsource = walletBalance >= wholesaleCost;

  // --- Confirm handler ---
  const handleConfirm = async (choice: 'complete' | 'outsource') => {
    setIsConfirming(true);
    try {
      const contactPref = choice === 'outsource'
        ? (hasPlatformFee ? docContactPreference : 'partner')
        : undefined;
      await onConfirm(choice, contactPref);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <ArrowRight className="h-5 w-5 text-primary" />
            Mark Order as Processing
          </DialogTitle>
          <DialogDescription>
            Choose how you would like to fulfil{' '}
            <span className="font-medium text-foreground">
              {order?.customerName}&apos;s
            </span>{' '}
            order.
          </DialogDescription>
        </DialogHeader>

        {/* Wallet Balance Banner */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <Wallet2 className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm text-muted-foreground">Wallet Balance</span>
            <span className="text-base font-semibold tabular-nums">
              {formatZAR(walletBalance)}
            </span>
          </div>
        </div>

        {/* Option Cards */}
        <div className={`grid gap-4 ${hasPlatformFee ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Card A: Complete Yourself (only for paid partners) */}
          {hasPlatformFee && (
            <div
              className={`flex flex-col gap-4 rounded-xl border p-5 transition-colors ${
                canComplete
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-muted bg-muted/30 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className={`mt-0.5 h-5 w-5 shrink-0 ${canComplete ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <div>
                  <p className="font-semibold leading-tight">Complete it yourself</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You fulfill the order and pay a platform royalty.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Platform Royalty</span>
                <Badge variant={canComplete ? 'default' : 'secondary'} className="tabular-nums">
                  {formatZAR(royalty)}
                </Badge>
              </div>

              {!canComplete && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Insufficient balance. Need {formatZAR(royaltyShortfall)} more.
                </div>
              )}

              <Button
                className="mt-auto w-full"
                disabled={!canComplete || isConfirming}
                onClick={() => handleConfirm('complete')}
              >
                {isConfirming ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {canComplete ? 'Complete Myself' : 'Insufficient Balance'}
              </Button>
            </div>
          )}

          {/* Card B: Outsource to My Accountant */}
          <div
            className={`flex flex-col gap-4 rounded-xl border p-5 transition-colors ${
              canOutsource
                ? 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-muted bg-muted/30 opacity-70'
            }`}
          >
            <div className="flex items-start gap-3">
              <Store
                className={`mt-0.5 h-5 w-5 shrink-0 ${canOutsource ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
              />
              <div>
                <p className="font-semibold leading-tight">Outsource to My Accountant</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  My Accountant handles fulfillment at wholesale cost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Wholesale Cost</span>
              <Badge
                variant={canOutsource ? 'outline' : 'secondary'}
                className="tabular-nums border-amber-500/60 text-amber-700 dark:text-amber-400"
              >
                {formatZAR(wholesaleCost)}
              </Badge>
            </div>

            {/* Document Contact — paid partners get radio, free partners get hardcoded note */}
            {hasPlatformFee ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Send document request to
                </p>
                <RadioGroup
                  value={docContactPreference}
                  onValueChange={(v) => setDocContactPreference(v as 'partner' | 'client')}
                  className="space-y-1.5"
                >
                  <div className="flex items-center gap-2.5 rounded-md border bg-background px-3 py-2.5">
                    <RadioGroupItem value="partner" id="doc-partner" />
                    <Label htmlFor="doc-partner" className="cursor-pointer text-sm">
                      Contact me (the partner)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-md border bg-background px-3 py-2.5">
                    <RadioGroupItem value="client" id="doc-client" />
                    <Label htmlFor="doc-client" className="cursor-pointer text-sm">
                      Contact my client directly
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Documents will be requested from you (the partner).
              </div>
            )}

            {!canOutsource && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Insufficient balance. Need {formatZAR(wholesaleShortfall)} more.
              </div>
            )}

            <Button
              className="mt-auto w-full"
              variant={hasPlatformFee ? 'outline' : 'default'}
              disabled={!canOutsource || isConfirming}
              onClick={() => handleConfirm('outsource')}
            >
              {isConfirming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Store className="mr-2 h-4 w-4" />
              )}
              {canOutsource ? 'Outsource Order' : 'Insufficient Balance'}
            </Button>
          </div>
        </div>

        {/* Top-up link */}
        <DialogFooter className="flex-col items-center sm:flex-col">
          <p className="text-center text-xs text-muted-foreground">
            Need more funds?{' '}
            <a
              href="/partner/settings#wallet"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Top up your wallet
            </a>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
