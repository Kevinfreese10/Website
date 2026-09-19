import SarsDisputesPageClient from '@/components/sars/SarsDisputesPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'SARS Disputes & Objections (Section 104) | Tax Dispute Resolution',
        description: 'Professional assistance with SARS disputes, Section 104 notices of objection, appeals, and suspension of payment by registered tax practitioners.',
    };
    return getStaticPageMetadata('sars-disputes', defaults);
}

const sarsDisputesSchema = generateServicePillarSchema({
  title: 'SARS Disputes, Objections & Appeals Representation',
  description: 'Expert dispute resolution for SARS audits, Section 104 Notice of Objections, Section 107 appeals, and payment suspension requests.',
  slug: '/sars-disputes',
  serviceType: 'TaxConsultant',
  priceRange: 'From R2,250',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'SARS Disputes & Objections', url: '/sars-disputes' }
  ],
  faqs: [
    {
      q: 'How long do I have to lodge an objection against a SARS assessment?',
      a: 'Under the Tax Administration Act, you have 30 business days from the date of the assessment or SARS reason letter to submit a formal Notice of Objection (NOO) via eFiling. Late objections require a condonation application proving exceptional circumstances.'
    },
    {
      q: 'What is the "pay now, argue later" rule with SARS?',
      a: 'In South Africa, lodging an objection does not automatically suspend your obligation to pay disputed tax. To prevent SARS from taking enforcement action or debiting your account, a formal Request for Suspension of Payment under Section 164 must be submitted alongside your dispute.'
    },
    {
      q: 'What happens if SARS disallows my objection?',
      a: 'If SARS disallows your objection in whole or in part, you have 30 business days to note an appeal under Section 107 to either the Tax Board (claims up to R1,000,000) or the Tax Court, or opt for Alternative Dispute Resolution (ADR).'
    },
    {
      q: 'Can My Accountant represent me in Alternative Dispute Resolution (ADR)?',
      a: 'Yes. Our registered SARS tax practitioners prepare your ADR documentation, represent your business in hearings, and negotiate a fair settlement with SARS dispute resolution facilitators.'
    }
  ]
});

export default function SarsDisputesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sarsDisputesSchema) }}
      />
      <SarsDisputesPageClient />
    </>
  );
}
