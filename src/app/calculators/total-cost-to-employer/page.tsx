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
  DollarSign,
  Users
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';

export default function TotalCostToEmployerCalculatorPage() {
  const [salary, setSalary] = useState<string>('');
  const [riskClass, setRiskClass] = useState<string>('0.005'); // Default: Office/Admin 0.5%

  const calculateTcoe = () => {
    const numSalary = parseFloat(salary) || 0;

    // 1. UIF: 1% of Gross, capped at Gross of R17,712 per month
    const uifEmployer = numSalary > 17712 ? 177.12 : numSalary * 0.01;

    // 2. SDL: 1% of Gross if annual salary > R500,000 (approx R41,667 per month)
    const sdlEmployer = (numSalary > 41667) ? numSalary * 0.01 : 0;

    // 3. COIDA: Gross * riskClass percentage
    const coidaPercent = parseFloat(riskClass) || 0.005;
    const coidaEmployer = numSalary * coidaPercent;

    // Totals
    const totalOverhead = uifEmployer + sdlEmployer + coidaEmployer;
    const totalTcoe = numSalary + totalOverhead;

    return {
      grossSalary: numSalary,
      uifEmployer,
      sdlEmployer,
      coidaEmployer,
      totalOverhead,
      totalTcoe
    };
  };

  const results = calculateTcoe();

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
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            Total Cost to Employer (TCOE) Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Calculate your company's full payroll overhead, including employer UIF, SDL, and COIDA estimations on top of gross salary.
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
                  <Label htmlFor="salary" className="font-bold text-slate-800 text-sm">Monthly Gross Salary (R)</Label>
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
                  <p className="text-[10px] text-slate-500">Enter the basic monthly salary paid to the employee.</p>
                </div>

                {/* Risk Category / COIDA */}
                <div className="space-y-2">
                  <Label htmlFor="risk" className="font-bold text-slate-800 text-sm">Industry COIDA Risk Category</Label>
                  <select
                    id="risk"
                    value={riskClass}
                    onChange={(e) => setRiskClass(e.target.value)}
                    className="w-full h-11 px-3 border border-border rounded-lg bg-white font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="0.005">Office / Admin / Consulting (0.5% rate)</option>
                    <option value="0.012">Retail / Hospitality / Trade (1.2% rate)</option>
                    <option value="0.018">Light Manufacturing / Logistics / Transport (1.8% rate)</option>
                    <option value="0.030">Heavy Construction / Mining / Engineering (3.0% rate)</option>
                  </select>
                  <p className="text-[10px] text-slate-500">Estimates Compensation for Occupational Injuries and Diseases Act (COIDA) levy.</p>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-6">
            <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
              <div className="bg-primary text-white p-5 text-center">
                <h3 className="font-bold text-lg">Payroll Cost Breakdown</h3>
              </div>
              <CardContent className="p-6 space-y-6 bg-white">
                
                {/* Take home pay prominent block */}
                <div className="bg-slate-50 border border-border rounded-xl p-5 text-center space-y-1">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Monthly Cost to Employer</span>
                  <div className="text-3xl font-black text-slate-900">{formatCurrency(results.totalTcoe)}</div>
                  <div className="text-xs text-slate-500">Payroll Overhead: +{formatCurrency(results.totalOverhead)}/month</div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Gross Basic Salary:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Employer UIF (1% capped):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.uifEmployer)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Employer SDL (1% if applicable):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.sdlEmployer)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Estimated COIDA (Workmen's Comp):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(results.coidaEmployer)}</span>
                  </div>
                </div>

                <Button asChild className="w-full font-bold h-11">
                  <Link href="/contact">
                    Talk to a Payroll Specialist <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Explanatory notes */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Why Calculating TCOE is Critical for South African Businesses</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Many small business owners assume that the gross salary on an employment contract is their only labor cost. However, in South Africa, employers are statutory required to contribute to the Unemployment Insurance Fund (UIF), the Skills Development Levy (SDL - for companies with an annual payroll above R500,000), and yearly COIDA insurance premiums. Accurately modeling these overheads is essential for hiring planning and cash flow health.
        </p>
        <CalculatorDisclaimer note="The Skills Development Levy is estimated per employee. The R500 000 exemption applies to your TOTAL annual payroll, not to an individual salary, and the Employment Tax Incentive is not applied here." />
      </section>
    </div>
  );
}
