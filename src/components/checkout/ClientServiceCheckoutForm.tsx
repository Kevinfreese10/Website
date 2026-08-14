

'use client';

import { useState, useEffect } from 'react';
import { Service, PrerequisiteItem } from '@/lib/types';
import { Button } from '../ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Check, ArrowRight, ShieldCheck, AlertCircle, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(firebaseApp);

export default function ClientServiceCheckoutForm({ service }: { service: Service }) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const { toast } = useToast();
  const [includeMainProduct, setIncludeMainProduct] = useState<boolean>(true);
  const [prereqServices, setPrereqServices] = useState<Service[]>([]);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<Set<string>>(new Set());
  const [loadingPrereqs, setLoadingPrereqs] = useState<boolean>(true);
  const router = useRouter();

  const isMainInCart = cartItems.some((item) => item.service.id === service.id);

  // Load prerequisite products for this service
  useEffect(() => {
    let isMounted = true;

    async function loadPrereqs() {
      const productIds = new Set<string>();

      // Check clientRequirements strictly
      if (service.clientRequirements) {
        service.clientRequirements.forEach((req) => {
          if (typeof req !== 'string' && req.type === 'product' && req.productId) {
            productIds.add(req.productId);
          }
        });
      }

      if (productIds.size === 0) {
        if (isMounted) {
          setPrereqServices([]);
          setLoadingPrereqs(false);
        }
        return;
      }

      try {
        const snap = await getDocs(collection(db, 'services'));
        const allServices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));

        const matched: Service[] = [];
        productIds.forEach((pid) => {
          const found = allServices.find(
            (s) => s.id === pid || s.slug === pid || s.title.toLowerCase() === pid.toLowerCase()
          );
          if (found && found.id !== service.id && !matched.some((m) => m.id === found.id)) {
            matched.push(found);
          }
        });

        if (isMounted) {
          setPrereqServices(matched);
          const initialSelected = new Set<string>();
          matched.forEach((p) => {
            const inCart = cartItems.some((ci) => ci.service.id === p.id);
            if (!inCart) initialSelected.add(p.id);
          });
          setSelectedPrereqIds(initialSelected);
          setLoadingPrereqs(false);
        }
      } catch (err) {
        console.error('Error fetching prerequisite products in checkout form:', err);
        if (isMounted) setLoadingPrereqs(false);
      }
    }

    loadPrereqs();

    return () => {
      isMounted = false;
    };
  }, [service.id, service.requiredProductIds, service.clientRequirements, cartItems]);

  const handleToggleMainProduct = () => {
    if (isMainInCart) {
      removeFromCart(service.id);
      setIncludeMainProduct(false);
      toast({
        title: 'Main Service Removed',
        description: `"${service.title}" removed from your cart.`,
      });
    } else {
      setIncludeMainProduct(!includeMainProduct);
    }
  };

  const togglePrereq = (p: Service) => {
    const inCart = cartItems.some((ci) => ci.service.id === p.id);
    if (inCart) {
      removeFromCart(p.id);
      setSelectedPrereqIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
      toast({
        title: 'Prerequisite Removed',
        description: `"${p.title}" removed from your cart.`,
      });
    } else {
      setSelectedPrereqIds((prev) => {
        const next = new Set(prev);
        if (next.has(p.id)) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
        return next;
      });
    }
  };

  // Live Price Calculation
  const mainPrice = includeMainProduct && !isMainInCart ? service.price : 0;
  const selectedPrereqList = prereqServices.filter(
    (p) => selectedPrereqIds.has(p.id) && !cartItems.some((ci) => ci.service.id === p.id)
  );
  const prereqsPrice = selectedPrereqList.reduce((sum, p) => sum + (p.price || 0), 0);
  const calculatedTotal = mainPrice + prereqsPrice;
  const selectedCount = (includeMainProduct && !isMainInCart ? 1 : 0) + selectedPrereqList.length;

  const handleAddAllToCart = (redirect: boolean) => {
    if (selectedCount === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one product or prerequisite to add to cart.',
        variant: 'destructive',
      });
      return;
    }

    // 1. Add main service if checked
    if (includeMainProduct && !isMainInCart) {
      addToCart(service);
    }

    // 2. Add selected prerequisite products
    selectedPrereqList.forEach((p) => {
      addToCart(p);
    });

    toast({
      title: 'Cart Updated',
      description: `Added ${selectedCount} item(s) to your cart.`,
    });

    if (redirect) {
      router.push('/cart');
    }
  };

  const getButtonText = () => {
    if (selectedCount === 0) return 'Select at Least 1 Product';
    if (includeMainProduct && !isMainInCart && selectedPrereqList.length > 0) {
      return `Buy Complete Package – ${formatPrice(calculatedTotal)}`;
    }
    if (includeMainProduct && !isMainInCart && selectedPrereqList.length === 0) {
      return `Buy ${service.title} Only – ${formatPrice(calculatedTotal)}`;
    }
    if ((!includeMainProduct || isMainInCart) && selectedPrereqList.length > 0) {
      return `Buy Prerequisite${selectedPrereqList.length > 1 ? 's' : ''} Only – ${formatPrice(calculatedTotal)}`;
    }
    return `Buy Now – ${formatPrice(calculatedTotal)}`;
  };

  return (
    <div className="space-y-4">
      {/* Order Configuration Box */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400 tracking-wider pb-1 border-b">
          <span>Configure Your Order</span>
          <span>Select Items</span>
        </div>

        {/* Main Product Selection Row */}
        <div
          onClick={handleToggleMainProduct}
          className={`flex items-start gap-3 p-3 rounded-xl border transition-all select-none cursor-pointer ${
            isMainInCart
              ? 'bg-emerald-50/70 border-emerald-300 hover:bg-red-50/50 hover:border-red-200'
              : includeMainProduct
              ? 'bg-primary/5 border-primary/40 shadow-2xs'
              : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
          }`}
        >
          <Checkbox
            checked={isMainInCart || includeMainProduct}
            onCheckedChange={handleToggleMainProduct}
            className="mt-0.5 pointer-events-none"
          />
          <div className="text-xs space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-extrabold text-slate-900 leading-tight">{service.title}</span>
              <span className="font-black text-primary text-xs shrink-0">
                {service.isPriceTbc ? 'Quote' : formatPrice(service.price)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Main Service</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{service.turnaroundTime}</span>
            </div>
            {isMainInCart && (
              <Badge className="text-[9px] bg-emerald-100 text-emerald-800 border-none font-bold py-0 px-1.5 mt-1">
                In Cart (Click to Remove)
              </Badge>
            )}
          </div>
        </div>

        {/* Prerequisite Products Selection List */}
        {!loadingPrereqs && prereqServices.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              Required Prerequisites
            </div>

            {prereqServices.map((p) => {
              const inCart = cartItems.some((ci) => ci.service.id === p.id);
              const isChecked = inCart || selectedPrereqIds.has(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => togglePrereq(p)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all select-none cursor-pointer ${
                    inCart
                      ? 'bg-emerald-50/70 border-emerald-300 hover:bg-red-50/50 hover:border-red-200'
                      : isChecked
                      ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => togglePrereq(p)}
                    className="mt-0.5 pointer-events-none"
                  />
                  <div className="text-xs space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 leading-none">{p.title}</span>
                      <span className="font-extrabold text-blue-700 text-xs shrink-0">
                        {p.isPriceTbc ? 'Quote' : formatPrice(p.price)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">Prerequisite Service</span>
                    {inCart && (
                      <Badge className="text-[9px] bg-emerald-100 text-emerald-800 border-none font-bold py-0 px-1.5 mt-1 block w-fit">
                        In Cart (Click to Remove)
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Calculated Total Bar */}
        <div className="flex items-center justify-between pt-2 border-t font-black text-sm">
          <span className="text-slate-600 font-extrabold text-xs">Selected Total ({selectedCount} item{selectedCount !== 1 ? 's' : ''}):</span>
          <span className="text-primary text-base font-black">{formatPrice(calculatedTotal)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <Button
        onClick={() => handleAddAllToCart(true)}
        disabled={selectedCount === 0}
        size="lg"
        className="w-full h-12 font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md rounded-xl"
      >
        {getButtonText()}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <Button
        onClick={() => handleAddAllToCart(false)}
        disabled={selectedCount === 0}
        variant="outline"
        size="lg"
        className="w-full h-11 font-bold text-xs rounded-xl border-slate-300 hover:bg-slate-50"
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add Selected ({selectedCount}) to Cart Only
      </Button>

      {cartItems.length > 0 && (
        <Button asChild variant="ghost" className="w-full text-xs font-bold text-primary hover:bg-primary/5" size="sm">
          <Link href="/cart">
            View Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-wide pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure Payment
        </span>
        <span className="text-slate-300">·</span>
        <span>SARS Compliant</span>
      </div>
    </div>
  );
}

