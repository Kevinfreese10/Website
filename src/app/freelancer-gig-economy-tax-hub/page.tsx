import { Metadata } from 'next';
import { Laptop, CheckCircle2, FileText, Globe, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import PageHero from '@/components/shared/PageHero';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Freelancer & Gig Economy Tax Hub',
  description: 'The ultimate tax and accounting hub for South African freelancers, digital nomads, and independent contractors. Master provisional tax, foreign income, and home office deductions.',
  alternates: {
      canonical: `${SITE_URL}/freelancer-gig-economy-tax-hub`,
  },
  openGraph: {
    title: 'Freelancer & Gig Economy Tax Hub',
    description: 'The ultimate tax and accounting hub for South African freelancers, digital nomads, and independent contractors.',
    url: `${SITE_URL}/freelancer-gig-economy-tax-hub`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Freelancer Tax Hub' }],
  },
};

export default function FreelancerHubPage() {
  const hubs = [
      {
          title: 'Provisional Tax',
          icon: FileText,
          description: 'Demystifying IRP6 returns, avoiding penalties, and accurately estimating your taxable income as an independent contractor.'
      },
      {
          title: 'Foreign Income',
          icon: Globe,
          description: 'Navigating the taxation of offshore earnings, remote work for overseas clients, and claiming the correct foreign tax credits.'
      },
      {
          title: 'Home Office Expenses',
          icon: Laptop,
          description: 'Understanding what you can legitimately claim from SARS, from internet and rent to equipment depreciation.'
      },
      {
          title: 'Sole Prop vs PTY (Ltd)',
          icon: PiggyBank,
          description: 'Deciding when it is most tax-efficient to incorporate your freelance business as a formal company.'
      }
  ];

  return (
    <div className="space-y-16 pb-16 bg-background">
      <PageHero
        badgeText="Freelancer & Remote Worker Hub"
        title={
          <>
            The Freelancer &amp; <span className="text-gradient">Gig Economy Tax Hub</span>
          </>
        }
        subtitle="Everything South African freelancers, digital nomads, and remote workers need to know about navigating SARS, foreign income, and running a lean independent business."
        primaryCta={{ text: 'Get Expert Tax Help', href: '/contact' }}
        secondaryCta={{ text: 'View All Tax Services', href: '/products#sars-services' }}
        showCredibilityRibbon={true}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Master Your Independent Finances</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Working for yourself offers incredible freedom, but it also means you are solely responsible for your tax compliance. We've built this hub to give you the clarity you need.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hubs.map((hub, i) => (
                  <Card key={i} className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                              <hub.icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-xl font-bold">{hub.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-muted-foreground">{hub.description}</p>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl pt-8">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 md:p-12 text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Need personalized advice?</h3>
              <p className="text-lg text-slate-700 mb-8 max-w-xl mx-auto">
                  Our accountants specialize in helping independent professionals structure their taxes efficiently and remain 100% compliant with SARS.
              </p>
              <Button asChild size="lg" className="font-bold">
                  <Link href="/contact">Book a Free Consultation</Link>
              </Button>
          </div>
      </section>
    </div>
  );
}
