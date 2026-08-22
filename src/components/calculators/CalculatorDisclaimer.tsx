import Link from 'next/link';
import { Info } from 'lucide-react';

/**
 * Standard limitation-of-liability notice for the public tax calculators.
 *
 * None of the 13 calculators previously carried any disclaimer — a repo-wide search for
 * "disclaimer", "not advice", "estimate only" and similar returned zero matches. Several instead
 * sit beside a confident call to action ("Talk to a Tax Consultant"), which frames the output as
 * a professional preliminary opinion.
 *
 * For a registered practice publishing tax computations, that is a real exposure: there is no
 * contractual limitation against a user who relies on a figure. It is not theoretical either —
 * the audit identified specific defects in several of these calculators (CGT defaulting to the
 * top marginal rate and omitting the primary residence exclusion; COIDA with no earnings ceiling;
 * SDL applied per-employee rather than per-employer; provisional tax misrepresenting how IRP6
 * payments are calculated). Those numbers still need a practitioner's review.
 *
 * `note` lets a calculator add a specific limitation on top of the general wording.
 */
export default function CalculatorDisclaimer({ note }: { note?: string }) {
  return (
    <aside
      aria-label="Important information about this calculator"
      className="mt-8 rounded-lg border border-slate-300 bg-slate-50 p-4 text-slate-700"
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <div className="space-y-2 text-xs leading-relaxed">
          <p>
            <strong className="font-medium text-slate-900">This is an estimate, not tax advice.</strong>{' '}
            This calculator is provided for general guidance only. It applies standard rates and
            thresholds and cannot account for your full circumstances — rebates, exemptions,
            exclusions, prior assessments, or rules specific to your entity type may change the
            result materially.
          </p>
          {note && <p>{note}</p>}
          <p>
            Rates and thresholds change, most commonly at the start of the tax year in March.
            Always confirm figures against the current SARS tables before relying on them, and
            speak to a registered practitioner before making a financial or compliance decision.
            My Accountant accepts no liability for any action taken on the basis of a figure
            produced here.
          </p>
          <p>
            <Link href="/contact" className="font-medium text-primary underline underline-offset-2">
              Speak to one of our practitioners
            </Link>{' '}
            for advice on your specific situation.
          </p>
        </div>
      </div>
    </aside>
  );
}
