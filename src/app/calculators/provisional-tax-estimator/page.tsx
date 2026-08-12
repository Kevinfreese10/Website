'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ProvisionalTaxEstimatorPage() {
  const [income, setIncome] = useState<string>('');
  const [period, setPeriod] = useState<'annual'>('annual');

  const calculateTax = () => {
    const annualIncome = parseFloat(income) || 0;

    let baseTax = 0;
    if (annualIncome <= 245100) {
      baseTax = annualIncome * 0.18;
    } else if (annualIncome <= 383100) {
      baseTax = 44118 + (annualIncome - 245100) * 0.26;
    } else if (annualIncome <= 530200) {
      baseTax = 79998 + (annualIncome - 383100) * 0.31;
    } else if (annualIncome <= 695800) {
      baseTax = 125599 + (annualIncome - 530200) * 0.36;
    } else if (annualIncome <= 887000) {
      baseTax = 185215 + (annualIncome - 695800) * 0.39;
    } else if (annualIncome <= 1878600) {
      baseTax = 259783 + (annualIncome - 887000) * 0.41;
    } else {
      baseTax = 666339 + (annualIncome - 1878600) * 0.45;
    }

    const primaryRebate = 17820;
    const estimatedTax = Math.max(0, baseTax - primaryRebate);
    const halfYearTax = estimatedTax / 2;

    return {
      annualIncome,
      estimatedTax,
      halfYearTax
    };
  };

  const results = calculateTax();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-16 pb-24">
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            Provisional Tax Estimator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your tax payable based on your estimated annual taxable income.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="income" className="font-bold text-slate-800 text-sm">Estimated Annual Taxable Income</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                    <Input
                      id="income"
                      type="number"
                      placeholder="e.g. 500000"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      className="pl-8 h-11 border-border font-semibold text-slate-800"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
              <div className="bg-primary text-white p-5 text-center">
                <h3 className="font-bold text-lg">Calculation Summary</h3>
              </div>
              <CardContent className="p-6 space-y-6 bg-white">
                
                <div className="bg-slate-50 border border-border rounded-xl p-5 text-center space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Estimated Annual Tax</span>
                  <div className="text-3xl font-black text-slate-900">{formatCurrency(results.estimatedTax)}</div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>1st Provisional Payment (Aug):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.halfYearTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>2nd Provisional Payment (Feb):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.halfYearTax)}</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </section>
    </div>
  );
}
