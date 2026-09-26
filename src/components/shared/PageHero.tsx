'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Building, Landmark, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PageHeroProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  title: React.ReactNode;
  subtitle: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  ctaSubtext?: string;
  showCredibilityRibbon?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHero({
  badgeText,
  badgeIcon,
  title,
  subtitle,
  primaryCta = { text: 'Visit Our Online Store', href: '/products' },
  secondaryCta = { text: 'Book Free Consultation', href: '/contact' },
  ctaSubtext = 'Explore 100+ accounting & tax services with transparent fixed prices and clear completion times in our online store.',
  showCredibilityRibbon = true,
  children,
  className = '',
}: PageHeroProps) {
  return (
    <section className={`relative w-full overflow-hidden bg-background pt-16 lg:pt-24 pb-20 text-center ${className}`}>
      {/* Aurora background blobs */}
      <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
      <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
      <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
      
      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid" />

      <div className="container relative z-10 mx-auto px-4 max-w-4xl">
        {badgeText && (
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-md glass neon-border text-xs font-semibold text-primary uppercase tracking-widest">
            {badgeIcon || <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />}
            {badgeText}
          </div>
        )}

        <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl xl:text-7xl font-headline leading-tight text-hero-gradient pb-2">
          {title}
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        {(primaryCta || secondaryCta || children) && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center items-center">
              {primaryCta && (
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300">
                  <Link href={primaryCta.href}>{primaryCta.text}</Link>
                </Button>
              )}
              {secondaryCta && (
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-bold shadow-xl border-white/10 hover:bg-white/5 transition-all duration-300">
                  <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
                </Button>
              )}
              {children}
            </div>

            {ctaSubtext && (
              <p className="text-xs sm:text-sm font-semibold text-primary/90 flex items-center justify-center gap-1.5 pt-1.5 max-w-xl mx-auto">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                <span>{ctaSubtext}</span>
              </p>
            )}
          </div>
        )}

        {showCredibilityRibbon && (
          <div className="mt-16 border-t border-white/[0.06] pt-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
              Accredited Professional Memberships &amp; Regulatory Compliance
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 hover:opacity-90 transition-opacity duration-300">
              {/* CIBA Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Building className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">CIBA Member</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Biz Accountant</span>
                </div>
              </div>
              {/* SAIT Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Landmark className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SAIT Member</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioner</span>
                </div>
              </div>
              {/* SAICA Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SAICA Affiliate</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Chartered Accounting</span>
                </div>
              </div>
              {/* SARS Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500">
                  S
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SARS Registered</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioners</span>
                </div>
              </div>
              {/* CIPC Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Building className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">CIPC Agent</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Company Registry</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
