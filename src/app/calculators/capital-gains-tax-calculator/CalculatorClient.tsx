'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';

export default function CapitalGainsTaxCalculatorClient() {
  const [proceeds, setProceeds] = useState<string>('');
  const [baseCost, setBaseCost] = useState<string>('');
  const [taxpayerType, setTaxpayerType] = useState<'individual' | 'company'>('individual');
  const [marginalRate, setMarginalRate] = useState<string>('45');

  const calculateCGT = () => {
    const numProceeds = parseFloat(proceeds) || 0;
    const numBaseCost = parseFloat(baseCost) || 0;

    const capitalGain = Math.max(0, numProceeds - numBaseCost);

    const annualExclusion = taxpayerType === 'individual' ? 40000 : 0;
    const netCapitalGain = Math.max(0, capitalGain - annualExclusion);

    const inclusionRate = taxpayerType === 'individual' ? 0.40 : 0.80;
    const taxableCapitalGain = netCapitalGain * inclusionRate;

    const taxRate =
      taxpayerType === 'individual' ? (parseFloat(marginalRate) || 0) / 100 : 0.27;
    const cgtPayable = taxableCapitalGain * taxRate;

    return {
      capitalGain,
      netCapitalGain,
      taxableCapitalGain,
      cgtPayable,
    };
  };

  const results = calculateCGT();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section className="container mx-auto px-4 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 space-y-6">
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="font-bold text-slate-800 text-sm">Taxpayer Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={taxpayerType === 'individual' ? 'default' : 'outline'}
                    onClick={() => setTaxpayerType('individual')}
                    className="font-semibold text-xs h-10 border border-border"
                  >
                    Individual
                  </Button>
                  <Button
                    type="button"
                    variant={taxpayerType === 'company' ? 'default' : 'outline'}
                    onClick={() => setTaxpayerType('company')}
                    className="font-semibold text-xs h-10 border border-border"
                  >
                    Company
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proceeds" className="font-bold text-slate-800 text-sm">
                  Proceeds (Selling Price)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                    R
                  </span>
                  <Input
                    id="proceeds"
                    type="number"
                    value={proceeds}
                    onChange={(e) => setProceeds(e.target.value)}
                    className="pl-8 h-11 border-border font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseCost" className="font-bold text-slate-800 text-sm">
                  Base Cost (Original Purchase Price + Costs)
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                    R
                  </span>
                  <Input
                    id="baseCost"
                    type="number"
                    value={baseCost}
                    onChange={(e) => setBaseCost(e.target.value)}
                    className="pl-8 h-11 border-border font-semibold text-slate-800"
                  />
                </div>
              </div>

              {taxpayerType === 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="marginalRate" className="font-bold text-slate-800 text-sm">
                    Marginal Tax Rate (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="marginalRate"
                      type="number"
                      value={marginalRate}
                      onChange={(e) => setMarginalRate(e.target.value)}
                      className="h-11 border-border font-semibold text-slate-800"
                    />
                  </div>
                </div>
              )}
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
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Estimated CGT Payable
                </span>
                <div className="text-3xl font-black text-slate-900">
                  {formatCurrency(results.cgtPayable)}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total Capital Gain:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(results.capitalGain)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Taxable Capital Gain:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(results.taxableCapitalGain)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <CalculatorDisclaimer note="This tool assumes the top marginal rate unless you change it, and does not apply the primary residence exclusion, roll-over relief, or exclusions on death. Actual CGT is frequently lower." />
    </section>
  );
}
