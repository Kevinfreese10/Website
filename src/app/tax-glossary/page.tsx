import { Metadata } from 'next';
import PageHero from '@/components/shared/PageHero';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Tax Glossary',
  description: 'Understand common tax terms and definitions with our comprehensive South African tax glossary.',
  alternates: {
    canonical: `${SITE_URL}/tax-glossary`,
  },
};

export default function TaxGlossaryPage() {
  const glossaryTerms = [
    { term: "Capital Gains Tax (CGT)", definition: "A tax levied on the profit made from the disposal of a capital asset." },
    { term: "PAYE (Pay As You Earn)", definition: "The system whereby employers are required to deduct income tax from their employees' salaries." },
    { term: "Provisional Tax", definition: "A method of paying income tax in advance to ensure the taxpayer does not have a large tax debt on assessment." },
    { term: "Value-Added Tax (VAT)", definition: "An indirect tax on the consumption of goods and services in the economy." },
    { term: "Turnover Tax", definition: "A simplified tax system for micro-businesses with a qualifying turnover of up to R1 million per year." },
    { term: "Input VAT", definition: "VAT that a vendor pays on goods and services acquired for the business." },
    { term: "Output VAT", definition: "VAT that a vendor charges on the sale of goods and services." },
  ];

  return (
    <div className="bg-background min-h-screen pb-16">
      <PageHero
        badgeText="Tax Reference Guide"
        title={
          <>
            South African <span className="text-gradient">Tax Glossary</span>
          </>
        }
        subtitle="Navigate the complexities of South African tax law with our easy-to-understand glossary of common terms."
        primaryCta={{ text: 'Book Free Consultation', href: '/contact' }}
        secondaryCta={{ text: 'View Tax Services', href: '/products#sars-services' }}
        showCredibilityRibbon={true}
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          {glossaryTerms.map((item, index) => (
            <div key={index} className="p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow glass-card">
              <h3 className="text-xl font-bold text-foreground mb-2">{item.term}</h3>
              <p className="text-muted-foreground">{item.definition}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
