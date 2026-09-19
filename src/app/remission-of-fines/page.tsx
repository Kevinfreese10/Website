import RemissionOfFinesPageClient from '@/components/sars/RemissionOfFinesPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Remission of SARS Fines & Penalties (RFR01) | Tax Penalty Relief',
        description: 'Apply for a SARS Request for Remission (RFR) to waive or reduce administrative non-compliance penalties, late payment penalties, and interest charges.',
    };
    return getStaticPageMetadata('remission-of-fines', defaults);
}

const remissionOfFinesSchema = generateServicePillarSchema({
  title: 'SARS Remission of Fines, Penalties & Interest (RFR01)',
  description: 'Apply for a SARS Request for Remission under Chapter 15 of the Tax Administration Act to dispute and waive administrative non-compliance penalties.',
  slug: '/remission-of-fines',
  serviceType: 'TaxConsultant',
  priceRange: 'From R1,850',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'Remission of Fines', url: '/remission-of-fines' }
  ],
  faqs: [
    {
      q: 'What is a SARS Request for Remission (RFR01)?',
      a: 'A Request for Remission (RFR01) is the statutory process under Chapter 15 of the Tax Administration Act where a taxpayer requests SARS to waive or reduce administrative non-compliance penalties or late submission penalties imposed on their account.'
    },
    {
      q: 'What penalties can SARS legally remit?',
      a: 'SARS can remit fixed-amount administrative penalties (e.g. late return filing), percentage-based late payment penalties (10%), and late payment interest if you prove exceptional circumstances or statutory grounds.'
    },
    {
      q: 'What grounds are accepted for penalty remission?',
      a: 'Accepted grounds include first incidence of non-compliance (remedied within prescribed timeframes), exceptional circumstances beyond your control (serious illness, natural disaster, SARS eFiling system errors, or postal failure), or SARS administrative errors.'
    },
    {
      q: 'What happens if SARS rejects my Request for Remission?',
      a: 'If SARS denies your RFR, you have the statutory right to lodge a formal Section 104 Notice of Objection against the penalty assessment within 30 business days.'
    }
  ]
});

export default function RemissionOfFinesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(remissionOfFinesSchema) }}
      />
      <RemissionOfFinesPageClient />
    </>
  );
}
