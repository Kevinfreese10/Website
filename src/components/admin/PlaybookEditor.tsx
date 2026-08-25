'use client';

/**
 * PlaybookEditor — the per-service fulfilment procedure editor for the AI order agent.
 *
 * Rebuilt after v1's checklist editor was deleted in aba0cdd2. See AI-ORDER-AGENT-PLAN.md §5.1
 * for the data model and §7 Phase 0 for scope.
 *
 * Renders inside ServiceForm's react-hook-form context; edits `fulfillmentChecklist`,
 * `playbookEntity`, `playbookOutputs`, `playbookCommonFailures` and `playbookApproval`.
 *
 * Rule enforced here (mirrors `isPlaybookApproved` in service-utils): the moment any step is
 * edited after approval, the approval is cleared and the version bumps. Kevin must re-approve
 * before the agent may act on the service again.
 */

import { useEffect, useRef } from 'react';
import { useFieldArray, useWatch, type Control, type UseFormSetValue, type UseFormGetValues } from 'react-hook-form';
import { FULFILLMENT_STEP_TYPES, type FulfillmentStepType, type PortalId, type PlaybookApproval } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowDown, ArrowUp, CheckCircle2, Plus, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PORTALS: { value: PortalId; label: string }[] = [
  { value: 'cipc', label: 'CIPC e-Services / BizPortal' },
  { value: 'efiling', label: 'SARS eFiling (incl. RLA)' },
  { value: 'cf_filing', label: 'Compensation Fund (CF-Filing / ROE)' },
  { value: 'ufiling', label: 'UIF uFiling' },
  { value: 'cidb', label: 'CIDB CRS' },
  { value: 'csd', label: 'Central Supplier Database' },
  { value: 'ncr', label: 'NCR portal' },
  { value: 'nhbrc', label: 'NHBRC portal' },
  { value: 'dsd', label: 'DSD NPO portal' },
  { value: 'other', label: 'Other' },
];

