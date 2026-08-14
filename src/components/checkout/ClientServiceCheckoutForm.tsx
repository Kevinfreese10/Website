

'use client';

import { useState, useEffect } from 'react';
import { Service, PrerequisiteItem } from '@/lib/types';
import { Button } from '../ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Check, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
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
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);
  const [prereqServices, setPrereqServices] = useState<Service[]>([]);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<Set<string>>(new Set());
  const [loadingPrereqs, setLoadingPrereqs] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const itemInCart = cartItems.some((item) => item.service.id === service.id);
    setIsAdded(itemInCart);
  }, [cartItems, service.id]);

  // Load prerequisite products for this service
  useEffect(() => {
    let isMounted = true;

    async function loadPrereqs() {
      const productIds = new Set<string>();

      // Check requiredProductIds
      if (service.requiredProductIds) {
        service.requiredProductIds.forEach((id) => productIds.add(id));
      }

      // Check clientRequirements
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
          // By default, select all prerequisite products that are not yet in the cart
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
  }, [service.id, service.requiredProductIds, service.clientRequirements]);

  const togglePrereq = (id: string) => {
    setSelectedPrereqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddAllToCart = (redirect: boolean) => {
    // 1. Add main service
    if (!isAdded) {
      addToCart(service);
      setIsAdded(true);
    }

    // 2. Add selected prerequisite products
    let addedPrereqCount = 0;
    prereqServices.forEach((p) => {
      const inCart = cartItems.some((ci) => ci.service.id === p.id);
      if (selectedPrereqIds.has(p.id) && !inCart) {
        addToCart(p);
        addedPrereqCount++;
      }
    });

    if (addedPrereqCount > 0) {
      toast({
        title: 'Prerequisites Added to Cart',
        description: `Added "${service.title}" + ${addedPrereqCount} required prerequisite product(s) to your cart.`,
      });
    } else if (!isAdded) {
      toast({
        title: 'Added to Cart',
        description: `"${service.title}" added to your cart.`,
      });
    }

    if (redirect) {
      router.push('/cart');
    }
  };

  return (
    <div className="space-y-4">
      {/* Prerequisite Product Checkbox Selection */}
      {!loadingPrereqs && prereqServices.length > 0 && (
        <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            Required Prerequisite Products
          </div>
          <p className="text-[11px] text-blue-900 leading-tight">
            Select the prerequisites you don&apos;t have so they can be added to your cart:
          </p>

          <div className="space-y-2 pt-1">
            {prereqServices.map((p) => {
              const inCart = cartItems.some((ci) => ci.service.id === p.id);
              const isChecked = inCart || selectedPrereqIds.has(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => !inCart && togglePrereq(p.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all select-none ${
                    inCart
                      ? 'bg-emerald-50/70 border-emerald-200 cursor-default'
                      : isChecked
                      ? 'bg-white border-blue-300 shadow-2xs cursor-pointer'
                      : 'bg-white/70 border-slate-200 cursor-pointer opacity-75 hover:opacity-100'
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={inCart}
                    onCheckedChange={() => !inCart && togglePrereq(p.id)}
                    className="mt-0.5 pointer-events-none"
                  />
                  <div className="text-xs space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 leading-none">{p.title}</span>
                      <span className="font-extrabold text-blue-700 text-xs shrink-0">
                        {p.isPriceTbc ? 'Quote' : formatPrice(p.price)}
                      </span>
                    </div>
                    {inCart && (
                      <Badge className="text-[9px] bg-emerald-100 text-emerald-800 border-none font-bold py-0 px-1.5 mt-1">
                        Already in Cart
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={() => handleAddAllToCart(true)}
        size="lg"
        className="w-full h-12 font-black text-sm bg-primary hover:bg-primary/90 text-white shadow-md rounded-xl"
      >
        Buy Now & Proceed to Cart
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <Button
        onClick={() => handleAddAllToCart(false)}
        disabled={isAdded && selectedPrereqIds.size === 0}
        variant={isAdded ? 'secondary' : 'outline'}
        size="lg"
        className={`w-full h-11 font-bold text-xs rounded-xl ${
          isAdded && selectedPrereqIds.size === 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'border-slate-300 hover:bg-slate-50'
        }`}
      >
        {isAdded && selectedPrereqIds.size === 0 ? (
          <>
            <Check className="mr-2 h-4 w-4 text-emerald-600" />
            Items Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {selectedPrereqIds.size > 0
              ? `Add Main + ${selectedPrereqIds.size} Prerequisite(s) to Cart`
              : 'Add to Cart Only'}
          </>
        )}
      </Button>

      {isAdded && (
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

