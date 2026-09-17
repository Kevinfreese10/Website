import ContactPageClient from '@/components/contact/ContactPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateContactPageSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Contact Us | My Accountant',
        description: 'Get in touch with the My Accountant team. Fill out our contact form with your questions or inquiries.',
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
