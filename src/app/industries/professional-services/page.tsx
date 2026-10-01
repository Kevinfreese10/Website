import { Metadata } from 'next';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Accounting for Professional Services & Agencies',
  description: 'Accounting, tax, and trust account management for consultants, marketing agencies, lawyers, and professional services firms in South Africa.',
  alternates: {
      canonical: `${SITE_URL}/industries/professional-services`,
  },
  openGraph: {
    title: 'Accounting for Professional Services & Agencies',
    description: 'Accounting, tax, and trust account management for professional services firms in South Africa.',
    url: `${SITE_URL}/industries/professional-services`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Professional Services Accounting' }],
  },
};

export default function ProfessionalServicesIndustryPage() {
  const benefits = [
      'Billable hours and project profitability tracking',
      'Trust account management and reconciliation',
      'Retainer billing automation',
      'Dividend planning and director tax structuring'
  ];

  const specialServices = [
      'Professional indemnity insurance advisory',
      'Partnership and shareholder agreement structuring',
      'Software integration for agency management tools',
      'Cash flow forecasting for project-based businesses'
  ];

  return (
    <div className="space-y-16 pb-16">
      <section className="bg-slate-50 text-slate-900 py-20 lg:py-32 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center">
            <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
                <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl max-w-4xl mx-auto text-hero-gradient pb-2">
                Accounting for Professional Services
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
                Streamline your billing, trust accounts, and tax structures for consultants, law firms, and creative agencies in South Africa.
            </p>
            <Button asChild size="lg" className="mt-10 font-bold px-10 h-12">
                <Link href="/contact">Get Started for my Firm</Link>
            </Button>
        </div>
      </section>

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900">Tailored Expertise for Agencies & Consultants</h2>
                <div className="text-lg text-muted-foreground leading-relaxed">
                    <p className="mb-4">As a service-based business, your time is your inventory. Effectively tracking billable hours, managing monthly retainer invoices, and accurately forecasting cash flow can make the difference between breaking even and scaling your firm.</p>
                    <p>At My Accountant, we provide tailored financial strategies for professional service providers, including marketing agencies, legal practices, and consulting firms. From ensuring your trust accounts meet compliance standards to structuring director drawings and dividends tax-efficiently, we handle the complexities of your finances.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <Card className="border-2 border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Key Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {benefits.map((benefit, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium text-slate-700">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Niche Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {specialServices.map((service, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium text-slate-700">{service}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
          </div>
      </section>

      <section className="bg-slate-50 py-16 border-y">
          <div className="container mx-auto px-4 text-center space-y-8">
              <h2 className="text-3xl font-bold text-slate-900">Ready to simplify your firm's finances?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our team of experts understands the unique challenges of the professional services sector in South Africa. Let us handle the numbers while you focus on your clients.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="font-bold h-12">
                    <Link href="/contact">Book a Consultation</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-bold h-12">
                    <Link href="/products">Browse All Services</Link>
                </Button>
              </div>
          </div>
      </section>
    </div>
  );
}
