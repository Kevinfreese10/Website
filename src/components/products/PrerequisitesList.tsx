'use client';

import { useState, useEffect } from 'react';
import { Service, PrerequisiteItem } from '@/lib/types';
import { ClipboardCheck, ShoppingBag, ShoppingCart, CheckCircle2, ShieldAlert, Loader2, CornerDownRight, Plus, Clock, Check, Lock, MousePointerClick } from 'lucide-react';
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
  confirmedIds?: Set<string>;
  onToggleConfirm?: (reqId: string) => void;
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

function checkServicePrereqsSatisfied(
  serviceReqs: (string | PrerequisiteItem)[] | undefined,
  currentDepth: number,
  allServicesMap: Service[],
  confirmedIds: Set<string>,
  selectedIds: Set<string>,
  visitedServiceIds: Set<string> = new Set()
): boolean {
  if (!serviceReqs || serviceReqs.length === 0 || currentDepth > 15) return true;

  for (let idx = 0; idx < serviceReqs.length; idx++) {
    const req = serviceReqs[idx];
    if (typeof req === 'string' || req.type === 'text') {
      const text = typeof req === 'string' ? req : req.text;
      const textId = `text_${currentDepth}_${idx}_${text}`;
      if (!confirmedIds.has(textId)) {
        return false;
      }
    } else if (req.type === 'product' && req.productId) {
      const productId = req.productId;
      if (visitedServiceIds.has(productId)) continue;

      const isAlreadyHave = confirmedIds.has(`product_${productId}`);
      const isIncluded = selectedIds.has(productId);

      if (!isAlreadyHave) {
        if (!isIncluded) return false;

        const childService = allServicesMap.find(
          (s) => s.id === productId || s.slug === productId || s.title.toLowerCase() === productId.toLowerCase()
        );
        if (childService && childService.clientRequirements) {
          const nextVisited = new Set(visitedServiceIds);
          nextVisited.add(productId);
          const childSatisfied = checkServicePrereqsSatisfied(
            childService.clientRequirements,
            currentDepth + 1,
            allServicesMap,
            confirmedIds,
            selectedIds,
            nextVisited
          );
          if (!childSatisfied) return false;
        }
      }
    }
  }

  return true;
}

