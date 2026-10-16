import Link from 'next/link';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';

const Footer = () => {
  const buildId = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;

  return (
    <footer className="border-t border-white/[0.06] bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            <div className="space-y-3">
                <p className="font-semibold text-foreground">Contact & Office</p>
                <div className="text-sm text-muted-foreground space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                        <span>
                          Ground Floor, Waterstone Building<br />
                          Stonemill Office Park<br />
                          300 Acacia Road<br />
                          Darrenwood, Johannesburg, 2195<br />
                          <a
                            href="https://www.google.com/maps?q=My+Accountant,+Stonemill+Office+Park,+300+Acacia+Road,+Darrenwood,+Johannesburg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center mt-0.5"
                          >
                            View on Google Maps & Reviews &rarr;
                          </a>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                        <a href="mailto:info@myacc.co.za" className="hover:text-primary min-h-[44px] inline-flex items-center">info@myacc.co.za</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                        <a href="tel:0101091625" className="hover:text-primary min-h-[44px] inline-flex items-center">010 109 1625</a>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-foreground/90">Mon – Fri: 08:00 – 17:00 SAST</p>
                          <p className="text-muted-foreground">Sat – Sun: Closed</p>
                          <p className="text-primary font-medium">Response within 24 business hours</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="font-semibold text-foreground">Accounting & Payroll</p>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/monthly-accounting" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Monthly Accounting & CFO</Link></li>
                    <li><Link href="/annual-financial-statements" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Annual Financial Statements</Link></li>
                    <li><Link href="/bookkeeping" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Professional Bookkeeping</Link></li>
                    <li><Link href="/monthly-payroll" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Monthly Payroll Services</Link></li>
                    <li><Link href="/coida-letter-of-good-standing" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">COIDA Letter of Good Standing</Link></li>
                    <li><Link href="/uif-compliance" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">UIF & SDL Compliance</Link></li>
                    <li><Link href="/paye-compliance" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">PAYE Compliance & EMP201</Link></li>
                    <li><Link href="/outsourced-payroll-fees-sa" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Outsourced Payroll Fees</Link></li>
                </ul>
            </div>

            <div className="space-y-3">
                <p className="font-semibold text-foreground">Tax & Secretarial</p>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/vat-registration-south-africa" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">VAT Registration South Africa</Link></li>
                    <li><Link href="/sars-compromise" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">SARS Debt Compromise</Link></li>
                    <li><Link href="/sars-disputes" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">SARS Disputes & Objections</Link></li>
                    <li><Link href="/remission-of-fines" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Remission of Fines & Penalties</Link></li>
                    <li><Link href="/company-secretarial-services-south-africa" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Company Secretarial Services</Link></li>
                    <li><Link href="/cipc-beneficial-ownership-register-south-africa" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Beneficial Ownership Register</Link></li>
                    <li><Link href="/company-registration" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">CIPC Company Registration</Link></li>
                    <li><Link href="/tax-returns" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Tax Return Filing</Link></li>
                </ul>
            </div>

            <div className="space-y-3">
                <p className="font-semibold text-foreground">Quick Links & Legal</p>
                <ul className="space-y-1 text-sm">
                    <li><Link href="/about" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">About Us</Link></li>
                    <li><Link href="/reviews" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Client Reviews</Link></li>
                    <li><Link href="/blog" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Tax Tip Blog</Link></li>
                    <li><Link href="/sars-tax-compliance-status-pin" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Free Tax Clearance Check</Link></li>
                    <li><Link href="/sars-tax-refund" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Free Tax Refund Check</Link></li>
                    <li><Link href="/become-a-partner" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Partner Program</Link></li>
                    <li><Link href="/popia" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">POPIA Privacy Policy</Link></li>
                    <li><Link href="/refund-policy" className="text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors">Refund Policy</Link></li>
                </ul>
            </div>

        </div>

        {/* Complete Service & Resource Directory */}
        <div className="border-t border-white/[0.06] pt-8 mb-8">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary mb-6">
            Complete Service &amp; Resource Directory
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-xs">
            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm">Core Accounting &amp; CFO</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link href="/accounting-services-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accounting Services South Africa</Link></li>
                <li><Link href="/fractional-cfo-services-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Fractional CFO Services</Link></li>
                <li><Link href="/sme-accounting" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SME Accounting</Link></li>
                <li><Link href="/management-accounts" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Management Accounts</Link></li>
                <li><Link href="/financial-advisory" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Financial Advisory</Link></li>
                <li><Link href="/outsourcing-vs-hiring" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Outsourcing vs Hiring In-House</Link></li>
                <li><Link href="/ai-accountant" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">AI Accountant Platform</Link></li>
                <li><Link href="/xero-accountant-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Xero Accountant SA</Link></li>
                <li><Link href="/sage-accountant-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Sage Accountant SA</Link></li>
                <li><Link href="/zoho-accountant-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Zoho Books Accountant</Link></li>
                <li><Link href="/pastel-accountant-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Pastel Accountant SA</Link></li>
                <li><Link href="/payroll-services" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Payroll Services Overview</Link></li>
                <li><Link href="/payroll-administration" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Payroll Administration</Link></li>
                <li><Link href="/nbc-provident-fund-guide" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">NBC Provident Fund Guide</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm">SARS, Tax &amp; Trusts</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link href="/tax-services-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Tax Services South Africa</Link></li>
                <li><Link href="/individual-tax-returns" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Individual Tax Returns (ITR12)</Link></li>
                <li><Link href="/provisional-tax" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Provisional Tax (IRP6)</Link></li>
                <li><Link href="/tax-consulting" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Tax Consulting SA</Link></li>
                <li><Link href="/tax-planning" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Strategic Tax Planning</Link></li>
                <li><Link href="/tax-compliance" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Tax Compliance Services</Link></li>
                <li><Link href="/compliance-services" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">CIPC &amp; Statutory Compliance</Link></li>
                <li><Link href="/specialist-services" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Specialist Regulatory Services</Link></li>
                <li><Link href="/trust-services" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Trust Accounting &amp; Tax</Link></li>
                <li><Link href="/liquidations" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Voluntary Liquidations</Link></li>
                <li><Link href="/case-studies" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Client Case Studies</Link></li>
                <li><Link href="/tax-glossary" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SA Tax &amp; Accounting Glossary</Link></li>
                <li><Link href="/tax-deadlines-calendar-2026" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">2026 SARS Tax Calendar</Link></li>
                <li><Link href="/freelancer-gig-economy-tax-hub" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Freelancer &amp; Gig Tax Hub</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm">Industries We Serve</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link href="/industries" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors font-medium text-foreground/90">All Industries Hub</Link></li>
                <li><Link href="/industries/construction" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Construction &amp; CIDB</Link></li>
                <li><Link href="/industries/ecommerce-online-sellers" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">E-Commerce &amp; Online Sellers</Link></li>
                <li><Link href="/industries/healthcare-medical-practices" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Healthcare &amp; Medical Practices</Link></li>
                <li><Link href="/industries/hospitality" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Hospitality &amp; Restaurants</Link></li>
                <li><Link href="/industries/professional-services" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Professional Services</Link></li>
                <li><Link href="/industries/freelancers" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Freelancers &amp; Contractors</Link></li>
                <li><Link href="/industries/influencers" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Content Creators &amp; Influencers</Link></li>
                <li><Link href="/industries/sme" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SMEs &amp; Growing Businesses</Link></li>
                <li><Link href="/industries/Startups" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Startups &amp; High-Growth Tech</Link></li>
                <li><Link href="/movie-film-production-accounting-south-africa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Movie &amp; Film Production Accounting</Link></li>
                <li><Link href="/movie-film-production-accountant-randburg" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Film Production Accountant Randburg</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm">Locations We Serve</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link href="/accountant-johannesburg" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Johannesburg</Link></li>
                <li><Link href="/bookkeeping-services-johannesburg" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Bookkeeping Services Johannesburg</Link></li>
                <li><Link href="/accountant-sandton" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Sandton</Link></li>
                <li><Link href="/accountant-randburg" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Randburg</Link></li>
                <li><Link href="/accountant-fourways" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Fourways</Link></li>
                <li><Link href="/accountant-bryanston" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Bryanston</Link></li>
                <li><Link href="/accountant-midrand" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Midrand</Link></li>
                <li><Link href="/accountant-roodepoort" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Roodepoort</Link></li>
                <li><Link href="/accountant-pretoria" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Pretoria</Link></li>
                <li><Link href="/accountant-centurion" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Centurion</Link></li>
                <li><Link href="/accountant-cape-town" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Cape Town</Link></li>
                <li><Link href="/accountant-stellenbosch" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Stellenbosch</Link></li>
                <li><Link href="/accountant-durban" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Durban</Link></li>
                <li><Link href="/accountant-umhlanga" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant Umhlanga</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm">Free Tax &amp; Fee Calculators</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link href="/calculators" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors font-medium text-foreground/90">All Calculators Hub</Link></li>
                <li><Link href="/calculators/salary-tax" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">PAYE Salary Tax Calculator</Link></li>
                <li><Link href="/calculators/sbc-tax-estimator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SBC Tax Estimator</Link></li>
                <li><Link href="/calculators/vat-calculator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">15% VAT Calculator</Link></li>
                <li><Link href="/calculators/provisional-tax-estimator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Provisional Tax Estimator</Link></li>
                <li><Link href="/calculators/capital-gains-tax-calculator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Capital Gains Tax Calculator</Link></li>
                <li><Link href="/calculators/total-cost-to-employer" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Total Cost to Employer (TCOE)</Link></li>
                <li><Link href="/calculators/payroll-cost" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Payroll Cost Calculator</Link></li>
                <li><Link href="/calculators/uif-coida-calculator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">UIF &amp; COIDA Calculator</Link></li>
                <li><Link href="/calculators/turnover-tax-calculator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Turnover Tax Calculator</Link></li>
                <li><Link href="/calculators/cipc-annual-return-fee" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">CIPC Annual Return Fee</Link></li>
                <li><Link href="/calculators/cidb-fee-and-grade" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">CIDB Fee &amp; Grade Calculator</Link></li>
                <li><Link href="/calculators/ncr-registration-fee" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">NCR Registration Fee</Link></li>
                <li><Link href="/calculators/bee-scorecard-estimator" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">B-BBEE Scorecard Estimator</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="font-semibold text-foreground text-xs mb-3">SARS eFiling &amp; Statutory Compliance Guides</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-5">
              <Link href="/sars-tax-compliance-status-pin" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Tax Compliance PIN</Link>
              <Link href="/sars-vat-vendor-search-verification" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS VAT Vendor Search</Link>
              <Link href="/sars-payment-reference-number-prn" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Payment Reference Number (PRN)</Link>
              <Link href="/sars-online-query-system-guide" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Online Query System (SOQS)</Link>
              <Link href="/sars-banking-details-change-verification" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Banking Details Verification</Link>
              <Link href="/sars-customs-importer-exporter-code" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Importer &amp; Exporter Code</Link>
              <Link href="/sars-deceased-estate-reporting" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Deceased Estate Tax</Link>
              <Link href="/sars-diesel-refund-scheme-registration" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Diesel Refund Scheme</Link>
              <Link href="/sars-donations-tax-it144" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Donations Tax (IT144)</Link>
              <Link href="/sars-employment-tax-incentive-eti" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Employment Tax Incentive (ETI)</Link>
              <Link href="/sars-External-company-tax-registration" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">External Company Tax Registration</Link>
              <Link href="/sars-financial-emigration-tax-clearance" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Financial Emigration Tax Clearance</Link>
              <Link href="/sars-home-office-expense-deduction" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Home Office Expense Deduction</Link>
              <Link href="/sars-learnership-tax-allowance-s12h" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Section 12H Learnership Allowance</Link>
              <Link href="/sars-medical-aid-tax-credits-guide" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Medical Aid Tax Credits</Link>
              <Link href="/sars-notice-of-assessment-ita34-explained" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS ITA34 Assessment Guide</Link>
              <Link href="/sars-pay-as-you-earn-emp201-emp501" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">PAYE EMP201 &amp; EMP501 Guide</Link>
              <Link href="/sars-payment-allocation-query" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Payment Allocation Query</Link>
              <Link href="/sars-public-benefit-organisation-pbo-s18a" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">PBO &amp; Section 18A Approval</Link>
              <Link href="/sars-rental-income-tax-guide" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Rental Income Tax Guide</Link>
              <Link href="/sars-solar-tax-incentive-s12b" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Section 12B Solar Tax Incentive</Link>
              <Link href="/sars-statement-of-account-soa" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Statement of Account (SOA)</Link>
              <Link href="/sars-tax-directive-application-irp3" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Tax Directive (IRP3)</Link>
              <Link href="/sars-travel-allowance-logbook-guide" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Travel Allowance &amp; Logbook Guide</Link>
              <Link href="/sars-turnover-tax-registration" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Turnover Tax Registration</Link>
              <Link href="/sars-voluntary-disclosure-programme-vdp" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">SARS Voluntary Disclosure (VDP)</Link>
            </div>
            <p className="font-semibold text-foreground text-xs mb-3">Featured Tax &amp; Business Guides</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Link href="/blog/sole-proprietor-vs-pty-ltd" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Sole Proprietor vs Pty Ltd</Link>
              <Link href="/blog/two-pot-retirement-tax-rules-2026" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Two-Pot Retirement Tax Rules 2026</Link>
              <Link href="/blog/accountant-vs-bookkeeper-guide" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Accountant vs Bookkeeper Guide</Link>
              <Link href="/blog/cc-vs-pty-ltd-conversion" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">CC to Pty Ltd Conversion</Link>
              <Link href="/blog/cgt-annual-exclusion-increase-2026" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">CGT Annual Exclusion 2026</Link>
              <Link href="/blog/crypto-asset-tax-reporting-sars-2026" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Crypto Asset Tax Reporting SARS</Link>
              <Link href="/blog/turnover-tax-vs-company-tax" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Turnover Tax vs Company Tax</Link>
              <Link href="/blog/vat-registration-threshold-sme-2026" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">VAT Registration Threshold 2026</Link>
              <Link href="/terms" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Contact Us</Link>
              <Link href="/support" className="hover:text-primary min-h-[44px] inline-flex items-center transition-colors">Support Helpdesk</Link>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10 relative h-[180px] w-full mb-8">
            <iframe
                title="My Accountant Office Location"
                src="https://www.google.com/maps?q=My+Accountant,+Stonemill+Office+Park,+300+Acacia+Road,+Darrenwood,+Johannesburg&output=embed"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
        <div className="mt-8 border-t border-white/[0.06] pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-white/[0.06] pb-8 mb-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.15em] text-primary">CIBA Practice Designation</span>
              <p className="text-sm font-bold text-foreground">Chartered Business Accountant in Practice</p>
              <span className="text-xs text-muted-foreground font-mono bg-white/[0.05] border-white/10 border px-2 py-0.5 rounded">CIBA201509-5372</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.15em] text-primary">SAIT Member Credentials</span>
              <p className="text-sm font-bold text-foreground">General Tax Practitioner (SA)™</p>
              <span className="text-xs text-muted-foreground font-mono bg-white/[0.05] border-white/10 border px-2 py-0.5 rounded">Member ID: 47011519</span>
            </div>
            <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.15em] text-primary">SARS Reference Number</span>
              <p className="text-sm font-bold text-foreground">Registered Tax Practitioner</p>
              <span className="text-xs text-muted-foreground font-mono bg-white/[0.05] border-white/10 border px-2 py-0.5 rounded">PR-0098553</span>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} My Accountant. All rights reserved.</p>
          {buildId && (
            <div className="mt-4 inline-block px-3 py-1 rounded-md border bg-muted/50 text-[10px] font-mono select-all">
                BUILD ID: {buildId}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
