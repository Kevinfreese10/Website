import { Metadata } from 'next';
import { HeartPulse, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Accounting for Healthcare & Medical Practices | My Accountant',
  description: 'Specialised accounting and tax services for doctors, dentists, and medical practices in South Africa. HPCSA compliance and medical billing support.',
  alternates: {
      canonical: `${SITE_URL}/industries/healthcare-medical-practices`,
  },
  openGraph: {
    title: 'Accounting for Healthcare & Medical Practices',
    description: 'Specialised accounting and tax services for doctors, dentists, and medical practices in South Africa.',
    url: `${SITE_URL}/industries/healthcare-medical-practices`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Healthcare Accounting' }],
  },
};

export default function HealthcareIndustryPage() {
  const benefits = [
      'Personalised tax structuring for medical professionals',
      'Integration with popular medical billing software',
      'Accurate tracking of locum income and expenses',
      'Payroll management for practice staff'
  ];

  const specialServices = [
      'HPCSA compliance and professional fee management',
      'Medical equipment financing advisory and depreciation',
      'Practice acquisition and valuation support',
      'Personal wealth integration and RA optimization'
  ];

  return (
    <div className="space-y-16 pb-16">
      <section className="bg-slate-50 text-slate-900 py-20 lg:py-32 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-8">
                <HeartPulse className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl max-w-4xl mx-auto text-hero-gradient pb-2">
                Accounting for Healthcare Professionals
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
                Dedicated financial management for doctors, dentists, specialists, and allied healthcare practitioners in South Africa.
            </p>
            <Button asChild size="lg" className="mt-10 font-bold px-10 h-12">
                <Link href="/contact">Get Started for my Practice</Link>
            </Button>
        </div>
      </section>

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-slate-900">Tailored Expertise for Medical Practices</h2>
                <div className="text-lg text-muted-foreground leading-relaxed">
                    <p className="mb-4">Running a medical practice requires your full attention on patient care, leaving little time for complex accounting and tax planning. From managing medical aid claims and locum payments to ensuring compliance with the HPCSA, the financial administration of a healthcare practice is highly specialised.</p>
                    <p>At My Accountant, we provide tailored accounting solutions for healthcare professionals. We help you optimise your tax structure, manage practice cash flow, and integrate your accounting systems with your medical billing software for a seamless financial operation.</p>
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
              <h2 className="text-3xl font-bold text-slate-900">Ready to simplify your practice finances?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our team of experts understands the unique challenges of the medical sector in South Africa. Let us handle the numbers while you focus on your patients.
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
