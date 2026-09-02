import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AnnualFinancialStatementsPdfDocument } from '@/server/pdf/AnnualFinancialStatementsPdfDocument';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { data } = await req.json();

    if (!data || !data.generalInfo) {
      return NextResponse.json({ error: 'Missing financial statements data' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(
      React.createElement(AnnualFinancialStatementsPdfDocument, { data }) as any
    );

    const filename = `${(data.generalInfo.companyName || 'Company')
      .replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Statements_${(data.generalInfo.financialYearEndedDate || 'AFS').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Annual Financial Statements PDF route error:', err);
    return NextResponse.json({ error: err.message || 'Failed to render AFS PDF' }, { status: 500 });
  }
}
