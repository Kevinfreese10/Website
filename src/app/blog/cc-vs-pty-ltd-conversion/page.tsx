import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'CC vs Pty Ltd: Why You Should Convert to a Pty Ltd',
  description: 'Learn why converting your Close Corporation (CC) to a Private Company (Pty Ltd) in South Africa is highly recommended and how to do it.',
  alternates: {
    canonical: `${SITE_URL}/blog/cc-vs-pty-ltd-conversion`,
  },
  openGraph: {
    title: 'CC vs Pty Ltd Conversion | My Accountant',
    description: 'Understand the benefits of converting your CC to a Pty Ltd and ensure compliance with the new Companies Act.',
  }
};

export default function CcVsPtyLtdConversion() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-lg lg:prose-xl prose-blue mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-8">
          CC vs Pty Ltd: Why It's Time to Convert
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          If you registered a business in South Africa before 2008, there is a good chance you own a Close Corporation (CC). However, under the new Companies Act of 2008, no new CCs can be registered. While existing CCs are still valid, converting your CC to a Pty Ltd offers numerous advantages.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What Happened to Close Corporations?</h2>
        <p className="text-gray-700 mb-6">
          The Companies Act (No. 71 of 2008) replaced the old act and aimed to simplify corporate structures. As a result, the formation of new Close Corporations was phased out. While existing CCs can continue to operate indefinitely, they are increasingly seen as a legacy structure.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Why Convert to a Pty Ltd?</h2>
        <p className="text-gray-700 mb-6">
          Converting from a CC to a Pty Ltd brings several key benefits:
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
          <li><strong>Better Investor Appeal:</strong> Investors and banks generally prefer the standard corporate structure of a Pty Ltd over a CC. A Pty Ltd issues shares, making it easier to raise capital.</li>
          <li><strong>Modern Compliance:</strong> The modern Companies Act is designed around the Pty Ltd structure. Converting aligns your business with current corporate governance standards.</li>
          <li><strong>Perpetual Succession:</strong> A Pty Ltd has perpetual succession, meaning it continues to exist regardless of changes in shareholders or directors, simplifying estate planning and succession.</li>
          <li><strong>No Audit Requirement (Often):</strong> Like CCs, many small Pty Ltds are exempt from statutory audits, meaning you get the benefits of a company without excessive audit fees, provided your public interest score remains low.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How Does the Conversion Work?</h2>
        <p className="text-gray-700 mb-6">
          The process involves lodging a formal application with the Companies and Intellectual Property Commission (CIPC). It requires:
        </p>
        <ol className="list-decimal pl-6 text-gray-700 mb-6 space-y-2">
          <li>A written resolution by all members of the CC agreeing to the conversion.</li>
          <li>Filing a Notice of Incorporation and a Memorandum of Incorporation (MOI).</li>
          <li>Payment of the prescribed CIPC fees.</li>
        </ol>
        <p className="text-gray-700 mb-6">
          Once converted, your CC number will change, and the suffix "CC" will be replaced by "(Pty) Ltd". Importantly, all assets, liabilities, and contracts of the CC automatically transfer to the new Pty Ltd.
        </p>

        <div className="bg-blue-50 p-6 rounded-lg mt-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Ready to Upgrade Your Business Structure?</h3>
          <p className="text-blue-800 mb-4">
            We handle the entire CC to Pty Ltd conversion process seamlessly through CIPC, saving you time and avoiding bureaucratic headaches.
          </p>
          <Link href="/contact" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
            Start Your Conversion Today
          </Link>
        </div>
      </article>
    </div>
  );
}
