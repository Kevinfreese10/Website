import MonthlyPayrollPageClient from '@/components/payroll/MonthlyPayrollPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Monthly Payroll Services South Africa | EMP201, UIF & Payslips',
        description: 'Outsourced monthly payroll administration for South African businesses. Compliant digital payslips, SARS EMP201 filing, EMP501 recons, and UIF declarations.',
    };
    return getStaticPageMetadata('monthly-payroll', defaults);
}

const monthlyPayrollSchema = generateServicePillarSchema({
  title: 'Outsourced Monthly Payroll Services South Africa',
  description: 'Full-cycle monthly payroll processing, BCEA-compliant digital payslips, monthly EMP201 filing, and bi-annual EMP501 employer reconciliations.',
  slug: '/monthly-payroll',
  serviceType: 'FinancialService',
  priceRange: 'From R550/month',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Payroll Services', url: '/products#payroll' },
    { name: 'Monthly Payroll', url: '/monthly-payroll' }
  ],
  faqs: [
    {
      q: 'What is included in your monthly payroll service?',
      a: 'Our service includes monthly gross-to-net calculations, BCEA-compliant confidential PDF payslips emailed to staff, monthly EMP201 declarations (PAYE, UIF, SDL) submitted to SARS, UIF return submissions via uFiling, and payment file reports.'
    },
    {
      q: 'Do you handle EMP501 employer reconciliations and IRP5 certificates?',
      a: 'Yes. We manage both the interim (September) and annual (May) EMP501 reconciliations on SARS e@syFile, generate tax certificates (IRP5/IT3a), and distribute them directly to your employees.'
    },
    {
      q: 'When must EMP201 returns be submitted to SARS?',
      a: 'EMP201 declarations and payments must reach SARS on or before the 7th day of each following month (or the preceding business day if the 7th falls on a weekend or public holiday).'
    },
    {
      q: 'How many employees can your payroll bureau handle?',
      a: 'We service SMEs ranging from 1 employee up to 250+ employees across South Africa using secure cloud payroll systems.'
    }
  ]
});

export default function MonthlyPayrollPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(monthlyPayrollSchema) }}
      />
      <MonthlyPayrollPageClient />
    </>
  );
}
