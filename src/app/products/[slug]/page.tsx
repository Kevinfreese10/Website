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

  const isCoop = slug === 'co-operative-society';

  let faqSchema: any = null;
  if (isCoop) {
      const faqData = [
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

      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      };
  }

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {faqSchema && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {isCoop && (
        <section className="relative w-full overflow-hidden bg-slate-50 border-b pt-12 pb-16 text-center mb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge variant="secondary" className="mb-4 uppercase tracking-wider">{service.category}</Badge>
            <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Co-operative Society <span className="text-gradient">Registration & Compliance</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
              Establish a democratically-owned business in South Africa with our complete, hassle-free CIPC registration, constitution drafting, and compliance setup.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-semibold">
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-primary" /> {service.turnaroundTime}</span>
              <span className="flex items-center text-primary text-lg font-extrabold">{formatPrice(service.price)}</span>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-12">
          {!isCoop && (
            <div className="text-center mb-8">
                <TrustIndexWidget />
            </div>
          )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-8 md:col-span-2">
              
            {!isCoop && (
              <div className="space-y-3">
                <Badge variant="secondary" className="w-fit">{service.category}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{service.title}</h1>
                 {service.isPriceTbc ? (
                  <p className="text-2xl font-bold text-muted-foreground">Price on request</p>
                ) : (
                  <p className="text-3xl font-bold text-primary">{formatPrice(service.price)}</p>
                )}
                <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1.5" />
                    <span className="text-sm font-medium">{service.turnaroundTime}</span>
                </div>
              </div>
            )}
            
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

        {/* FAQ SECTION (Strictly aligned with Google Search Engine requirements) */}
        {isCoop && (
          <div className="mt-16 bg-slate-50 rounded-2xl p-8 border shadow-sm max-w-4xl mx-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground font-semibold">Everything you need to know about South African Co-operative Society registration and compliance.</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="faq-1" className="border-b">
                  <AccordionTrigger className="text-base font-bold text-slate-900 text-left py-4">
                    What is a Co-operative Society in South Africa?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                    A Co-operative Society is a democratic business model owned and run by its members, who share the profits and benefits. In South Africa, co-operatives are registered with the CIPC (Companies and Intellectual Property Commission) and governed by the Co-operatives Act.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2" className="border-b">
                  <AccordionTrigger className="text-base font-bold text-slate-900 text-left py-4">
                    How many members are required to form a Co-operative?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                    A primary co-operative requires a minimum of <strong>5 individual members</strong> to form and register. A secondary co-operative requires a minimum of <strong>2 primary co-operatives</strong> as members.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3" className="border-b">
                  <AccordionTrigger className="text-base font-bold text-slate-900 text-left py-4">
                    What are the requirements to register a Co-operative Society with CIPC?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                    To register, you need: a minimum of 5 members, certified ID copies or smartcard copies of all founding members (not older than 3 months), a completed Co-op Form 1, a constitution signed by all members, and a CIPC name reservation confirmation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4" className="border-b">
                  <AccordionTrigger className="text-base font-bold text-slate-900 text-left py-4">
                    What are the tax compliance obligations for a Co-operative?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-4">
                    Co-operatives are registered for Income Tax with SARS. They are required to submit annual tax returns (IT14SD/IT12EI) and may qualify for special tax deductions or small business tax rates depending on their sector and operations.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
