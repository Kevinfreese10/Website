import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BlogPost, Service } from '@/lib/types';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { format } from 'date-fns';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';
import Script from 'next/script';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const db = getFirestore(firebaseApp);

export const dynamic = 'force-dynamic';

async function getPost(slug: string): Promise<BlogPost | null> {
    const q = query(collection(db, "blogPosts"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const docData = querySnapshot.docs[0].data();
    
    const date = docData.date?.toDate ? docData.date.toDate().toISOString() : docData.date;
    
    return {
        ...docData,
        id: querySnapshot.docs[0].id,
        date: date,
    } as BlogPost;
}

async function getRelatedServices(serviceIds: string[]): Promise<Service[]> {
  if (!serviceIds || serviceIds.length === 0) {
    return [];
  }
  const servicesRef = collection(db, 'services');
  const q = query(servicesRef, where('__name__', 'in', serviceIds));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
 
  if (!post) {
    return { title: 'Post Not Found' }
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const title = post.metaTitle || `${post.title} | My Accountant`;
  const description = post.metaDescription || post.excerpt;
  
  let ogImage = post.seoImageUrl || post.imageUrl || GLOBAL_OG_IMAGE;
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
      type: 'article',
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: post.seoImageLabel || post.title
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedServices = await getRelatedServices(post.relatedProducts || []);

  // Standard fallback FAQ generator for blog posts
  const titleClean = post.title.replace(/[?.!]/g, "");
  const postFaqs = [
    {
      q: `What is the key takeaway from "${titleClean}"?`,
      a: post.excerpt || `In this article, we explore the essential concepts of "${titleClean}" to help South African businesses and individuals make informed financial decisions.`
    },
    {
      q: `Who can benefit from the advice in "${titleClean}"?`,
      a: `SME owners, freelancers, and taxpayers in South Africa looking to optimize their compliance, reduce tax liability, and streamline their accounting workflows will find this guidance invaluable.`
    },
    {
      q: `How can My Accountant assist with "${titleClean}"?`,
      a: "Our team of qualified Chartered Business Accountants and Tax Practitioners offers complete, online accounting, bookkeeping, VAT submissions, and tax dispute support to keep your business compliant with SARS and CIPC."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": postFaqs.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  const isKevin = true; // Globally override to Kevin Freese as requested by the user

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <article className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{post.title}</h1>
          <div className="mt-6 flex items-center gap-4">
            <div>
              <p className="font-semibold text-slate-900 leading-tight">
                {isKevin ? 'Kevin Freese (Chartered Business Accountant & Registered Tax Practitioner)' : post.author}
              </p>
              {isKevin && (
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                  CIBA (SBA Practitioner) | SAIT (General Tax Practitioner SA)
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Published on {format(new Date(post.date), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </header>
        
        <div className="relative my-8 h-64 md:h-96 w-full">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="rounded-lg object-cover shadow-lg"
            data-ai-hint={post.imageHint}
          />
        </div>

        <div
          className="prose prose-lg max-w-none prose-h3:font-headline prose-h3:text-xl prose-h3:font-semibold prose-p:text-foreground/80 prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
          suppressHydrationWarning
        />

        {/* FAQ SECTION (Strictly aligned with Google Search Engine requirements) */}
        {postFaqs && postFaqs.length > 0 && (
          <section className="mt-16 bg-slate-50 rounded-2xl p-8 border shadow-sm max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground font-semibold">Answers to common questions about "{titleClean}".</p>
              </div>
              
              <Accordion type="single" collapsible className="w-full mt-4">
                {postFaqs.map((faq, index) => (
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
          </section>
        )}
        
        {relatedServices.length > 0 && (
          <section className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">Related Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {relatedServices.map(service => (
                      <Card
                      key={service.id}
                      className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      >
                      <CardHeader>
                          <CardTitle>{service.title}</CardTitle>
                          {service.isPriceTbc ? (
                              <p className="text-xl font-bold text-muted-foreground pt-2">Price on request</p>
                          ) : (
                              <p className="text-2xl font-bold text-primary pt-2">{formatPrice(service.price)}</p>
                          )}
                          <div className="flex items-center text-muted-foreground pt-1">
                              <Clock className="h-4 w-4 mr-1.5" />
                              <span className="text-xs font-medium">{service.turnaroundTime}</span>
                          </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <CardDescription>{service.description}</CardDescription>
                      </CardContent>
                      <CardFooter>
                          <Button asChild className="w-full">
                          <Link href={`/products/${service.slug}`}>Learn More</Link>
                          </Button>
                      </CardFooter>
                      </Card>
                  ))}
              </div>
          </section>
        )}

      </article>
    </>
  );
}
