import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const LLMS_TEXT = `# My Accountant

> Online accounting, tax, payroll, SARS, and CIPC compliance services
> for South African businesses and individuals. Fixed pricing on 100+
> services, fully online — no office visit required.

## What We Do
- Bookkeeping, management accounts, and annual financial statements
- Company registration and CIPC compliance (Pty Ltd, NPC, NPO, co-ops)
- SARS registrations, returns, disputes, and tax debt (Section 200) compromises
- Payroll outsourcing, PAYE/UIF/SDL, and EMP201/EMP501 compliance
- CIDB, COIDA, NCR, and NCCA registrations and statutory renewals
- Section 104 objections, tax appeals, and remission of fines (RFR)

## Who We Serve
South African businesses, entrepreneurs, SMEs, and individuals, served
online nationwide. Headquartered in Johannesburg.

## Credentials
Team includes CIBA (Chartered Institute for Business Accountants),
SAIT (South African Institute of Taxation), and SAICA-affiliated
practitioners. Registered SARS tax practitioners and a CIPC agent.
- Founder & Managing Director: Kevin Freese (SARS PR-0098553, CIBA 201509-5372, SAIT 47011519).

## Contact & Business Hours
- Phone: 010 109 1625 (+27 10 109 1625)
- Email: info@myacc.co.za
- Physical Address: Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195, South Africa
- Operating Hours: Monday – Friday: 08:00 – 17:00 (SAST) | Saturday – Sunday: Closed
- Response Time: Within 24 business hours

## Key Pages & Services
- Catalog & Pricing: https://www.myacc.co.za/products
- Private Company Registration: https://www.myacc.co.za/products/private-company-registration
- VAT Registration: https://www.myacc.co.za/products/vat-registration
- SARS Tax Debt Relief (S200): https://www.myacc.co.za/sars-compromise
- SARS Dispute Resolution: https://www.myacc.co.za/sars-disputes
- Remission of Penalties & Interest: https://www.myacc.co.za/remission-of-fines
- Company Liquidations: https://www.myacc.co.za/liquidations
- Compliance Check Tool: https://www.myacc.co.za/compliance
- Monthly Accounting: https://www.myacc.co.za/monthly-accounting
- Contact: https://www.myacc.co.za/contact
- Bookkeeper Partner Program: https://www.myacc.co.za/become-a-partner
- Blog & Tax Guides: https://www.myacc.co.za/blog
`;

export async function GET() {
  return new NextResponse(LLMS_TEXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
