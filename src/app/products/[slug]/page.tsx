import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Clock, ClipboardCheck, ChevronRight, Home, ShoppingCart, FileUp, RefreshCw, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getAdminDb } from '@/lib/firebase-admin';
import { Service } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Metadata, ResolvingMetadata } from 'next';
import ServiceCheckoutForm from '@/components/checkout/ServiceCheckoutForm';
import PrerequisitesList from '@/components/products/PrerequisitesList';
import ProductPageInteractiveContainer from '@/components/products/ProductPageInteractiveContainer';
import Script from 'next/script';
import { generateStructuredData } from '@/lib/schema/productSchema';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';

export const revalidate = 900;

async function getService(slug: string): Promise<Service | null> {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('services').where('slug', '==', slug).get();

    if (snap.empty) {
        return null;
    }
    const doc = snap.docs[0];
    const data = doc.data();

    const serviceData = {
        id: doc.id,
        ...data,
    } as any;

    if (data.createdAt) {
        serviceData.createdAt = data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    }
    
    return serviceData as Service;
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    return { title: 'Product Not Found' }
  }

  const canonicalUrl = `${SITE_URL}/products/${service.slug}`;
  const rawTitle = service.metaTitle || `${service.title} | My Accountant`;
  
  // Strip " | My Accountant" suffix if present to prevent duplication by the layout's title.template
  const title = rawTitle.endsWith(' | My Accountant')
    ? rawTitle.slice(0, -' | My Accountant'.length)
    : rawTitle;
    
  const description = service.metaDescription || service.description;
  
  let ogImage = service.seoImageUrl || service.imageUrl || GLOBAL_OG_IMAGE;
  if (ogImage.startsWith('/')) {
    ogImage = `${SITE_URL}${ogImage}`;
  }
 
  return {
    title: { absolute: title },
    description: description,
    alternates: {
        canonical: canonicalUrl,
    },
    openGraph: {
      title: rawTitle,
      description: description,
      url: canonicalUrl,
      siteName: 'My Accountant',
      locale: 'en_ZA',
      type: 'website',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: service.seoImageLabel || service.title
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: rawTitle,
      description: description,
      images: [ogImage],
    },
  }
}


