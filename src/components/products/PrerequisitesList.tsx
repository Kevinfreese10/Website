'use client';

import { useState, useEffect } from 'react';
import { Service, PrerequisiteItem } from '@/lib/types';
import { ClipboardCheck, ShoppingBag, ShoppingCart, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);

interface PrerequisitesListProps {
  requirements: (string | PrerequisiteItem)[];
  allServices?: Service[];
}

interface LoadedProductPrereq {
  type: 'product';
  service: Service;
}

interface LoadedTextPrereq {
  type: 'text';
  text: string;
}

type LoadedPrereq = LoadedTextPrereq | LoadedProductPrereq;

export default function PrerequisitesList({ requirements, allServices = [] }: PrerequisitesListProps) {
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();
  const [items, setItems] = useState<LoadedPrereq[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadPrerequisites() {
      if (!requirements || requirements.length === 0) {
        if (isMounted) setLoading(false);
        return;
      }

      const result: LoadedPrereq[] = [];
      const missingProductIds: string[] = [];

      // 1. Parse initial list
      requirements.forEach((req) => {
        if (typeof req === 'string') {
          result.push({ type: 'text', text: req });
        } else if (req.type === 'product' && req.productId) {
          const found = allServices.find(
            (s) => s.id === req.productId || s.slug === req.productId || s.title.toLowerCase() === req.productId.toLowerCase()
          );
          if (found) {
            result.push({ type: 'product', service: found });
          } else {
            missingProductIds.push(req.productId);
          }
        } else if (req.type === 'text' && req.text) {
          result.push({ type: 'text', text: req.text });
        }
      });

      // 2. Fetch any missing product services from Firestore
      if (missingProductIds.length > 0) {
        try {
          const snap = await getDocs(collection(db, 'services'));
          const dbServices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));

          missingProductIds.forEach((missingId) => {
            const match = dbServices.find(
              (s) => s.id === missingId || s.slug === missingId || s.title.toLowerCase() === missingId.toLowerCase()
            );
            if (match && !result.some((r) => r.type === 'product' && r.service.id === match.id)) {
              result.push({ type: 'product', service: match });
            }
          });
        } catch (err) {
          console.error('Error fetching prerequisite products:', err);
        }
      }

      if (isMounted) {
        setItems(result);
        setLoading(false);
      }
    }

    loadPrerequisites();

    return () => {
      isMounted = false;
    };
  }, [requirements, allServices]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading requirements...
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No specific prerequisites required.</p>;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleAddToCart = (service: Service) => {
    addToCart(service);
    toast({
      title: 'Prerequisite Added to Cart',
      description: `"${service.title}" has been added to your cart. Please review your cart to ensure all prerequisites are met.`,
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        if (item.type === 'text') {
          return (
            <div key={index} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50/60 border border-slate-200/60 text-xs">
              <ClipboardCheck className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-slate-800 font-medium leading-relaxed">{item.text}</span>
            </div>
          );
        }

        const inCart = cartItems.some((ci) => ci.service.id === item.service.id);

        return (
          <div
            key={item.service.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{item.service.title}</span>
                <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-200 font-bold">
                  Required Product
                </Badge>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{item.service.description}</p>
              <div className="font-extrabold text-blue-700 text-xs pt-0.5">
                {item.service.isPriceTbc ? 'Price on Request' : formatPrice(item.service.price)}
              </div>
            </div>

            <Button
              onClick={() => handleAddToCart(item.service)}
              disabled={inCart}
              size="sm"
              className={`h-9 font-bold text-xs rounded-lg shrink-0 w-full sm:w-auto ${
                inCart ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {inCart ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Add Prerequisite to Cart
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
