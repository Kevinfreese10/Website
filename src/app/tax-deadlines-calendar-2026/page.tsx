import { Metadata } from 'next';
import { Calendar } from 'lucide-react';
import PageHero from '@/components/shared/PageHero';

export const metadata: Metadata = {
  title: 'Tax Deadlines Calendar 2026 | My Accountant',
  description: 'Stay compliant with our 2026 calendar of important SARS tax compliance dates for businesses and individuals.',
};

export default function TaxDeadlinesPage() {
  const deadlines = [
    { date: "7th of every month", description: "PAYE, UIF, and SDL submissions and payments due (EMP201)." },
    { date: "25th of every month", description: "VAT submissions and payments for manual filers." },
    { date: "Last business day of the month", description: "VAT submissions and payments via eFiling." },
    { date: "End of February", description: "First provisional tax payment for companies with a Feb year-end; Second provisional tax payment for individuals." },
    { date: "End of August", description: "First provisional tax payment for individuals; Second provisional tax payment for companies with a Feb year-end." },
    { date: "October", description: "Individual income tax return (ITR12) deadline for non-provisional taxpayers filing via eFiling." },
    { date: "January 2027", description: "Individual income tax return (ITR12) deadline for provisional taxpayers." }
  ];

  return (
    <div className="bg-background min-h-screen pb-16">
      <PageHero
        badgeText="SARS Compliance Calendar"
        badgeIcon={<Calendar className="h-3.5 w-3.5 text-primary animate-pulse" />}
        title={
          <>
            SARS Tax Deadlines <span className="text-gradient">Calendar 2026</span>
          </>
        }
        subtitle="Missing a SARS deadline can result in severe penalties and interest. Keep track of crucial dates to ensure your business remains fully compliant."
        primaryCta={{ text: 'Book Free Tax Consultation', href: '/contact' }}
        secondaryCta={{ text: 'View Tax Services', href: '/products#sars-services' }}
        showCredibilityRibbon={true}
      />

      <main className="container mx-auto px-4 py-12 max-w-4xl">

      <div className="relative border-l-4 border-blue-100 ml-4 pl-8 space-y-12">
        {deadlines.map((item, index) => (
          <div key={index} className="relative">
            <span className="absolute -left-[42px] bg-blue-600 rounded-full w-5 h-5 border-4 border-white" />
            <h3 className="text-2xl font-bold text-blue-700 mb-2">{item.date}</h3>
            <p className="text-slate-700 text-lg">{item.description}</p>
          </div>
        ))}
      </div>
    </main>
    </div>
  );
}
