import { Metadata } from 'next';
import { Utensils, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Accounting for Hospitality & Restaurants | My Accountant',
  description: 'Full-service accounting for restaurants, hotels, and cafes in South Africa. We manage POS integration, inventory control, and complex hospitality payroll.',
  alternates: {
      canonical: `${SITE_URL}/industries/hospitality`,
  },
  openGraph: {
    title: 'Accounting for Hospitality & Restaurants',
    description: 'Full-service accounting for restaurants, hotels, and cafes in South Africa.',
    url: `${SITE_URL}/industries/hospitality`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Hospitality Accounting' }],
  },
};

export default function HospitalityIndustryPage() {
  const benefits = [
      'Daily sales and POS (Point of Sale) reconciliation',
      'Inventory, food cost, and beverage tracking',
      'Complex hospitality payroll and shift management',
      'Liquor license and health/safety compliance support'
  ];

  const specialServices = [
      'Wastage and shrinkage reporting',
      'Supplier account management and bulk invoice processing',
      'VAT201 preparation for high-volume trade',
      'Lease negotiation support and turnover rental tracking'
  ];

  return (
    <div className="space-y-16 pb-16">
      <section className="bg-slate-50 text-slate-900 py-20 lg:py-32 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
                <Utensils className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl max-w-4xl mx-auto text-hero-gradient pb-2">
                Accounting for Hospitality & Restaurants
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
                Protect your margins with expert inventory, payroll, and POS integration for restaurants, cafes, and boutique hotels in South Africa.
            </p>
            <Button asChild size="lg" className="mt-10 font-bold px-10 h-12">
                <Link href="/contact">Get Started for my Business</Link>
            </Button>
        </div>
      </section>

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900">Tailored Expertise for Hospitality</h2>
                <div className="text-lg text-muted-foreground leading-relaxed">
                    <p className="mb-4">Restaurants and hospitality businesses operate on notoriously thin margins and high transaction volumes. Without accurate daily tracking, food costs and wages can quickly erode profitability. Tracking tips, managing shift-based payroll, and reconciling delivery platforms like UberEats and Mr D adds another layer of complexity.</p>
                    <p>At My Accountant, we provide the financial oversight needed to track food costs accurately, manage your staff payroll seamlessly, and integrate your POS data directly into your accounting software. We give you real-time visibility into your business's performance.</p>
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
              <h2 className="text-3xl font-bold text-slate-900">Ready to simplify your business finances?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our team of experts understands the unique challenges of the hospitality sector in South Africa. Let us handle the numbers while you focus on your guests.
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
