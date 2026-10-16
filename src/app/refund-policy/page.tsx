import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Refund & Cancellation Policy | My Accountant South Africa',
        description: 'Understand the official refund and cancellation policy for online accounting, SARS tax, CIPC secretarial, and compliance services purchased from My Accountant.',
    };
    return getStaticPageMetadata('refund-policy', defaults);
}

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight text-foreground">
            <AlertCircle className="h-6 w-6 text-primary" />
            Refund Policy
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">Our refund policy for accounting and compliance services is as follows:</p>
            <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>All services are non-refundable once the work has begun.</li>
                <li>Not having the required prerequisites or documentation is not valid grounds for a refund. Your order will remain open for as long as you need in order to provide the required information, even if it is not immediate.</li>
                <li>Refunds may be considered only if the service has not yet started and valid grounds apply.</li>
                <li>A processing fee of 10% will be deducted from any approved refund.</li>
                <li>Refund requests must be submitted within 48 hours of purchase.</li>
            </ul>
            <p className="font-semibold text-foreground">
                Please ensure you have all required documents ready before purchasing. Your order will remain securely stored on your account until all prerequisites are provided.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
