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
        title: 'Our Products | My Accountant',
        description: 'Comprehensive solutions to meet all your financial needs. We offer a range of services for individuals and businesses.',
    };
    return getStaticPageMetadata('products', defaults);
}

export default async function ProductsPage() {
  // Fetch data server-side for bot discovery and SEO
  const servicesSnapshot = await getDocs(query(collection(db, "services"), orderBy("title")));
  const rawServices = servicesSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  }));
  const services = toPlainObject(rawServices) as Service[];

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
