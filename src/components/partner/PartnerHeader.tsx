'use client';

import Link from 'next/link';
import { LogIn, Menu, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';
import Image from 'next/image';
import { useState } from 'react';

export default function PartnerHeader({ partner }: { partner: User }) {
  const lp = partner.landingPage;
  const logoHeight = lp?.logoHeight || 40;
  const showLogo = lp?.showLogo !== false;
  const hideBranding = lp?.hideHeaderBranding === true;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ctaTarget = lp?.showCalculator ? '#calculator' : '#contact';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md shadow-sm h-16 flex items-center">
      <div className="container mx-auto flex items-center justify-between px-4">
        {!hideBranding ? (
          <Link href={`/p/${lp?.slug}`} className="flex items-center gap-3">
            {showLogo && lp?.logoUrl ? (
              <div 
                  className="relative" 
                  style={{ 
                      height: `${logoHeight}px`,
                      width: `${logoHeight * 3}px`
                  }}
              >
                <Image 
                  src={lp.logoUrl} 
                  alt={partner.companyName || partner.name} 
                  fill 
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <span className="text-xl font-bold" style={{ color: lp?.primaryColor || 'inherit' }}>
                {partner.companyName || partner.name}
              </span>
            )}
          </Link>
        ) : (
          <div /> // Spacer if branding is hidden
        )}

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/p/${lp?.slug}#about`}>About Us</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/p/${lp?.slug}#products`}>Services</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href="/login">
              <LogIn className="mr-1.5 h-3.5 w-3.5" /> Portal
            </Link>
          </Button>
          <Button asChild className="partner-btn font-semibold ml-1">
            <Link href={`/p/${lp?.slug}${ctaTarget}`}>
              <MessageSquare className="mr-2 h-4 w-4" /> Get a Free Quote
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="sm:hidden flex items-center gap-2">
          <Button asChild size="sm" className="partner-btn font-semibold text-xs h-8 px-3">
            <Link href={`/p/${lp?.slug}${ctaTarget}`}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Free Quote
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href={`/p/${lp?.slug}#about`}
              className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href={`/p/${lp?.slug}#products`}
              className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            {lp?.showCalculator && (
              <Link
                href={`/p/${lp?.slug}#calculator`}
                className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fee Calculator
              </Link>
            )}
            <Link
              href={`/p/${lp?.slug}#faqs`}
              className="block py-2.5 px-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQs
            </Link>
            <div className="pt-2 border-t">
              <Link
                href="/login"
                className="block py-2.5 px-3 text-sm text-muted-foreground font-medium rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="inline mr-2 h-3.5 w-3.5" /> Client Portal Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
