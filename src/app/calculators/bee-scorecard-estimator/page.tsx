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

export default function BeeScorecardEstimatorPage() {
  const [ownership, setOwnership] = useState<string>('0');
  const [management, setManagement] = useState<string>('0');
  const [skills, setSkills] = useState<string>('0');
  const [enterprise, setEnterprise] = useState<string>('0');
  const [socioEconomic, setSocioEconomic] = useState<string>('0');

  const calculateScore = () => {
    const o = parseFloat(ownership) || 0;
    const m = parseFloat(management) || 0;
    const s = parseFloat(skills) || 0;
    const e = parseFloat(enterprise) || 0;
    const se = parseFloat(socioEconomic) || 0;

    const totalPoints = o + m + s + e + se;
    
    let level = 'Non-Compliant';
    if (totalPoints >= 100) level = 'Level 1';
    else if (totalPoints >= 95) level = 'Level 2';
    else if (totalPoints >= 90) level = 'Level 3';
    else if (totalPoints >= 80) level = 'Level 4';
    else if (totalPoints >= 75) level = 'Level 5';
    else if (totalPoints >= 70) level = 'Level 6';
    else if (totalPoints >= 55) level = 'Level 7';
    else if (totalPoints >= 40) level = 'Level 8';

    return { totalPoints, level };
  };

  const results = calculateScore();

  return (
    <div className="space-y-16 pb-24">
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            BEE Scorecard Estimator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your B-BBEE recognition level using the generic scorecard elements.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-6 space-y-6">
            <Card className="border border-border bg-card shadow-sm">
              <CardContent className="p-6 space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="ownership" className="font-bold text-slate-800 text-sm">Ownership Points (out of 25)</Label>
                  <Input
                    id="ownership"
                    type="number"
                    max="25"
                    value={ownership}
                    onChange={(e) => setOwnership(e.target.value)}
                    className="h-11 border-border font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="management" className="font-bold text-slate-800 text-sm">Management Control Points (out of 19)</Label>
                  <Input
                    id="management"
                    type="number"
                    max="19"
                    value={management}
                    onChange={(e) => setManagement(e.target.value)}
                    className="h-11 border-border font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills" className="font-bold text-slate-800 text-sm">Skills Development Points (out of 20)</Label>
                  <Input
                    id="skills"
                    type="number"
                    max="20"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="h-11 border-border font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enterprise" className="font-bold text-slate-800 text-sm">Enterprise & Supplier Dev Points (out of 42)</Label>
                  <Input
                    id="enterprise"
                    type="number"
                    max="42"
                    value={enterprise}
                    onChange={(e) => setEnterprise(e.target.value)}
                    className="h-11 border-border font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="socioEconomic" className="font-bold text-slate-800 text-sm">Socio-Economic Dev Points (out of 5)</Label>
                  <Input
                    id="socioEconomic"
                    type="number"
                    max="5"
                    value={socioEconomic}
                    onChange={(e) => setSocioEconomic(e.target.value)}
                    className="h-11 border-border font-semibold text-slate-800"
                  />
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
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Estimated B-BBEE Level</span>
                  <div className="text-3xl font-black text-slate-900">{results.level}</div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Total Score:</span>
                    <span className="font-semibold text-slate-800">{results.totalPoints.toFixed(2)} Points</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
        <CalculatorDisclaimer note="This does not apply priority-element sub-minimums (which cause discounting) or the simplified EME/QSE regimes. A formal verification may produce a materially different level." />
      </section>
    </div>
  );
}
