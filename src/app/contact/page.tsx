import ContactPageClient from '@/components/contact/ContactPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateContactPageSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Contact My Accountant | Randburg, Johannesburg Office',
        description: 'Contact My Accountant in Darrenwood, Randburg (010 109 1625 or info@myacc.co.za) for CIBA & SARS accredited accounting, tax, payroll, and CIPC support.',
    };
    return getStaticPageMetadata('contact', defaults);
}

export default function ContactPage() {
  const contactSchema = generateContactPageSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <ContactPageClient />
    </>
  );
}
