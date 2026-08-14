'use client';

import { useState, useEffect } from 'react';
import { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CheckCircle2, ShieldAlert, Plus, Sparkles } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);

interface RequiredProductAddonsCardProps {
  mainService: Service;
  allServices?: Service[];
}

export default function RequiredProductAddonsCard({
  mainService,
  allServices = [],
}: RequiredProductAddonsCardProps) {
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();
  const [prereqServices, setPrereqServices] = useState<Service[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const mainServiceId = mainService?.id;
  const requiredProductIdsKey = (mainService?.requiredProductIds || []).join(',');

  useEffect(() => {
    let isMounted = true;

    async function loadRequiredServices() {
      if (!mainService?.requiredProductIds || mainService.requiredProductIds.length === 0) {
        setLoading(false);
        return;
      }

      const found: Service[] = [];
      const missingIds: string[] = [];

      mainService.requiredProductIds.forEach((id) => {
        const s = allServices.find((item) => item.id === id);
        if (s) {
          found.push(s);
        } else {
          missingIds.push(id);
        }
      });

      // Fetch missing required services directly from Firestore
      if (missingIds.length > 0) {
        try {
          const snap = await getDocs(collection(db, 'services'));
          const allDbServices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));

          missingIds.forEach((reqId) => {
            const match = allDbServices.find(
              (s) => s.id === reqId || s.slug === reqId || s.title.toLowerCase() === reqId.toLowerCase()
            );
            if (match && !found.some((f) => f.id === match.id)) {
              found.push(match);
            }
          });
        } catch (err) {
          console.error('Error loading prerequisite services:', err);
        }
      }

      if (isMounted) {
        setPrereqServices(found);
        // Default all required products to checked
        setSelectedIds(found.map((s) => s.id));
        setLoading(false);
      }
    }

    loadRequiredServices();

    return () => {
      isMounted = false;
    };
  }, [mainServiceId, requiredProductIdsKey]);

  if (loading || prereqServices.length === 0) {
    return null;
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddSelectedToCart = () => {
    let addedCount = 0;

    prereqServices.forEach((s) => {
      if (selectedIds.includes(s.id)) {
        addToCart(s);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast({
        title: 'Prerequisite Products Added',
        description: `Added ${addedCount} required product(s) to your cart.`,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/40 shadow-sm rounded-2xl overflow-hidden my-6">
      <CardHeader className="bg-blue-100/60 pb-3 border-b border-blue-200/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-blue-950 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Required Prerequisite Services
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-200 text-blue-800 font-bold text-[10px] uppercase">
            Recommended Add-ons
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-xs text-blue-900 leading-relaxed">
          The service <strong>"{mainService.title}"</strong> requires the prerequisite products below. Check the boxes to add them directly to your order:
        </p>

        <div className="space-y-3">
          {prereqServices.map((service) => {
            const isChecked = selectedIds.includes(service.id);
            const inCart = cartItems.some((ci) => ci.service.id === service.id);

            return (
              <div
                key={service.id}
                onClick={() => toggleSelect(service.id)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-white border-blue-400 shadow-2xs ring-1 ring-blue-400'
                    : 'bg-slate-50/80 border-slate-200 text-slate-500 hover:bg-white'
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleSelect(service.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{service.title}</span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      {service.isPriceTbc ? 'TBC' : formatPrice(service.price)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{service.description}</p>
                  {inCart && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Already in Cart
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleAddSelectedToCart}
          disabled={selectedIds.length === 0}
          className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm h-11 rounded-xl shadow-sm gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Add Selected Prerequisites to Cart ({selectedIds.length})
        </Button>
      </CardContent>
    </Card>
  );
}
