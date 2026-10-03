import RemissionOfFinesPageClient from '@/components/sars/RemissionOfFinesPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'SARS Fines & Penalty Remission (RFR01) | My Accountant',
        description: 'Apply for a SARS Request for Remission (RFR01) under Chapter 15 of the Tax Administration Act to waive Section 211 administrative penalties and interest.',
    };
    return getStaticPageMetadata('remission-of-fines', defaults);
}

const remissionFaqs = [
  {
    q: 'What is a SARS Request for Remission (RFR01)?',
    a: 'A Request for Remission (RFR01) is the formal statutory process under Chapter 15 of the Tax Administration Act 28 of 2011 (TAA) whereby a taxpayer requests the SARS Commissioner to remit (waive or cancel) administrative non-compliance penalties, late payment penalties, or accrued interest charges assessed against their tax account.'
  },
  {
    q: 'How are Section 211 fixed-amount monthly administrative penalties calculated?',
    a: 'Under Section 211 of the TAA, SARS imposes a recurring monthly administrative penalty for each month a required tax return remains unsubmitted (up to 35 months). The penalty amount ranges from R250 per month (for assessed loss or taxable income under R250k) up to R16,000 per month (for taxable income exceeding R50M). If an unfiled return spans multiple months, penalties accumulate rapidly into tens of thousands of Rands.'
  },
  {
    q: 'What grounds qualify for remission under Section 217 (nominal non-compliance / first incidence)?',
    a: 'Under Section 217 of the TAA, SARS may remit a fixed-amount penalty if the taxpayer has remedied the non-compliance (filed the outstanding return or paid the debt) AND either: (1) it is a first incidence of non-compliance in the preceding 36 months, (2) the duration of non-compliance was under 5 business days with reasonable cause, or (3) the total penalty is less than R2,000 and reasonable grounds for the failure existed.'
  },
  {
    q: 'What constitutes "exceptional circumstances" under Section 218 of the Tax Administration Act?',
    a: 'Section 218 authorizes SARS to remit penalties if the failure resulted from extraordinary circumstances beyond the taxpayer\'s control, including: natural or human-made disasters; civil disturbance or public violence; serious illness or physical accident affecting the taxpayer or key financial personnel; profound psychological distress or bereavement; documented SARS eFiling system errors or official website downtime; or postal and third-party delivery delays.'
  },
  {
    q: 'What is the procedure if SARS disallows or rejects my Request for Remission?',
    a: 'SARS is required to issue an outcome letter within 21 business days. If SARS disallows the RFR in whole or in part, the taxpayer has the statutory right under Section 104 of the TAA to lodge a formal Notice of Objection (DISP01) within 30 business days of the outcome date, citing legal and factual grounds to the SARS Dispute Resolution division.'
  }
];

const remissionOfFinesSchema = generateServicePillarSchema({
  title: 'SARS Remission of Fines, Penalties & Interest (RFR01)',
  description: 'Apply for a SARS Request for Remission under Chapter 15 of the Tax Administration Act to dispute and waive administrative non-compliance penalties and late payment charges.',
  slug: '/remission-of-fines',
  serviceType: 'TaxConsultant',
  priceRange: 'From R1,850',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'Remission of Fines', url: '/remission-of-fines' }
  ],
  faqs: remissionFaqs
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
