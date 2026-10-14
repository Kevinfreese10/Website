'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Plus,
  Trash,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, Service } from '@/lib/types';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { getNextOrderId } from '@/lib/sequence';
import Link from 'next/link';
import { submitPayFastPayment } from '@/lib/payfast-client';
import { getPartnerServicePrice } from '@/lib/partner-pricing';
import { Badge } from '@/components/ui/badge';

const db = getFirestore(firebaseApp);

const lineItemSchema = z.object({
  serviceId: z.string().min(1, 'Please select a service.'),
  description: z.string().min(1, 'Description is required.'),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().min(1, 'Quantity must be at least 1.')
  ),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, 'Price cannot be negative.')
  ),
  retailPrice: z.preprocess(
    (val) => Number(val),
    z.number().min(0).optional()
  ),
});

const formSchema = z.object({
  clientReference: z
    .string()
    .min(2, 'Please enter the client name or reference this order is for.'),
  agreeRefundPolicy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the refund policy.',
  }),
  confirmRequirements: z.boolean().refine((val) => val === true, {
    message:
      'You must confirm that you have gathered all necessary document requirements.',
  }),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
});

type CreatePartnerOrderFormValues = z.infer<typeof formSchema>;

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export default function CreatePartnerOrderForm({
  onOrderCreated,
}: {
  onOrderCreated?: () => void;
}) {
  const { user: partner } = useAuth();
  const { tier, tierPlan, discountPercent } = usePartner();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [retailTotal, setRetailTotal] = useState(0);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  const partnerId =
    partner?.role === 'partner' ? partner.uid : partner?.partnerId;

  useEffect(() => {
    const fetchServices = async () => {
      setIsServicesLoading(true);
      try {
        const q = query(collection(db, 'services'), orderBy('title'));
        const querySnapshot = await getDocs(q);
        const fetchedServices = querySnapshot.docs.map(
          (d) => ({ ...d.data(), id: d.id } as Service)
        );
        setAllServices(fetchedServices);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  const form = useForm<CreatePartnerOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientReference: '',
      agreeRefundPolicy: false,
      confirmRequirements: false,
      items: [
        {
          serviceId: '',
          description: '',
          quantity: 1,
          price: 0,
          retailPrice: 0,
        },
      ],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    const subscription = form.watch((value) => {
      const items = value.items || [];
      const wholesaleSum = items.reduce(
        (acc, item) => acc + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
        0
      );
      const retailSum = items.reduce(
        (acc, item) => acc + (Number(item?.retailPrice) || 0) * (Number(item?.quantity) || 0),
        0
      );
      setTotal(wholesaleSum);
      setRetailTotal(retailSum);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleServiceChange = (serviceId: string, index: number) => {
    const selectedService = allServices.find((s) => s.id === serviceId);
    if (selectedService) {
      const wholesalePrice = getPartnerServicePrice(selectedService, tier);
      form.setValue(`items.${index}.description`, selectedService.title);
      form.setValue(`items.${index}.price`, wholesalePrice);
      form.setValue(`items.${index}.retailPrice`, selectedService.price);
      form.trigger(`items.${index}`);
    }
  };

  async function onSubmit(values: CreatePartnerOrderFormValues) {
    if (!partner || !partnerId) return;

    setIsLoading(true);
    toast({
      title: 'Creating Practice Order...',
      description: 'Preparing your wholesale checkout.',
    });

    try {
      const orderId = await getNextOrderId();
      const practiceName = partner.companyName || partner.name;
      const clientRef = values.clientReference.trim();

      const wholesaleTotal = values.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const clientRetailTotal = values.items.reduce(
        (acc, item) => acc + (item.retailPrice || item.price) * item.quantity,
        0
      );

      const orderData: Order = {
        id: orderId,
        resellerId: partnerId,
        partnerId: partnerId,
        userId: partnerId,
        customerName: practiceName,
        customerEmail: partner.email,
        customerPhone: partner.contactNumber,
        endCustomerName: clientRef,
        documentContact: 'partner',
        date: Timestamp.now(),
        items: values.items.map((item) => ({
          id: item.serviceId,
          serviceId: item.serviceId,
          title: item.description,
          price: item.price,
          clientPrice: item.retailPrice || item.price,
          quantity: item.quantity,
        })),
        total: wholesaleTotal,
        clientTotal: clientRetailTotal,
        status: 'Pending Payment',
        originalOrderId: null,
        isOutsourced: true,
        discountAmount: Math.max(0, clientRetailTotal - wholesaleTotal),
        discountCode: `${tierPlan.name.toUpperCase()}-${discountPercent}%`,
        source: 'Partner',
      };

      await setDoc(doc(db, 'orders', orderId), orderData);

      if (onOrderCreated) {
        onOrderCreated();
      }

      toast({
        title: 'Redirecting to PayFast...',
        description: 'Initiating wholesale payment.',
      });

      const res = await submitPayFastPayment({
        orderId,
        amount: wholesaleTotal,
        itemName: `Partner Order #${orderId} (${clientRef})`,
        itemDescription: orderData.items.map((i) => i.title).join(', '),
        customerName: practiceName || 'Partner User',
        customerEmail: partner.email,
        customerPhone: partner.contactNumber || '',
        returnPath: `/payment-success/${orderId}`,
        cancelPath: `/partner/orders`,
      });

      if (!res.success) {
        toast({
          title: 'Payment Gateway Error',
          description: res.error || 'Could not redirect to PayFast.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Error creating partner order: ', error);
      toast({
        title: 'Operation Failed',
        description:
          error.message || 'There was a problem processing your request.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-4"
      >
        <div className="p-4 bg-slate-50 rounded-xl border text-sm text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Back-Office Wholesale Order
            </p>
            <Badge variant="default" className="font-bold">
              {tierPlan.name} Tier ({discountPercent}% Off)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This order is booked under your practice account (
            <strong>{partner?.companyName || partner?.name}</strong>). All status updates, document requests, and deliverables are sent strictly to{' '}
            <strong>{partner?.email}</strong> — we never contact your client directly.
          </p>
        </div>

        <FormField
          control={form.control}
          name="clientReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 font-semibold">
                <Building2 className="h-4 w-4 text-primary" />
                Client Name / Reference (For Your Tracking)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Acme Trading (Pty) Ltd — 2024/123456/07"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Enter the name of the client or entity this service is being fulfilled for so you and our back-office team can identify the order.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div>
          <h3 className="text-base font-semibold mb-3">Select Services</h3>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const lineItem = form.watch(`items.${index}`);
              const lineTotal =
                (Number(lineItem?.price) || 0) * (Number(lineItem?.quantity) || 1);
              const lineRetail =
                (Number(lineItem?.retailPrice) || 0) *
                (Number(lineItem?.quantity) || 1);

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-lg items-start bg-background"
                >
                  <div className="md:col-span-7">
                    <FormField
                      control={form.control}
                      name={`items.${index}.serviceId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Service</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleServiceChange(value, index);
                            }}
                            value={field.value}
                            disabled={isServicesLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isServicesLoading
                                      ? 'Loading services...'
                                      : 'Select a service'
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {allServices
                                .filter((s) => s.price > 0 && !s.isPriceTbc)
                                .map((service) => {
                                  const partnerPrice = getPartnerServicePrice(
                                    service,
                                    tier
                                  );
                                  return (
                                    <SelectItem key={service.id} value={service.id}>
                                      {service.title} — {formatPrice(partnerPrice)} (Retail:{' '}
                                      {formatPrice(service.price)})
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Qty</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-3 flex items-center justify-end gap-2 pt-6">
                    <div className="text-right">
                      {lineRetail > lineTotal && (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {formatPrice(lineRetail)}
                        </p>
                      )}
                      <p className="font-bold text-sm text-slate-900">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                    <Button
                      aria-label="Delete"
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="h-8 w-8 text-destructive shrink-0"
                      disabled={fields.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              append({
                serviceId: '',
                description: '',
                quantity: 1,
                price: 0,
                retailPrice: 0,
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" /> Add Another Service
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>
              Standard Retail Value:{' '}
              <span className="font-semibold text-foreground">
                {formatPrice(retailTotal)}
              </span>
            </div>
            <div className="text-emerald-600 font-semibold">
              Your Practice Savings ({discountPercent}% Off):{' '}
              {formatPrice(Math.max(0, retailTotal - total))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Wholesale Total Due ({tierPlan.name} Tier)
            </p>
            <p className="text-2xl font-extrabold text-primary">
              {formatPrice(total)}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <FormField
            control={form.control}
            name="agreeRefundPolicy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer text-xs font-medium text-slate-700">
                    I understand and agree to the{' '}
                    <Link
                      href="/refund-policy"
                      target="_blank"
                      className="underline font-bold text-primary"
                    >
                      Refund Policy
                    </Link>
                    .
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmRequirements"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer text-xs font-medium text-slate-700">
                    I confirm that I have gathered all necessary document requirements for the selected service(s).
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full font-bold"
          size="lg"
          disabled={isLoading || !form.formState.isValid || total === 0}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? 'Redirecting to PayFast...'
            : `Proceed to PayFast Checkout (${formatPrice(total)})`}
        </Button>
      </form>
    </Form>
  );
}
