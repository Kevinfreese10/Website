import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ManagementReportPdfDocument } from '@/server/pdf/ManagementReportPdfDocument';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { data, analysis, customNotes } = await req.json();

    if (!data || !data.client || !data.period) {
      return NextResponse.json({ error: 'Missing report data' }, { status: 400 });
    }

    const buffer = await renderToBuffer(
      React.createElement(ManagementReportPdfDocument, {
        data,
        analysis,
        customNotes,
      }) as any
    );

    const filename = `Management_Report_${(data.client.companyName || 'Company')
      .replace(/[^a-zA-Z0-9]/g, '_')}_${(data.period.label || 'Period').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Management Report PDF route error:', err);
    return NextResponse.json({ error: err.message || 'Failed to render PDF' }, { status: 500 });
  }
}
