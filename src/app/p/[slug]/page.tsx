import { getPartnerBySlug, getServices, getPartnerOverrides, getCategories } from '@/lib/firebase-admin';
import { User, Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import PartnerLeadForm from '@/components/partner/PartnerLeadForm';

export const dynamic = 'force-dynamic';

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

  const services = globalServices.map(s => {
      const override = overrides[s.id];
      if (!override) return s;
      return {
          ...s,
          title: override.title || s.title,
          price: override.price ?? s.price,
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

  const HeroContent = ({ isOverlay = true }: { isOverlay?: boolean }) => (
    <div className={cn(
        isOverlay && "container mx-auto px-4 relative z-10",
        heroLayout === 'split-left' ? 'text-left lg:mr-auto lg:ml-0 lg:max-w-xl' :
        heroLayout === 'split-right' ? 'text-right lg:ml-auto lg:mr-0 lg:max-w-xl' :
        'text-center max-w-4xl mx-auto w-full'
    )}>
      <div className="space-y-6">
        <h1 
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ 
                color: isOverlay ? (lp?.heroTitleColor || (heroImage && overlayOpacity > 0.3 ? '#ffffff' : 'inherit')) : lp?.heroTitleColor || 'inherit'
            }}
        >
          {lp?.heroTitle}
        </h1>
        <p 
            className="text-xl opacity-90 leading-relaxed"
            style={{ 
                color: isOverlay ? (lp?.heroSubtitleColor || (heroImage && overlayOpacity > 0.3 ? '#ffffff' : 'inherit')) : lp?.heroSubtitleColor || 'inherit'
            }}
        >
          {lp?.heroSubtitle}
        </p>
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
    <div className="space-y-24 pb-24">
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
          <section className="container mx-auto px-4 -mt-12 lg:-mt-16">
              <div className="py-12 md:py-16 text-center">
                <HeroContent isOverlay={false} />
              </div>
          </section>
      )}

      <div className="container mx-auto px-4">
        {lp?.testimonials && lp.testimonials.length > 0 ? (
          <div className="space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900">What Our Clients Say</h2>
              <p className="text-muted-foreground text-sm">Real feedback from local businesses and individuals.</p>
              <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lp.testimonials.map((t: any, i: number) => (
                <Card key={i} className="flex flex-col partner-card border shadow-sm p-6 space-y-4 relative">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating || 5 }).map((_, rIdx) => (
                      <Star key={rIdx} className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                    ))}
                  </div>
                  <p className="text-sm italic opacity-85 leading-relaxed flex-grow">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="pt-3 border-t border-muted/50">
                    <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                    {t.role && (
                      <p className="text-xs text-muted-foreground">
                        {t.role}{t.company ? ` at ${t.company}` : ''}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <TrustIndexWidget />
        )}
      </div>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 scroll-m-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-slate-900">About Our Practice</h2>
          <Separator className="w-24 mx-auto partner-border border-b-2 opacity-50" />
          <p className="text-lg opacity-80 leading-relaxed whitespace-pre-wrap">
            {lp?.aboutUs}
          </p>
        </div>
      </section>

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
            <div className="container mx-auto px-4 text-center space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">{lp?.servicesHeroTitle || 'Accounting & Tax Solutions'}</h2>
              <p className="opacity-70 text-lg">{lp?.servicesHeroSubtitle || 'Comprehensive professional services for individuals and SMEs.'}</p>
            </div>
        )}

        <div className="container mx-auto px-4 space-y-20">
            {categorizedServices.map((category) => (
                <div key={category.id} className="space-y-12">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h3 className="text-3xl font-bold text-slate-900">{category.name}</h3>
                        {category.description && (
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {category.description}
                            </p>
                        )}
                        <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {category.data.map((service: Service) => (
                            <Card key={service.id} className="flex flex-col group hover:shadow-xl transition-all duration-300 partner-card border shadow-sm">
                                <CardHeader className="space-y-2 pb-4">
                                    <CardTitle className="text-2xl font-bold leading-tight group-hover:partner-text transition-colors">
                                        {service.title}
                                    </CardTitle>
                                    <div className="space-y-1">
                                        {service.isPriceTbc ? (
                                            <span className="text-xl font-bold opacity-50 block">Price on Request</span>
                                        ) : (
                                            <span className="text-2xl font-bold partner-text block">
                                                {formatPrice(service.price)}
                                            </span>
                                        )}
                                        <div className="flex items-center text-xs opacity-70 font-medium">
                                            <Clock className="h-4 w-4 mr-1.5 opacity-70 partner-icon" />
                                            {service.turnaroundTime}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-6">
                                    <p className="text-sm opacity-80 leading-relaxed line-clamp-3">
                                        {service.description}
                                    </p>
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold">What&apos;s Included:</p>
                                        <ul className="space-y-2">
                                            {service.whatsIncluded.slice(0, 3).map((item: string, i: number) => (
                                                <li key={i} className="flex items-start text-xs opacity-90">
                                                    <CheckCircle2 className="h-4 w-4 mr-3 mt-0.5 partner-icon flex-shrink-0" />
                                                    <span className="leading-tight">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button className="w-full partner-btn font-semibold h-11" asChild>
                                        <Link href={`/p/${slug}/products/${service.slug}`}>
                                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* FAQ Section */}
      {lp?.faqs && lp.faqs.length > 0 && (
        <section id="faqs" className="container mx-auto px-4 scroll-m-24 max-w-3xl space-y-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <Separator className="w-16 mx-auto partner-border border-b-2 opacity-30" />
          </div>
          <Accordion type="single" collapsible className="w-full border rounded-xl overflow-hidden bg-white shadow-sm divide-y">
            {lp.faqs.map((faq: any, i: number) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b-0 px-6 py-1">
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline text-base py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-sm leading-relaxed pb-4 pt-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Lead Form Section */}
      {lp?.showLeadForm !== false && (
        <section id="contact" className="container mx-auto px-4 scroll-m-24 max-w-lg space-y-8">
          <Separator className="max-w-xs mx-auto opacity-20" />
          <PartnerLeadForm partnerId={partner.id} />
        </section>
      )}
    </div>
  );
}
