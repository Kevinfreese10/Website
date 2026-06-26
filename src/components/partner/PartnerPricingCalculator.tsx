'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { savePartnerLead } from '@/app/actions/partnerLeads';
import { CheckCircle2, Clock, Loader2, Mail, Phone, User, Send, Calculator, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const leadSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'A valid phone number is required (min 10 digits).'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export default function PartnerPricingCalculator({
  services,
  partnerId,
}: {
  services: Service[];
  partnerId: string;
}) {
  const { toast } = useToast();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Toggle selection
  const handleToggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const exists = prev.includes(id);
      let next: string[];
      if (exists) {
        next = prev.filter((item) => item !== id);
      } else {
        next = [...prev, id];
      }
      
      // Update form message with selected services
      updateFormMessage(next);
      return next;
    });
  };

  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  // Calculate totals
  const totals = useMemo(() => {
    let monthlyTotal = 0;
    let onceOffTotal = 0;
    let hasTbc = false;

    selectedServices.forEach((s) => {
      if (s.isPriceTbc) {
        hasTbc = true;
      } else {
        const isMonthly =
          s.turnaroundTime.toLowerCase().includes('monthly') ||
          s.turnaroundTime.toLowerCase().includes('ongoing') ||
          s.title.toLowerCase().includes('monthly');
        
        if (isMonthly) {
          monthlyTotal += s.price;
        } else {
          onceOffTotal += s.price;
        }
      }
    });

    return { monthlyTotal, onceOffTotal, hasTbc };
  }, [selectedServices]);

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: 'I am interested in requesting a quote. Please contact me.',
    },
  });

  const updateFormMessage = (ids: string[]) => {
    if (ids.length === 0) {
      form.setValue('message', 'I am interested in requesting a quote. Please contact me.');
      return;
    }
    const selected = services.filter((s) => ids.includes(s.id));
    const monthlyList = selected.filter(
      (s) =>
        !s.isPriceTbc &&
        (s.turnaroundTime.toLowerCase().includes('monthly') ||
          s.turnaroundTime.toLowerCase().includes('ongoing') ||
          s.title.toLowerCase().includes('monthly'))
    );
    const onceOffList = selected.filter(
      (s) =>
        s.isPriceTbc ||
        (!s.turnaroundTime.toLowerCase().includes('monthly') &&
          !s.turnaroundTime.toLowerCase().includes('ongoing') &&
          !s.title.toLowerCase().includes('monthly'))
    );

    let msg = `Hello, I would like to request a quote/consultation for the following services:\n\n`;
    
    if (monthlyList.length > 0) {
      msg += `--- Monthly Retainer Services ---\n`;
      monthlyList.forEach((s) => {
        msg += `- ${s.title} (${formatPrice(s.price)}/mo)\n`;
      });
      msg += `\n`;
    }

    if (onceOffList.length > 0) {
      msg += `--- One-off Setup & Project Services ---\n`;
      onceOffList.forEach((s) => {
        if (s.isPriceTbc) {
          msg += `- ${s.title} (Price on Request)\n`;
        } else {
          msg += `- ${s.title} (${formatPrice(s.price)})\n`;
        }
      });
      msg += `\n`;
    }

    const mTotal = monthlyList.reduce((acc, curr) => acc + curr.price, 0);
    const oTotal = onceOffList.reduce((acc, curr) => acc + (acc = curr.isPriceTbc ? 0 : curr.price), 0);
    const hasTbc = onceOffList.some((s) => s.isPriceTbc);

    msg += `Estimated Monthly Retainer: ${formatPrice(mTotal)}\n`;
    msg += `Estimated Once-off Setup: ${formatPrice(oTotal)}${hasTbc ? ' + Price on Request items' : ''}\n\n`;
    msg += `Please get in touch with me to finalize my requirement.`;

    form.setValue('message', msg);
  };

  async function onSubmit(values: z.infer<typeof leadSchema>) {
    setIsSubmitting(true);
    try {
      const res = await savePartnerLead({
        partnerId,
        ...values,
      });

      if (res.success) {
        setSubmitted(true);
        toast({
          title: 'Quote Request Submitted!',
          description: "We've received your pricing estimation request and will follow up shortly.",
        });
        form.reset();
        setSelectedServiceIds([]);
      } else {
        toast({
          title: 'Submission Failed',
          description: res.error || 'There was a problem sending your message.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to the server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-xl mx-auto text-center p-8 border shadow-lg partner-card">
        <CardHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Quote Request Received</CardTitle>
          <CardDescription className="text-sm">
            Thank you for using our calculator. We have received your detailed estimate request and will review your selected services. An expert will reach out to you shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button type="button" onClick={() => setSubmitted(false)} className="partner-btn font-semibold px-6">
            Calculate Another Quote
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-lg overflow-hidden partner-card max-w-4xl mx-auto">
      <CardHeader className="bg-muted/15 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Accounting & Tax Calculator</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Select the compliance services your business requires to calculate your monthly or setup estimates.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-muted/60">
        
        {/* Services Checklist column */}
        <div className="p-6 md:col-span-7 space-y-4 max-h-[500px] overflow-y-auto">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Available Services</h3>
          <div className="space-y-3">
            {services.map((service) => {
              const isSelected = selectedServiceIds.includes(service.id);
              const isMonthly =
                service.turnaroundTime.toLowerCase().includes('monthly') ||
                service.turnaroundTime.toLowerCase().includes('ongoing') ||
                service.title.toLowerCase().includes('monthly');

              return (
                <div
                  key={service.id}
                  onClick={() => handleToggleService(service.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-start justify-between select-none ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
                      : 'border-muted/70 hover:border-primary/50 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1 pr-4 flex-grow">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <CheckCircle2 className="h-3 w-3 fill-current" />}
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 leading-tight">
                        {service.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80 pl-6 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {service.turnaroundTime}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                        {isMonthly ? 'Retainer' : 'Once-off'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 self-center">
                    {service.isPriceTbc ? (
                      <span className="text-xs font-bold text-muted-foreground block">TBC</span>
                    ) : (
                      <span className={`text-sm font-bold block ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                        {formatPrice(service.price)}
                        {isMonthly && <span className="text-[10px] font-normal text-muted-foreground">/mo</span>}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Capture and totals column */}
        <div className="p-6 md:col-span-5 bg-slate-50/40 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Pricing Estimate</h3>
            
            {selectedServices.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl bg-slate-100/30 text-muted-foreground flex flex-col items-center justify-center p-4">
                <AlertCircle className="h-8 w-8 opacity-40 mb-2" />
                <p className="text-xs font-bold">No Services Selected</p>
                <p className="text-[10px] opacity-80 mt-1 max-w-[200px]">
                  Choose items from the left to calculate your estimate and request a formal quote.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Breakdowns */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <span className="truncate max-w-[160px] opacity-90">{s.title}</span>
                      <span className="font-bold shrink-0">
                        {s.isPriceTbc ? 'Quote Req.' : formatPrice(s.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">Monthly Retainer:</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(totals.monthlyTotal)}<span className="text-xs font-normal">/mo</span></span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-800">Once-off Setup:</span>
                    <span className="text-md font-bold text-slate-700">{formatPrice(totals.onceOffTotal)}</span>
                  </div>
                  {totals.hasTbc && (
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Some selected services require customized quotes based on business scale.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="border-t pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                          <Input {...field} placeholder="Full Name" className="pl-9 h-8 text-xs bg-white" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input {...field} placeholder="Email" className="pl-9 h-8 text-xs bg-white" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input {...field} placeholder="Phone" className="pl-9 h-8 text-xs bg-white" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Hidden/Collapsed message description */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <Textarea {...field} className="text-[10px] p-2 leading-relaxed bg-white/60 resize-none h-16" placeholder="Message details..." />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting || selectedServices.length === 0}
                  className="w-full partner-btn h-9 font-semibold text-xs gap-1.5 mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Submit Estimate Request
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

        </div>

      </CardContent>
    </Card>
  );
}
