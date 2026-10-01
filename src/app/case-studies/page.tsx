import { Metadata } from 'next';
import { Star } from 'lucide-react';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Client Case Studies & Testimonials',
  description: 'Read real success stories and case studies from businesses and individuals who have transformed their accounting with My Accountant.',
  alternates: {
    canonical: `${SITE_URL}/case-studies`,
  },
};

import PageHero from '@/components/shared/PageHero';

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      company: "TechFlow Solutions",
      industry: "Software Development",
      challenge: "Rapid expansion led to severe bookkeeping backlogs and non-compliance with VAT regulations.",
      solution: "Implemented automated cloud accounting and reconstructed 18 months of financial records within 30 days.",
      result: "Saved R45,000 in potential SARS penalties and gained real-time financial visibility.",
      author: "David M., CEO"
    },
    {
      company: "The Green Café",
      industry: "Hospitality",
      challenge: "Struggling with manual payroll processing and high staff turnover complexity.",
      solution: "Migrated to a fully managed payroll system with automated PAYE/UIF submissions.",
      result: "Reduced administrative time by 15 hours per week and achieved 100% payroll accuracy.",
      author: "Sarah J., Owner"
    },
    {
      company: "Global Importers Ltd",
      industry: "Retail & E-commerce",
      challenge: "Complex cross-border transactions causing tax inefficiencies and cash flow bottlenecks.",
      solution: "Restructured the corporate entity and optimized import tax claiming procedures.",
      result: "Improved cash flow by 22% through strategic tax planning and timely VAT refunds.",
      author: "Michael K., Director"
    }
  ];

  return (
    <div className="bg-background min-h-screen pb-16">
      <PageHero
        badgeText="Real Business Impact"
        title={
          <>
            Client <span className="text-gradient">Success Stories</span>
          </>
        }
        subtitle="Discover how we help South African businesses overcome complex financial challenges and achieve sustainable growth."
        primaryCta={{ text: 'Book Free Consultation', href: '/contact' }}
        secondaryCta={{ text: 'View All Services', href: '/products' }}
        showCredibilityRibbon={true}
      />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-16">
          <TrustIndexWidget />
        </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {caseStudies.map((study, index) => (
          <div key={index} className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col">
            <div className="flex text-amber-400 mb-4">
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
              <Star className="fill-current w-5 h-5" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{study.company}</h3>
            <p className="text-sm font-semibold text-blue-600 mb-6 uppercase tracking-wider">{study.industry}</p>
            
            <div className="space-y-4 flex-grow">
              <div>
                <strong className="text-slate-900 block mb-1">The Challenge:</strong>
                <p className="text-slate-600 text-sm leading-relaxed">{study.challenge}</p>
              </div>
              <div>
                <strong className="text-slate-900 block mb-1">Our Solution:</strong>
                <p className="text-slate-600 text-sm leading-relaxed">{study.solution}</p>
              </div>
              <div>
                <strong className="text-slate-900 block mb-1">The Result:</strong>
                <p className="text-emerald-700 font-medium text-sm leading-relaxed">{study.result}</p>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-100">
              <p className="font-bold text-slate-800">{study.author}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
    </div>
  );
}
