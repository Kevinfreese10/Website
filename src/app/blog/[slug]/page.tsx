import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BlogPost, Service } from '@/lib/types';
import { getAdminDb } from '@/lib/firebase-admin';
import { format } from 'date-fns';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SITE_URL, GLOBAL_OG_IMAGE, LOGO_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';
import { CURATED_BLOG_FAQS } from '@/lib/blog-faqs';
import BlogContextualCta, { hasContextualCta } from '@/components/blog/BlogContextualCta';

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

// Helper to estimate read time
const calculateReadTime = (content: string | undefined) => {
    if (!content) return 1;
    const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
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
  const fallbackFaqs = [
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

  // Resolve FAQs: post.faqs || CURATED_BLOG_FAQS[post.slug] || fallbackFaqs
  const rawPostFaqs = (post as any).faqs;
  const postFaqs: { q: string; a: string }[] = (rawPostFaqs && rawPostFaqs.length > 0)
    ? rawPostFaqs.map((f: any) => ({
        q: f.q || f.question || '',
        a: f.a || f.answer || '',
      }))
    : (CURATED_BLOG_FAQS[post.slug] || fallbackFaqs);

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${postUrl}#breadcrumb`,
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
        "name": "Tax Tip Blog",
        "item": `${SITE_URL}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  };

  const faqSchema = {
    "@type": "FAQPage",
    "@id": `${postUrl}#faq`,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`
    },
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
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
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
      "@id": `${SITE_URL}/#kevin-freese`,
      "name": "Kevin Freese",
      "jobTitle": "Managing Director & Senior Accountant",
      "url": `${SITE_URL}`,
      "worksFor": {
        "@id": `${SITE_URL}/#organization`
      },
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
      "@id": `${SITE_URL}/#organization`,
      "name": "My Accountant",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#logo`,
        "url": LOGO_URL,
        "contentUrl": LOGO_URL
      }
    }
  };

  const blogPostGraph = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbSchema,
      faqSchema,
      articleSchema
    ]
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostGraph) }}
      />
      
      {/* DYNAMIC PREMIUM HERO SECTION */}
      <section className="relative w-full bg-white border-b pt-20 pb-24 animate-in fade-in">
        <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80" />
        
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest font-extrabold bg-blue-50 text-blue-700 px-3 py-1">Tax Tip Blog</Badge>
            
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-slate-900">
              {firstPart} {secondPart && <span className="text-gradient from-blue-600 to-indigo-600">{secondPart}</span>}
            </h1>
            
            <p className="max-w-2xl text-lg font-medium text-slate-600 md:text-xl leading-relaxed">
              {post.excerpt}
            </p>
            
            {/* Author & Meta Block */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden shadow-md border-2 border-white">
                  <Image src="/images/kevin.jpeg" alt="Kevin Freese" width={56} height={56} className="object-cover h-full w-full" unoptimized />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 leading-tight">Kevin Freese</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Chartered Accountant (CIBA, SAIT)</p>
                </div>
              </div>
              
              <div className="hidden sm:block h-10 w-px bg-slate-200" />
              
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                <span>{format(new Date(post.date), 'MMMM d, yyyy')}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-primary" /> {calculateReadTime(post.content)} min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full pt-8 pb-4">
        <TrustIndexWidget />
      </div>

      <article className="container mx-auto max-w-4xl px-4 pb-12 mt-4">
        {/* SHARE WIDGET */}
        <ShareWidget postTitle={post.title} postSlug={post.slug} />

        <div className="relative mb-12 h-64 md:h-[450px] w-full">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="rounded-xl object-cover shadow-2xl border border-slate-200"
            data-ai-hint={post.imageHint}
            priority
          />
        </div>

        <div
          className="prose prose-lg md:prose-xl max-w-none prose-headings:font-headline prose-headings:font-black prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-primary prose-a:font-semibold hover:prose-a:text-primary/80 prose-li:text-slate-700 prose-li:marker:text-primary prose-ul:space-y-2 prose-ol:space-y-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-medium prose-blockquote:text-slate-900 prose-img:rounded-xl prose-img:shadow-lg"
          dangerouslySetInnerHTML={{ 
            __html: (post.content || '')
              .replace(/<h1(\s|>)/gi, '<h2$1')
              .replace(/<\/h1>/gi, '</h2>') 
          }}
          suppressHydrationWarning
        />

        {/* Topic-Specific Contextual CTA for Conversion Funnels */}
        <BlogContextualCta slug={post.slug} />

        {/* Generic Fallback CTA Block for Other Blog Posts */}
        {!hasContextualCta(post.slug) && (
          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white font-headline">Need Expert Help?</h2>
              <p className="text-lg text-slate-300 font-medium">
                Don't let tax compliance slow you down. Book a free consultation today or browse our online store.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 w-full sm:w-auto">
                  <Link href="/contact">Book Free Consultation</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white transition-all duration-300 w-full sm:w-auto backdrop-blur-md">
                  <Link href="/products">Visit Online Store</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ SECTION (Strictly aligned with Google Search Engine requirements) */}
        {postFaqs && postFaqs.length > 0 && (
          <section className="mt-16 bg-slate-50 rounded-xl p-8 border shadow-sm max-w-3xl mx-auto">
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
                        className="flex flex-col overflow-hidden transition-all duration-500 border border-blue-200/90 bg-[#f4f8ff] group shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-primary/40"
                      >
                        <CardHeader className="pb-3 relative">
                            {service.isFeatured && (
                              <div className="absolute top-3 right-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/20">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> Popular
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="w-fit text-[9px] uppercase tracking-wider font-extrabold rounded-md px-2 py-0.5 flex items-center bg-white text-blue-700 border border-blue-200/80 shadow-2xs">
                                  {service.category}
                                </Badge>
                              </div>
                            </div>

                            <CardTitle className="leading-snug text-slate-800 text-[16px] font-black group-hover:text-primary transition-colors duration-300 pr-14">
                              <Link href={`/products/${service.slug}`} className="hover:underline line-clamp-2">
                                {service.title}
                              </Link>
                            </CardTitle>

                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="flex items-center text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400" />
                                <Star className="h-3 w-3 fill-amber-400" />
                                <Star className="h-3 w-3 fill-amber-400" />
                                <Star className="h-3 w-3 fill-amber-400" />
                                <Star className="h-3 w-3 fill-amber-400" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {service.aggregateRatingValue || "5.0"} ({service.reviewCount || "120+"})
                              </span>
                            </div>

                            <div className="mt-3 flex items-start justify-between gap-2">
                              <div>
                                {service.isPriceTbc ? (
                                  <span className="text-xl font-black text-slate-900 leading-none block">Price on Request</span>
                                ) : (
                                  <span className="text-xl font-black text-slate-900 leading-none block">
                                    {formatPrice(service.price)}
                                  </span>
                                )}
                              </div>  
                              <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                                <Clock className="h-3.5 w-3.5 text-emerald-600 flex-none" />
                                <span className="text-[11px] font-bold text-emerald-700">{service.turnaroundTime}</span>
                              </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-grow pt-0 pb-3">
                            {service.whatsIncluded && service.whatsIncluded.length > 0 ? (
                              <div className="mt-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">What's Included</p>
                                <ul className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                                  {service.whatsIncluded.slice(0, 3).map((item, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="h-1.5 w-1.5 mr-2 mt-1.5 bg-emerald-600 flex-none rounded-full" />
                                      <span className="line-clamp-1">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mt-1">{service.description}</p>
                            )}
                        </CardContent>

                        <CardFooter className="pt-0 pb-4 flex gap-2">
                            <Button
                              asChild
                              size="sm"
                              variant="default"
                              className="flex-1 font-bold h-10 text-xs rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Link href={`/products/${service.slug}`} className="group/btn flex items-center justify-center gap-1">
                                {service.isPriceTbc ? "Get a Quote" : "View Service & Prerequisites"}
                                <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                              </Link>
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
