import React from 'react';
import Link from 'next/link';
import { UserCheck, ArrowRight, PhoneCall, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SarsExpertCtaProps {
  title?: string;
  subtitle?: string;
}

export default function SarsExpertCta({
  title = "Need Expert Assistance? Let My Accountant Handle SARS For You",
  subtitle = "Avoid SARS penalties, audit complications, or endless waiting on hold. Our registered SAIT tax practitioners can resolve your query, submit outstanding returns, and represent you directly with SARS."
}: SarsExpertCtaProps) {
  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-xl my-12 overflow-hidden">
      <CardContent className="p-8 md:p-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-bold text-xs uppercase tracking-widest">
              <UserCheck className="h-4 w-4" /> Registered SARS Tax Practitioners
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4 text-xs md:text-sm font-semibold text-foreground/80 pt-2 justify-center md:justify-start">
              <span className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-emerald-500" /> Fast SARS Dispute & Debt Relief</span>
              <span className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-emerald-500" /> Verified TCS & Direct Power of Attorney</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 w-full md:w-auto shrink-0 justify-center">
            <Button asChild size="lg" className="h-13 px-8 text-base font-bold shadow-lg bg-gradient hover:opacity-90 text-white">
              <Link href="/contact" className="inline-flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Book Consultation
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 px-8 text-base font-bold border-primary/30 hover:bg-primary/10">
              <Link href="/products#sars-services" className="inline-flex items-center gap-2">
                View SARS Services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
