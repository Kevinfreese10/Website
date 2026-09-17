'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendPublicFormEmail } from '@/app/actions/email-gateway';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Loader2, Mail, Phone, MapPin, Clock, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  phone: z.string().min(10, 'A valid cell number is required.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export default function ContactPageClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const formRenderedAt = useRef(Date.now());
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  async function handleSubmit(values: z.infer<typeof contactFormSchema>) {
    setIsLoading(true);
    try {
      await sendPublicFormEmail({
        subject: `New Contact Form Submission from ${values.name}`,
        replyToEmail: values.email,
        html: `
          <p><strong>Name:</strong> ${values.name}</p>
          <p><strong>Email:</strong> ${values.email}</p>
          <p><strong>Cell Number:</strong> ${values.phone}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${values.message.replace(/\n/g, '<br>')}</p>
        `,
        website: honeypot,
        formRenderedAt: formRenderedAt.current,
      });
      toast({
        title: 'Message Sent!',
        description: "Thank you for contacting us. We'll get back to you shortly.",
      });
      form.reset();
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again later.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }

  const keywordButtons = [
    { label: 'Entity Registrations', href: '/products#entity-registrations' },
    { label: 'SARS Services', href: '/products#sars-services' },
    { label: 'CIPC Services', href: '/products#cipc-services' },
    { label: 'Accounting Services', href: '/products#accounting-services' },
    { label: 'Payroll Services', href: '/products#payroll-services' },
  ];

  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Contact Us | <span className="text-gradient">My Accountant</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto">
            Get in touch with our team of accounting and tax specialists. Fill out the form below or use our contact details to reach us.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {keywordButtons.map((btn) => (
              <Button key={btn.label} asChild variant="outline" className="h-9 md:h-11 px-4 md:px-6 rounded-full font-bold transition-all text-xs md:text-sm">
                <Link href={btn.href}>{btn.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Direct Contact & Business Hours Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-2 bg-slate-50/80 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-slate-900">Direct Contact & Hours</CardTitle>
                <CardDescription>We operate online nationwide across South Africa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Business Hours</h4>
                    <p className="text-slate-600 font-medium">Monday – Friday: 08:00 – 17:00 SAST</p>
                    <p className="text-slate-500 text-xs mt-0.5">Weekends & Public Holidays: Closed</p>
                    <p className="text-blue-700 font-semibold text-xs mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                      Guaranteed response within 24 business hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Telephone</h4>
                    <a href="tel:0101091625" className="text-slate-700 font-semibold hover:text-primary transition-colors">
                      010 109 1625
                    </a>
                    <p className="text-slate-500 text-xs mt-0.5">Direct line to our Johannesburg practice</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Email Inquiries</h4>
                    <a href="mailto:info@myacc.co.za" className="text-slate-700 font-semibold hover:text-primary transition-colors">
                      info@myacc.co.za
                    </a>
                    <p className="text-slate-500 text-xs mt-0.5">For general inquiries, quotes & document submissions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Head Office Location</h4>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195
                    </p>
                    <a
                      href="https://www.google.com/maps?q=My+Accountant,+Stonemill+Office+Park,+300+Acacia+Road,+Darrenwood,+Johannesburg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1.5"
                    >
                      View on Google Maps & Reviews <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Professional Practice Credentials
                    </div>
                    <p>• CIBA: Chartered Business Accountant (CIBA201509-5372)</p>
                    <p>• SAIT: General Tax Practitioner (SAIT 47011519)</p>
                    <p>• SARS Registered Tax Practitioner (PR-0098553)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <Card className="border-2 bg-slate-50 shadow-lg">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Have a question? We'll get back to you within 24 business hours.</CardDescription>
              </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">Leave this field blank</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} required className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} required className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cell Number</FormLabel>
                      <FormControl><Input type="tel" {...field} required className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl><Textarea {...field} required minLength={10} className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-bold shadow-md">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
}
