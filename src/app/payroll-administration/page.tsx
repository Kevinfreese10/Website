import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Receipt, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';

export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Payroll Administration Services | My Accountant',
        description: 'Professional payroll administration for South African businesses. Digital payslips, leave tracking, and employer tax management.',
    };
    return getStaticPageMetadata('payroll-administration', defaults);
}

export default function PayrollAdministrationPage() {
  const coreServices = [
    { title: 'Digital Payslips', description: 'Automated monthly or bi-weekly payslips delivered securely to employees.', icon: Receipt },
    { title: 'Leave Management', description: 'Systematic tracking of annual, sick, and family responsibility leave.', icon: Clock },
    { title: 'Employee Onboarding', description: 'Setup and registration of new staff in the payroll system.', icon: Users },
    { title: 'Third-Party Payouts', description: 'Assistance with scheduling payments to medical aids and pension funds.', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2">
            <span className="text-gradient">Payroll #Administration Services</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto">
            Accurate, on-time, and professional. We take the administrative burden out of paying your team, ensuring every calculation is perfect.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Enquire About Payroll</Link>
            </Button>
          </div>
        </div>
      </section>

      <TrustIndexWidget />

      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Reliable Payroll Outsourcing</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Strategic administrative support for your workforce.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {coreServices.map((service, index) => (
            <Card key={index} className="glass-card shadow-sm h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <service.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 text-center py-12">
        <div className="max-w-3xl mx-auto p-12 rounded-xl glass-card border shadow-sm">
            <h2 className="text-3xl font-bold">Scale Your Business, Not Your Admin</h2>
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed text-center">
                Whether you have 1 or 100 employees, our payroll engine scales with you. We ensure your team is paid correctly while you focus on leading them.
            </p>
            <Button asChild size="lg" className="mt-8 shadow-lg font-bold">
                <Link href="/contact">Speak to a Specialist</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
