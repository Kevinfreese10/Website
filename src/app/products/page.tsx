import ProductsPageClient from '@/components/products/ProductsPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Service } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const services = servicesSnapshot.docs.map(doc => {
    const data = doc.data();
    const serviceData = { ...data, id: doc.id } as any;
    // Serialize Firestore Timestamps
    if (data.createdAt && data.createdAt instanceof Timestamp) {
        serviceData.createdAt = data.createdAt.toDate().toISOString();
    }
    return serviceData as Service;
  });

  const categoriesSnapshot = await getDocs(query(collection(db, "categories"), orderBy("order")));
  const categories = categoriesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "My Accountant Services",
    "description": "Comprehensive accounting, tax, CIPC, and payroll compliance services for South African businesses and individuals.",
    "url": "https://www.myacc.co.za/products",
    "itemListElement": services.map((service, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.myacc.co.za/products/${service.slug}`
    }))
  };

  return (
    <>
      <script
        id="products-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <ProductsPageClient 
          initialServices={services} 
          initialCategories={categories as any} 
      />
    </>
  );
}
