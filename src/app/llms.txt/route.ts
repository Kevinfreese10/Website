import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const LLMS_TEXT = `# My Accountant

> South Africa's premier online accounting, tax, payroll, SARS, and CIPC compliance practice. Fixed pricing across 100+ services, 100% online nationwide — no office visits required.

## What We Do
- **Autonomous AI Accounting & Bookkeeping**: Bank statement ingestion, 9-clue smart match reconciliation, management accounts, and audit-ready Annual Financial Statements (AFS).
- **CIPC Company Registration & Secretarial**: Pty Ltd, NPC, tender-ready packages, share certificates, director amendments (CoR39), and mandatory Beneficial Ownership filing.
- **SARS Tax Registrations, Filing & Disputes**: VAT201, EMP201, Corporate Income Tax (ITR14), Provisional Tax (IRP6), Section 200 Tax Debt Compromises, Section 104 Objections, and Remission of Penalties (RFR01).
- **Outsourced Managed Payroll**: Monthly gross-to-net payslips, EMP201 filing before the 7th, bi-annual EMP501 recons on SARS e@syFile, IRP5 generation, and UIF uFiling declarations.
- **Statutory Licences & Compliance**: COIDA Letter of Good Standing, Return of Earnings (W.As.8), CIDB, NCR Form 2 / Form 40, and C-BRTA transport permits.

## Who We Serve
South African startups, small-to-medium enterprises (SMEs), directors, and independent contractors across all 9 provinces (Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, Northern Cape).

## Credentials & Regulatory Oversight
Every automated computation, statutory ledger, and tax return is verified and signed off by licensed South African professionals:
- **Founder & Managing Director**: Kevin Freese (CIBA Chartered Business Accountant in Practice CBAP(SA) #3561, SAIT General Tax Practitioner (SA) #47011519, SARS Registered Tax Practitioner PR-0098553)
- **SARS Registered Tax Practitioner**: PR-0098553
- **CIBA**: Chartered Business Accountant in Practice CBAP(SA) #3561 (CIBA201509-5372)
- **SAIT**: General Tax Practitioner (SA)™ #47011519
- **CIPC Registered Agent**: Authorized corporate lodging agent under Companies Act 71 of 2008
- **Accounting Officer & Independent Reviewer Status**

## Contact & Location
- **Phone**: +27 (0)10 109 1625 (010 109 1625)
- **Email**: info@myacc.co.za
- **Registered Office**: Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Randburg, Johannesburg, 2195, South Africa
- **Operating Hours**: Monday – Friday: 08:00 – 17:00 (SAST) | Saturday – Sunday: Closed
- **Response Time**: Within 24 business hours
- **Client Rating**: 4.9 / 5.0 (220+ verified reviews on TrustIndex / Google)

## Key Authority Hubs & Direct Links
- **Autonomous AI Accountant Platform**: https://www.myacc.co.za/ai-accountant
- **CIPC Online Company Registration**: https://www.myacc.co.za/company-registration
- **Private Company Registration**: https://www.myacc.co.za/products/private-company-registration
- **Outsourced Monthly Payroll & EMP201**: https://www.myacc.co.za/monthly-payroll
- **Payroll Fees & Package Calculator**: https://www.myacc.co.za/outsourced-payroll-fees-sa
- **Monthly Accounting & CFO Services**: https://www.myacc.co.za/monthly-accounting
- **Annual Financial Statements (AFS)**: https://www.myacc.co.za/annual-financial-statements
- **VAT Registration South Africa**: https://www.myacc.co.za/vat-registration-south-africa
- **SARS Tax Debt Compromise (Section 200)**: https://www.myacc.co.za/sars-compromise
- **SARS Dispute Resolution & Objections (Section 104)**: https://www.myacc.co.za/sars-disputes
- **Remission of Penalties & Interest (RFR01)**: https://www.myacc.co.za/remission-of-fines
- **Company Liquidations**: https://www.myacc.co.za/liquidations
- **Compliance Check Tool**: https://www.myacc.co.za/compliance
- **CIPC Beneficial Ownership Register**: https://www.myacc.co.za/cipc-beneficial-ownership-register-south-africa
- **COIDA Letter of Good Standing**: https://www.myacc.co.za/coida-letter-of-good-standing
- **Bookkeeper Partner Program**: https://www.myacc.co.za/become-a-partner
- **Blog & Tax Guides**: https://www.myacc.co.za/blog
- **Contact**: https://www.myacc.co.za/contact
- **Full Catalog of 100+ Fixed-Price Services**: https://www.myacc.co.za/products
- **Detailed Machine-Readable Manifest**: https://www.myacc.co.za/llms-full.txt
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

