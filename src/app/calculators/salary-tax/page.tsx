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
  InfoIcon,
  HelpCircleIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SalaryTaxCalculatorPage() {
  const [salary, setSalary] = useState<string>('');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [ageGroup, setAgeGroup] = useState<'under65' | '65to74' | '75plus'>('under65');
  const [dependants, setDependants] = useState<string>('0');

  const calculateTax = () => {
    const numSalary = parseFloat(salary) || 0;
    const annualSalary = period === 'monthly' ? numSalary * 12 : numSalary;

    // 1. Calculate base tax using 2026/2027 SARS brackets
    let baseTax = 0;
    if (annualSalary <= 245100) {
      baseTax = annualSalary * 0.18;
    } else if (annualSalary <= 383100) {
      baseTax = 44118 + (annualSalary - 245100) * 0.26;
    } else if (annualSalary <= 530200) {
      baseTax = 79998 + (annualSalary - 383100) * 0.31;
    } else if (annualSalary <= 695800) {
      baseTax = 125599 + (annualSalary - 530200) * 0.36;
    } else if (annualSalary <= 887000) {
      baseTax = 185215 + (annualSalary - 695800) * 0.39;
    } else if (annualSalary <= 1878600) {
      baseTax = 259783 + (annualSalary - 887000) * 0.41;
    } else {
      baseTax = 666339 + (annualSalary - 1878600) * 0.45;
    }

    // 2. Subtract rebates
    let rebates = 17820; // Primary rebate
    if (ageGroup === '65to74') {
      rebates += 9765; // Secondary rebate
    } else if (ageGroup === '75plus') {
      rebates += 9765 + 3249; // Secondary + Tertiary rebates
    }

    // 3. Subtract medical tax credits
    const numDependants = parseInt(dependants) || 0;
    let medicalCreditMonthly = 0;
    if (numDependants >= 1) {
      medicalCreditMonthly += 376; // Main member
    }
    if (numDependants >= 2) {
      medicalCreditMonthly += 376; // First dependant
    }
    if (numDependants > 2) {
      medicalCreditMonthly += (numDependants - 2) * 254; // Additional dependants
    }
    const annualMedicalCredit = medicalCreditMonthly * 12;

    // Total tax calculations (cannot go below 0)
    const totalRebatesAndCredits = rebates + annualMedicalCredit;
    const annualTaxPayable = Math.max(0, baseTax - totalRebatesAndCredits);
    const monthlyTaxPayable = annualTaxPayable / 12;

    const annualTakeHome = Math.max(0, annualSalary - annualTaxPayable);
    const monthlyTakeHome = annualTakeHome / 12;

    const effectiveTaxRate = annualSalary > 0 ? (annualTaxPayable / annualSalary) * 100 : 0;

    return {
      annualSalary,
      monthlySalary: annualSalary / 12,
      baseTax,
      rebates,
      annualMedicalCredit,
      annualTaxPayable,
      monthlyTaxPayable,
      annualTakeHome,
      monthlyTakeHome,
      effectiveTaxRate
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
      {/* Hero Header */}
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            Salary Tax (PAYE) Calculator 2026/2027
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your monthly SARS pay-as-you-earn (PAYE) deductions and net take-home salary based on the latest tax rates.
          </p>
        </div>
      </section>

      {/* Calculator Body */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Card */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-6">
                
                {/* Salary Input */}
                <div className="space-y-2">
                  <Label htmlFor="salary" className="font-bold text-slate-800 text-sm">Gross Salary</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                      <Input
                        id="salary"
                        type="number"
                        placeholder="e.g. 35000"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        className="pl-8 h-11 border-border font-semibold text-slate-800"
                      />
                    </div>
                    <div className="flex bg-slate-50 border border-border rounded-lg p-1">
                      <Button
                        type="button"
                        variant={period === 'monthly' ? 'default' : 'ghost'}
                        onClick={() => setPeriod('monthly')}
                        className="h-9 font-semibold text-xs px-3"
                      >
                        Monthly
                      </Button>
                      <Button
                        type="button"
                        variant={period === 'annual' ? 'default' : 'ghost'}
                        onClick={() => setPeriod('annual')}
                        className="h-9 font-semibold text-xs px-3"
                      >
                        Annual
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Age Group */}
                <div className="space-y-3">
                  <Label className="font-bold text-slate-800 text-sm">Your Age Group</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={ageGroup === 'under65' ? 'default' : 'outline'}
                      onClick={() => setAgeGroup('under65')}
                      className="font-semibold text-xs h-10 border border-border"
                    >
                      Under 65
                    </Button>
                    <Button
                      type="button"
                      variant={ageGroup === '65to74' ? 'default' : 'outline'}
                      onClick={() => setAgeGroup('65to74')}
                      className="font-semibold text-xs h-10 border border-border"
                    >
                      65 - 74
                    </Button>
                    <Button
                      type="button"
                      variant={ageGroup === '75plus' ? 'default' : 'outline'}
                      onClick={() => setAgeGroup('75plus')}
                      className="font-semibold text-xs h-10 border border-border"
                    >
                      75+
                    </Button>
                  </div>
                </div>

                {/* Medical Aid Dependants */}
                <div className="space-y-2">
                  <Label htmlFor="dependants" className="font-bold text-slate-800 text-sm">
                    Medical Scheme Dependants
                  </Label>
                  <div className="relative">
                    <Input
                      id="dependants"
                      type="number"
                      min="0"
                      max="15"
                      placeholder="e.g. 2 (Self + Dependant)"
                      value={dependants}
                      onChange={(e) => setDependants(e.target.value)}
                      className="h-11 border-border font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Helps estimate your SARS Medical Scheme Fees Tax Credit.</p>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-6">
            <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
              <div className="bg-primary text-white p-5 text-center">
                <h3 className="font-bold text-lg">Calculation Summary</h3>
              </div>
              <CardContent className="p-6 space-y-6 bg-white">
                
                {/* Take home pay prominent block */}
                <div className="bg-slate-50 border border-border rounded-xl p-5 text-center space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Estimated Monthly Take-Home</span>
                  <div className="text-3xl font-black text-slate-900">{formatCurrency(results.monthlyTakeHome)}</div>
                  <div className="text-xs text-slate-500">Effective Tax Rate: {results.effectiveTaxRate.toFixed(1)}%</div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Monthly Gross Income:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.monthlySalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Monthly PAYE Tax:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(results.monthlyTaxPayable)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Annual Rebate Used:</span>
                    <span>{formatCurrency(results.rebates)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Annual Medical Credit:</span>
                    <span>{formatCurrency(results.annualMedicalCredit)}</span>
                  </div>
                </div>

                <Button asChild className="w-full font-bold h-11">
                  <Link href="/contact">
                    Talk to a Tax Consultant <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Explanatory notes */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">How SARS Personal Income Tax Calculations Work</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          South Africa utilizes a progressive tax system. This means that as your income increases, the percentage of tax you pay on each additional Rand also increases. The calculation begins by grouping your total annual salary into brackets, calculating the gross tax due, and then applying any rebates or medical aid tax credits for which you qualify.
        </p>
      </section>
    </div>
  );
}
