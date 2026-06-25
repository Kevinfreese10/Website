'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, ArrowRight, LogIn, Mail, MapPin, Phone, MessageSquare, Star, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Helper to format currency in preview
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export default function PartnerLandingPagePreview({
  watchedLp,
  companyName = 'My Accounting Practice',
  partnerEmail = 'contact@practice.co.za',
  partnerPhone = '011 123 4567',
  partnerAddress = { street: '123 Main Road', city: 'Johannesburg', province: 'Gauteng', zip: '2000' }
}: {
  watchedLp: any;
  companyName?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  partnerAddress?: any;
}) {
  const lp = watchedLp || {};
  const isOutline = lp.buttonStyle === 'outline';
  const overlayOpacity = (lp.heroOverlayOpacity || 0) / 100;
  const heroLayout = lp.heroLayout || 'centered';
  const textPosition = lp.heroTextPosition || 'inside';
  const primaryColor = lp.primaryColor || '#214392';
  const secondaryColor = lp.secondaryColor || '#214392';
  const backgroundColor = lp.backgroundColor || '#ffffff';
  const textColor = lp.textColor || '#111827';
  const cardBackgroundColor = lp.cardBackgroundColor || '#ffffff';
  const cardBorderColor = lp.cardBorderColor || '#e5e7eb';
  const buttonColor = lp.buttonColor || '#214392';
  const buttonTextColor = lp.buttonTextColor || '#ffffff';

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Mock services for preview
  const mockServices = [
    {
      id: '1',
      title: 'Monthly Bookkeeping',
      price: 1500,
      turnaroundTime: 'Monthly ongoing',
      description: 'Full monthly bookkeeping services including bank reconciliations, management accounts, and VAT submissions.',
      whatsIncluded: ['Bank reconciliations', 'Management accounts', 'VAT201 submission']
    },
    {
      id: '2',
      title: 'Company Registration',
      price: 850,
      turnaroundTime: '3-5 working days',
      description: 'Register a new private company (Pty) Ltd in South Africa with CIPC, including share certificates and tax registration.',
      whatsIncluded: ['CIPC registration', 'Name reservation', 'Income tax registration']
    },
    {
      id: '3',
      title: 'Annual Financial Statements',
      price: 4500,
      turnaroundTime: '10-15 working days',
      description: 'Compilation of annual financial statements in accordance with IFRS for SMEs, prepared by a registered accounting officer.',
      whatsIncluded: ['Compilation report', 'Statement of financial position', 'Tax computation']
    }
  ];

  // Curated testimonials fallback
  const testimonials = lp.testimonials && lp.testimonials.length > 0 ? lp.testimonials : [
    {
      name: 'Sarah Connor',
      role: 'CEO',
      company: 'Tech Solutions',
      quote: 'Outstanding professional accounting service! They handled our tax compliance and bookkeeping seamlessly.',
      rating: 5
    },
    {
      name: 'David Govender',
      role: 'Founder',
      company: 'Govender Logistics',
      quote: 'Highly recommend this practice. Fast response times, accurate reporting, and excellent customer service.',
      rating: 5
    }
  ];

  // Curated FAQs fallback
  const faqs = lp.faqs && lp.faqs.length > 0 ? lp.faqs : [
    {
      question: 'What documents are required to begin monthly accounting?',
      answer: 'Typically we require your company registration documents (CIPC), director IDs, proof of address, and access to your business bank statements or cloud accounting software.'
    },
    {
      question: 'Do you assist with tax clearance certificates?',
      answer: 'Yes, we can apply for and renew tax clearance status with SARS, provided your tax submissions and account payments are fully up-to-date.'
    }
  ];

  const HeroContent = ({ isOverlay = true }: { isOverlay?: boolean }) => (
    <div className={cn(
      isOverlay && "relative z-10",
      heroLayout === 'split-left' ? 'text-left lg:mr-auto lg:ml-0 lg:max-w-md' :
      heroLayout === 'split-right' ? 'text-right lg:ml-auto lg:mr-0 lg:max-w-md' :
      'text-center max-w-2xl mx-auto w-full'
    )}>
      <div className="space-y-4">
        <h1 
          className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight"
          style={{ 
            color: isOverlay ? (lp.heroTitleColor || (lp.heroImageUrl && overlayOpacity > 0.3 ? '#ffffff' : textColor)) : (lp.heroTitleColor || textColor)
          }}
        >
          {lp.heroTitle || 'Professional Accounting Services'}
        </h1>
        <p 
          className="text-sm opacity-90 leading-relaxed"
          style={{ 
            color: isOverlay ? (lp.heroSubtitleColor || (lp.heroImageUrl && overlayOpacity > 0.3 ? '#ffffff' : textColor)) : (lp.heroSubtitleColor || textColor)
          }}
        >
          {lp.heroSubtitle || 'Expert tax, accounting, and compliance solutions tailored to your business.'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="border rounded-xl shadow-2xl overflow-hidden bg-slate-100 flex flex-col h-[700px] w-full max-w-full font-sans text-xs">
      {/* Mock Browser Header */}
      <div className="bg-slate-200 px-4 py-2 border-b flex items-center gap-3 select-none">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="bg-white/80 border rounded px-3 py-0.5 text-[10px] text-muted-foreground font-mono text-center flex-grow max-w-md mx-auto truncate">
          https://www.myacc.co.za/p/{lp.slug || 'your-slug'}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Mock Browser Viewport */}
      <div className="flex-grow overflow-y-auto bg-white flex flex-col h-full" style={{ backgroundColor }}>
        {/* Style injection for variables in preview */}
        <style dangerouslySetInnerHTML={{ __html: `
          .preview-btn {
            background-color: ${isOutline ? 'transparent' : buttonColor} !important;
            color: ${isOutline ? buttonColor : buttonTextColor} !important;
            border: ${isOutline ? `1px solid ${buttonColor}` : 'none'} !important;
            transition: all 0.2s;
          }
          .preview-btn:hover {
            opacity: 0.9;
          }
          .preview-text {
            color: ${primaryColor} !important;
          }
          .preview-icon {
            color: ${secondaryColor} !important;
          }
          .preview-card {
            background-color: ${cardBackgroundColor} !important;
            border-color: ${cardBorderColor} !important;
          }
        `}} />

        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-sm h-11 flex items-center px-4 shrink-0">
          <div className="w-full flex items-center justify-between">
            {!(lp.hideHeaderBranding === true) ? (
              <div className="flex items-center gap-2">
                {lp.showLogo !== false && lp.logoUrl ? (
                  <img 
                    src={lp.logoUrl} 
                    alt={companyName} 
                    style={{ height: `${(lp.logoHeight || 40) * 0.5}px` }}
                    className="object-contain"
                  />
                ) : (
                  <span className="font-bold text-sm" style={{ color: primaryColor }}>
                    {companyName}
                  </span>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hover:underline cursor-pointer">About</span>
              <span className="text-[10px] text-muted-foreground hover:underline cursor-pointer">Services</span>
              <Button size="xs" className="preview-btn text-[10px] h-7 px-2.5">
                <LogIn className="h-3 w-3 mr-1" /> Portal Login
              </Button>
            </div>
          </div>
        </header>

        {/* Body content */}
        <div className="flex-grow space-y-12 pb-12">
          {/* Hero Section */}
          <section 
            className={cn(
              "relative overflow-hidden flex items-center p-6",
              textPosition === 'inside' ? "py-10" : "py-4",
              heroLayout === 'background' ? 'w-full rounded-none' : 'm-4 rounded-xl'
            )}
            style={{ 
              backgroundColor: secondaryColor + '10',
              backgroundImage: lp.heroImageUrl ? `url("${lp.heroImageUrl}")` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: textPosition === 'inside' && lp.heroImageUrl ? '200px' : 'auto',
            }}
          >
            {lp.heroImageUrl && (
              <div className="absolute inset-0 z-0 bg-black" style={{ opacity: overlayOpacity }} />
            )}
            {textPosition === 'inside' && <HeroContent isOverlay={true} />}
          </section>

          {textPosition === 'below' && (
            <div className="text-center px-4 -mt-6">
              <HeroContent isOverlay={false} />
            </div>
          )}

          {/* About Section */}
          <section className="px-4 text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-lg font-bold" style={{ color: textColor }}>About Our Practice</h2>
            <Separator className="w-12 mx-auto border-b" style={{ borderColor: primaryColor }} />
            <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {lp.aboutUs || 'We are a dedicated accounting practice helping businesses thrive through sound financial advice and accurate bookkeeping.'}
            </p>
          </section>

          {/* Services Section */}
          <section className="px-4 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold" style={{ color: textColor }}>
                {lp.servicesHeroTitle || 'Our Services'}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {lp.servicesHeroSubtitle || 'Comprehensive compliance and advisory services for individuals and companies.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockServices.map((service) => (
                <Card key={service.id} className="preview-card border flex flex-col rounded-lg shadow-sm overflow-hidden text-[11px]">
                  <CardHeader className="p-3 pb-2 space-y-1">
                    <CardTitle className="text-xs font-bold leading-tight truncate">
                      {service.title}
                    </CardTitle>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm preview-text">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-[9px] text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-0.5" />
                        {service.turnaroundTime}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 py-2 flex-grow space-y-3 text-[10px]">
                    <p className="text-muted-foreground leading-snug line-clamp-2">
                      {service.description}
                    </p>
                    <ul className="space-y-1 text-slate-600">
                      {service.whatsIncluded.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 preview-icon shrink-0" />
                          <span className="truncate">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-3 pt-0">
                    <Button size="xs" className="w-full preview-btn text-[10px] h-7">
                      Order Service <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="px-4 py-8 bg-slate-50/50 border-y space-y-6">
            <h2 className="text-lg font-bold text-center" style={{ color: textColor }}>Client Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {testimonials.map((t: any, i: number) => (
                <Card key={i} className="p-4 preview-card border rounded-lg shadow-sm space-y-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating || 5 }).map((_, rIdx) => (
                      <Star key={rIdx} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                    ))}
                  </div>
                  <p className="text-[10px] italic text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-bold text-[10px] text-slate-800">{t.name}</p>
                    {t.role && <p className="text-[9px] text-muted-foreground">{t.role}{t.company ? ` at ${t.company}` : ''}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="px-4 max-w-xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-center" style={{ color: textColor }}>Frequently Asked Questions</h2>
            <div className="border rounded-lg overflow-hidden divide-y">
              {faqs.map((faq: any, i: number) => (
                <div key={i} className="bg-white">
                  <button 
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full px-4 py-3 flex justify-between items-center font-bold text-left hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedFaq === i && "rotate-180")} />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 pb-3 pt-1 text-muted-foreground text-[10px] leading-relaxed border-t bg-slate-50/30">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Lead capture form */}
          {lp.showLeadForm !== false && (
            <section className="px-4 max-w-md mx-auto space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold" style={{ color: textColor }}>Contact Our Team</h2>
                <p className="text-[10px] text-muted-foreground">Have a custom request or inquiry? Get in touch with us.</p>
              </div>
              <Card className="p-4 border rounded-lg shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Your Name</label>
                    <input type="text" disabled className="w-full border rounded px-2.5 py-1.5 bg-slate-50 cursor-not-allowed" placeholder="John" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Email Address</label>
                    <input type="email" disabled className="w-full border rounded px-2.5 py-1.5 bg-slate-50 cursor-not-allowed" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Phone Number</label>
                  <input type="text" disabled className="w-full border rounded px-2.5 py-1.5 bg-slate-50 cursor-not-allowed" placeholder="082 123 4567" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Message</label>
                  <textarea disabled rows={2} className="w-full border rounded px-2.5 py-1.5 bg-slate-50 cursor-not-allowed resize-none" placeholder="I would like to discuss..." />
                </div>
                <Button disabled size="xs" className="w-full preview-btn text-[10px] h-8">
                  Submit Inquiry
                </Button>
              </Card>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t bg-slate-50 p-6 space-y-4 text-[10px] mt-auto shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h3 className="font-bold text-sm" style={{ color: primaryColor }}>{companyName}</h3>
              <p className="text-muted-foreground leading-snug">
                {lp.heroSubtitle || 'Expert tax, accounting, and compliance solutions.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold uppercase tracking-wider text-[9px]">Contact Info</h4>
              <div className="space-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" style={{ color: primaryColor }} />
                  <span>{partnerEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" style={{ color: primaryColor }} />
                  <span>{partnerPhone}</span>
                </div>
                {partnerAddress?.street && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                    <span>{partnerAddress.street}, {partnerAddress.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="border-t pt-3 text-center text-[9px] text-muted-foreground opacity-70">
            <p>&copy; {new Date().getFullYear()} {companyName}. Powered by My Accountant.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