export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  // Generate structured data server-side
  const jsonLd = generateStructuredData(service);

  // Split title to dynamically add a gorgeous homepage-style text gradient
  const titleWords = service.title.split(' ');
  let firstPart = service.title;
  let secondPart = '';
  
  if (titleWords.length > 1) {
      const splitIndex = Math.ceil(titleWords.length / 2);
      firstPart = titleWords.slice(0, splitIndex).join(' ');
      secondPart = titleWords.slice(splitIndex).join(' ');
  }

  // Custom Co-operative Society FAQ override
  let serviceFaqs = service.faqs;
  if (slug === 'co-operative-society' && (!serviceFaqs || serviceFaqs.length === 0)) {
      serviceFaqs = [
        {
          q: "What is a Co-operative Society in South Africa?",
          a: "A Co-operative Society is a democratic business model owned and run by its members, who share the profits and benefits. In South Africa, co-operatives are registered with the CIPC (Companies and Intellectual Property Commission) and governed by the Co-operatives Act."
        },
        {
          q: "How many members are required to form a Co-operative?",
          a: "A primary co-operative requires a minimum of 5 individual members to form and register. A secondary co-operative requires a minimum of 2 primary co-operatives as members."
        },
        {
          q: "What are the requirements to register a Co-operative Society with CIPC?",
          a: "To register, you need: a minimum of 5 members, certified ID copies or smartcard copies of all founding members (not older than 3 months), a completed Co-op Form 1, a constitution signed by all members, and a CIPC name reservation confirmation."
        },
        {
          q: "What are the tax compliance obligations for a Co-operative?",
          a: "Co-operatives are registered for Income Tax with SARS. They are required to submit annual tax returns (IT14SD/IT12EI) and may qualify for special tax deductions or small business tax rates depending on their sector and operations."
        }
      ];
  }

  // Fallback automatic high-quality SEO FAQ generator for all other products
  if (!serviceFaqs || serviceFaqs.length === 0) {
    const titleClean = service.title.replace(" Service", "");
    const includedStr = service.whatsIncluded && service.whatsIncluded.length > 0 
      ? service.whatsIncluded.slice(0, 3).join(", ") + (service.whatsIncluded.length > 3 ? ", and more" : "")
      : "comprehensive compliance, review, and submission support";
      
    const reqStr = service.clientRequirements && service.clientRequirements.length > 0
      ? service.clientRequirements.slice(0, 3).join(", ") + (service.clientRequirements.length > 3 ? ", and other supporting documentation" : "")
      : "standard company details and representative contact information";
      
    const pricingStr = service.isPriceTbc 
      ? "is available on a Price on Request basis. Please submit a contact inquiry to receive a custom quote tailored to your business scale."
      : `is priced transparently at ${formatPrice(service.price)}. Payments can be made securely online via PayFast supporting Credit Cards, Instant EFT, and EFT.`;

    serviceFaqs = [
      {
        q: `What is included in the ${titleClean} service?`,
        a: `Our ${service.title} includes ${includedStr}. We handle the entire preparation, verification, and filing to ensure full compliance.`
      },
      {
        q: `What are the prerequisites to start the ${titleClean} process?`,
        a: `To get started with ${titleClean}, we require: ${reqStr}. You can easily upload these files securely through our online client portal after checkout.`
      },
      {
        q: `How long does the ${titleClean} service take to complete?`,
        a: `The turnaround time for ${titleClean} is estimated at ${service.turnaroundTime}. We fast-track submissions directly with CIPC or SARS to ensure the fastest possible processing.`
      },
      {
        q: `What is the cost and payment structure for ${titleClean}?`,
        a: `The ${titleClean} service ${pricingStr}`
      }
    ];
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": serviceFaqs.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": `${SITE_URL}/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": service.category,
        "item": `${SITE_URL}/products#${service.category.toLowerCase().replace(/ /g, '-')}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": service.title,
        "item": `${SITE_URL}/products/${service.slug}`
      }
    ]
  };

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* BREADCRUMB */}
      <nav className="container mx-auto px-4 pt-6 pb-2 animate-in fade-in">
        <ol className="flex items-center gap-1 text-xs font-semibold text-muted-foreground flex-wrap">
          <li><Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" />Home</Link></li>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
          <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
          <li><Link href={`/products#${service.category.toLowerCase().replace(/ /g, '-')}`} className="hover:text-primary transition-colors">{service.category}</Link></li>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
          <li className="text-slate-700 font-bold truncate max-w-[180px]">{service.title}</li>
        </ol>
      </nav>

      {/* COLOURFUL HERO SECTION */}
      <section className="relative w-full overflow-hidden pt-6 sm:pt-8 pb-12 sm:pb-20 text-center mb-6 sm:mb-12 animate-in fade-in">
        {/* Aurora blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-10 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[250px] h-[250px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-5 px-3.5 py-1.5 rounded-full glass neon-border text-[11px] sm:text-xs font-extrabold text-primary uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {service.category}
          </div>
          <h1 className="mb-4 sm:mb-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-hero-gradient pb-2 leading-tight">
            {firstPart} {secondPart && <span className="text-gradient">{secondPart}</span>}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mb-5 sm:mb-6">
            <div className="flex items-center text-amber-400">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-500">
              {service.aggregateRatingValue || "5.0"} ({service.reviewCount || "120+"} reviews)
            </span>
          </div>
          <p className="mx-auto mb-6 sm:mb-8 max-w-2xl text-base sm:text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            {service.description || `Professional ${service.title} compliance services tailored for South African businesses and individuals.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-semibold">
            <span className="flex items-center text-muted-foreground gap-1.5 text-xs sm:text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              {service.turnaroundTime}
            </span>
            <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-lg sm:text-xl font-black neon-border">
              {service.isPriceTbc ? 'Price on Request' : formatPrice(service.price)}
            </span>
          </div>
        </div>
      </section>

      <div className="text-center -mt-4 sm:-mt-6 mb-6 sm:mb-8 animate-in fade-in">
        <TrustIndexWidget />
      </div>

      <div className="container mx-auto px-4 pb-8 sm:pb-12 flex-grow">
        <section className="bg-secondary/30 border-white/[0.06] mb-8 sm:mb-12 rounded-3xl glass-card px-3 sm:px-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works" className="border-none">
              <AccordionTrigger className="hover:no-underline py-6 sm:py-8">
                <div className="text-left md:text-center w-full space-y-1 sm:space-y-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground font-headline">How Our Online Accounting Process Works</h2>
                  <p className="text-muted-foreground text-xs sm:text-base md:text-lg font-normal">Four simple steps to full compliance. Click to view.</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 relative pb-6 sm:pb-8 pt-3 sm:pt-4">
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
                <div key={idx} className="relative text-center space-y-4 sm:space-y-6 group">
                  <div className={cn("h-16 w-16 sm:h-20 sm:w-20 rounded-3xl border flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm transition-all duration-300 group-hover:scale-105", step.bg)}>
                    <step.icon className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none block mb-1", step.textColor)}>Step {step.step}</span>
                    <h3 className="font-bold text-lg sm:text-xl leading-tight text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed px-2 sm:px-4">{step.desc}</p>
                  {idx < 3 && <ArrowRight className="hidden lg:block absolute -right-6 top-10 h-8 w-8 text-muted-foreground/20" />}
                </div>
              ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-12">
        <ProductPageInteractiveContainer
          service={service}
          clientRequirements={service.clientRequirements}
        />
      </div>

        {/* DYNAMIC FAQ ACCORDION SECTION (Strictly aligned with Google Search Engine requirements) */}
        {serviceFaqs && serviceFaqs.length > 0 && (
          <div className="mt-8 sm:mt-16 bg-card/40 rounded-2xl p-4 sm:p-8 border border-border/40 shadow-sm max-w-4xl mx-auto">
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Frequently Asked Questions</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Everything you need to know about our {service.title} solutions.</p>
              </div>
              
              <div className="w-full space-y-6">
          {serviceFaqs.map((faq, index) => (
            <div key={index} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
              </div>
            </div>
          </div>
        )}

      {/* MOBILE STICKY BUY BAR */}
      {!service.isPriceTbc && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border/40 shadow-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
          <div aria-hidden="true">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate max-w-[180px]">{service.title}</p>
            <p className="text-lg font-black text-primary leading-none">{formatPrice(service.price)}</p>
          </div>
          <a
            href="#checkout"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md active:scale-95 transition-all"
          >
            Order Now
          </a>
        </div>
      )}
    </>
  );
}
