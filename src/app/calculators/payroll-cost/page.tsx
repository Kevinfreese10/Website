'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  HelpCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';

export default function PayrollCostCalculatorPage() {
  const [employees, setEmployees] = useState<number>(10);

  const calculateFee = (empCount: number) => {
    if (empCount <= 10) {
      return 6400;
    }
    // R190 per additional employee above 10, capped at R14,000 for 50 employees
    return Math.min(6400 + (empCount - 10) * 190, 14000);
  };

  const currentFee = calculateFee(employees);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const faqs = [
    {
      q: "How does the payroll cost sliding scale work?",
      a: "For up to 10 employees, you pay a flat rate of R6,400 per month. If you have between 11 and 50 employees, you pay R6,400 plus an additional R190 per month for each employee above 10. The total fee is capped at a maximum of R14,000 per month for 50 employees."
    },
    {
      q: "What is included in the monthly payroll service?",
      a: "Our monthly payroll service includes digital payslip distribution, calculation and submission of monthly EMP201 returns (PAYE, UIF, SDL) to SARS, monthly electronic UIF declaration submissions (UI19) to the Department of Labour, bi-annual and annual EMP501 reconciliations, and generation of IRP5 tax certificates at year-end."
    },
    {
      q: "Are there any setup fees or hidden costs?",
      a: "No, we do not charge setup fees to transition your payroll. All standard payroll calculations, document generation, and returns are covered under the single monthly fee calculated by this tool."
    }
  ];

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Header */}
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl font-headline text-hero-gradient pb-2">
            Payroll Cost Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your monthly outsourced payroll administration and SARS/Department of Labour compliance fees instantly.
          </p>
        </div>
      </section>

      {/* Main Calculator Area */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Slider and Controls */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <Label className="font-bold text-slate-800 text-sm uppercase tracking-wide">Number of Employees</Label>
                    <span className="text-2xl font-black text-primary font-headline">
                      {employees === 50 ? "50+ (Max Cap)" : `${employees} Employees`}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={employees}
                    onChange={(e) => setEmployees(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                  />
                  
                  <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                    <span>1 Staff</span>
                    <span>10 Staff</span>
                    <span>25 Staff</span>
                    <span>50+ Staff</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Payroll Fee Structure</h4>
                  <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                    <li>• <span className="font-semibold text-slate-700">1 to 10 Employees:</span> Flat R6,400 / month</li>
                    <li>• <span className="font-semibold text-slate-700">11 to 50 Employees:</span> R6,400 + R190 per additional employee</li>
                    <li>• <span className="font-semibold text-slate-700">50+ Employees:</span> Capped at R14,000 / month maximum</li>
                  </ul>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pricing & Deliverables */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-border bg-card shadow-sm overflow-hidden rounded-3xl">
              <div className="bg-slate-900 text-white p-6 space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
                
                <div className="space-y-4 relative z-10">
                  <h3 className="text-lg font-bold text-emerald-400">Included Deliverables</h3>
                  
                  <ul className="space-y-2.5">
                    {[
                      "SARS-compliant monthly PDF payslips",
                      "Monthly EMP201 returns (PAYE/UIF/SDL)",
                      "UIF declarations (UI19) to Dept of Labour",
                      "Annual & Bi-annual EMP501 reconciliations",
                      "IRP5 tax certificates generated at year-end",
                      "EFT bank payment file export support"
                    ].map((inc, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4 relative z-10 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Monthly Fee</span>
                    <p className="text-3xl font-black text-white font-headline tracking-tight">
                      {formatCurrency(currentFee)} <span className="text-sm font-normal text-slate-400">/ mo</span>
                    </p>
                    <span className="text-[9px] text-slate-500 font-semibold block">VAT Exclusive</span>
                  </div>

                  <Button asChild className="w-full h-11 font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md">
                    <Link href={`/contact?package=payroll&employees=${employees}`} className="flex items-center justify-center gap-2">
                      Get Payroll Support
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* FAQs Section */}
      <section className="container mx-auto px-4 max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 animate-pulse" />
                  {faq.q}
                </div>
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
        <CalculatorDisclaimer note="Pricing shown is indicative. Confirm current fees before quoting a client." />
      </section>
    </div>
  );
}
