import { getPartnerBySlug } from '@/lib/firebase-admin';
import { User } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export default async function PartnerRefundPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);

  if (!partner || !partner.landingPage?.popiaPolicy) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">POPIA Compliance Policy</h1>
          <p className="mt-2 text-lg opacity-70">{partner.companyName || partner.name}</p>
        </div>
        
        <Card className="partner-card">
            <CardContent className="p-8">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap opacity-80 leading-relaxed">
                    {partner.landingPage.popiaPolicy}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
