import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sole Proprietor vs Pty Ltd: Which is Best in South Africa?',
  description: 'A detailed guide comparing Sole Proprietorships and Private Companies (Pty Ltd) in South Africa. Understand the tax, legal, and operational differences.',
  openGraph: {
    title: 'Sole Proprietor vs Pty Ltd | My Accountant',
    description: 'Learn the differences between a Sole Proprietor and a Pty Ltd in South Africa to make the right business choice.',
  }
};

export default function SoleProprietorVsPtyLtd() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-lg lg:prose-xl prose-blue mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-8">
          Sole Proprietor vs Pty Ltd: Choosing the Right Structure
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Starting a business in South Africa requires choosing a legal structure. The two most common options for new entrepreneurs are registering as a Sole Proprietor or a Private Company (Pty Ltd). Let's explore which option is best for your goals.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is a Sole Proprietor?</h2>
        <p className="text-gray-700 mb-6">
          A Sole Proprietorship is the simplest business structure. There is no legal distinction between the owner and the business. All profits are your personal income, and all debts are your personal liabilities.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
          <li><strong>Pros:</strong> Easy and free to set up, minimal administration, and lower accounting fees.</li>
          <li><strong>Cons:</strong> Unlimited personal liability, harder to raise capital, and potentially higher tax rates at higher income brackets.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is a Pty Ltd (Private Company)?</h2>
        <p className="text-gray-700 mb-6">
          A Private Company is a separate legal entity from its owners (shareholders). It provides limited liability protection and has its own tax identity.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
          <li><strong>Pros:</strong> Limited personal liability, looks more professional, easier to attract investors, and flat corporate tax rate (27%).</li>
          <li><strong>Cons:</strong> Higher setup costs, strict CIPC compliance, requires annual returns, and higher accounting fees.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Tax Implications</h2>
        <p className="text-gray-700 mb-6">
          <strong>Sole Proprietors</strong> are taxed on the individual sliding scale, ranging from 18% to 45%. This is beneficial if your business profits are low (under R300,000 per year) because you benefit from the primary tax rebate.
        </p>
        <p className="text-gray-700 mb-6">
          <strong>Pty Ltds</strong> are taxed at a flat rate of 27% on taxable income. Small Business Corporations (SBCs) can get even better tax rates. If your profits are high, a company structure is generally more tax-efficient.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Which Should You Choose?</h2>
        <p className="text-gray-700 mb-6">
          Start as a <strong>Sole Proprietor</strong> if you are testing a low-risk idea, have minimal startup capital, and expect lower initial profits.
        </p>
        <p className="text-gray-700 mb-6">
          Register a <strong>Pty Ltd</strong> if your business carries financial risk, you plan to hire employees, need to bid for tenders, or expect high profits.
        </p>

        <div className="bg-blue-50 p-6 rounded-lg mt-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Need Help Registering?</h3>
          <p className="text-blue-800 mb-4">
            We can help you evaluate your business structure and register your new Pty Ltd company quickly and compliantly.
          </p>
          <Link href="/contact" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
            Contact Us Today
          </Link>
        </div>
      </article>
    </div>
  );
}
