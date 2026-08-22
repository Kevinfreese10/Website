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
  Info,
  AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';

export default function TurnoverTaxCalculatorPage() {
  const [turnover, setTurnover] = useState<string>('');

  const calculateTurnoverTax = () => {
    const numTurnover = parseFloat(turnover) || 0;

    if (numTurnover <= 0) {
      return { tax: 0, effectiveRate: 0, isExceeded: false };
    }

    if (numTurnover > 1000000) {
      return { tax: 0, effectiveRate: 0, isExceeded: true };
    }

    let tax = 0;
    if (numTurnover <= 335000) {
      tax = 0;
    } else if (numTurnover <= 500000) {
      tax = (numTurnover - 335000) * 0.01;
    } else if (numTurnover <= 750000) {
      tax = 1650 + (numTurnover - 500000) * 0.02;
    } else {
      tax = 6650 + (numTurnover - 750000) * 0.03;
    }

    const effectiveRate = numTurnover > 0 ? (tax / numTurnover) * 100 : 0;

    return { tax, effectiveRate, isExceeded: false };
  };

  const { tax, effectiveRate, isExceeded } = calculateTurnoverTax();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            Micro-Business Tax Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            SARS Turnover Tax Calculator
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Calculate your estimated SARS Turnover Tax payable for micro-businesses with annual gross revenue up to R1 million.
          </p>
        </div>

        {/* Main Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Enter Gross Annual Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="turnover" className="font-bold text-slate-800 text-sm">
                  Annual Turnover / Gross Revenue (R)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R</span>
                  <Input
                    id="turnover"
                    type="number"
                    placeholder="e.g. 450000"
                    className="pl-8 text-base font-bold text-slate-900"
                    value={turnover}
                    onChange={(e) => setTurnover(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Gross income received before deducting expenses. Max qualifying limit is R1,000,000.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-blue-600" />
                  Turnover Tax Benefits
                </div>
                <p className="leading-relaxed">
                  Replaces Income Tax, VAT, Provisional Tax, and CGT with a single tax payment. The first R335,000 of turnover is completely tax-free!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl flex flex-col justify-between">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Estimated Tax Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-center">
              {isExceeded ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-700 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Exceeds R1M Qualifying Limit
                  </div>
                  <p className="leading-relaxed">
                    Turnover Tax is strictly restricted to micro-businesses with annual turnover of R1,000,000 or less.
                  </p>
                  <p className="font-semibold">
                    We recommend checking out Small Business Corporation (SBC) tax rates or Standard Company Tax instead!
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full mt-2 border-amber-300 text-amber-900 hover:bg-amber-100">
                    <Link href="/calculators/sbc-tax-estimator">Check SBC Tax Rates →</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center p-6 rounded-2xl bg-slate-900 text-white space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Annual Turnover Tax</span>
                    <div className="text-4xl font-extrabold text-emerald-400">{formatCurrency(tax)}</div>
                    <div className="text-xs text-slate-300 font-medium">
                      Effective Tax Rate: <strong className="text-white">{effectiveRate.toFixed(2)}%</strong> of gross turnover
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500">Qualifying Bracket</span>
                      <span className="font-bold text-slate-900">
                        {parseFloat(turnover) <= 335000 ? '0% (Tax Free)' : parseFloat(turnover) <= 500000 ? '1%' : parseFloat(turnover) <= 750000 ? '2%' : '3%'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500">Tax Exempt Amount</span>
                      <span className="font-bold text-emerald-600">R335,000</span>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="pt-2">
                <Button asChild className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm h-11 rounded-xl shadow-sm">
                  <Link href="/sars-turnover-tax-registration" className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Read SARS Turnover Tax Guide & Apply
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Section */}
        <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Turnover Tax Brackets Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-xs text-slate-600 space-y-4">
            <p>
              The table below outlines the progressive Turnover Tax rates applicable to qualifying South African sole proprietors, partnerships, close corporations, and companies:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="p-2.5">Turnover Bracket</th>
                    <th className="p-2.5">Rate of Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">R0 – R335,000</td>
                    <td className="p-2.5 text-emerald-700 font-bold">0%</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">R335,001 – R500,000</td>
                    <td className="p-2.5">1% of amount above R335,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">R500,001 – R750,000</td>
                    <td className="p-2.5">R1,650 + 2% of amount above R500,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">R750,001 – R1,000,000</td>
                    <td className="p-2.5">R6,650 + 3% of amount above R750,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <CalculatorDisclaimer />
    </main>
  );
}
