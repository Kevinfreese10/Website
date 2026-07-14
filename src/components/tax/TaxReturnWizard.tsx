'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Briefcase, Car, FileText, CheckCircle2, RotateCcw, Building2, Clock, Shield, Star, Inbox } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

type Step = 'start' | 'auto-assess' | 'business' | 'allowances' | 'result';
type ResultType = 'simple' | 'complex' | 'sole-proprietor' | 'auto-assess' | null;

export default function TaxReturnWizard() {
  const [step, setStep] = useState<Step>('start');
  const [result, setResult] = useState<ResultType>(null);

  const resetWizard = () => {
    setStep('start');
    setResult(null);
  };

  const handleAutoAssessAnswer = (isAutoAssessed: boolean) => {
    if (isAutoAssessed) {
      setResult('auto-assess');
      setStep('result');
    } else {
      setStep('business');
    }
  };

  const handleBusinessAnswer = (isBusiness: boolean) => {
    if (isBusiness) {
      setResult('sole-proprietor');
      setStep('result');
    } else {
      setStep('allowances');
    }
  };

  const handleAllowancesAnswer = (hasAllowances: boolean) => {
    if (hasAllowances) {
      setResult('complex');
    } else {
      setResult('simple');
    }
    setStep('result');
  };

  const getProgress = () => {
    if (step === 'start') return 0;
    if (step === 'auto-assess') return 25;
    if (step === 'business') return 60;
    if (step === 'allowances') return 100;
    return 100;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden transition-all duration-500 rounded-3xl ring-1 ring-primary/10">
      
      {/* Progress Bar (Hidden on start and result) */}
      {(step === 'auto-assess' || step === 'business' || step === 'allowances') && (
         <Progress value={getProgress()} className="h-1.5 rounded-none bg-primary/10" />
      )}

      {step === 'start' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          <div className="absolute top-6 right-6 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Takes 30 seconds
          </div>
          <CardHeader className="text-center pb-4 pt-16">
            <CardTitle className="text-4xl font-extrabold tracking-tight">Which Tax Return Do You Need?</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground pb-8 px-8 max-w-xl mx-auto">
            <p className="text-xl">Answer 3 simple questions to instantly find the correct SARS ITR12 tax return package for your specific financial situation.</p>
          </CardContent>
          <CardFooter className="flex flex-col items-center pb-16">
            <Button size="lg" className="w-full sm:w-auto h-16 px-12 text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all" onClick={() => setStep('auto-assess')}>
              Start the Quiz <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <div className="flex items-center gap-6 mt-6 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-green-500" /> 100% SARS Compliant</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 5.0 Rated Service</span>
            </div>
          </CardFooter>
        </div>
      )}

      {step === 'auto-assess' && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="pt-10 px-6 sm:px-10">
            <div className="flex justify-between items-center mb-6">
               <Button variant="ghost" size="sm" onClick={() => setStep('start')} className="w-fit text-muted-foreground hover:bg-slate-100 rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
               <div className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> 30 sec left
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Inbox className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase">Question 1 of 3</span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl leading-snug font-bold">
              Have you received an Auto Assessment from SARS?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-12 px-6 sm:px-10 space-y-4">
            <button 
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md"
              onClick={() => handleAutoAssessAnswer(true)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 group-hover:bg-primary/10 p-3 rounded-xl transition-colors shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-slate-500 group-hover:text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-medium">Yes, SARS has issued me an auto assessment</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
            <button 
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md"
              onClick={() => handleAutoAssessAnswer(false)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 group-hover:bg-primary/10 p-3 rounded-xl transition-colors shrink-0">
                  <FileText className="h-6 w-6 text-slate-500 group-hover:text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-medium">No, I have not been auto assessed</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
          </CardContent>
        </div>
      )}

      {step === 'business' && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="pt-10 px-6 sm:px-10">
            <div className="flex justify-between items-center mb-6">
               <Button variant="ghost" size="sm" onClick={() => setStep('auto-assess')} className="w-fit text-muted-foreground hover:bg-slate-100 rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
               <div className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> 20 sec left
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase">Question 2 of 3</span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl leading-snug font-bold">
              Do you earn any income from running a business in your own name, freelancing, or working as an independent contractor?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-12 px-6 sm:px-10 space-y-4">
            <button 
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md"
              onClick={() => handleBusinessAnswer(true)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 group-hover:bg-primary/10 p-3 rounded-xl transition-colors shrink-0">
                  <Building2 className="h-6 w-6 text-slate-500 group-hover:text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-medium">Yes, I have business or freelance income</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
            <button 
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md"
              onClick={() => handleBusinessAnswer(false)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 group-hover:bg-primary/10 p-3 rounded-xl transition-colors shrink-0">
                  <FileText className="h-6 w-6 text-slate-500 group-hover:text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-medium">No, I only earn a salary</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
          </CardContent>
        </div>
      )}

      {step === 'allowances' && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <CardHeader className="pt-10 px-6 sm:px-10">
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" size="sm" onClick={() => setStep('business')} className="w-fit text-muted-foreground hover:bg-slate-100 rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" /> 10 sec left
              </div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-2xl">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <span className="text-sm font-bold tracking-widest text-primary uppercase">Question 3 of 3</span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl leading-snug font-bold">
              Do you receive a travel allowance, have a company car, or want to claim medical aid and retirement annuity deductions?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-12 px-6 sm:px-10 space-y-4">
            <button 
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md"
              onClick={() => handleAllowancesAnswer(true)}
            >
               <div className="flex items-center gap-4">
                <div className="bg-slate-100 group-hover:bg-primary/10 p-3 rounded-xl transition-colors shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-slate-500 group-hover:text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-medium">Yes, I have allowances or deductions</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
            <button 
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md"
              onClick={() => handleAllowancesAnswer(false)}
            >
               <div className="flex items-center gap-4">
                <div className="bg-slate-100 group-hover:bg-primary/10 p-3 rounded-xl transition-colors shrink-0">
                  <FileText className="h-6 w-6 text-slate-500 group-hover:text-primary" />
                </div>
                <span className="text-lg sm:text-xl font-medium">No, none of the above apply to me</span>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </button>
          </CardContent>
        </div>
      )}

      {step === 'result' && result && (
        <div className="animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center pt-16 pb-6">
            <div className="mx-auto bg-green-500 shadow-xl shadow-green-500/30 text-white w-24 h-24 rounded-full flex items-center justify-center mb-8 relative">
              <CheckCircle2 className="h-12 w-12" />
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                 <Shield className="w-6 h-6 text-primary" fill="currentColor" />
              </div>
            </div>
            <span className="text-sm font-black tracking-[0.2em] text-green-600 uppercase mb-3 block">Your Perfect Match Found</span>
            <CardTitle className="text-4xl font-extrabold tracking-tight">
              {result === 'auto-assess' && "SARS Auto Assessment Review"}
              {result === 'simple' && "Simple ITR12 Tax Return"}
              {result === 'complex' && "Complex ITR12 Tax Return"}
              {result === 'sole-proprietor' && "Sole Proprietor Tax Return"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8 px-10 max-w-2xl mx-auto">
            <p className="text-xl text-slate-600 leading-relaxed mb-6">
              {result === 'auto-assess' && "Since SARS has auto-assessed you, you have a limited window to accept it or file an amended return. We will thoroughly review your auto assessment to ensure SARS didn't miss any deductions you are entitled to before accepting."}
              {result === 'simple' && "Based on your answers, you have a straightforward tax profile. Our Simple ITR12 package is the perfect fit for you to get compliant quickly and affordably."}
              {result === 'complex' && "Because you have allowances or deductions to claim, you need our Complex ITR12 package. We will ensure every eligible deduction is properly claimed to maximize your return."}
              {result === 'sole-proprietor' && "Since you earn business or freelance income, SARS requires you to file a Sole Proprietor return. Our experts will help you compile your income and expenses correctly."}
            </p>
            
            {/* High Conversion Trust Block */}
            <div className="bg-slate-50 border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm font-medium text-slate-600">
               <div className="flex items-center gap-2">
                 <div className="bg-green-100 text-green-600 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                 No Hidden Fees
               </div>
               <div className="flex items-center gap-2">
                 <div className="bg-green-100 text-green-600 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                 Registered Tax Practitioners
               </div>
               <div className="flex items-center gap-2">
                 <div className="bg-green-100 text-green-600 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></div>
                 Maximum Refund Guaranteed
               </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-16 px-10 max-w-xl mx-auto">
            {result === 'auto-assess' && (
              <Button asChild size="lg" className="w-full h-16 text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all">
                <Link href="/products/sars-auto-assessment-review">Order Review Now (R250)</Link>
              </Button>
            )}
            {result === 'simple' && (
              <Button asChild size="lg" className="w-full h-16 text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all">
                <Link href="/products/individual-income-tax-return-itr12-simple">Order Package Now (R750)</Link>
              </Button>
            )}
            {result === 'complex' && (
              <Button asChild size="lg" className="w-full h-16 text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all">
                <Link href="/products/complex-individual-income-tax-return-itr12">Order Package Now (R1150)</Link>
              </Button>
            )}
            {result === 'sole-proprietor' && (
              <Button asChild size="lg" className="w-full h-16 text-xl font-bold rounded-full shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all">
                <Link href="/products/sole-proprietor-income-tax-return-itr12">Order Package Now (R2950)</Link>
              </Button>
            )}
            <p className="text-xs text-center text-slate-400 font-medium">Secure online payment via Yoco or PayFast</p>
            
            <Button variant="ghost" onClick={resetWizard} className="text-muted-foreground mt-4 hover:bg-slate-100 rounded-full h-12">
              <RotateCcw className="mr-2 h-4 w-4" /> Restart Quiz
            </Button>
          </CardFooter>
        </div>
      )}
    </Card>
  );
}
