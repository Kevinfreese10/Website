import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BlogPost, Service } from '@/lib/types';
import { getAdminDb } from '@/lib/firebase-admin';
import { format } from 'date-fns';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';
import Script from 'next/script';

export const revalidate = 1800;

async function getPost(slug: string): Promise<BlogPost | null> {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection('blogPosts').where('slug', '==', slug).get();
    if (snap.empty) {
        return null;
    }
    const docData = snap.docs[0].data();
    
    const date = docData.date?.toDate ? docData.date.toDate().toISOString() : docData.date;
    
    return {
        ...docData,
        id: snap.docs[0].id,
        date: date,
    } as BlogPost;
}

async function getRelatedServices(serviceIds: string[]): Promise<Service[]> {
  if (!serviceIds || serviceIds.length === 0) {
    return [];
  }
  const adminDb = getAdminDb();
  const snap = await adminDb.collection('services').where('__name__', 'in', serviceIds).get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
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
  const rawTitle = post.metaTitle || `${post.title} | My Accountant`;
  
  // Strip " | My Accountant" suffix if present to prevent duplication by the layout's title.template
  const title = rawTitle.endsWith(' | My Accountant')
    ? rawTitle.slice(0, -' | My Accountant'.length)
    : rawTitle;
    
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
      title: rawTitle,
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`
    },
    "headline": post.title,
    "description": post.metaDescription || post.excerpt,
    "image": [
      post.seoImageUrl || post.imageUrl || GLOBAL_OG_IMAGE
    ],
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": "Kevin Freese",
      "jobTitle": "Managing Director & Senior Accountant",
      "url": `${SITE_URL}`,
      "hasCredential": [
        {
          "@type": "EducationalOccupationalCredential",
          "name": "Chartered Business Accountant in Practice",
          "credentialCategory": "Professional Designation",
          "recognizedBy": {
            "@type": "Organization",
            "name": "Chartered Institute for Business Accountants (CIBA)"
          },
          "identifier": "CIBA201509-5372"
        },
        {
          "@type": "EducationalOccupationalCredential",
          "name": "General Tax Practitioner (SA)™",
          "credentialCategory": "Professional Tax Designation",
          "recognizedBy": {
            "@type": "Organization",
            "name": "South African Institute of Taxation (SAIT)"
          },
          "identifier": "47011519"
        },
        {
          "@type": "EducationalOccupationalCredential",
          "name": "Registered SARS Tax Practitioner",
          "credentialCategory": "Tax Authority Registration",
          "recognizedBy": {
            "@type": "GovernmentOrganization",
            "name": "South African Revenue Service (SARS)"
          },
          "identifier": "PR-0098553"
        }
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "My Accountant",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/logo.png`
      }
    }
  };

  const isKevin = true; // Globally override to Kevin Freese as requested by the user

  // Split title to dynamically add a gorgeous homepage-style text gradient
  const titleWords = post.title.split(' ');
  let firstPart = post.title;
  let secondPart = '';
  
  if (titleWords.length > 1) {
      const splitIndex = Math.ceil(titleWords.length / 2);
      firstPart = titleWords.slice(0, splitIndex).join(' ');
      secondPart = titleWords.slice(splitIndex).join(' ');
  }

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      
      {/* DYNAMIC PREMIUM HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-50 border-b pt-16 pb-20 text-center animate-in fade-in">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider">Tax Tip Blog</Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-hero-gradient pb-2">
            {firstPart} {secondPart && <span className="text-gradient">{secondPart}</span>}
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground font-semibold">
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-900 leading-tight">
                Kevin Freese (Chartered Business Accountant & Registered Tax Practitioner)
              </p>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                CIBA (SBA Practitioner) | SAIT (General Tax Practitioner SA)
              </p>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-primary" /> {format(new Date(post.date), 'dd/MM/yyyy')}</span>
          </div>
        </div>
      </section>

      <article className="container mx-auto max-w-4xl px-4 py-12">
        <div className="relative my-8 h-64 md:h-[450px] w-full">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="rounded-xl object-cover shadow-xl border"
            data-ai-hint={post.imageHint}
            priority
          />
        </div>

        <div
          className="prose prose-lg max-w-none prose-h3:font-headline prose-h3:text-xl prose-h3:font-semibold prose-p:text-foreground/80 prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: post.content }}
          suppressHydrationWarning
        />

        {/* PROMINENT CTA BLOCK TO REDIRECT TRAFFIC */}
        <div className="my-16 bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 shadow-sm text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-foreground font-headline">Need Expert Accounting or Compliance Help?</h2>
            <p className="text-lg text-muted-foreground font-medium">
              Don't let SARS, CIPC, or complex accounting slow your business down. Our team of registered professionals is ready to handle it for you online.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300 w-full sm:w-auto">
                <Link href="/contact">Book Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-bold bg-white hover:bg-slate-50 text-foreground transition-all duration-300 w-full sm:w-auto">
                <Link href="/products">Visit Online Store</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ SECTION (Strictly aligned with Google Search Engine requirements) */}
        {postFaqs && postFaqs.length > 0 && (
          <section className="mt-16 bg-slate-50 rounded-2xl p-8 border shadow-sm max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground font-semibold">Answers to common questions about "{titleClean}".</p>
              </div>
              
              <div className="w-full space-y-6">
          {postFaqs.map((faq, index) => (
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
