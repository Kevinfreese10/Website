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
import { Loader2, Send } from 'lucide-react';

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
    <Card className="max-w-md mx-auto border shadow-lg partner-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-center">Contact Our Practice</CardTitle>
        <CardDescription className="text-center">
          Have questions or want to discuss a custom service? Send us a message directly.
        </CardDescription>
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
            <Button type="submit" disabled={isSubmitting} className="w-full h-11 partner-btn font-semibold mt-2">
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