const CHANNEL_STYLES: Record<string, string> = {
  internal: 'bg-slate-100 text-slate-700 border-slate-200',
  document: 'bg-amber-50 text-amber-800 border-amber-200',
  email: 'bg-sky-50 text-sky-800 border-sky-200',
  portal: 'bg-violet-50 text-violet-800 border-violet-200',
  client: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

function channelOf(type?: FulfillmentStepType): string {
  const found = FULFILLMENT_STEP_TYPES.find(t => t.value === type);
  if (found) return found.channel;
  // legacy types
  if (type === 'doc_verification') return 'internal';
  if (type === 'document_drafting') return 'document';
  if (type === 'external_filing') return 'portal';
  if (type === 'internal_calc') return 'internal';
  return 'internal';
}

export type PlaybookEditorProps = {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  /** requirement rows so steps can reference them by id */
  requirements: { id?: string; label: string }[];
  currentUser: { uid?: string; id?: string; name?: string; email?: string } | null | undefined;
  isAdmin: boolean;
};

export default function PlaybookEditor({ control, setValue, getValues, requirements, currentUser, isAdmin }: PlaybookEditorProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'fulfillmentChecklist' });
  const approval = useWatch({ control, name: 'playbookApproval' }) as PlaybookApproval | null | undefined;
  const version = (useWatch({ control, name: 'playbookVersion' }) as number | undefined) || 0;
  const steps = useWatch({ control, name: 'fulfillmentChecklist' }) as any[] | undefined;

  // Clear approval when steps change after the editor has mounted.
  const snapshotRef = useRef<string | null>(null);
  useEffect(() => {
    const serialized = JSON.stringify(steps || []);
    if (snapshotRef.current === null) {
      snapshotRef.current = serialized;
      return;
    }
    if (serialized !== snapshotRef.current) {
      snapshotRef.current = serialized;
      if (getValues('playbookApproval')) {
        setValue('playbookApproval', null, { shouldDirty: true });
      }
    }
  }, [steps, getValues, setValue]);

  const approve = () => {
    const stamp: PlaybookApproval = {
      approvedBy: currentUser?.uid || currentUser?.id || 'unknown',
      approvedByName: currentUser?.name || currentUser?.email || undefined,
      approvedAt: new Date().toISOString(),
      version: version + 1,
    };
    setValue('playbookVersion', version + 1, { shouldDirty: true });
    setValue('playbookApproval', stamp, { shouldDirty: true });
    // re-snapshot so this approval isn't immediately cleared
    snapshotRef.current = JSON.stringify(getValues('fulfillmentChecklist') || []);
  };

  const revoke = () => setValue('playbookApproval', null, { shouldDirty: true });

  const addStep = () => {
    append({
      id: `step_${Date.now().toString(36)}`,
      title: '',
      description: '',
      type: 'manual',
      owner: 'kevin',
      estimatedDays: 1,
      submitMode: 'stage',
    });
  };

  const hasSteps = fields.length > 0;
  const isApproved = !!approval?.approvedAt;

  return (
    <div className="space-y-5">
      {/* Approval banner */}
      <div className={cn('rounded-lg border p-3 flex items-start justify-between gap-3',
        isApproved ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60')}>
        <div className="flex items-start gap-2 text-xs">
          {isApproved ? <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" /> : <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5" />}
          <div>
            <p className="font-semibold">
              {isApproved ? `Playbook approved — v${approval?.version}` : hasSteps ? 'DRAFT — not in use by the agent' : 'No playbook — order falls back to the generic 4-step checklist'}
            </p>
            <p className="text-muted-foreground">
              {isApproved
                ? `by ${approval?.approvedByName || approval?.approvedBy} on ${new Date(approval!.approvedAt).toLocaleString('en-ZA')}. Editing any step clears this approval.`
                : 'The AI order agent only acts on services with an approved playbook. Save the form after approving.'}
            </p>
          </div>
        </div>
        {isAdmin && (
          isApproved
            ? <Button type="button" variant="outline" size="sm" onClick={revoke}>Revoke approval</Button>
            : <Button type="button" size="sm" disabled={!hasSteps} onClick={approve}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve playbook</Button>
        )}
      </div>

      {/* Playbook-level fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField control={control} name="playbookEntity" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">This service is for</FormLabel>
            <Select value={field.value || 'either'} onValueChange={field.onChange}>
              <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="company">A company / entity</SelectItem>
                <SelectItem value="individual">An individual</SelectItem>
                <SelectItem value="either">Either</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={control} name="playbookOutputsText" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">What the client receives (one per line)</FormLabel>
            <FormControl><Textarea rows={2} className="text-xs" placeholder={'CoR14.3 certificate\nMOI\nSARS tax number'} {...field} value={field.value || ''} /></FormControl>
          </FormItem>
        )} />
        <FormField control={control} name="playbookCommonFailuresText" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Common reasons this order bounces (one per line)</FormLabel>
            <FormControl><Textarea rows={2} className="text-xs" placeholder={'ID certification older than 3 months\nBank letter in director\'s name, not the company'} {...field} value={field.value || ''} /></FormControl>
          </FormItem>
        )} />
      </div>

      <Separator />

      {/* Steps */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Fulfilment steps ({fields.length})</h4>
        <Button type="button" size="sm" variant="outline" onClick={addStep}><Plus className="h-3.5 w-3.5 mr-1" />Add step</Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-4 text-center border border-dashed rounded-md">
          No steps yet. Add the ordered procedure for this service — collect, verify, draft, submit, wait, deliver, sign off.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((f, index) => {
          const type = (steps?.[index]?.type || 'manual') as FulfillmentStepType;
          const channel = channelOf(type);
          return (
            <div key={f.id} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-6">{index + 1}.</span>
                <Badge variant="outline" className={cn('text-[10px] uppercase', CHANNEL_STYLES[channel])}>{channel}</Badge>
                <FormField control={control} name={`fulfillmentChecklist.${index}.title`} render={({ field }) => (
                  <FormItem className="flex-grow space-y-0">
                    <FormControl><Input className="h-8 text-sm" placeholder="Step title, e.g. Reserve company name on CIPC" {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )} />
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <FormField control={control} name={`fulfillmentChecklist.${index}.type`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Type</FormLabel>
                    <Select value={field.value || 'manual'} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {FULFILLMENT_STEP_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                        {/* legacy values still present on old services */}
                        {['doc_verification', 'document_drafting', 'external_filing', 'internal_calc'].includes(field.value) && (
                          <SelectItem value={field.value} className="text-xs">{field.value} (legacy)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={control} name={`fulfillmentChecklist.${index}.owner`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Who does it</FormLabel>
                    <Select value={field.value || 'kevin'} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="agent" className="text-xs">Agent (automatable)</SelectItem>
                        <SelectItem value="kevin" className="text-xs">Kevin</SelectItem>
                        <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={control} name={`fulfillmentChecklist.${index}.estimatedDays`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Est. days</FormLabel>
                    <FormControl><Input type="number" min={0} className="h-7 text-xs" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={control} name={`fulfillmentChecklist.${index}.doneCriteria`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Done when…</FormLabel>
                    <FormControl><Input className="h-7 text-xs" placeholder="e.g. CoR14.3 received" {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={control} name={`fulfillmentChecklist.${index}.description`} render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px] text-muted-foreground">Description (shown to staff)</FormLabel>
                  <FormControl><Input className="h-7 text-xs" {...field} value={field.value || ''} /></FormControl>
                </FormItem>
              )} />

              <FormField control={control} name={`fulfillmentChecklist.${index}.aiInstructions`} render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px] text-muted-foreground">Agent instructions — the rules, gotchas and validations for this step</FormLabel>
                  <FormControl><Textarea rows={2} className="text-xs" placeholder="e.g. Bank confirmation letter must be in the COMPANY's name, not the director's. Accept digital verification reference in place of a stamp." {...field} value={field.value || ''} /></FormControl>
                </FormItem>
              )} />

              {/* Channel-specific fields */}
              {(type === 'collect' || type === 'verify') && (
                <FormField control={control} name={`fulfillmentChecklist.${index}.requirementIds`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Requirements this step concerns</FormLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {requirements.filter(r => r.id).map(r => {
                        const selected: string[] = field.value || [];
                        const on = selected.includes(r.id!);
                        return (
                          <button type="button" key={r.id} onClick={() => field.onChange(on ? selected.filter(x => x !== r.id) : [...selected, r.id])}
                            className={cn('text-[11px] px-2 py-0.5 rounded-full border', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground')}>
                            {r.label}
                          </button>
                        );
                      })}
                      {requirements.length === 0 && <span className="text-[11px] text-muted-foreground italic">Add client documents on the Client Documents tab first.</span>}
                    </div>
                  </FormItem>
                )} />
              )}

              {(type === 'draft_document' || type === 'document_drafting' || type === 'deliver') && (
                <FormField control={control} name={`fulfillmentChecklist.${index}.templateIdsText`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Template IDs (comma separated, e.g. accountants_letter, power_of_attorney)</FormLabel>
                    <FormControl><Input className="h-7 text-xs" {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )} />
              )}

              {type === 'email_submission' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <FormField control={control} name={`fulfillmentChecklist.${index}.emailTo`} render={({ field }) => (
                    <FormItem className="space-y-0.5"><FormLabel className="text-[11px] text-muted-foreground">Regulator email address</FormLabel>
                      <FormControl><Input className="h-7 text-xs" placeholder="registrations@ncr.org.za" {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                  <FormField control={control} name={`fulfillmentChecklist.${index}.emailSubjectTemplate`} render={({ field }) => (
                    <FormItem className="space-y-0.5"><FormLabel className="text-[11px] text-muted-foreground">Subject template</FormLabel>
                      <FormControl><Input className="h-7 text-xs" placeholder="NCR Registration Application — {entityName}" {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                  <FormField control={control} name={`fulfillmentChecklist.${index}.expectedReply`} render={({ field }) => (
                    <FormItem className="space-y-0.5"><FormLabel className="text-[11px] text-muted-foreground">What reply counts as done</FormLabel>
                      <FormControl><Input className="h-7 text-xs" placeholder="Acknowledgement with NCRCP reference" {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                </div>
              )}

              {(type === 'portal_filing' || type === 'external_filing') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <FormField control={control} name={`fulfillmentChecklist.${index}.portalId`} render={({ field }) => (
                    <FormItem className="space-y-0.5"><FormLabel className="text-[11px] text-muted-foreground">Portal</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select portal" /></SelectTrigger></FormControl>
                        <SelectContent>{PORTALS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}</SelectContent>
                      </Select></FormItem>
                  )} />
                  <FormField control={control} name={`fulfillmentChecklist.${index}.portalProcedure`} render={({ field }) => (
                    <FormItem className="space-y-0.5"><FormLabel className="text-[11px] text-muted-foreground">Procedure / form</FormLabel>
                      <FormControl><Input className="h-7 text-xs" placeholder="e.g. cipc.fileCoR39 or 'Annual Return'" {...field} value={field.value || ''} /></FormControl></FormItem>
                  )} />
                  <FormField control={control} name={`fulfillmentChecklist.${index}.submitMode`} render={({ field }) => (
                    <FormItem className="space-y-0.5"><FormLabel className="text-[11px] text-muted-foreground">Submit mode</FormLabel>
                      <Select value={field.value || 'stage'} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="manual" className="text-xs">Manual — agent prepares a hand-off sheet</SelectItem>
                          <SelectItem value="stage" className="text-xs">Stage — browser fills, Kevin presses submit</SelectItem>
                          <SelectItem value="auto" className="text-xs" disabled>Auto — only via autonomy promotion</SelectItem>
                        </SelectContent>
                      </Select></FormItem>
                  )} />
                </div>
              )}

              {type === 'wait_external' && (
                <FormField control={control} name={`fulfillmentChecklist.${index}.followUpAfterDaysText`} render={({ field }) => (
                  <FormItem className="space-y-0.5">
                    <FormLabel className="text-[11px] text-muted-foreground">Follow up after (working days, comma separated e.g. 30, 60, 75)</FormLabel>
                    <FormControl><Input className="h-7 text-xs" {...field} value={field.value || ''} /></FormControl>
                  </FormItem>
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
