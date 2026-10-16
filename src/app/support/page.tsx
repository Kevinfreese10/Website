import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { faqs } from '@/lib/data';
import SupportForm from '@/components/support/SupportForm';
import FaqAI from '@/components/support/FaqAI';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata('support', {
    title: 'Support Center & Client Helpdesk | My Accountant',
    description:
      'Get instant answers to your SARS, CIPC, payroll, and accounting questions or submit a support ticket to our Randburg client service desk.',
  });
}

export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-hero-gradient pb-2">Support Center</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find answers to common questions or contact our support team.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <FaqAI />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
          <div className="w-full space-y-6">
            {faqs.map(faq => (
              <div key={faq.id} className="border-b border-border pb-6 last:border-0">
                <h3 className="text-lg font-bold text-foreground mb-2">{faq.question}</h3>
                <div className="text-slate-600 leading-relaxed">{faq.answer}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SupportForm />
        </section>
      </div>
    </div>
  );
}
