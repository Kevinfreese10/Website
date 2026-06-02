import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, Clock, ClipboardCheck } from 'lucide-react';
import { Service } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Metadata, ResolvingMetadata } from 'next';
import ServiceCheckoutForm from '@/components/checkout/ServiceCheckoutForm';
import Script from 'next/script';
import { generateStructuredData } from '@/lib/schema/productSchema';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const db = getFirestore(firebaseApp);

export const dynamic = 'force-dynamic';

async function getService(slug: string): Promise<Service | null> {
    const q = query(collection(db, 'services'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    const data = doc.data();

    const serviceData = {
        id: doc.id,
        ...data,
    } as any;

    if (data.createdAt && data.createdAt instanceof Timestamp) {
        serviceData.createdAt = data.createdAt.toDate().toISOString();
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
  const title = service.metaTitle || `${service.title} | My Accountant`;
  const description = service.metaDescription || service.description;
  
  let ogImage = service.seoImageUrl || service.imageUrl || GLOBAL_OG_IMAGE;
  if (ogImage.startsWith('/')) {
    ogImage = `${SITE_URL}${ogImage}`;
  }
 
  return {
    title: title,
    description: description,
    alternates: {
        canonical: canonicalUrl,
    },
    openGraph: {
      title: title,
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
      title: title,
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

      {/* DYNAMIC PREMIUM HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-50 border-b pt-12 pb-16 text-center mb-12 animate-in fade-in">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">{service.category}</Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
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

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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

          <div className="md:col-span-1">
              <ServiceCheckoutForm service={service} />
          </div>
        </div>

        {/* TRUSTINDEX REVIEWS WIDGET */}
        <div className="mt-12">
          <TrustIndexWidget />
        </div>

        {/* DYNAMIC FAQ ACCORDION SECTION (Strictly aligned with Google Search Engine requirements) */}
        {serviceFaqs && serviceFaqs.length > 0 && (
          <div className="mt-16 bg-slate-50 rounded-2xl p-8 border shadow-sm max-w-4xl mx-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground font-semibold">Everything you need to know about our {service.title} solutions.</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full mt-4">
                {serviceFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="border-b">
                    <AccordionTrigger className="text-base font-bold text-slate-900 text-left py-4">
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
    </>
  );
}
