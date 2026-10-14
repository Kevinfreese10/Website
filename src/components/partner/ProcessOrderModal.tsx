'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Store,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Order, Service } from '@/lib/types';
import { usePartner } from '@/contexts/PartnerContext';
import { getPartnerServicePrice } from '@/lib/partner-pricing';
import { submitPayFastPayment } from '@/lib/payfast-client';
import { useToast } from '@/hooks/use-toast';

interface ProcessOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  walletBalance?: number;
  allServices: Service[];
  hasPlatformFee?: boolean;
  onConfirm?: (choice: 'complete' | 'outsource', documentContact?: 'partner') => Promise<void>;
}

const formatZAR = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

export function ProcessOrderModal({
  open,
  onOpenChange,
  order,
  allServices,
}: ProcessOrderModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { tier, tierPlan, discountPercent } = usePartner();
  const { toast } = useToast();

  // --- Cost & Profit calculations ---
  const wholesaleCost = (order?.items ?? []).reduce((sum, item) => {
    const matchedService = allServices.find((s) => s.id === (item.id || item.serviceId));
    const itemPrice = item.price || item.unitPrice || 0;
    const unitCost = matchedService
      ? getPartnerServicePrice(matchedService, tier)
      : itemPrice;
    return sum + unitCost * (item.quantity || 1);
  }, 0);

  const calculatedRetailTotal = (order?.items ?? []).reduce((sum, item) => {
    const matchedService = allServices.find((s) => s.id === (item.id || item.serviceId));
    const retailUnitPrice = matchedService?.price || item.clientPrice || item.price || 0;
    return sum + retailUnitPrice * (item.quantity || 1);
  }, 0);

  const clientSellingTotal = Math.max(order?.clientTotal ?? 0, calculatedRetailTotal);
  const partnerProfit = Math.max(0, clientSellingTotal - wholesaleCost);
  const profitMargin =
    clientSellingTotal > 0 ? Math.round((partnerProfit / clientSellingTotal) * 100) : 0;

  const handlePayNow = async () => {
    if (!order) return;
    setIsConfirming(true);
    try {
      const res = await submitPayFastPayment({
        orderId: order.status === 'Pending Payment' ? order.id : `OUTSOURCE-${order.id}`,
        amount: wholesaleCost,
        itemName: `Partner Order #${order.id}`,
        itemDescription: (order.items || []).map((i) => i.title).join(', '),
        customerName: order.customerName || 'Partner',
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone || '',
        returnPath: `/payment-success/${order.id}`,
        cancelPath: `/partner/orders`,
      });

      if (!res.success) {
        toast({
          title: 'Payment Gateway Error',
          description: res.error || 'Could not redirect to PayFast.',
          variant: 'destructive',
        });
        setIsConfirming(false);
      }
    } catch (e: any) {
      console.error('PayFast error:', e);
      toast({
        title: 'Error',
        description: e?.message || 'Could not initiate payment.',
        variant: 'destructive',
      });
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <ArrowRight className="h-5 w-5 text-primary" />
            Complete Back-Office Order Payment
          </DialogTitle>
          <DialogDescription>
            Submit order{' '}
            <span className="font-medium text-foreground">#{order?.id}</span>{' '}
            {order?.endCustomerName ? `for ${order.endCustomerName} ` : ''}
            to My Accountant at your {tierPlan.name} Tier ({discountPercent}% off) wholesale rate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <Store className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold leading-tight">
                Back-Office Fulfillment ({tierPlan.name} Tier)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                My Accountant fulfills this order behind the scenes at your {discountPercent}% wholesale discount.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 rounded-lg bg-background p-3 text-xs border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Wholesale Cost ({discountPercent}% Off)
              </span>
              <Badge variant="default" className="tabular-nums font-bold">
                {formatZAR(wholesaleCost)}
              </Badge>
            </div>
            {clientSellingTotal > 0 && (
              <div className="pt-2 border-t flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Standard Retail Value:</span>
                  <span className="font-semibold text-slate-900">
                    {formatZAR(clientSellingTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Your Practice Margin:
                  </span>
                  <span className="text-emerald-700 font-black text-sm">
                    {formatZAR(partnerProfit)}{' '}
                    <span className="text-[10px] font-semibold text-emerald-600 font-mono">
                      ({profitMargin}% margin)
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            All communication, document requests, and deliverables happen strictly with you (the partner).
          </div>

          <Button
            className="mt-2 w-full font-bold"
            size="lg"
            disabled={isConfirming}
            onClick={handlePayNow}
          >
            {isConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Store className="mr-2 h-4 w-4" />
            )}
            Proceed to PayFast ({formatZAR(wholesaleCost)})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
