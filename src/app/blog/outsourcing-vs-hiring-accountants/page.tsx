import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Building2,
  Headphones,
  BookOpen,
  BarChart3,
  Star,
  AlertTriangle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Outsourcing vs Hiring Staff: The Complete Guide for Accountants | My Accountant',
  description: 'Struggling to scale your accounting practice? Compare the true costs, risks and benefits of hiring more staff vs outsourcing to My Accountant\'s partner network. The smarter choice for South African accountants and bookkeepers.',
  keywords: ['outsourcing accounting', 'hire accountant staff south africa', 'accounting practice growth', 'bookkeeper outsource', 'become accounting partner south africa'],
  openGraph: {
    title: 'Outsourcing vs Hiring Staff: The Guide for South African Accountants',
    description: 'Compare the real cost of hiring vs outsourcing for your accounting practice. Discover how to scale without the risk.',
    images: [{ url: '/og-image.jpg' }],
  },
};

const hiringPros = [
  { text: 'Full control over staff output, hours and processes' },
  { text: 'Staff develop deep knowledge of your client relationships' },
  { text: 'Easier internal communication and team culture building' },
  { text: 'Staff can represent your brand at client meetings' },
];

const hiringCons = [
  { text: 'High fixed cost: salary, UIF, COIDA, medical aid, leave pay' },
  { text: 'Lengthy recruitment process — can take 3 to 6 months' },
  { text: 'Risk of a bad hire destroying client trust or exposing you to SARS penalties' },
  { text: 'Staff need ongoing training as tax laws, CIPC rules and software change' },
  { text: 'Sick leave, resignations and notice periods create gaps in service delivery' },
  { text: 'You pay full salary even in slow months with no work' },
  { text: 'Employment disputes, CCMA and HR management drain your time' },
  { text: 'Office space, equipment, software licences and IT costs add up quickly' },
];

const outsourcingPros = [
  { text: 'Pay only for work done — zero idle salary cost in slow periods' },
  { text: 'Instantly scale capacity up or down to match your client pipeline' },
  { text: 'Access a full team of registered specialists across tax, payroll, CIPC and compliance' },
  { text: 'No recruitment, onboarding or HR administration to manage' },
  { text: 'You maintain the client relationship while we handle the work' },
  { text: 'Zero risk of SARS penalties — we guarantee compliance and accuracy' },
  { text: 'Earn a referral commission or markup on every outsourced job' },
  { text: 'Your practice can serve 3× more clients without 3× the cost' },
];

const outsourcingCons = [
  { text: 'Less direct control over individual staff doing the work' },
  { text: 'Requires clear briefs and structured handover of client documents' },
  { text: 'Client relationships must be carefully managed to maintain trust' },
];

const costComparison = [
  {
    item: 'Junior Accountant Salary (annual)',
    hiring: 'R 180,000 – R 300,000',
    outsourcing: 'R 0',
  },
  {
    item: 'Employer UIF / COIDA Contributions',
    hiring: '~R 3,600 – R 6,000 / yr',
    outsourcing: 'R 0',
  },
  {
    item: 'Leave Pay & 13th Cheque',
    hiring: '~R 15,000 – R 25,000 / yr',
    outsourcing: 'R 0',
  },
  {
    item: 'Software Licences (Xero, Sage, etc.)',
    hiring: 'R 6,000 – R 18,000 / yr',
    outsourcing: 'Included',
  },
  {
    item: 'Training & CPD Courses',
    hiring: 'R 5,000 – R 15,000 / yr',
    outsourcing: 'R 0',
  },
  {
    item: 'Recruitment Fees (once-off)',
    hiring: 'R 20,000 – R 60,000',
    outsourcing: 'R 0',
  },
  {
    item: 'Office Space & Equipment',
    hiring: 'R 12,000 – R 36,000 / yr',
    outsourcing: 'R 0',
  },
  {
    item: 'Cost per completed tax return',
    hiring: 'R 800 – R 2,000+',
    outsourcing: 'From R 350 (partner rate)',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Instant Capacity',
    description: 'Take on 10 new clients tomorrow. We have the team ready — no interviews, no onboarding.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Guaranteed',
    description: 'Every job is completed by registered practitioners. Your reputation stays spotless.',
  },
  {
    icon: DollarSign,
    title: 'Commission on Every Job',
    description: 'Mark up our wholesale rates or earn referral commission. Your practice earns more, not less.',
  },
  {
    icon: Headphones,
    title: 'White-Label Service',
    description: 'Clients never know we exist. The work comes back under your brand, your letterhead.',
  },
  {
    icon: BookOpen,
    title: 'Specialists Across All Areas',
    description: 'Tax, payroll, CIPC, SARS disputes, financial statements — one partner, every service.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Practice Management',
    description: 'Use our portal to track jobs, upload documents and communicate — completely free.',
  },
];

