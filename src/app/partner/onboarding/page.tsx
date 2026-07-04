'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, updateDoc, writeBatch, Timestamp, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { services as baseServices } from '@/lib/data';
import { CheckCircle2, Sparkles, Banknote, Building, Briefcase, Loader2, ArrowRight, Paintbrush, ChevronRight, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { getNextOrderId } from '@/lib/sequence';
import { useRouter } from 'next/navigation';
import { Order } from '@/lib/types';

const db = getFirestore(firebaseApp);

const themePresets = [
  { id: 'custom', name: 'Custom Theme', primaryColor: '#214392', hoverColor: '#1a3575' },
  { id: 'my_accountant', name: 'Master Theme', primaryColor: '#0866FF', hoverColor: '#0054d1' },
  { id: 'tech_blue', name: 'Light Blue', primaryColor: '#0072b2', hoverColor: '#005a8d' },
  { id: 'futuristic', name: 'Dark Theme', primaryColor: '#1e2229', hoverColor: '#12151a' },
  { id: 'facebook', name: 'Facebook', primaryColor: '#0866FF', hoverColor: '#0054d1' },
  { id: 'lovable', name: 'Lovable', primaryColor: '#9b87f5', hoverColor: '#7E69AB' },
  { id: 'monday', name: 'Monday.com', primaryColor: '#e2445c', hoverColor: '#c23b4f' },
  { id: 'monday_crm', name: 'Monday CRM', primaryColor: '#784bd1', hoverColor: '#633ead' },
  { id: 'stripe', name: 'Stripe', primaryColor: '#635bff', hoverColor: '#524bcf' },
  { id: 'airbnb', name: 'Airbnb', primaryColor: '#FF385C', hoverColor: '#d90b36' },
  { id: 'linear', name: 'Linear', primaryColor: '#5e6ad2', hoverColor: '#4c56aa' },
  { id: 'spotify', name: 'Spotify', primaryColor: '#1DB954', hoverColor: '#189a46' },
  { id: 'notion', name: 'Notion', primaryColor: '#000000', hoverColor: '#333333' },
  { id: 'apple', name: 'Apple', primaryColor: '#0071e3', hoverColor: '#005bb5' },
];

export default function PartnerOnboardingPage() {
  const { user, updateUser } = useAuth();
  const { isGrowthActive } = usePartner();
  const { toast } = useToast();
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingDFY, setIsProcessingDFY] = useState(false);
  const [globalMarkup, setGlobalMarkup] = useState('20');

  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountType, setAccountType] = useState('Current');

  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('custom');

  useEffect(() => {
    if (user) {
      setBankName(user.bankingDetails?.bankName || '');
      setAccountHolder(user.bankingDetails?.accountHolder || user.companyName || user.name);
      setAccountNumber(user.bankingDetails?.accountNumber || '');
      setBranchCode(user.bankingDetails?.branchCode || '');
      setAccountType((user.bankingDetails as any)?.accountType || 'Current');

      setHeroSubheadline(user.landingPage?.heroSubtitle || 'Professional Accounting & Tax Solutions for Small Businesses');
      setAboutUs(user.landingPage?.aboutUs || '');
      setSelectedTheme(user.landingPage?.themePreset || 'custom');
    }
  }, [user]);

  if (!isGrowthActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
        <Settings className="h-16 w-16 text-muted-foreground animate-spin" />
        <h2 className="text-2xl font-bold">Onboarding is a Premium Feature</h2>
        <p className="text-muted-foreground max-w-md">
          Upgrade to the Growth tier to configure your white-label practice landing page, custom pricing, and banking credentials.
        </p>
        <Button asChild>
          <Link href="/become-a-partner">Upgrade Plan</Link>
        </Button>
      </div>
    );
  }

  const handleSaveBanking = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        bankingDetails: {
          bankName,
          accountHolder,
          accountNumber,
          branchCode,
          accountType,
        } as any
      });
      updateUser({
        ...user,
        bankingDetails: {
          bankName,
          accountHolder,
          accountNumber,
          branchCode,
          accountType,
        } as any
      });
      toast({ title: 'Banking Details Saved', description: 'Your EFT information is configured.' });
      setActiveStep(2);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save banking details.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLanding = async () => {
    if (!user) return;
    setIsSaving(true);
    const theme = themePresets.find(t => t.id === selectedTheme) || themePresets[0];
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        landingPage: {
          themePreset: selectedTheme as any,
          primaryColor: theme.primaryColor,
          hoverColor: theme.hoverColor,
          heroTitle: user.landingPage?.heroTitle || user.companyName || 'Welcome to Our Practice',
          heroSubtitle: heroSubheadline,
          aboutUs,
          enabled: true,
          slug: user.landingPage?.slug || '',
        } as any
      });
      updateUser({
        ...user,
        landingPage: {
          themePreset: selectedTheme as any,
          primaryColor: theme.primaryColor,
          hoverColor: theme.hoverColor,
          heroTitle: user.landingPage?.heroTitle || user.companyName || 'Welcome to Our Practice',
          heroSubtitle: heroSubheadline,
          aboutUs,
          enabled: true,
          slug: user.landingPage?.slug || '',
        } as any
      });
      toast({ title: 'Branding Saved', description: 'Your landing page customization is updated.' });
      setActiveStep(3);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to update website branding.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyMarkup = async () => {
    if (!user) return;
    const markupMultiplier = 1 + parseFloat(globalMarkup) / 100;
    if (isNaN(markupMultiplier) || markupMultiplier < 1) {
      toast({ title: 'Invalid Markup', description: 'Please enter a valid positive markup percentage.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    toast({ title: 'Calculating Markups...', description: 'Updating override prices for all services.' });

    try {
      const batch = writeBatch(db);
      baseServices.forEach(service => {
        const markedPrice = Math.round(service.price * markupMultiplier);
        
        const newValues = {
          price: markedPrice,
          title: service.title,
          description: service.description,
          longDescription: service.longDescription,
          turnaroundTime: service.turnaroundTime,
          whatsIncluded: service.whatsIncluded || [],
          clientRequirements: service.clientRequirements || [],
        };

        const overrideRef = doc(db, 'users', user.uid, 'serviceOverrides', service.id);
        batch.set(overrideRef, newValues, { merge: true });
      });

      await batch.commit();
      toast({ title: 'Pricing Configured', description: 'Successfully applied a ' + globalMarkup + '% markup to all services.' });
      setActiveStep(4);
    } catch (e) {
      console.error(e);
      toast({ title: 'Markup Failed', description: 'Could not apply bulk markup.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuyDFY = async () => {
    if (!user) return;
    setIsProcessingDFY(true);
    try {
      const orderId = await getNextOrderId();
      const dfyOrder: Order = {
        id: orderId,
        userId: user.uid,
        customerName: user.companyName || user.name,
        customerEmail: user.email,
        items: [{
          id: 'partner_dfy_setup',
          title: 'Done-For-You Practice Setup',
          price: 1950,
          quantity: 1,
        }],
        total: 1950,
        discountCode: null,
        discountAmount: null,
        status: 'Pending Payment',
        date: Timestamp.now(),
        source: 'Partner',
        resellerId: user.uid,
        originalOrderId: null,
      };
      
      await setDoc(doc(db, 'orders', orderId), dfyOrder);

      const payfastUrl = process.env.NEXT_PUBLIC_PAYFAST_PROCESS_URL || 'https://www.payfast.co.za/eng/process';
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payfastUrl;

      const data = {
        merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '23836312',
        merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || 'h4fkhz6ouoksx',
        return_url: process.env.NEXT_PUBLIC_APP_URL + '/partner/onboarding?dfy_success=true',
        cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/partner/onboarding',
        notify_url: process.env.NEXT_PUBLIC_APP_URL + '/api/payfast/notify',
        name_first: user.name.split(' ')[0],
        name_last: user.name.split(' ').slice(1).join(' '),
        email_address: user.email,
        m_payment_id: orderId,
        amount: '1950.00',
        item_name: 'Done-For-You Onboarding Setup',
      };

      for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = (data as any)[key];
        form.appendChild(input);
      }
      
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not initialize Done-For-You order.', variant: 'destructive' });
      setIsProcessingDFY(false);
    }
  };

  const stepsList = [
    { label: 'Setup Model', icon: Sparkles },
    { label: 'Banking EFT', icon: Banknote },
    { label: 'Website Customization', icon: Paintbrush },
    { label: 'Markup & Pricing', icon: Briefcase },
    { label: 'Launch Profile', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Practice Setup Wizard</h1>
        <p className="text-muted-foreground">Follow these simple steps to customize and launch your accounting practice.</p>
        <Progress value={((activeStep + 1) / stepsList.length) * 100} className="h-2 mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {stepsList.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activeStep;
            const isActive = idx === activeStep;

            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={'w-full flex items-center gap-3 p-3 rounded-lg border text-left text-xs font-bold transition-all ' + (
                  isActive 
                    ? 'bg-primary border-primary text-white shadow-md' 
                    : isCompleted 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{step.label}</span>
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="md:col-span-3">
          {activeStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Choose Your Onboarding Model</CardTitle>
                <CardDescription>Configure your practice portal with help from our Chartered Accountants or self-service.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(user as any)?.setupAddon ? (
                  <div className="p-6 border-2 border-primary/20 bg-primary/5 rounded-xl text-center space-y-4">
                    <ShieldCheck className="h-12 w-12 text-primary mx-auto" />
                    <h3 className="text-lg font-bold">Done-For-You Setup Active</h3>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                      Our CA-led team is currently designing your white-label practice, configuring your pricing markups, and formatting your public website. We will contact you shortly to schedule your walkthrough training session.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-6 border-2 border-primary/25 bg-primary/5 rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="inline-block bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Recommended</div>
                        <h4 className="font-bold text-lg text-slate-900">Done-For-You Setup</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Let our Chartered Accountants handle the heavy lifting. We will write custom copy, design your theme branding, map markup rates, and guide you in a 1-on-1 walk-through.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="text-xl font-extrabold text-slate-900">R1,950 <span className="text-xs font-normal text-muted-foreground">once-off</span></div>
                        <Button onClick={handleBuyDFY} disabled={isProcessingDFY} className="w-full font-bold">
                          {isProcessingDFY ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                          Add Done-For-You Setup
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 border rounded-xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="inline-block bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Standard</div>
                        <h4 className="font-bold text-lg text-slate-900">Self-Service Setup</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Complete our wizard steps yourself. Set your bank details, adjust colors, and input pricing markups manually using the dashboard.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setActiveStep(1)} className="w-full font-bold">
                        Proceed Manually <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Banking & EFT Details</CardTitle>
                <CardDescription>Used to instruct clients where to send payment for service invoices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. FNB, Standard Bank" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Account Holder Name</Label>
                    <Input id="accountHolder" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">Branch Code</Label>
                    <Input id="branchCode" value={branchCode} onChange={e => setBranchCode(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Account Type</Label>
                    <div className="flex gap-4 mt-2">
                      {['Current', 'Savings'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="accountType"
                            value={type}
                            checked={accountType === type}
                            onChange={() => setAccountType(type)}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="ghost" onClick={() => setActiveStep(0)}>Back</Button>
                <Button onClick={handleSaveBanking} disabled={isSaving} className="font-bold">
                  {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Save & Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Branding & White-Label Details</CardTitle>
                <CardDescription>Configure the style presets and core page texts for your custom practice landing page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme Presets</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {themePresets.map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme.id)}
                        className={'p-3 border-2 rounded-lg text-center font-bold text-xs flex flex-col items-center gap-2 transition-all ' + (
                          selectedTheme === theme.id 
                            ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <div className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                        <span className="truncate">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subheadline">Hero Sub-headline</Label>
                  <Input 
                    id="subheadline" 
                    value={heroSubheadline} 
                    onChange={e => setHeroSubheadline(e.target.value)} 
                    placeholder="Brief description of your values/strengths"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">About Us Description</Label>
                  <Textarea 
                    id="about" 
                    value={aboutUs} 
                    onChange={e => setAboutUs(e.target.value)} 
                    rows={4}
                    placeholder="Tell your clients about your credentials, services, and commitment..."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="ghost" onClick={() => setActiveStep(1)}>Back</Button>
                <Button onClick={handleSaveLanding} disabled={isSaving} className="font-bold">
                  {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  Save & Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Service Pricing Overrides</CardTitle>
                <CardDescription>Setup pricing overrides for all your services with a global markup percentage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-slate-50/50 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">Set Global Markup Rate</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set a percentage to mark up your prices above the wholesale rate (the main store cost). This updates all your services in one click, but you can still tweak them manually later in the Services tab.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative max-w-[150px]">
                      <Input 
                        type="number" 
                        value={globalMarkup} 
                        onChange={e => setGlobalMarkup(e.target.value)} 
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-sm font-bold text-muted-foreground">%</span>
                    </div>
                    <Button onClick={handleApplyMarkup} disabled={isSaving} className="font-bold">
                      {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      Apply Markup to All
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Example Pricing Calculation</h4>
                  <div className="border rounded-lg p-3 grid grid-cols-3 gap-2 text-xs text-slate-700 font-medium">
                    <div>
                      <p className="text-muted-foreground">Wholesale Cost</p>
                      <p className="font-black text-slate-900 mt-1">R1,000</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Markup Rate</p>
                      <p className="font-black text-primary mt-1">+{globalMarkup}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Public Price</p>
                      <p className="font-black text-green-600 mt-1">
                        R{Math.round(1000 * (1 + parseFloat(globalMarkup) / 100))}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="ghost" onClick={() => setActiveStep(2)}>Back</Button>
                <Button onClick={() => setActiveStep(4)} className="font-bold">
                  Next Step <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeStep === 4 && (
            <Card className="text-center py-8 px-6">
              <CardHeader className="space-y-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto border-2 border-green-200">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl font-bold">Your Practice Profile is Ready!</CardTitle>
                <CardDescription className="max-w-md mx-auto leading-relaxed">
                  Congratulations! Your banking details, website branding customization, and pricing overrides are successfully set.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  Your clients can now view your public services, choose packages, and checkout on your white-label landing page. You are ready to start onboarding client companies.
                </p>
              </CardContent>
              <CardFooter className="justify-center border-t pt-6 gap-3">
                <Button variant="outline" onClick={() => setActiveStep(3)}>Back</Button>
                <Button asChild className="font-bold shadow-md">
                  <Link href="/partner/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
