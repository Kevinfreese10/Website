import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const buildId = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;

  return (
    <footer className="border-t border-white/[0.06] bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Contact Details</h3>
                <div className="text-sm text-muted-foreground space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <span>
                          Ground Floor, Waterstone Building<br />
                          Stonemill Office Park<br />
                          300 Acacia Road<br />
                          Darrenwood, Johannesburg<br />
                          2195
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4" />
                        <a href="mailto:info@myacc.co.za" className="hover:text-primary">info@myacc.co.za</a>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4" />
                        <a href="tel:0101091625" className="hover:text-primary">010 109 1625</a>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Quick Links</h3>
                 <ul className="space-y-2 text-sm">
                    <li><Link href="/#about" className="text-muted-foreground hover:text-primary">About</Link></li>
                    <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Blog</Link></li>
                    <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                    <li><Link href="/compliance" className="text-muted-foreground hover:text-primary">Compliance Check</Link></li>
                    <li><Link href="/sars-compromise" className="text-muted-foreground hover:text-primary">SARS Compromise</Link></li>
                    <li><Link href="/sars-disputes" className="text-muted-foreground hover:text-primary">SARS Disputes</Link></li>
                    <li><Link href="/remission-of-fines" className="text-muted-foreground hover:text-primary">Remission of Fines</Link></li>
                    <li><Link href="/liquidations" className="text-muted-foreground hover:text-primary">Liquidations</Link></li>
                    <li><Link href="/become-a-partner" className="text-muted-foreground hover:text-primary">Become a Partner</Link></li>
                    <li><Link href="/popia" className="text-muted-foreground hover:text-primary">POPIA Policy</Link></li>
                    <li><Link href="/refund-policy" className="text-muted-foreground hover:text-primary">Refund Policy</Link></li>
                </ul>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 relative h-[200px] md:h-full min-h-[200px]">
                <iframe
                    src="https://www.google.com/maps?q=Stonemill+Office+Park+Johannesburg&output=embed"
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>

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
        <div className="mt-8 flex justify-center gap-6 mb-8">
          <script defer async src='https://cdn.trustindex.io/loader-cert.js?a78a37175c7b7428511669d1ff3'></script>
          <script defer async src='https://cdn.trustindex.io/loader-cert.js?4926f2a758e0744bd106e7e6f62'></script>
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
