import { getPartnerBySlug, getService, getPartnerOverride } from '@/lib/firebase-admin';
import { User, Service } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Clock, ClipboardCheck, BadgeCheck, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ServiceCheckoutForm from '@/components/checkout/ServiceCheckoutForm';
import PrerequisitesList from '@/components/products/PrerequisitesList';
import ProductPageInteractiveContainer from '@/components/products/ProductPageInteractiveContainer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, serviceSlug: string }> }): Promise<Metadata> {
  const { slug, serviceSlug } = await params;
  const [partner, rawService] = await Promise.all([
    getPartnerBySlug(slug),
    getService(serviceSlug)
  ]);

  if (!partner || !rawService) return { title: 'Product Not Found' };

  const override = await getPartnerOverride(partner.id, rawService.id);
  const title = override?.metaTitle || `${override?.title || rawService.title} | ${partner.companyName || partner.name}`;
  const description = override?.metaDescription || override?.description || rawService.metaDescription || rawService.description;
  const ogImage = partner.landingPage?.heroImageUrl || rawService.imageUrl || GLOBAL_OG_IMAGE;

  return {
    title: title,
    description: description,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      // Point canonical to the main product page — this makes the main page
      // the authoritative source and consolidates all ranking signals there.
      canonical: `${SITE_URL}/products/${serviceSlug}`,
    },
    openGraph: {
        title,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
    }
  };
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default async function PartnerProductDetailPage({ params }: { params: Promise<{ slug: string, serviceSlug: string }> }) {
  const { slug, serviceSlug } = await params;
  const [partner, rawService] = await Promise.all([
    getPartnerBySlug(slug),
    getService(serviceSlug)
  ]);

  if (!partner || !rawService) {
    notFound();
  }

  const lp = partner.landingPage;
  const override = await getPartnerOverride(partner.id, rawService.id);

  const service = override ? {
      ...rawService,
      ...override,
      title: override.title || rawService.title,
      price: override.price ?? rawService.price,
      description: override.description || rawService.description,
      longDescription: override.longDescription || rawService.longDescription,
      turnaroundTime: override.turnaroundTime || rawService.turnaroundTime,
  } : rawService;

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8 hover:partner-text">
          <Link href={`/p/${slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Link>
        </Button>

        <ProductPageInteractiveContainer
          service={service}
          partnerId={partner.id}
          clientRequirements={service.clientRequirements}
        />
      </div>
    </>
  );
}
