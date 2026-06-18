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
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SbcTaxEstimatorPage() {
  const [profit, setProfit] = useState<string>('');

  const calculateSbcTax = () => {
    const numProfit = parseFloat(profit) || 0;

    // 1. Calculate standard corporate income tax (CIT) at 27% flat
    const standardCit = numProfit * 0.27;

    // 2. Calculate SBC tax using 2026/2027 progressive brackets
    let sbcTax = 0;
    if (numProfit <= 99000) {
      sbcTax = 0;
    } else if (numProfit <= 365000) {
      sbcTax = (numProfit - 99000) * 0.07;
    } else if (numProfit <= 550000) {
      sbcTax = 18620 + (numProfit - 365000) * 0.21;
    } else {
      sbcTax = 57470 + (numProfit - 550000) * 0.27;
    }

    // Tax savings
    const savings = Math.max(0, standardCit - sbcTax);

    return {
      profit: numProfit,
      standardCit,
      sbcTax,
      savings
    };
  };

  const results = calculateSbcTax();

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
            Small Business Corporation (SBC) Tax Savings Estimator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your corporate tax savings by qualifying as a SARS Small Business Corporation (SBC).
          </p>
        </div>
      </section>

      {/* Main Calculator */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Panel */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profit" className="font-bold text-slate-800 text-sm">Annual Taxable Income / Profit (R)</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                    <Input
                      id="profit"
                      type="number"
                      placeholder="e.g. 450000"
                      value={profit}
                      onChange={(e) => setProfit(e.target.value)}
                      className="pl-8 h-11 border-border font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Enter your annual net profit before corporate tax is calculated.</p>
                </div>
              </CardContent>
            </Card>

            {/* SBC Requirements Box */}
            <div className="bg-slate-50 border rounded-xl p-5 space-y-3 border-border">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Basic SBC Requirements
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                To qualify for these progressive tax rates in South Africa, your company must meet these SARS rules:
              </p>
              <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc">
                <li>All shareholders must be natural persons (no holding companies or trusts).</li>
                <li>Gross turnover for the tax year must not exceed **R20 million**.</li>
                <li>Not more than 20% of gross income can consist of "investment income" and "personal service" income.</li>
                <li>Shareholders must not hold shares in any other active company.</li>
              </ul>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-6">
            <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
              <div className="bg-primary text-white p-5 text-center">
                <h3 className="font-bold text-lg">Estimated Savings</h3>
              </div>
              <CardContent className="p-6 space-y-6 bg-white">
                
                {/* Savings prominent display */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-1">
                  <span className="text-xs uppercase font-bold text-green-700 tracking-wider">Estimated Tax Savings</span>
                  <div className="text-3xl font-black text-green-900">{formatCurrency(results.savings)}</div>
                  <p className="text-[10px] text-green-700">Money kept in your business compared to standard 27% corporate tax.</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Standard Company Tax (27%):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.standardCit)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>SBC Tiered Tax (2026/2027):</span>
                    <span className="font-semibold text-primary">{formatCurrency(results.sbcTax)}</span>
                  </div>
                </div>

                <Button asChild className="w-full font-bold h-11">
                  <Link href="/contact">
                    Verify SBC Eligibility <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Info details */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Why the SBC Tax Structure is Critical for South African Startups</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Standard corporate income tax in South Africa is calculated at a flat 27% rate, meaning you pay R27,000 for every R100,000 in taxable profit. Qualifying as an SBC allows your business to pay 0% tax on the first R99,000 of profit, and only 7% on profit up to R365,000. This structure is a powerful incentive designed by SARS to support early-stage growth and job creation.
        </p>
      </section>
    </div>
  );
}
