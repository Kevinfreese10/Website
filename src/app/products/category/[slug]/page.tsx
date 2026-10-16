import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getAdminDb, serializeDbData } from '@/lib/firebase-admin';
import { Service } from '@/lib/types';
import { CATEGORIES_LIST, getCategoryBySlug } from '@/lib/categories';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  ArrowRight, 
  CalendarDays, 
  CheckCircle2, 
  ChevronRight, 
  FolderCheck, 
  Home, 
  ShieldCheck, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const revalidate = 900;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES_LIST.map((cat) => ({
    slug: cat.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found | My Accountant',
    };
  }

  const canonicalUrl = `${SITE_URL}/products/category/${category.slug}`;
  const fullTitle = `${category.metaTitle} | My Accountant`;

  return {
    title: { absolute: fullTitle },
    description: category.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: category.metaDescription,
      url: canonicalUrl,
      siteName: 'My Accountant',
      locale: 'en_ZA',
      type: 'website',
      images: [
        {
          url: GLOBAL_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: category.metaDescription,
      images: [GLOBAL_OG_IMAGE],
    },
  };
}

async function getCategoryServices(categoryName: string): Promise<Service[]> {
  const db = getAdminDb();
  // Services in Firestore store their category name in data.category
  const snap = await db.collection('services').get();
  const lowerName = categoryName.toLowerCase().trim();

  const services = snap.docs
    .map((doc) => {
      const d = serializeDbData(doc.data());
      const rawDesc = String(d.description || d.metaDescription || '');
      const description = rawDesc.length > 220 ? `${rawDesc.slice(0, 217).trimEnd()}...` : rawDesc;
      return {
        id: doc.id,
        slug: d.slug,
        title: d.title,
        price: d.price,
        pricingType: d.pricingType,
        isPriceTbc: Boolean(d.isPriceTbc || d.pricingType === 'tbc'),
        category: d.category,
        description,
        turnaroundTime: d.turnaroundTime,
        popular: Boolean(d.popular || d.isFeatured),
        isFeatured: Boolean(d.isFeatured || d.popular),
        isActive: d.isActive ?? true,
        order: d.order ?? 0,
        whatsIncluded: Array.isArray(d.whatsIncluded) ? d.whatsIncluded.slice(0, 3) : [],
      } as unknown as Service;
    })
    .filter((s) => {
      const cat = (s.category || '').toLowerCase().trim();
      return cat === lowerName || cat.includes(lowerName) || lowerName.includes(cat);
    });

  // Sort by price ascending or title
  return services.sort((a, b) => (a.price || 0) - (b.price || 0));
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const services = await getCategoryServices(category.name);

  // Structured Data (CollectionPage + BreadcrumbList + ItemList)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services & Products',
        item: `${SITE_URL}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${SITE_URL}/products/category/${category.slug}`,
      },
    ],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} in South Africa`,
    description: category.metaDescription,
    url: `${SITE_URL}/products/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: services.length,
      itemListElement: services.map((s, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_URL}/products/${s.slug}`,
        name: s.title,
        description: s.metaDescription || s.description,
      })),
    },
  };

  const otherCategories = CATEGORIES_LIST.filter((c) => c.slug !== category.slug);

  return (
    <div className="w-full bg-background flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="container mx-auto px-4 max-w-6xl">
          <ol className="flex items-center space-x-2 text-xs text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
            </li>
            <li><ChevronRight className="h-3 w-3 text-slate-400" /></li>
            <li>
              <Link href="/products" className="hover:text-foreground">
                Services
              </Link>
            </li>
            <li><ChevronRight className="h-3 w-3 text-slate-400" /></li>
            <li className="font-semibold text-foreground truncate">{category.name}</li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white py-12 md:py-16 border-b border-slate-200/80">
        <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4 uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
            <FolderCheck className="h-3.5 w-3.5 mr-1" />
            Service Category
          </Badge>
          <h1 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl font-headline text-slate-900">
            {category.name} <span className="text-primary">in South Africa</span>
          </h1>
          <p className="mx-auto mb-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            {category.description}. Order online with guaranteed turnaround times and expert oversight by licensed practitioners.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{services.length} services available with transparent fixed pricing</span>
          </div>
        </div>
      </section>

      <div className="text-center my-6">
        <TrustIndexWidget />
      </div>

      {/* Services Grid */}
      <main className="container mx-auto px-4 max-w-6xl py-8 flex-grow">
        {services.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground font-medium text-lg">No services currently listed under this category.</p>
            <Button asChild variant="outline">
              <Link href="/products">Browse All Services</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className="flex flex-col overflow-hidden transition-all duration-300 border border-slate-200 bg-white hover:shadow-lg hover:border-primary/40 group"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {category.name}
                    </span>
                    {service.turnaroundTime && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <CalendarDays className="h-3 w-3" />
                        {service.turnaroundTime}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
                    <Link href={`/products/${service.slug}`}>
                      {service.title}
                    </Link>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-grow space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {service.metaDescription || service.description}
                  </p>

                  {service.whatsIncluded && service.whatsIncluded.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">Included:</span>
                      {service.whatsIncluded.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">Fee</span>
                    <span className="text-lg font-black text-slate-900">
                      {service.isPriceTbc ? 'Price on Request' : formatPrice(service.price)}
                    </span>
                  </div>
                  <Button asChild size="sm" className="font-bold rounded-lg shadow-xs group-hover:translate-x-0.5 transition-transform">
                    <Link href={`/products/${service.slug}`} className="flex items-center gap-1.5">
                      <span>View Service</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Category FAQ & Info Card */}
        <section className="mt-16 p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Why Choose My Accountant for {category.name}?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Certified Practitioners</h3>
              <p>
                All filings and registrations are completed by licensed SARS Tax Practitioners and CIBA/SAIT members, ensuring strict compliance with South African legislation.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Transparent Fixed Pricing</h3>
              <p>
                No unexpected hourly retainers or hidden fees. Every service in our catalog includes full preparation, client portal tracking, and official regulatory submissions.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">100% Online Workflows</h3>
              <p>
                Upload your statutory documents securely from your phone or desktop. We manage the CIPC, SARS, NCR, or Department of Labour processes end-to-end.
              </p>
            </div>
          </div>
        </section>

        {/* Cross-Link Other Categories */}
        <section className="mt-12 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Explore Other Service Categories</h2>
          <div className="flex flex-wrap gap-2">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/products/category/${c.slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition-colors shadow-2xs"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
