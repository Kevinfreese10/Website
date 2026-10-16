'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CalculatorClient() {
  const [turnover, setTurnover] = useState<string>('');

  const calculateTurnoverTax = () => {
    const numTurnover = parseFloat(turnover) || 0;

    if (numTurnover <= 0) {
      return { tax: 0, effectiveRate: 0, isExceeded: false };
    }

    if (numTurnover > 2300000) {
      return { tax: 0, effectiveRate: 0, isExceeded: true };
    }

    let tax = 0;
    if (numTurnover <= 600000) {
      tax = 0;
    } else if (numTurnover <= 950000) {
      tax = (numTurnover - 600000) * 0.01;
    } else if (numTurnover <= 1400000) {
      tax = 3500 + (numTurnover - 950000) * 0.02;
    } else {
      tax = 12500 + (numTurnover - 1400000) * 0.03;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl">
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
                placeholder="e.g. 750000"
                className="pl-8 text-base font-bold text-slate-900"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Gross income received before deducting expenses. Max qualifying limit is R2,300,000.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs text-blue-900">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-blue-600" />
              Turnover Tax Benefits
            </div>
            <p className="leading-relaxed">
              Replaces Income Tax, VAT, Provisional Tax, and CGT with a single tax payment. The first R600,000 of turnover is completely tax-free!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl flex flex-col justify-between">
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
                Exceeds R2.3M Qualifying Limit
              </div>
              <p className="leading-relaxed">
                Turnover Tax is strictly restricted to micro-businesses with annual turnover of R2,300,000 or less.
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
              <div className="text-center p-6 rounded-xl bg-slate-900 text-white space-y-2">
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
                    {(parseFloat(turnover) || 0) <= 600000 ? '0% (Tax Free)' : (parseFloat(turnover) || 0) <= 950000 ? '1%' : (parseFloat(turnover) || 0) <= 1400000 ? '2%' : '3%'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="font-medium text-slate-500">Tax Exempt Amount</span>
                  <span className="font-bold text-emerald-600">R600,000</span>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="pt-2">
            <Button asChild className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm h-11 rounded-xl shadow-sm">
              <Link href="/sars-turnover-tax-registration" className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Read SARS Turnover Tax Guide &amp; Apply
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
