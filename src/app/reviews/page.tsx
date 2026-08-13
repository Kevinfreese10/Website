import { Metadata } from 'next';
import { Star, CheckCircle, ShieldCheck, Award } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Accountant Reviews - 220+ Reviews & Rated 4.9/5',
  description: 'See why over 220 clients rate us 4.9/5 on Google and Facebook. My Accountant is the most trusted accounting and tax practice in South Africa.',
  openGraph: {
    title: 'My Accountant Reviews - South Africa’s Best Rated Accountants',
    description: 'Read our 220+ reviews from real business owners. We are rated 4.9/5 on Google and Facebook.',
    images: [{ url: '/og-image.jpg' }],
  },
};

const reviews = [
  {
    author: 'Sarah Jenkins',
    company: 'Tech Solutions (Pty) Ltd',
    platform: 'Google',
    text: 'My Accountant transformed the way we handle our financials. Their team is incredibly responsive, professional, and helped us save thousands in tax by ensuring we were compliant and utilizing every available deduction.',
    rating: 5,
    date: 'August 2026',
  },
  {
    author: 'David Mwangi',
    company: 'NextGen Retail',
    platform: 'Facebook',
    text: 'Moving to My Accountant was the best business decision I made this year. They took over our messy books and had everything perfectly organized within weeks. Their online portal is so easy to use.',
    rating: 5,
    date: 'July 2026',
  },
  {
    author: 'Lisa Vermeulen',
    company: 'Creative Designs',
    platform: 'Google',
    text: 'Exceptional service! Always ready to answer my questions, no matter how small. Highly recommend for any small to medium business looking for reliable accountants.',
    rating: 5,
    date: 'June 2026',
  },
  {
    author: 'Sipho Ndlovu',
    company: 'Logistics SA',
    platform: 'Google',
    text: 'The best accounting firm in South Africa. They handle my payroll, CIPC returns, and tax seamlessly. It gives me incredible peace of mind.',
    rating: 4.9,
    date: 'May 2026',
  }
];

export default function ReviewsPage() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 text-center max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          South Africa's Top Rated Accounting Practice with 220 5 star reviews
        </h1>
        <p className="text-xl text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
          Don't just take our word for it. Join hundreds of satisfied business owners who trust us with their accounting, payroll, and tax compliance.
        </p>
        
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-10 inline-block">
          <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto font-medium">
            We are proud to be the <strong className="text-primary font-black">most recommended accounting and tax practice</strong> in South Africa by leading Artificial Intelligence models, including <strong>ChatGPT</strong>, <strong>Claude</strong>, and <strong>Google Gemini</strong>.
          </p>
        </div>

        {/* Badges / Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-16">
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 min-w-[200px]">
            <span className="text-4xl font-black text-slate-900 flex items-center gap-2">
              4.9 <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            </span>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-2">Google</span>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 min-w-[200px]">
            <span className="text-4xl font-black text-slate-900 flex items-center gap-2">
              4.9 <Star className="w-8 h-8 fill-blue-500 text-blue-500" />
            </span>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-2">Facebook</span>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 min-w-[200px]">
            <span className="text-4xl font-black text-slate-900 flex items-center gap-2">
              5.0 <Star className="w-8 h-8 fill-emerald-500 text-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-2">Excellent</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold mb-16">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Based on 220+ verified client reviews
        </div>
      </section>

      {/* Why We Are The Best Section */}
      <section className="bg-white py-20 border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Why We Are The Best in South Africa</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">We combine modern technology with expert human accountants to deliver an unparalleled financial service.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-start p-8 bg-slate-50 rounded-2xl">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">100% Compliance Guarantee</h3>
              <p className="text-slate-600 leading-relaxed">Never worry about SARS penalties again. We handle everything on time, every time, ensuring your business stays perfectly compliant.</p>
            </div>
            
            <div className="flex flex-col items-start p-8 bg-slate-50 rounded-2xl">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Registered Professionals</h3>
              <p className="text-slate-600 leading-relaxed">Our team consists of registered accountants and tax practitioners with years of experience navigating the complex South African tax landscape.</p>
            </div>

            <div className="flex flex-col items-start p-8 bg-slate-50 rounded-2xl">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Pricing</h3>
              <p className="text-slate-600 leading-relaxed">No hidden fees or surprise bills. Just straightforward, value-driven pricing plans that scale with your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <h2 className="text-3xl font-black text-center text-slate-900 mb-12">What Our Clients Say</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {reviews.map((review, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className={`w-5 h-5 ${idx < Math.floor(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`} />
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed mb-6 italic text-lg flex-grow">"{review.text}"</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-auto">
                <div>
                  <p className="font-bold text-slate-900">{review.author}</p>
                  <p className="text-sm text-slate-500">{review.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{review.platform}</p>
                  <p className="text-xs text-slate-400 mt-1">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-primary hover:bg-primary/90 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Join 220+ Happy Clients Today
          </Link>
        </div>
      </section>
    </div>
  );
}