export default function PrerequisitesList({
  requirements,
  allServices = [],
  depth = 0,
  selectedPrereqIds,
  onTogglePrereq,
  onConfirmationChange,
  confirmedIds,
  onToggleConfirm,
}: PrerequisitesListProps) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const { toast } = useToast();
  const [items, setItems] = useState<LoadedPrereq[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());
  const [localConfirmedIds, setLocalConfirmedIds] = useState<Set<string>>(new Set());

  const requirementsKey = JSON.stringify(requirements || []);
  const servicesLength = allServices?.length || 0;

  const activeSelectedIds = selectedPrereqIds || localSelectedIds;
  const activeConfirmedIds = confirmedIds || localConfirmedIds;

  const toggleConfirm = (reqId: string) => {
    if (onToggleConfirm) {
      onToggleConfirm(reqId);
    } else {
      setLocalConfirmedIds((prev) => {
        const next = new Set(prev);
        if (next.has(reqId)) next.delete(reqId);
        else next.add(reqId);
        return next;
      });
    }
  };

  // Evaluate if all top-level prerequisite requirements are confirmed
  useEffect(() => {
    if (!onConfirmationChange) return;

    if (!items || items.length === 0) {
      onConfirmationChange(true);
      return;
    }

    const unconfirmedIds: string[] = [];

    items.forEach((item, idx) => {
      if (item.type === 'text') {
        const id = `text_${depth}_${idx}_${item.text}`;
        if (!activeConfirmedIds.has(id)) {
          unconfirmedIds.push(id);
        }
      } else if (item.type === 'product') {
        const productId = item.service.id;
        const isIncluded = activeSelectedIds.has(productId);
        const isAlreadyHave = activeConfirmedIds.has(`product_${productId}`);

        if (!isIncluded && !isAlreadyHave) {
          unconfirmedIds.push(`product_${productId}`);
        }

        // Only enforce child requirements if user does NOT already have this product!
        if (!isAlreadyHave) {
          const childSatisfied = checkServicePrereqsSatisfied(
            item.service.clientRequirements,
            depth + 1,
            allServices || [],
            activeConfirmedIds,
            activeSelectedIds
          );
          if (!childSatisfied) {
            unconfirmedIds.push(`child_prereqs_${productId}`);
          }
        }
      }
    });

    const allConfirmed = unconfirmedIds.length === 0;
    onConfirmationChange(allConfirmed);
  }, [activeConfirmedIds, activeSelectedIds, items, depth, onConfirmationChange]);

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
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-red-50 to-red-100/60 border border-red-300 text-xs text-red-950 font-bold shadow-2xs mb-2 animate-in fade-in leading-relaxed">
          <ClipboardCheck className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>Please confirm you have each required item below by clicking the checkboxes to unlock checkout.</p>
            <p className="text-[11px] font-normal text-red-900 leading-normal">
              🤝 <strong>Don&apos;t worry if you&apos;re missing anything right now!</strong> Your order stays open for as long as you need, with no expiry date. You can provide your documents whenever it&apos;s convenient for you. <span className="text-[10px] opacity-80">(Please note that missing prerequisites do not qualify for a refund, as we keep your account ready for you).</span>
            </p>
          </div>
        </div>
      )}
      {items.map((item, index) => {
        if (item.type === 'text') {
          const reqId = `text_${depth}_${index}_${item.text}`;
          const isConfirmed = activeConfirmedIds.has(reqId);

          return (
            <div
              key={reqId}
              onClick={() => toggleConfirm(reqId)}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer select-none ${
                isConfirmed
                  ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-2xs'
                  : 'bg-white border-red-200/90 hover:border-red-300 text-slate-700 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div
                  className={`h-4.5 w-4.5 shrink-0 rounded border flex items-center justify-center transition-all mt-0.5 ${
                    isConfirmed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-red-400 bg-red-50/60 ring-2 ring-red-400/20 animate-pulse'
                  }`}
                >
                  {isConfirmed && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                </div>
                <span className={`text-xs leading-relaxed break-words ${isConfirmed ? 'font-bold text-emerald-950' : 'font-semibold text-slate-800'}`}>
                  {item.text}
                </span>
              </div>
              <span className="self-end sm:self-center text-[10px] font-bold shrink-0">
                {isConfirmed ? (
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    ✓ Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 animate-pulse">
                    <MousePointerClick className="w-3 h-3 text-red-600 animate-bounce" />
                    Click box to confirm
                  </span>
                )}
              </span>
            </div>
          );
        }

        const isIncludedInOrder = activeSelectedIds.has(item.service.id);
        const isProductAlreadyHave = activeConfirmedIds.has(`product_${item.service.id}`);
        const childRequirements = item.service.clientRequirements || [];

        // Check recursively if all child text and product requirements for this product are confirmed/satisfied
        const allChildReqsConfirmed = checkServicePrereqsSatisfied(
          childRequirements,
          depth + 1,
          allServices || [],
          activeConfirmedIds,
          activeSelectedIds
        );

        return (
          <div
            key={item.service.id}
            className={`p-3.5 rounded-xl border transition-all ${
              isProductAlreadyHave
                ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                : depth > 0
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
                  {isProductAlreadyHave && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold">
                      ✓ Confirmed (You have this)
                    </Badge>
                  )}
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                {/* Option 1: I already have this */}
                <div
                  onClick={() => toggleConfirm(`product_${item.service.id}`)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer select-none ${
                    isProductAlreadyHave
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div
                    className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                      isProductAlreadyHave
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-400 bg-white'
                    }`}
                  >
                    {isProductAlreadyHave && <Check className="h-3 w-3 text-white stroke-[3]" />}
                  </div>
                  <span>I already have {item.service.title}</span>
                </div>

                {/* Option 2: Include in Order */}
                <Button
                  disabled={!allChildReqsConfirmed && !isIncludedInOrder}
                  onClick={() => {
                    if (isProductAlreadyHave) {
                      toggleConfirm(`product_${item.service.id}`);
                    }
                    handleToggleIncludeInOrder(item.service.id);
                  }}
                  size="sm"
                  className={`h-9 font-bold text-xs rounded-lg shrink-0 transition-all ${
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
            </div>

            {!isProductAlreadyHave && !allChildReqsConfirmed && !isIncludedInOrder && (
              <div className="mt-2 text.5 max-w-full text-[11px] font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/90 p-2 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <span className="text-sm">⚠️</span>
                Please confirm all prerequisites below to enable including this product in your order.
              </div>
            )}

            {/* Recursive Child Prerequisites (only if not already owned) */}
            {!isProductAlreadyHave && childRequirements.length > 0 && depth < 15 && (
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
                  confirmedIds={activeConfirmedIds}
                  onToggleConfirm={toggleConfirm}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

