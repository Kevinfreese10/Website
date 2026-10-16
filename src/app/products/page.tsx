import ProductsPageClient from '@/components/products/ProductsPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service } from '@/lib/types';
import { toPlainObject } from '@/lib/serialize-firestore';
import { generateCatalogOffersSchema } from '@/lib/schema/productSchema';

export const revalidate = 900;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Online Accounting, Tax & CIPC Compliance Services | My Accountant',
        description: 'Browse our complete catalog of South African accounting, tax clearance, VAT, payroll, CIPC company registration, and compliance services at transparent fixed fees.',
    };
    return getStaticPageMetadata('products', defaults);
}

export default async function ProductsPage() {
  // Fetch data server-side for bot discovery and SEO
  const servicesSnapshot = await getDocs(query(collection(db, "services"), orderBy("title")));
  const rawServices = servicesSnapshot.docs.map(doc => {
    const d = doc.data();
    const rawDesc = String(d.description || '');
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
    };
  });
  const services = toPlainObject(rawServices) as unknown as Service[];

  const categoriesSnapshot = await getDocs(query(collection(db, "categories"), orderBy("order")));
  const rawCategories = categoriesSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  }));
  const categories = toPlainObject(rawCategories);

  const catalogSchema = generateCatalogOffersSchema(services);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
      />
      <ProductsPageClient 
          initialServices={services} 
          initialCategories={categories as any} 
      />
    </>
  );
}
