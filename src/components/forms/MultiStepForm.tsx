'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { StickyFormActions } from './StickyFormActions';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiStepFormStep {
  label: string;
  description?: string;
  content: React.ReactNode;
  /** Return false (or a message) to block Continue. */
  validate?: () => boolean | string | Promise<boolean | string>;
}

/**
 * Guided multi-step form shell: stepper on top, one step at a time with
 * entrance animation, Back/Continue in a sticky action bar, submit on the
 * final step. Keep field state in the parent (e.g. one react-hook-form).
 */
export function MultiStepForm({
  steps,
  onSubmit,
  submitLabel = 'Submit',
  submitting = false,
  onValidationError,
  className,
}: {
  steps: MultiStepFormStep[];
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  submitting?: boolean;
  onValidationError?: (message: string) => void;
  className?: string;
}) {
  const [step, setStep] = React.useState(0);
  const last = step === steps.length - 1;
  const current = steps[step];

  const next = async () => {
    if (current.validate) {
      const res = await current.validate();
      if (res !== true) {
        if (typeof res === 'string' && res) onValidationError?.(res);
        return;
      }
    }
    if (last) {
      await onSubmit();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Stepper
        steps={steps.map(({ label, description }) => ({ label, description }))}
        currentStep={step}
      />
      <div key={step} className="animate-fade-up">
        {current.content}
      </div>
      <StickyFormActions>
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
        )}
        <Button type="button" onClick={next} loading={submitting}>
          {last ? submitLabel : 'Continue'}
          {!last && <ArrowRight className="ml-1.5 h-4 w-4" />}
        </Button>
      </StickyFormActions>
    </div>
  );
}
