'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFirestore, collection, query, where, getDocs, setDoc, doc, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Link as LinkIcon, PlusCircle, CheckCircle, Loader2, ShoppingBag, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { customAlphabet } from 'nanoid';
import { useAuth } from '@/contexts/AuthContext';

const db = getFirestore(firebaseApp);
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

interface OrderPrerequisiteRequirementsCardProps {
  order: Order;
  allServices: Service[];
  baseRoute?: '/admin/orders' | '/partner/orders';
  onOrderUpdated?: () => void;
}

interface MissingPrerequisite {
  parentServiceTitle: string;
  prereqService: Service;
}

export default function OrderPrerequisiteRequirementsCard({
  order,
  allServices,
  baseRoute = '/admin/orders',
  onOrderUpdated,
}: OrderPrerequisiteRequirementsCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingPrereqId, setCreatingPrereqId] = useState<string | null>(null);
  const [missingPrereqs, setMissingPrereqs] = useState<MissingPrerequisite[]>([]);
  const [linkedChildOrders, setLinkedChildOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function checkPrerequisites() {
      if (!order) return;
      setLoading(true);

      try {
        // 1. Fetch customer's existing orders to check if they already bought the prerequisite
        const customerEmail = order.customerEmail || order.endCustomerEmail;
        let customerOrders: Order[] = [];

        if (customerEmail) {
          const q = query(collection(db, 'orders'), where('customerEmail', '==', customerEmail));
          const snap = await getDocs(q);
          customerOrders = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Order));
        }

        // 2. Fetch child orders linked directly to this order
        const childQ = query(collection(db, 'orders'), where('originalOrderId', '==', order.id));
        const childSnap = await getDocs(childQ);
        const childOrders = childSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Order));

        if (isMounted) {
          setLinkedChildOrders(childOrders);
        }

        // Combine all relevant customer service IDs
        const existingServiceIds = new Set<string>();
        customerOrders.forEach((o) => {
          if (o.status !== 'Cancelled') {
            o.items?.forEach((item) => {
              if (item.serviceId) existingServiceIds.add(item.serviceId);
              if (item.id) existingServiceIds.add(item.id);
            });
          }
        });

        // 3. Find missing prerequisites for items in the current order
        const missing: MissingPrerequisite[] = [];

        order.items?.forEach((item) => {
          const serviceId = item.serviceId || item.id;
          const serviceObj = allServices.find(
            (s) => s.id === serviceId || s.title.toLowerCase() === item.title?.toLowerCase()
          );

          if (serviceObj?.requiredProductIds && serviceObj.requiredProductIds.length > 0) {
            serviceObj.requiredProductIds.forEach((reqId) => {
              const prereqService = allServices.find((s) => s.id === reqId);
              if (prereqService) {
                // Check if already ordered by customer or created as child order
                const hasOrdered = existingServiceIds.has(prereqService.id);
                const hasChildOrder = childOrders.some((co) =>
                  co.items?.some((i) => i.serviceId === prereqService.id || i.id === prereqService.id)
                );

                if (!hasOrdered && !hasChildOrder) {
                  // Prevent duplicate entries
                  if (!missing.some((m) => m.prereqService.id === prereqService.id)) {
                    missing.push({
                      parentServiceTitle: item.title,
                      prereqService,
                    });
                  }
                }
              }
            });
          }
        });

        if (isMounted) {
          setMissingPrereqs(missing);
        }
      } catch (err) {
        console.error('Error checking prerequisites:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkPrerequisites();

    return () => {
      isMounted = false;
    };
  }, [order, allServices]);

  const handleCreatePrerequisiteOrder = async (prereq: MissingPrerequisite) => {
    setCreatingPrereqId(prereq.prereqService.id);
    const newOrderId = `ORD-${nanoid()}`;

    try {
      const price = prereq.prereqService.price || 0;
      const newOrderData: Partial<Order> = {
        id: newOrderId,
        userId: order.userId || null,
        resellerId: order.resellerId || undefined,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone || '',
        endCustomerName: order.endCustomerName || '',
        endCustomerEmail: order.endCustomerEmail || '',
        date: Timestamp.now(),
        items: [
          {
            id: prereq.prereqService.id,
            serviceId: prereq.prereqService.id,
            title: prereq.prereqService.title,
            quantity: 1,
            price: price,
            unitPrice: price,
            total: price,
            description: prereq.prereqService.description || '',
          },
        ],
        total: price,
        clientTotal: price,
        status: 'Pending Payment',
        originalOrderId: order.id,
        source: baseRoute === '/partner/orders' ? 'Partner' : 'Staff',
        department: prereq.prereqService.department || 'Administration',
        notes: [
          {
            text: `Automatically created as required prerequisite for Order #${order.id} (${prereq.parentServiceTitle})`,
            date: new Date().toISOString(),
            authorId: user?.uid || 'system',
            isInternal: true,
            subject: 'Prerequisite Order Created',
            attachments: null,
          },
        ],
      };

      await setDoc(doc(db, 'orders', newOrderId), newOrderData);

      toast({
        title: 'Prerequisite Order Created',
        description: `Order #${newOrderId} for "${prereq.prereqService.title}" created & linked.`,
      });

      // Remove from missing list and update linked list
      setMissingPrereqs((prev) => prev.filter((m) => m.prereqService.id !== prereq.prereqService.id));
      setLinkedChildOrders((prev) => [...prev, newOrderData as Order]);

      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      console.error('Error creating prerequisite order:', err);
      toast({
        title: 'Failed to Create Order',
        description: err.message || 'Could not create prerequisite order.',
        variant: 'destructive',
      });
    } finally {
      setCreatingPrereqId(null);
    }
  };

  if (loading) return null;

  const hasOriginalLink = !!order.originalOrderId;
  const hasChildLinks = linkedChildOrders.length > 0;
  const hasMissingPrereqs = missingPrereqs.length > 0;

  if (!hasOriginalLink && !hasChildLinks && !hasMissingPrereqs) {
    return null;
  }

  return (
    <div className="space-y-4 my-6">
      {/* 1. Original Parent Order Link Banner */}
      {hasOriginalLink && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 font-medium text-sm">
            <LinkIcon className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Linked Prerequisite Order:</span> This order was created as a required prerequisite for Original Order{' '}
              <strong className="text-blue-950">#{order.originalOrderId}</strong>.
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-800 hover:bg-blue-100 font-bold shrink-0">
            <Link href={`${baseRoute}/${order.originalOrderId}`}>
              View Original Order #{order.originalOrderId} →
            </Link>
          </Button>
        </div>
      )}

      {/* 2. Linked Child Prerequisite Orders List */}
      {hasChildLinks && (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4 border-b border-emerald-100 bg-emerald-100/40">
            <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Linked Prerequisite Orders Created ({linkedChildOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {linkedChildOrders.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-emerald-100 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Order #{child.id}</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      {child.status}
                    </Badge>
                  </div>
                  <div className="text-slate-500">
                    {child.items?.map((i) => i.title).join(', ')} — R{child.total?.toFixed(2)}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-8 text-emerald-700 hover:text-emerald-900 font-bold">
                  <Link href={`${baseRoute}/${child.id}`} className="flex items-center gap-1">
                    Open Order
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 3. Missing Required Prerequisites Banner & Action */}
      {hasMissingPrereqs && (
        <Card className="border-amber-300 bg-amber-50/60 shadow-sm rounded-xl">
          <CardHeader className="py-3 px-4 border-b border-amber-200/80 bg-amber-100/50">
            <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Missing Service Prerequisites Identified ({missingPrereqs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-amber-900 leading-relaxed">
              The client does not have an active or completed order for the required prerequisite service(s) below. You can order the missing requirement directly for this client:
            </p>
            <div className="space-y-2">
              {missingPrereqs.map((mp) => (
                <div
                  key={mp.prereqService.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-white border border-amber-200 text-xs shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      <span>{mp.prereqService.title}</span>
                      <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                        Required for {mp.parentServiceTitle}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{mp.prereqService.description}</p>
                    <div className="font-bold text-slate-900">
                      R{mp.prereqService.price?.toFixed(2)} ZAR
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreatePrerequisiteOrder(mp)}
                    disabled={creatingPrereqId === mp.prereqService.id}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-3 rounded-lg shrink-0 w-full sm:w-auto"
                  >
                    {creatingPrereqId === mp.prereqService.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        Order Required Product Direct
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
