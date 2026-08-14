'use client';

import { useState, useEffect } from 'react';
import { Service, PrerequisiteItem } from '@/lib/types';
import { ClipboardCheck, ShoppingBag, ShoppingCart, CheckCircle2, ShieldAlert, Loader2, CornerDownRight, Plus, Clock, Check, Lock } from 'lucide-react';
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
  depth?: number;
  selectedPrereqIds?: Set<string>;
  onTogglePrereq?: (serviceId: string) => void;
  onConfirmationChange?: (allConfirmed: boolean) => void;
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

export default function PrerequisitesList({
  requirements,
  allServices = [],
  depth = 0,
  selectedPrereqIds,
  onTogglePrereq,
  onConfirmationChange,
}: PrerequisitesListProps) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const { toast } = useToast();
  const [items, setItems] = useState<LoadedPrereq[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const requirementsKey = JSON.stringify(requirements || []);
  const servicesLength = allServices?.length || 0;

  const activeSelectedIds = selectedPrereqIds || localSelectedIds;

  const toggleConfirm = (reqId: string) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  };

  // Evaluate if all top-level prerequisite requirements are confirmed
  useEffect(() => {
    if (!onConfirmationChange) return;

    if (!items || items.length === 0) {
      onConfirmationChange(true);
      return;
    }

    const textReqIds: string[] = [];
    items.forEach((item, idx) => {
      if (item.type === 'text') {
        textReqIds.push(`text_${depth}_${idx}_${item.text}`);
      } else if (item.type === 'product') {
        const childReqs = item.service.clientRequirements || [];
        childReqs.forEach((r, childIdx) => {
          const reqText = typeof r === 'string' ? r : r.type === 'text' ? r.text : null;
          if (reqText) {
            textReqIds.push(`text_${depth + 1}_${childIdx}_${reqText}`);
          }
        });
      }
    });

    const allConfirmed = textReqIds.length === 0 || textReqIds.every((id) => confirmedIds.has(id));
    onConfirmationChange(allConfirmed);
  }, [confirmedIds, items, depth, onConfirmationChange]);

  const handleToggleIncludeInOrder = (serviceId: string) => {
    if (onTogglePrereq) {
      onTogglePrereq(serviceId);
    } else {
      setLocalSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(serviceId)) next.delete(serviceId);
        else next.add(serviceId);
        return next;
      });
    }
  };

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
  }, [requirementsKey, servicesLength]);

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

  return (
    <div className="space-y-3">
      {depth === 0 && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-100/40 to-orange-50 border border-amber-200/90 text-xs text-amber-900 font-semibold shadow-2xs mb-2 animate-in fade-in">
          <ClipboardCheck className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          <span>
            Please confirm you have each required item below by clicking the checkboxes to unlock checkout.
          </span>
        </div>
      )}
      {items.map((item, index) => {
        if (item.type === 'text') {
          const reqId = `text_${depth}_${index}_${item.text}`;
          const isConfirmed = confirmedIds.has(reqId);

          return (
            <div
              key={reqId}
              onClick={() => toggleConfirm(reqId)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                isConfirmed
                  ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-2xs'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div
                className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all mt-0.5 ${
                  isConfirmed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-400 bg-white'
                }`}
              >
                {isConfirmed && <Check className="h-3 w-3 text-white stroke-[3]" />}
              </div>
              <span className={`text-xs leading-relaxed ${isConfirmed ? 'font-bold text-emerald-950' : 'font-medium'}`}>
                {item.text}
              </span>
              <span className="ml-auto text-[10px] font-bold shrink-0">
                {isConfirmed ? (
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    ✓ Confirmed
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Confirm you have this
                  </span>
                )}
              </span>
            </div>
          );
        }

        const isIncludedInOrder = activeSelectedIds.has(item.service.id);
        const childRequirements = item.service.clientRequirements || [];

        // Check if all child text requirements for this product are confirmed
        const childReqStrings = childRequirements
          .map((r) => (typeof r === 'string' ? r : r.type === 'text' ? r.text : null))
          .filter(Boolean) as string[];

        const allChildReqsConfirmed =
          childReqStrings.length === 0 ||
          childReqStrings.every((text, idx) => confirmedIds.has(`text_${depth + 1}_${idx}_${text}`));

        return (
          <div
            key={item.service.id}
            className={`p-3.5 rounded-xl border transition-all ${
              depth > 0
                ? 'border-blue-300 bg-blue-100/40 ml-2 sm:ml-4'
                : 'border-blue-200 bg-blue-50/40 shadow-2xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-sm">{item.service.title}</span>
                  <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-200 font-bold">
                    Required Product
                  </Badge>
                  {item.service.turnaroundTime && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white/90 border border-slate-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                      <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                      {item.service.turnaroundTime}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{item.service.description}</p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {item.service.isPriceTbc ? (
                    <span className="font-extrabold text-blue-700 text-xs">Price on Request</span>
                  ) : (
                    <>
                      <span className="font-black text-blue-700 text-sm">
                        {formatPrice(item.service.price || 0)}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold">
                        🎁 Unlocks 20% OFF Total Order
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              <Button
                disabled={!allChildReqsConfirmed && !isIncludedInOrder}
                onClick={() => handleToggleIncludeInOrder(item.service.id)}
                size="sm"
                className={`h-9 font-bold text-xs rounded-lg shrink-0 w-full sm:w-auto transition-all ${
                  isIncludedInOrder
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : !allChildReqsConfirmed
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                {isIncludedInOrder ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Included in Order
                  </>
                ) : !allChildReqsConfirmed ? (
                  <>
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    Confirm Prerequisites Below
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Include in Order
                  </>
                )}
              </Button>
            </div>

            {!allChildReqsConfirmed && !isIncludedInOrder && (
              <div className="mt-2 text.5 max-w-full text-[11px] font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/90 p-2 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <span className="text-sm">⚠️</span>
                Please confirm all prerequisites below to enable including this product in your order.
              </div>
            )}

            {/* Recursive Child Prerequisites */}
            {childRequirements.length > 0 && depth < 3 && (
              <div className="mt-3 pt-3 border-t border-blue-200/70 space-y-2">
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Prerequisites for {item.service.title}:
                </div>
                <PrerequisitesList
                  requirements={childRequirements}
                  allServices={allServices}
                  depth={depth + 1}
                  selectedPrereqIds={selectedPrereqIds}
                  onTogglePrereq={onTogglePrereq}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

