import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/lib/types';
import {
  generateNcrForm2Draft,
  generatePowerOfAttorneyResolutionDraft,
  generateShareCertificateDraft,
  generateAccountantsLetterDraft,
  generateSarsPublicOfficerResolutionDraft,
} from '@/lib/pdf/template-generators';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id') || searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template ID query parameter (id)' }, { status: 400 });
    }

    const sampleOrder: Order = {
      id: 'PREVIEW-101',
      customerName: 'Nqobi Sithole',
      customerEmail: 'nqobi.sithole@example.co.za',
      customerPhone: '+27 82 123 4567',
      endCustomerName: 'ACME HOLDINGS (PTY) LTD',
      date: new Date().toISOString(),
      items: [{ id: 'srv_preview', title: 'Statutory Compliance Service', price: 1500, quantity: 1 }],
      total: 1500,
      discountCode: null,
      discountAmount: null,
      status: 'Processing',
      documentUploads: [
        { serviceId: 'srv_preview', requirementLabel: 'COR14.3 (Company Registration)', type: 'file', status: 'approved', fileName: 'COR14.3.pdf', uploadedAt: new Date().toISOString() },
        { serviceId: 'srv_preview', requirementLabel: 'Company Name', type: 'text', textValue: 'ACME HOLDINGS (PTY) LTD', status: 'approved', uploadedAt: new Date().toISOString() },
        { serviceId: 'srv_preview', requirementLabel: 'Registration Number', type: 'text', textValue: '2024/987654/07', status: 'approved', uploadedAt: new Date().toISOString() },
        { serviceId: 'srv_preview', requirementLabel: 'ID copy of Director', type: 'file', status: 'approved', fileName: 'Director_ID_Copy.pdf', uploadedAt: new Date().toISOString() },
        { serviceId: 'srv_preview', requirementLabel: 'ID Number', type: 'text', textValue: '8501015009087', status: 'approved', uploadedAt: new Date().toISOString() },
        { serviceId: 'srv_preview', requirementLabel: 'Registered Address', type: 'text', textValue: '123 Commercial Avenue, Sandton, Johannesburg, 2196', status: 'approved', uploadedAt: new Date().toISOString() },
      ],
    };

    let pdfResult: { buffer: Buffer; fileName: string };

    switch (templateId) {
      case 'sars_public_officer_resolution':
      case 'director_resolution':
        pdfResult = await generateSarsPublicOfficerResolutionDraft(sampleOrder);
        break;
      case 'ncr_form_2':
        pdfResult = await generateNcrForm2Draft(sampleOrder);
        break;
      case 'power_of_attorney':
        pdfResult = await generatePowerOfAttorneyResolutionDraft(sampleOrder);
        break;
      case 'share_certificate':
        pdfResult = await generateShareCertificateDraft(sampleOrder);
        break;
      case 'accountants_letter':
        pdfResult = await generateAccountantsLetterDraft(sampleOrder);
        break;
      default:
        return NextResponse.json({ error: `Unknown template ID: ${templateId}` }, { status: 404 });
    }

    return new NextResponse(pdfResult.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfResult.fileName}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error generating sample template preview PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF preview' }, { status: 500 });
  }
}
