import Link from 'next/link';
import Script from 'next/script';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';

const Footer = () => {
  const buildId = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;

  return (
    <footer className="border-t border-white/[0.06] bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Contact & Office</h3>
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
                            className="text-xs text-primary hover:underline inline-block mt-0.5"
                          >
                            View on Google Maps & Reviews &rarr;
                          </a>
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href="mailto:info@myacc.co.za" className="hover:text-primary">info@myacc.co.za</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        <a href="tel:0101091625" className="hover:text-primary">010 109 1625</a>
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
                <h3 className="font-semibold text-foreground">Accounting & Payroll</h3>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/monthly-accounting" className="text-muted-foreground hover:text-primary">Monthly Accounting & CFO</Link></li>
                    <li><Link href="/annual-financial-statements" className="text-muted-foreground hover:text-primary">Annual Financial Statements</Link></li>
                    <li><Link href="/bookkeeping-services" className="text-muted-foreground hover:text-primary">Professional Bookkeeping</Link></li>
                    <li><Link href="/monthly-payroll" className="text-muted-foreground hover:text-primary">Monthly Payroll Services</Link></li>
                    <li><Link href="/coida-letter-of-good-standing" className="text-muted-foreground hover:text-primary">COIDA Letter of Good Standing</Link></li>
                    <li><Link href="/uif-compliance" className="text-muted-foreground hover:text-primary">UIF & SDL Compliance</Link></li>
                    <li><Link href="/paye-compliance" className="text-muted-foreground hover:text-primary">PAYE Compliance & EMP201</Link></li>
                    <li><Link href="/outsourced-payroll-fees-sa" className="text-muted-foreground hover:text-primary">Outsourced Payroll Fees</Link></li>
                </ul>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Tax & Secretarial</h3>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/vat-registration-south-africa" className="text-muted-foreground hover:text-primary">VAT Registration South Africa</Link></li>
                    <li><Link href="/sars-compromise" className="text-muted-foreground hover:text-primary">SARS Debt Compromise</Link></li>
                    <li><Link href="/sars-disputes" className="text-muted-foreground hover:text-primary">SARS Disputes & Objections</Link></li>
                    <li><Link href="/remission-of-fines" className="text-muted-foreground hover:text-primary">Remission of Fines & Penalties</Link></li>
                    <li><Link href="/company-secretarial-services-south-africa" className="text-muted-foreground hover:text-primary">Company Secretarial Services</Link></li>
                    <li><Link href="/cipc-beneficial-ownership-register-south-africa" className="text-muted-foreground hover:text-primary">Beneficial Ownership Register</Link></li>
                    <li><Link href="/company-registration" className="text-muted-foreground hover:text-primary">CIPC Company Registration</Link></li>
                    <li><Link href="/tax-returns" className="text-muted-foreground hover:text-primary">Tax Return Filing</Link></li>
                </ul>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Quick Links & Legal</h3>
                <ul className="space-y-2 text-sm">
                    <li><Link href="/#about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                    <li><Link href="/reviews" className="text-muted-foreground hover:text-primary">Client Reviews</Link></li>
                    <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Tax Tip Blog</Link></li>
                    <li><Link href="/free-tax-clearance-status-check" className="text-muted-foreground hover:text-primary">Free Tax Clearance Check</Link></li>
                    <li><Link href="/sars-tax-refund" className="text-muted-foreground hover:text-primary">Free Tax Refund Check</Link></li>
                    <li><Link href="/become-a-partner" className="text-muted-foreground hover:text-primary">Partner Program</Link></li>
                    <li><Link href="/popia" className="text-muted-foreground hover:text-primary">POPIA Privacy Policy</Link></li>
                    <li><Link href="/refund-policy" className="text-muted-foreground hover:text-primary">Refund Policy</Link></li>
                </ul>
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
        <div className="mt-8 flex justify-center mb-8">
          <Script src='https://cdn.trustindex.io/loader-cert.js?a78a37175c7b7428511669d1ff3' strategy="lazyOnload" />
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
