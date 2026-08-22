'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';

export default function UifCoidaCalculatorPage() {
  const [salary, setSalary] = useState<string>('');

  const calculateContributions = () => {
    const grossSalary = parseFloat(salary) || 0;
    
    // UIF is capped at R17712 per month. (1% employee, 1% employer)
    const uifSalaryCap = 17712;
    const uifApplicableSalary = Math.min(grossSalary, uifSalaryCap);
    
    const employeeUif = uifApplicableSalary * 0.01;
    const employerUif = uifApplicableSalary * 0.01;
    const totalUif = employeeUif + employerUif;
    
    // COIDA is usually paid annually, estimate around 1% of gross earnings (varies by industry risk)
    const estimatedCoidaMonthly = grossSalary * 0.01;
    const estimatedCoidaAnnual = estimatedCoidaMonthly * 12;

    return {
      grossSalary,
      employeeUif,
      employerUif,
      totalUif,
      estimatedCoidaMonthly,
      estimatedCoidaAnnual
    };
  };

  const results = calculateContributions();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2
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
            UIF & COIDA Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Calculate monthly UIF contributions and estimate COIDA levies based on gross salary.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="salary" className="font-bold text-slate-800 text-sm">Monthly Gross Salary</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="e.g. 25000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
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
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Monthly UIF</span>
                  <div className="text-3xl font-black text-slate-900">{formatCurrency(results.totalUif)}</div>
                  <div className="text-xs text-slate-500">Max capped at R177.12 each</div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Employee UIF Contribution (1%):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.employeeUif)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Employer UIF Contribution (1%):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.employerUif)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Estimated Annual COIDA (~1%):</span>
                    <span className="font-semibold text-primary">{formatCurrency(results.estimatedCoidaAnnual)}</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
        <CalculatorDisclaimer note="COIDA is estimated without applying the annual earnings ceiling, and assessment tariffs vary by industry classification. Treat the COIDA figure as indicative only." />
      </section>
    </div>
  );
}
