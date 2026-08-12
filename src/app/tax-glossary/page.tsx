import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Glossary | My Accountant',
  description: 'Understand common tax terms and definitions with our comprehensive South African tax glossary.',
};

export default function TaxGlossaryPage() {
  const glossaryTerms = [
    { term: "Capital Gains Tax (CGT)", definition: "A tax levied on the profit made from the disposal of a capital asset." },
    { term: "PAYE (Pay As You Earn)", definition: "The system whereby employers are required to deduct income tax from their employees' salaries." },
    { term: "Provisional Tax", definition: "A method of paying income tax in advance to ensure the taxpayer does not have a large tax debt on assessment." },
    { term: "Value-Added Tax (VAT)", definition: "An indirect tax on the consumption of goods and services in the economy." },
    { term: "Turnover Tax", definition: "A simplified tax system for micro-businesses with a qualifying turnover of up to R1 million per year." },
    { term: "Input VAT", definition: "VAT that a vendor pays on goods and services acquired for the business." },
    { term: "Output VAT", definition: "VAT that a vendor charges on the sale of goods and services." },
  ];

  return (
    <main className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-black mb-8 text-slate-900">South African Tax Glossary</h1>
      <p className="text-lg text-slate-600 mb-12">
        Navigate the complexities of South African tax law with our easy-to-understand glossary of common terms.
      </p>

      <div className="space-y-6">
        {glossaryTerms.map((item, index) => (
          <div key={index} className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{item.term}</h3>
            <p className="text-slate-600">{item.definition}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
