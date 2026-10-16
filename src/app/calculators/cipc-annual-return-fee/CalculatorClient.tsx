'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CipcAnnualReturnFeeCalculatorClient() {
  const [turnover, setTurnover] = useState<string>('');
  const [isLate, setIsLate] = useState<boolean>(false);
  const [entityType, setEntityType] = useState<'private' | 'public'>('private');

  const calculateFees = () => {
    const numTurnover = parseFloat(turnover) || 0;
    let baseFee = 0;

    if (entityType === 'private') {
      if (numTurnover < 1000000) {
        baseFee = 100;
      } else if (numTurnover < 10000000) {
        baseFee = 450;
      } else if (numTurnover < 25000000) {
        baseFee = 2000;
      } else {
        baseFee = 3000;
      }
    } else {
      baseFee = 4000;
    }

    const penalty = isLate ? 150 : 0;
    const totalCipc = baseFee + penalty;
    const assistanceFee = 350;
    const totalWithAssistance = totalCipc + assistanceFee;

    return {
      baseFee,
      penalty,
      totalCipc,
      assistanceFee,
      totalWithAssistance,
    };
  };

  const fees = calculateFees();

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
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="font-bold text-slate-800 text-sm">Company Entity Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={entityType === 'private' ? 'default' : 'outline'}
                    onClick={() => setEntityType('private')}
                    className="font-semibold h-11 border border-border"
                  >
                    Private Company / CC
                  </Button>
                  <Button
                    type="button"
                    variant={entityType === 'public' ? 'default' : 'outline'}
                    onClick={() => setEntityType('public')}
                    className="font-semibold h-11 border border-border"
                  >
                    Public / External
                  </Button>
                </div>
              </div>

              {entityType === 'private' && (
                <div className="space-y-2">
                  <Label htmlFor="turnover" className="font-bold text-slate-800 text-sm">
                    Annual Turnover (R)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                      R
                    </span>
                    <Input
                      id="turnover"
                      type="number"
                      placeholder="e.g. 850000"
                      value={turnover}
                      onChange={(e) => setTurnover(e.target.value)}
                      className="pl-8 h-11 border-border font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Enter turnover matching your latest approved financial statements.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-border">
                <Checkbox
                  id="isLate"
                  checked={isLate}
                  onCheckedChange={(checked) => setIsLate(!!checked)}
                  className="mt-0.5 border-border"
                />
                <div className="grid gap-1">
                  <Label
                    htmlFor="isLate"
                    className="font-bold text-slate-800 text-sm cursor-pointer select-none"
                  >
                    Filing is Late / Overdue
                  </Label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Annual returns must be filed within 30 business days from the anniversary date. Check this box if you missed the deadline.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-5 flex gap-3 text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-700" />
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm">Important CIPC Notice</h4>
              <p className="text-xs leading-relaxed text-amber-800">
                Filing is mandatory every year, even if your company was completely dormant or made a loss. Failure to file annual returns results in automatic deregistration by the CIPC, causing you to lose ownership of your company name.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
            <div className="bg-primary text-white p-5 text-center">
              <h3 className="font-bold text-lg">Calculation Summary</h3>
            </div>
            <CardContent className="p-6 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>CIPC Base Filing Fee:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(fees.baseFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Late Filing Penalty:</span>
                  <span
                    className={`font-semibold ${
                      fees.penalty > 0 ? 'text-red-600' : 'text-slate-800'
                    }`}
                  >
                    {formatCurrency(fees.penalty)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base text-slate-800">
                  <span>Direct CIPC Total:</span>
                  <span>{formatCurrency(fees.totalCipc)}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Filing Assistance Fee:</span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(fees.assistanceFee)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-lg text-primary">
                  <span>Full Service Total:</span>
                  <span>{formatCurrency(fees.totalWithAssistance)}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  *Our full service covers payment processing, submission checks, CIPC tracking, and email delivery of your updated disclosure certificate.
                </p>
              </div>

              <Button asChild className="w-full font-bold h-11">
                <Link href="/products/annual-returns">
                  File Annual Return Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
