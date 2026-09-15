'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OutsourcedPayrollFeesCalculator() {
  const [employees, setEmployees] = useState<number>(10);

  const calculateFee = (empCount: number) => {
    if (empCount <= 10) {
      return 6400;
    }
    // R190 per additional employee above 10, capped at R14,000 for 50 employees
    return Math.min(6400 + (empCount - 10) * 190, 14000);
  };

  const currentFee = calculateFee(employees);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const inclusions = [
    "SARS-compliant monthly PDF payslips",
    "Monthly EMP201 calculation & submission",
    "Monthly UIF declaration (UI19) filing",
    "EMP501 Mid-Year & Annual Reconciliations",
    "IRP5 tax certificates at year-end",
    "Direct bank EFT payment file export",
    "Leave tracking and dashboard support"
  ];

  return (
    <Card className="border border-border bg-card shadow-lg max-w-4xl mx-auto rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Controls */}
        <div className="md:col-span-7 p-6 md:p-8 space-y-8 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <Label className="text-sm font-black text-slate-800 tracking-wide uppercase">Number of Employees</Label>
              <span className="text-2xl font-black text-primary font-headline">
                {employees === 50 ? "50+ (Max Cap)" : `${employees} Employees`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={employees}
              onChange={(e) => setEmployees(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
              <span>1 Staff</span>
              <span>10 Staff</span>
              <span>25 Staff</span>
              <span>50+ Staff</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider mb-2">Pricing Structure</h4>
            <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
              <li>• <span className="font-bold text-slate-700">1 to 10 Employees:</span> Flat R6,400 / month</li>
              <li>• <span className="font-bold text-slate-700">11 to 50 Employees:</span> R6,400 + R190 per additional employee</li>
              <li>• <span className="font-bold text-slate-700">50+ Employees:</span> Capped at R14,000 / month maximum</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="md:col-span-5 bg-slate-900 text-white p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <h3 className="text-lg font-bold text-emerald-400">Your Payroll Quote</h3>
            
            <ul className="space-y-3">
              {inclusions.slice(0, 5).map((inc, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 space-y-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Monthly Fee</span>
              <p className="text-3xl font-black text-white font-headline tracking-tight">
                {formatCurrency(currentFee)} <span className="text-sm font-normal text-slate-400">/ mo</span>
              </p>
              <span className="text-[9px] text-slate-500 font-semibold block">VAT Exclusive</span>
            </div>

            <Button asChild className="w-full h-11 font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md">
              <Link href={`/contact?package=payroll&employees=${employees}`} className="flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
