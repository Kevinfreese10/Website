'use client';

import { User } from "@/lib/types";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PartnerFooter({ partner }: { partner: User }) {
  const primaryColor = partner.landingPage?.primaryColor || '#214392';
  const lp = partner.landingPage;
  const ctaTarget = lp?.showCalculator ? '#calculator' : '#contact';

  return (
    <footer className="border-t">
      {/* CTA Strip */}
      <div 
        className="py-14 text-center"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}11, ${primaryColor}08)`,
        }}
      >
        <div className="container mx-auto px-4 max-w-2xl space-y-5">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
            Ready to streamline your accounting?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Join hundreds of businesses who trust us with their compliance. Get a no-obligation quote today.
          </p>
          <Button asChild className="partner-btn font-bold h-12 px-8 text-base">
            <Link href={`/p/${lp?.slug}${ctaTarget}`}>
              Get Started Today <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer Content */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h3 className="font-bold text-lg" style={{ color: primaryColor }}>{partner.companyName || partner.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {partner.landingPage?.heroSubtitle}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Contact Details</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {partner.address?.street && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
                    <div className="flex flex-col">
                      <span>{partner.address.street}</span>
                      {partner.address.suburb && <span>{partner.address.suburb}</span>}
                      <span>{partner.address.city}</span>
                      {partner.address.zip && <span>{partner.address.zip}</span>}
                      {partner.address.province && <span>{partner.address.province}</span>}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                  <a href={`mailto:${partner.email}`} className="hover:underline">{partner.email}</a>
                </div>
                {partner.contactNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                    <a href={`tel:${partner.contactNumber}`} className="hover:underline">{partner.contactNumber}</a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {partner.landingPage?.popiaPolicy && (
                  <li><Link href={`/p/${partner.landingPage.slug}/popia`} className="hover:underline">POPIA Policy</Link></li>
                )}
                {partner.landingPage?.refundPolicy && (
                  <li><Link href={`/p/${partner.landingPage.slug}/refund-policy`} className="hover:underline">Refund Policy</Link></li>
                )}
                {partner.landingPage?.termsAndConditions && (
                  <li><Link href={`/p/${partner.landingPage.slug}/terms`} className="hover:underline">Terms & Conditions</Link></li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {partner.companyName || partner.name}. All rights reserved.</p>
            <p className="mt-2 opacity-50 italic">Powered by My Accountant Partner Network</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
