import { getPartnerBySlug, getServices, getPartnerOverrides, getCategories } from '@/lib/firebase-admin';
import { User, Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, ArrowRight, Star, Shield, Award, Users, TrendingUp, Quote, ShoppingCart, FileUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import PartnerLeadForm from '@/components/partner/PartnerLeadForm';
import PartnerPricingCalculator from '@/components/partner/PartnerPricingCalculator';
import AnimatedSection from '@/components/partner/AnimatedSection';
import FloatingCTA from '@/components/partner/FloatingCTA';
import PartnerServicesList from '@/components/partner/PartnerServicesList';

export const revalidate = 3600;

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default async function PartnerLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);
  if (!partner) return null;

  const [globalServices, categories, overrides] = await Promise.all([
    getServices(),
    getCategories(),
    getPartnerOverrides(partner.id)
  ]);

  const lp = partner.landingPage;
  const heroImage = lp?.heroImageUrl;
  const overlayOpacity = (lp?.heroOverlayOpacity || 0) / 100;
  const heroLayout = lp?.heroLayout || 'centered';
  const textPosition = lp?.heroTextPosition || 'inside';
  const servicesHeroLayout = lp?.servicesHeroLayout || 'centered';
  const servicesHeroTextPosition = lp?.servicesHeroTextPosition || 'inside';
  const showServicesHero = lp?.showServicesHero !== false;
  const ctaTarget = lp?.showCalculator ? '#calculator' : '#contact';

  const services = globalServices
    .filter(s => {
      const override = overrides[s.id];
      return override ? override.enabled !== false : true;
    })
    .map(s => {
      const override = overrides[s.id];
      if (!override) return s;
      return {
          ...s,
          title: override.title || s.title,
          price: override.price != null ? Math.max(override.price, s.price) : s.price,
          description: override.description || s.description,
          longDescription: override.longDescription || s.longDescription,
          turnaroundTime: override.turnaroundTime || s.turnaroundTime,
      };
  });

  const categorizedServices = categories
    .map(category => ({
        ...category,
        data: services.filter(s => s.category === category.name)
    }))
    .filter(c => c.data.length > 0);

  // Find the lowest-priced non-TBC service for "Most Popular" badge
  const pricedServices = services.filter(s => !s.isPriceTbc && s.price > 0);
  const mostPopularId = pricedServices.length > 0
    ? pricedServices.reduce((a, b) => a.price < b.price ? a : b).id
    : null;

  const HeroContent = ({ isOverlay = true }: { isOverlay?: boolean }) => (
    <div className={cn(
        isOverlay && "container mx-auto px-4 relative z-10",
        heroLayout === 'split-left' ? 'text-left lg:mr-auto lg:ml-0 lg:max-w-xl' :
        heroLayout === 'split-right' ? 'text-right lg:ml-auto lg:mr-0 lg:max-w-xl' :
        'text-center max-w-4xl mx-auto w-full'
    )}>
      <div className="space-y-6">
        <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-hero-gradient pb-2"
            style={{ 
                color: isOverlay ? (lp?.heroTitleColor || (heroImage && overlayOpacity > 0.3 ? '#ffffff' : 'inherit')) : lp?.heroTitleColor || 'inherit'
            }}
        >
          {lp?.heroTitle}
        </h1>
        <p 
            className="text-xl opacity-90 leading-relaxed max-w-2xl mx-auto"
            style={{ 
                color: isOverlay ? (lp?.heroSubtitleColor || (heroImage && overlayOpacity > 0.3 ? '#ffffff' : 'inherit')) : lp?.heroSubtitleColor || 'inherit'
            }}
        >
          {lp?.heroSubtitle}
        </p>

        {/* Hero CTAs */}
        <div className={cn(
          "flex flex-col sm:flex-row gap-3 pt-2",
          heroLayout === 'split-right' ? 'sm:justify-end' : 
          heroLayout === 'split-left' ? 'sm:justify-start' : 'justify-center'
        )}>
          <Button asChild size="lg" className="partner-btn font-bold h-14 px-8 text-base shadow-lg">
            <Link href={`/p/${slug}${ctaTarget}`}>
              Get a Free Quote <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button 
            asChild 
            size="lg" 
            variant="outline" 
            className={cn(
              "font-bold h-14 px-8 text-base",
              isOverlay && heroImage && overlayOpacity > 0.3 
                ? "border-white/50 text-white hover:bg-white/10" 
                : "border-border"
            )}
          >
            <Link href={`/p/${slug}#products`}>
              View Our Services
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );

  const ServicesHeroContent = ({ isOverlay = true }: { isOverlay?: boolean }) => (
    <div className={cn(
        "relative z-10 space-y-4 w-full",
        isOverlay && "container mx-auto px-4",
        servicesHeroLayout === 'split-left' ? 'text-left' : 
        servicesHeroLayout === 'split-right' ? 'text-right' : 'text-center mx-auto',
        servicesHeroLayout === 'background' ? 'max-w-4xl mx-auto' : 'max-w-2xl mx-auto'
    )}>
        <h2 
            className="text-3xl md:text-5xl font-bold"
            style={{ color: isOverlay ? '#ffffff' : 'inherit' }}
        >
            {lp?.servicesHeroTitle || 'Accounting & Tax Solutions'}
        </h2>
        <p 
            className="text-lg opacity-90"
            style={{ color: isOverlay ? '#ffffff' : 'inherit' }}
        >
            {lp?.servicesHeroSubtitle || 'Comprehensive professional services for individuals and SMEs.'}
        </p>
    </div>
  );

  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      {/* Floating Mobile CTA */}
      <FloatingCTA />

      {/* Hero Section */}
      <section 
        className={cn(
            "relative overflow-hidden flex items-center",
            textPosition === 'inside' ? "py-20 lg:py-32" : "h-[300px] lg:h-[450px]",
            heroLayout === 'split-left' ? 'text-left' : heroLayout === 'split-right' ? 'text-right' : 'text-center',
            heroLayout === 'background' ? 'w-full' : 'container mx-auto px-4'
        )}
        style={{ 
            backgroundColor: lp?.secondaryColor || 'rgba(0,0,0,0.03)',
            minHeight: textPosition === 'inside' ? (heroImage ? '500px' : 'auto') : 'auto',
            backgroundImage: heroImage ? `url("${heroImage}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: heroLayout === 'background' ? '0' : '1.5rem',
        }}
      >
                {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift opacity-60" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift opacity-60" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift opacity-60" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid opacity-70" />

        {/* Overlay */}
        {heroImage && (
            <div 
                className="absolute inset-0 z-0" 
                style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
            />
        )}

        {textPosition === 'inside' && <HeroContent isOverlay={true} />}
      </section>

      {/* Text Below Hero Image */}
      {textPosition === 'below' && (
          <section className="container mx-auto px-4">
              <div className="py-12 md:py-16 text-center">
                <HeroContent isOverlay={false} />
              </div>
          </section>
      )}

      {/* Trust Strip */}
      <AnimatedSection className="py-8 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-blue-500" /> SARS Registered
            </span>
            <span className="hidden sm:block w-px h-4 bg-border" />
            <span className="flex items-center gap-2 font-medium">
              <Award className="h-4 w-4 text-emerald-500" /> Professionally Accredited
            </span>
            <span className="hidden sm:block w-px h-4 bg-border" />
            <span className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-violet-500" /> 100+ Clients Served
            </span>
            <span className="hidden sm:block w-px h-4 bg-border" />
            <span className="flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4 text-orange-500" /> Same-Day Response
            </span>
          </div>
        </div>
      </AnimatedSection>

      {/* Stats Counter Section (Only shown when configured/enabled by partner) */}
      {lp?.showStats && (
        <AnimatedSection className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { value: '10+', label: 'Years of Experience', icon: TrendingUp, color: 'text-blue-500' },
                { value: '500+', label: 'Businesses Served', icon: Users, color: 'text-emerald-500' },
                { value: '2,000+', label: 'Tax Returns Filed', icon: CheckCircle2, color: 'text-violet-500' },
                { value: '99%', label: 'Client Satisfaction', icon: Star, color: 'text-orange-500' },
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2">
                  <stat.icon className={cn("h-6 w-6 mx-auto opacity-80", stat.color)} />
                  <div className={cn("text-3xl md:text-4xl font-extrabold", stat.color)}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Online Process Steps */}
      <AnimatedSection className="py-16 bg-muted/20 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-black md:text-4xl uppercase tracking-tighter text-foreground font-headline">How Our Online Accounting Process Works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to full compliance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {[
              { 
                step: "01", 
                title: "Choose Your Service", 
                desc: "Browse our online store and select the accounting, tax, or compliance service your business requires.", 
                icon: ShoppingCart, 
                bg: "bg-amber-50/80 border-amber-200/60 text-amber-600",
                textColor: "text-amber-600"
              },
              { 
                step: "02", 
                title: "Upload Your Documents", 
                desc: "Securely upload your supporting documents through our online platform.", 
                icon: FileUp, 
                bg: "bg-blue-50/80 border-blue-200/60 text-blue-600",
                textColor: "text-blue-600"
              },
              { 
                step: "03", 
                title: "We Process Your Application", 
                desc: "Our team handles the accounting, SARS, CIPC, or compliance process on your behalf.", 
                icon: RefreshCw, 
                bg: "bg-purple-50/80 border-purple-200/60 text-purple-600",
                textColor: "text-purple-600"
              },
              { 
                step: "04", 
                title: "Receive Confirmation & Support", 
                desc: "We provide updates, confirmations, and ongoing support throughout the process.", 
                icon: CheckCircle2, 
                bg: "bg-emerald-50/80 border-emerald-200/60 text-emerald-600",
                textColor: "text-emerald-600"
              }
            ].map((step, idx) => (
              <div key={idx} className="relative text-center space-y-6 group">
                <div className={cn("h-20 w-20 rounded-xl border flex items-center justify-center mx-auto mb-6 shadow-sm transition-all duration-300 group-hover:scale-105", step.bg)}>
                  <step.icon className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none block mb-1", step.textColor)}>Step {step.step}</span>
                  <h3 className="font-bold text-xl leading-tight text-foreground">{step.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">{step.desc}</p>
                {idx < 3 && <ArrowRight className="hidden lg:block absolute -right-6 top-10 h-8 w-8 text-muted-foreground/20" />}
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <div className="space-y-24">
        {/* Testimonials Section */}
        <AnimatedSection className="container mx-auto px-4">
          {lp?.testimonials && lp.testimonials.length > 0 ? (
            <div className="space-y-12">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">What Our Clients Say</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">Real feedback from local businesses and individuals.</p>
                <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lp.testimonials.map((t: any, i: number) => (
                  <Card key={i} className="flex flex-col glass-card border border-border shadow-sm p-6 space-y-4 relative hover:scale-[1.02] transition-all duration-300">
                    <Quote className="h-8 w-8 partner-icon opacity-15 absolute top-4 right-4" />
                    <div className="flex gap-1">
                      {Array.from({ length: t.rating || 5 }).map((_, rIdx) => (
                        <Star key={rIdx} className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                      ))}
                    </div>
                    <p className="text-sm italic opacity-85 leading-relaxed flex-grow">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="pt-3 border-t border-muted/50 flex items-center gap-3">
                      {/* Avatar with initials */}
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: lp?.primaryColor || '#214392' }}
                        >
                          {t.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
                        {t.role && (
                          <p className="text-xs text-muted-foreground">
                            {t.role}{t.company ? ` at ${t.company}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <TrustIndexWidget />
          )}
        </AnimatedSection>

        {/* About Section */}
        <AnimatedSection>
          <section id="about" className="container mx-auto px-4 scroll-m-24">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">About Our Practice</h2>
              <Separator className="w-24 mx-auto partner-border border-b-2 opacity-50" />
              <p className="text-lg opacity-80 leading-relaxed whitespace-pre-wrap">
                {lp?.aboutUs}
              </p>
              <div className="pt-4">
                <Button asChild size="lg" className="partner-btn font-bold h-12 px-8">
                  <Link href={`/p/${slug}${ctaTarget}`}>
                    Let&apos;s Work Together <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Services Grid */}
        <section id="products" className="scroll-m-24 space-y-16">
          {showServicesHero && lp?.servicesHeroImageUrl ? (
              <div className={cn(servicesHeroTextPosition === 'below' ? "space-y-12" : "")}>
                  <div className={cn(servicesHeroLayout === 'background' ? "w-full" : "container mx-auto px-4")}>
                      <div 
                          className={cn(
                              "relative overflow-hidden flex items-center p-8 md:p-12",
                              servicesHeroLayout === 'background' ? "min-h-[350px] lg:min-h-[500px]" : "h-[250px] lg:h-[400px]",
                              servicesHeroTextPosition === 'inside' ? "py-20 lg:py-32" : "",
                              servicesHeroLayout === 'split-left' ? 'justify-start' : 
                              servicesHeroLayout === 'split-right' ? 'justify-end' : 'justify-center'
                          )}
                          style={{ 
                              backgroundImage: `url("${lp.servicesHeroImageUrl}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: servicesHeroLayout === 'background' ? '0' : '1.5rem',
                          }}
                      >
                          <div 
                              className="absolute inset-0" 
                              style={{ backgroundColor: `rgba(0,0,0,${(lp.servicesHeroOverlayOpacity || 0) / 100})` }}
                          />
                          {servicesHeroTextPosition === 'inside' && <ServicesHeroContent isOverlay={true} />}
                      </div>
                  </div>
                  {servicesHeroTextPosition === 'below' && (
                      <div className="container mx-auto px-4">
                          <ServicesHeroContent isOverlay={false} />
                      </div>
                  )}
              </div>
          ) : (
              <AnimatedSection className="container mx-auto px-4 text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{lp?.servicesHeroTitle || 'Accounting & Tax Solutions'}</h2>
                <p className="opacity-70 text-lg">{lp?.servicesHeroSubtitle || 'Comprehensive professional services for individuals and SMEs.'}</p>
              </AnimatedSection>
          )}

        {/* Pricing / Packages Comparison Section (Only shown when explicitly enabled/configured by partner) */}
        {lp?.showPricingPackages && (
          <AnimatedSection>
            <section id="pricing" className="container mx-auto px-4 scroll-m-24 max-w-5xl space-y-12">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Simple, Transparent Packages</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">Choose the plan that fits your business stage.</p>
                <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {/* Essential Card */}
                <Card className="flex flex-col partner-card shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-foreground/90">Essential</h3>
                    <p className="text-xs text-muted-foreground mt-1">Best for small startups & sole proprietors</p>
                    <div className="flex items-baseline mt-4">
                      <span className="text-4xl font-extrabold text-foreground">R3,500</span>
                      <span className="text-sm font-semibold text-muted-foreground ml-1">/ month</span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-wide">For turnover under R1M</p>
                  </div>
                  <CardContent className="flex-grow p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Monthly Bookkeeping & Reconciliations</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Quarterly Management Reports</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Annual Financial Statements</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Income Tax & CIPC Annual Returns</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Payroll Processing & PAYE / UIF</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Dedicated Accountant</span>
                      </li>
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full partner-btn text-white font-bold h-11 rounded-lg shadow-md active:scale-95 transition-all" asChild>
                      <Link href="#contact">Get Started</Link>
                    </Button>
                  </div>
                </Card>

                {/* Growth Card (Most Popular) */}
                <Card className="flex flex-col glass-card border-2 partner-border shadow-lg relative hover:shadow-2xl hover:scale-[1.03] transition-all duration-300">
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-background border border-border partner-text font-black text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-md shadow-md select-none">
                    Most Popular
                  </div>
                  <div className="p-6 border-b partner-bg/5 rounded-t-xl partner-card">
                    <h3 className="text-xl font-bold text-foreground/90">Growth</h3>
                    <p className="text-xs text-muted-foreground mt-1">Perfect for growing SME businesses</p>
                    <div className="flex items-baseline mt-4">
                      <span className="text-4xl font-extrabold text-foreground">R7,000</span>
                      <span className="text-sm font-semibold text-muted-foreground ml-1">/ month</span>
                    </div>
                    <p className="text-[11px] font-bold partner-text mt-2 uppercase tracking-wide">For turnover up to R7M</p>
                  </div>
                  <CardContent className="flex-grow p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Everything in Essential</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>VAT Returns & Submissions</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Bi-Monthly Management Reports</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Financial Manager Support</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Cash Flow & Budgeting Assistance</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>CFO Advisory & Monthly Reviews</span>
                      </li>
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full partner-btn text-white font-bold h-11 rounded-lg shadow-md active:scale-95 transition-all" asChild>
                      <Link href="#contact">Get Started</Link>
                    </Button>
                  </div>
                </Card>

                {/* Executive Card */}
                <Card className="flex flex-col partner-card shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                  <div className="p-6 border-b">
                    <h3 className="text-xl font-bold text-foreground/90">Executive</h3>
                    <p className="text-xs text-muted-foreground mt-1">Comprehensive CFO & tax governance</p>
                    <div className="flex items-baseline mt-4">
                      <span className="text-4xl font-extrabold text-foreground">R11,500</span>
                      <span className="text-sm font-semibold text-muted-foreground ml-1">/ month</span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-wide">For turnover up to R25M</p>
                  </div>
                  <CardContent className="flex-grow p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Everything in Growth</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Monthly Management Reports</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Unlimited CFO Advisory Services</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Unlimited Strategic Business Reviews</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs text-foreground/80 font-medium">
                        <CheckCircle2 className="h-4 w-4 partner-text shrink-0" />
                        <span>Priority Support Response</span>
                      </li>
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full partner-btn text-white font-bold h-11 rounded-lg shadow-md active:scale-95 transition-all" asChild>
                      <Link href="#contact">Get Started</Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </section>
          </AnimatedSection>
        )}
          <PartnerServicesList 
            categories={categories} 
            services={services} 
            mostPopularId={mostPopularId}
            slug={slug}
            partnerId={partner.id}
          />
        </section>

        {/* Pricing Calculator Section */}
        {lp?.showCalculator && (
          <AnimatedSection>
            <section id="calculator" className="container mx-auto px-4 scroll-m-24 max-w-4xl space-y-8">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Estimate Your Fees</h2>
                <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
              </div>
              <PartnerPricingCalculator services={services} partnerId={partner.id} />
            </section>
          </AnimatedSection>
        )}


        {/* FAQ Section */}
        <AnimatedSection>
          <section id="faqs" className="container mx-auto px-4 scroll-m-24 max-w-3xl space-y-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Frequently Asked Questions</h2>
              <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
            </div>
            <div className="w-full space-y-6">
              {(lp?.faqs && lp.faqs.length > 0 ? lp.faqs : [
                { question: "How secure are my documents?", answer: "We use bank-level 256-bit encryption and strict access controls. Your financial data and personal documents are stored in secure cloud vaults and never shared with unauthorized third parties." },
                { question: "How long does registration take?", answer: "Most standard registrations (like CIPC or basic SARS registrations) take 1-3 business days once we have all your required documents. We'll keep you updated every step of the way." },
                { question: "What if I need help after my service is completed?", answer: "Our relationship doesn't end after delivery. You get post-service support for any questions related to your recent order, and we offer affordable retainers for ongoing accounting and tax needs." },
                { question: "Do I need to come into an office?", answer: "Not at all! Our entire process is optimized for remote collaboration. You can upload documents securely, sign electronically, and consult with us via video call or phone from anywhere in the world." }
              ]).map((faq: any, i: number) => (
                <div key={i} className="border-b border-border pb-6 last:border-0">
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <div className="text-slate-600 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* Lead Form Section */}
        {lp?.showLeadForm !== false && (
          <AnimatedSection>
            <section id="contact" className="container mx-auto px-4 scroll-m-24 max-w-lg space-y-8">
              <Separator className="max-w-xs mx-auto opacity-20" />
              <PartnerLeadForm partnerId={partner.id} />
            </section>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