export default function OutsourcingVsHiringPage() {
  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <section className="bg-slate-900 text-white pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="inline-block text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full mb-6">
            For Accountants &amp; Bookkeepers
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Outsourcing vs Hiring Staff<br />
            <span className="text-primary">The Honest Comparison</span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Every growing accounting practice reaches the same crossroads: take on more clients and hire someone, or find a smarter way to scale. Here's everything you need to make the right decision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/become-a-partner"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg text-base"
            >
              Become a Partner <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all text-base"
            >
              Talk to Us First
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-primary text-white py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-black">R 250,000+</p>
              <p className="text-sm text-white/70 mt-1">Average annual cost of a junior hire</p>
            </div>
            <div>
              <p className="text-3xl font-black">3–6 Months</p>
              <p className="text-sm text-white/70 mt-1">Average recruitment timeline in SA</p>
            </div>
            <div>
              <p className="text-3xl font-black">20%</p>
              <p className="text-sm text-white/70 mt-1">Wholesale discount for partners</p>
            </div>
            <div>
              <p className="text-3xl font-black">48hrs</p>
              <p className="text-sm text-white/70 mt-1">Average turnaround on outsourced jobs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pros & Cons Comparison */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Full Pros &amp; Cons Breakdown</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">We've been honest about both sides so you can make a fully informed decision.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hiring */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-8 py-6 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-slate-500" />
                <h3 className="text-xl font-black text-slate-900">Hiring More Staff</h3>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-4">Pros</p>
                  <ul className="space-y-3">
                    {hiringPros.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t pt-6">
                  <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-4">Cons</p>
                  <ul className="space-y-3">
                    {hiringCons.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Outsourcing */}
            <div className="rounded-2xl border-2 border-primary overflow-hidden shadow-xl">
              <div className="bg-primary px-8 py-6 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-white" />
                <h3 className="text-xl font-black text-white">Outsourcing to My Accountant</h3>
                <span className="ml-auto bg-white text-primary text-xs font-black px-3 py-1 rounded-full">Recommended</span>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-4">Pros</p>
                  <ul className="space-y-3">
                    {outsourcingPros.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t pt-6">
                  <p className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4">Considerations</p>
                  <ul className="space-y-3">
                    {outsourcingCons.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison Table */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">The True Cost of Hiring</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Most practice owners dramatically underestimate what a single staff member actually costs. Here's the full picture.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-slate-900 text-white text-sm font-bold px-6 py-4">
              <span>Cost Item</span>
              <span className="text-center">Hiring Staff</span>
              <span className="text-center text-primary">Partner Outsourcing</span>
            </div>
            {costComparison.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-6 py-4 text-sm border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <span className="text-slate-700 font-medium">{row.item}</span>
                <span className="text-center text-red-500 font-bold">{row.hiring}</span>
                <span className="text-center text-green-600 font-bold">{row.outsourcing}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">Estimates based on South African market rates as of 2025/2026. Actual costs may vary.</p>
        </div>
      </section>

      {/* What you get as a partner */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">What You Get as a My Accountant Partner</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Our Business Exchange Initiative (BEI) gives independent accountants and bookkeepers access to a full-service team with zero overhead.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-2xl hover:bg-primary/5 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-primary/5 border-y border-primary/10 py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="text-2xl font-bold text-slate-800 italic leading-relaxed mb-8">
            "I was about to hire my third staff member when I discovered the partner programme. I outsource everything I can't handle, mark it up slightly, and I'm earning more than before — with less stress and zero HR headaches."
          </blockquote>
          <p className="font-bold text-slate-900">Themba M.</p>
          <p className="text-slate-500 text-sm">Independent Bookkeeper, Johannesburg</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-slate-900 text-white text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to Scale Without the Stress?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of South African accountants and bookkeepers who partner with us to grow their practices without growing their headcount.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/become-a-partner"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-primary text-white font-black text-lg rounded-full hover:bg-primary/90 transition-all shadow-xl"
            >
              Join the Partner Programme <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/partner-signup"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white/10 text-white font-bold text-lg rounded-full hover:bg-white/20 transition-all"
            >
              Sign Up Free
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-6">No joining fees. No monthly subscription. Pay only for what you outsource.</p>
        </div>
      </section>

    </div>
  );
}
