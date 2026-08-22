
'use client';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import { Loader2, ShoppingCart, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { validateDiscountCodeAction } from '@/app/actions';

export default function CheckoutPage() {
  const { cartItems, cartTotal, isCartLoaded } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentage: number; discountAmount: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isPromoInputOpen, setIsPromoInputOpen] = useState(false);

  const promoDiscountAmount = appliedPromo ? Math.round((cartTotal * appliedPromo.percentage) / 100) : 0;
  const finalOrderTotal = Math.max(0, cartTotal - promoDiscountAmount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      toast({ title: 'Enter Code', description: 'Please enter a promo / discount code.', variant: 'destructive' });
      return;
    }
    setIsValidatingPromo(true);
    try {
      const res = await validateDiscountCodeAction({
        code: promoCodeInput.trim(),
        email: user?.email || undefined,
        subtotal: cartTotal,
      });

      if (res.success && res.code && res.percentage !== undefined && res.discountAmount !== undefined) {
        setAppliedPromo({
          code: res.code,
          percentage: res.percentage,
          discountAmount: res.discountAmount,
        });
        toast({ title: 'Discount Applied! 🎉', description: res.message });
      } else {
        toast({ title: 'Invalid Code', description: res.error || 'This code is not valid.', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error('Error validating promo code:', e);
      toast({ title: 'Validation Error', description: 'Could not validate promo code. Please try again.', variant: 'destructive' });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    toast({ title: 'Discount Removed', description: 'Promo code discount has been removed.' });
  };
  
  if (!isCartLoaded) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex h-[calc(100vh-20rem)] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
    );
  }
  
  if (isCartLoaded && cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">You can't proceed to checkout without any products.</p>
          <Button asChild className="mt-6">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8 text-hero-gradient pb-2">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <CheckoutForm appliedPromo={appliedPromo} />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.service.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.service.title}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p>{formatPrice(item.service.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Promo Code Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs mb-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold uppercase tracking-wide">{appliedPromo.code}</span>
                        <span className="text-[11px] text-emerald-700 ml-1.5 font-bold">({appliedPromo.percentage}% OFF)</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={handleRemovePromo}
                      className="h-6 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 font-bold shrink-0"
                    >
                      Remove
                    </Button>
                  </div>
                ) : isPromoInputOpen ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary" /> Promo / Discount Code
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPromoInputOpen(false)}
                        className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. SAVE10"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="h-9 text-xs uppercase font-mono tracking-wider bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyPromo();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isValidatingPromo || !promoCodeInput.trim()}
                        onClick={handleApplyPromo}
                        className="h-9 px-4 text-xs font-bold shrink-0"
                      >
                        {isValidatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPromoInputOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors w-full text-left"
                  >
                    <Tag className="w-3.5 h-3.5" /> Have a discount or promo code?
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {appliedPromo && promoDiscountAmount > 0 ? (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Discount ({appliedPromo.code})
                    </span>
                    <span>-{formatPrice(promoDiscountAmount)}</span>
                  </div>
                ) : null}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className={appliedPromo ? 'text-emerald-700' : ''}>{formatPrice(finalOrderTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
