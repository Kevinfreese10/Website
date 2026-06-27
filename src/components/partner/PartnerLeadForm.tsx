'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { savePartnerLead } from '@/app/actions/partnerLeads';
import { Loader2, Send, ShieldCheck, Clock, Sparkles } from 'lucide-react';

const leadSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'A valid phone number is required (min 10 digits).'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export default function PartnerLeadForm({ partnerId }: { partnerId: string }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

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
          title: 'Inquiry Submitted!',
          description: "We've received your message and will get back to you shortly.",
        });
        form.reset();
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
        description: 'Failed to connect to the server. Please check your network and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto text-center p-6 border shadow-lg partner-card">
        <CardHeader className="space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <Sparkles className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold">Thank You!</CardTitle>
          <CardDescription>
            Your inquiry has been successfully sent. A representative from our practice will contact you soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button type="button" onClick={() => setSubmitted(false)} className="partner-btn font-semibold">
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto border shadow-xl partner-card overflow-hidden">
      <CardHeader className="pb-4 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center partner-text mb-1">
          <Send className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold">Get Your Free Consultation</CardTitle>
        <CardDescription className="text-sm">
          Have questions or want to discuss a custom service? Send us a message directly.
        </CardDescription>
        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 partner-icon" /> Free consultation
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 partner-icon" /> Response in 24hrs
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 partner-icon" /> No obligations
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Your Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="082 123 4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Briefly describe what accounting or compliance help you need..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 partner-btn font-bold mt-2 text-base">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit Inquiry
                </>
              )}
            </Button>
            {/* Trust footer */}
            <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> SSL Secured
              </span>
              <span>•</span>
              <span>Your data is private</span>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
