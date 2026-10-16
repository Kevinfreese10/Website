'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CalculatorClient() {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'exclusive' | 'inclusive'>('exclusive');

  const calculateVat = () => {
    const numAmount = parseFloat(amount) || 0;
    let vatAmount = 0;
    let exclusive = 0;
    let inclusive = 0;

    if (type === 'exclusive') {
      exclusive = numAmount;
      vatAmount = numAmount * 0.15;
      inclusive = numAmount * 1.15;
    } else {
      inclusive = numAmount;
      vatAmount = numAmount - (numAmount / 1.15);
      exclusive = numAmount / 1.15;
    }

    return { vatAmount, exclusive, inclusive };
  };

  const results = calculateVat();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-6 space-y-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-bold text-slate-800 text-sm">Amount (ZAR)</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-11 border-border font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-800 text-sm">Amount Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === 'exclusive' ? 'default' : 'outline'}
                  onClick={() => setType('exclusive')}
                  className="font-semibold text-xs h-10 border border-border"
                >
                  Excluding VAT
                </Button>
                <Button
                  type="button"
                  variant={type === 'inclusive' ? 'default' : 'outline'}
                  onClick={() => setType('inclusive')}
                  className="font-semibold text-xs h-10 border border-border"
                >
                  Including VAT
                </Button>
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
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Including VAT</span>
              <div className="text-3xl font-black text-slate-900">{formatCurrency(results.inclusive)}</div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Amount Excluding VAT:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(results.exclusive)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm text-slate-600">
                <span>VAT Amount (15%):</span>
                <span className="font-semibold text-primary">{formatCurrency(results.vatAmount)}</span>
              </div>
            </div>

            <Button asChild className="w-full font-bold h-11">
              <Link href="/vat-registration-south-africa">
                SARS VAT Registration &amp; VAT201 Services <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
