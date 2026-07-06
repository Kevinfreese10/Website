import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Clock, ClipboardCheck, ChevronRight, Home } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase-admin';
import { Service } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Metadata, ResolvingMetadata } from 'next';
import ServiceCheckoutForm from '@/components/checkout/ServiceCheckoutForm';
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

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

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

      {/* DYNAMIC PREMIUM HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-card/40 border-b border-border/40 pt-8 pb-16 text-center mb-12 animate-in fade-in">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">{service.category}</Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {firstPart} {secondPart && <span className="text-gradient">{secondPart}</span>}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            {service.description || `Professional ${service.title} compliance services tailored for South African businesses and individuals.`}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-semibold">
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-primary" /> {service.turnaroundTime}</span>
            <span className="flex items-center text-primary text-lg font-extrabold">
              {service.isPriceTbc ? 'Price on Request' : formatPrice(service.price)}
            </span>
          </div>
        </div>
      </section>

      <div className="text-center -mt-6 mb-8 animate-in fade-in">
        <TrustIndexWidget />
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div className="space-y-8 md:col-span-2">
              
            <div>
              <h2 className="text-xl font-semibold font-bold">Product Description</h2>
              <Separator className="my-3" />
              <p className="text-muted-foreground leading-relaxed">{service.longDescription}</p>
            </div>

            {service.whatsIncluded && service.whatsIncluded.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold font-bold">What's Included</h2>
                <Separator className="my-3" />
                <ul className="space-y-3">
                  {service.whatsIncluded.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <BadgeCheck className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {service.clientRequirements && service.clientRequirements.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold font-bold">Prerequisites</h2>
                <Separator className="my-3" />
                 <ul className="space-y-3">
                  {service.clientRequirements.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <ClipboardCheck className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* STICKY CHECKOUT SIDEBAR */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Service summary recap */}
              <div className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">{service.category}</p>
                <h3 className="text-base font-black text-foreground leading-snug mb-3">{service.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-xs text-muted-foreground font-semibold gap-1">
                    <Clock className="h-3.5 w-3.5" />{service.turnaroundTime}
                  </span>
                  <span className="text-xl font-black text-primary">
                    {service.isPriceTbc ? 'Quote' : formatPrice(service.price)}
                  </span>
                </div>
              </div>
              <ServiceCheckoutForm service={service} />
            </div>
          </div>
        </div>

        {/* DYNAMIC FAQ ACCORDION SECTION (Strictly aligned with Google Search Engine requirements) */}
        {serviceFaqs && serviceFaqs.length > 0 && (
          <div className="mt-16 bg-card/40 rounded-2xl p-8 border border-border/40 shadow-sm max-w-4xl mx-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-foreground">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground font-semibold">Everything you need to know about our {service.title} solutions.</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full mt-4">
                {serviceFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-b">
                    <AccordionTrigger className="text-base font-bold text-foreground text-left py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY BUY BAR */}
      {!service.isPriceTbc && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border/40 shadow-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4">
          <div>
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
