'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Service, PrerequisiteItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShoppingCart, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);

interface MissingCartPrerequisite {
  parentTitle: string;
  prereqService: Service;
}

export default function CartPrerequisiteChecker() {
  const { cartItems, addToCart } = useCart();
  const { toast } = useToast();
  const [missingPrereqs, setMissingPrereqs] = useState<MissingCartPrerequisite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const cartItemsKey = cartItems.map((ci) => ci.service.id).join(',');

  useEffect(() => {
    let isMounted = true;

    async function checkCartPrerequisites() {
      if (cartItems.length === 0) {
        if (isMounted) {
          setMissingPrereqs([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const snap = await getDocs(collection(db, 'services'));
        const allServices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));

        const cartServiceIds = new Set(cartItems.map((ci) => ci.service.id));
        const missing: MissingCartPrerequisite[] = [];

        cartItems.forEach((ci) => {
          const serviceObj = ci.service;

          // 1. Check requiredProductIds
          const reqIds = new Set<string>();
          if (serviceObj.requiredProductIds) {
            serviceObj.requiredProductIds.forEach((id) => reqIds.add(id));
          }

          // 2. Check structured clientRequirements
          if (serviceObj.clientRequirements) {
            serviceObj.clientRequirements.forEach((req) => {
              if (typeof req !== 'string' && req.type === 'product' && req.productId) {
                reqIds.add(req.productId);
              }
            });
          }

          // Verify if missing from cart
          reqIds.forEach((reqId) => {
            if (!cartServiceIds.has(reqId)) {
              const prereqService = allServices.find(
                (s) => s.id === reqId || s.slug === reqId || s.title.toLowerCase() === reqId.toLowerCase()
              );

              if (prereqService && !cartServiceIds.has(prereqService.id)) {
                if (!missing.some((m) => m.prereqService.id === prereqService.id)) {
                  missing.push({
                    parentTitle: serviceObj.title,
                    prereqService,
                  });
                }
              }
            }
          });
        });

        if (isMounted) {
          setMissingPrereqs(missing);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking cart prerequisites:', err);
        if (isMounted) setLoading(false);
      }
    }

    checkCartPrerequisites();

    return () => {
      isMounted = false;
    };
  }, [cartItemsKey]);

  if (loading || missingPrereqs.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleAddPrerequisiteToCart = (prereqService: Service) => {
    addToCart(prereqService);
    toast({
      title: 'Prerequisite Product Added',
      description: `"${prereqService.title}" added to your cart. Cart updated!`,
    });
  };

  return (
    <Card className="border-2 border-amber-300 bg-amber-50/70 shadow-sm rounded-2xl overflow-hidden mb-6">
      <CardHeader className="bg-amber-100/70 py-3 px-4 border-b border-amber-200">
        <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          Cart Action Required: Missing Prerequisites Identified ({missingPrereqs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-amber-900 leading-relaxed">
          One or more items in your cart require prerequisite services to be completed first. Please review and add the required services below before completing your order:
        </p>

        <div className="space-y-2">
          {missingPrereqs.map((mp) => (
            <div
              key={mp.prereqService.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200 text-xs shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{mp.prereqService.title}</span>
                  <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                    Required for {mp.parentTitle}
                  </Badge>
                </div>
                <p className="text-slate-500 text-[11px] line-clamp-1">{mp.prereqService.description}</p>
                <div className="font-extrabold text-amber-900 text-xs">
                  {mp.prereqService.isPriceTbc ? 'Quote' : formatPrice(mp.prereqService.price)}
                </div>
              </div>

              <Button
                onClick={() => handleAddPrerequisiteToCart(mp.prereqService)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-3 rounded-lg shrink-0 w-full sm:w-auto gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Prerequisite to Cart
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
