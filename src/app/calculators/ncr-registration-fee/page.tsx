'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  HelpCircle,
  ArrowRight,
  Info,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function NcrRegistrationFeeCalculatorPage() {
  const [debt, setDebt] = useState<string>('');
  const [branches, setBranches] = useState<string>('1');

  const calculateFees = () => {
    const numDebt = parseFloat(debt) || 0;
    const numBranches = parseInt(branches) || 1;

    const applicationFee = 550;
    const branchFee = numBranches * 250;

    let initialFee = 0;
    let category = '';

    if (numDebt < 250000) {
      initialFee = 1000;
      category = 'Category 9 (< R250k)';
    } else if (numDebt <= 500000) {
      initialFee = 1500;
      category = 'Category 8 (R250k - R500k)';
    } else if (numDebt <= 1000000) {
      initialFee = 2000;
      category = 'Category 7 (R500k - R1m)';
    } else if (numDebt <= 5000000) {
      initialFee = 2500 + (numDebt - 1000000) * 0.001;
      category = 'Category 6 (R1m - R5m)';
    } else if (numDebt <= 100000000) {
      initialFee = 7000 + (numDebt - 5000000) * 0.0001;
      category = 'Category 5 (R5m - R100m)';
    } else if (numDebt <= 1000000000) {
      initialFee = 16000 + (numDebt - 100000000) * 0.00005;
      category = 'Category 4 (R100m - R1bn)';
    } else if (numDebt <= 5000000000) {
      initialFee = 70000 + (numDebt - 1000000000) * 0.00003;
      category = 'Category 3 (R1bn - R5bn)';
    } else if (numDebt <= 15000000000) {
      initialFee = 190000 + (numDebt - 5000000000) * 0.00001;
      category = 'Category 2 (R5bn - R15bn)';
    } else {
      initialFee = 330000;
      category = 'Category 1 (≥ R15bn)';
    }

    const totalNcr = applicationFee + branchFee + initialFee;
    const assistanceFee = 1400; // Flat facilitation fee
    const totalWithAssistance = totalNcr + assistanceFee;

    return {
      applicationFee,
      branchFee,
      initialFee,
      category,
      totalNcr,
      assistanceFee,
      totalWithAssistance
    };
  };

  const results = calculateFees();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Header */}
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            NCR Registration Fee Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your National Credit Regulator (NCR) initial registration, branch, and application fees in South Africa.
          </p>
        </div>
      </section>

      {/* Main Panel */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Card */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-6">
                
                {/* Principal Debt */}
                <div className="space-y-2">
                  <Label htmlFor="debt" className="font-bold text-slate-800 text-sm">
                    Projected Annual Principal Debt / Credit Extended (R)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                    <Input
                      id="debt"
                      type="number"
                      placeholder="e.g. 500000"
                      value={debt}
                      onChange={(e) => setDebt(e.target.value)}
                      className="pl-8 h-11 border-border font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    The total amount of credit you project to extend to clients in a year, excluding interest and service fees.
                  </p>
                </div>

                {/* Branches */}
                <div className="space-y-2">
                  <Label htmlFor="branches" className="font-bold text-slate-800 text-sm">
                    Number of Business Branches / Locations
                  </Label>
                  <Input
                    id="branches"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={branches}
                    onChange={(e) => setBranches(e.target.value)}
                    className="h-11 border-border font-semibold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500">
                    NCR charges R250 per branch location from which you conduct credit operations.
                  </p>
                </div>

              </CardContent>
            </Card>

            {/* NCR Registration Mandatory Compliance */}
            <div className="bg-slate-50 border rounded-xl p-5 space-y-3 border-border">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Mandatory Registration Criteria
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                In South Africa, any person or entity providing loans, business credit, or deferred payments with interest for profit must register as a Credit Provider with the NCR. Failing to register makes your loan agreements legally void and unenforceable.
              </p>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-5">
            <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
              <div className="bg-primary text-white p-5 text-center">
                <h3 className="font-bold text-lg">NCR Cost Summary</h3>
              </div>
              <CardContent className="p-6 space-y-6 bg-white">
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>NCR Application Fee:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.applicationFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Branch Locations Fee:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.branchFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Initial Registration Fee:</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(results.initialFee)}
                    </span>
                  </div>
                  <p className="text-[10px] text-primary font-bold text-right -mt-2">
                    {results.category}
                  </p>
                  <Separator />
                  <div className="flex justify-between font-bold text-base text-slate-800">
                    <span>Direct NCR Total:</span>
                    <span>{formatCurrency(results.totalNcr)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <Link href="/products/ncr-registration" className="underline hover:text-primary transition-colors">
                      Our Facilitation Fee:
                    </Link>
                    <span className="font-semibold text-slate-700">{formatCurrency(results.assistanceFee)}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg text-primary">
                    <span>Full Service Total:</span>
                    <span>{formatCurrency(results.totalWithAssistance)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    *Our full service covers preparing NCR application form, compiling financial policies, arranging criminal record checks, and processing submissions.
                  </p>
                </div>

                <Button asChild className="w-full font-bold h-11">
                  <Link href="/contact">
                    Apply for NCR Registration <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Info details */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Understanding NCR Registration Steps</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Becoming a registered credit provider involves submitting an application, payment of fees, and supplying various required supporting documents (including CIPC records, tax clearance, and police clearance for directors). Once approved, you are issued an NCR registration certificate and number, which must be displayed on all loan agreements and premises.
        </p>
      </section>
    </div>
  );
}
