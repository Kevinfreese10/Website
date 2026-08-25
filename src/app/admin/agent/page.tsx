'use client';

/**
 * AI Order Agent — approval inbox (AI-ORDER-AGENT-PLAN.md §6.7).
 *
 * One ranked queue of everything the agent wants to do. Each proposal shows the order, the step,
 * the evidence, and three buttons: Approve, Edit & approve, Reject. Nothing the client or a
 * regulator sees happens without a click here (until an action type is promoted, §8).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Check, Loader2, Pencil, RefreshCw, X, ExternalLink, ShieldCheck, ShieldAlert, FileCheck2, MessageSquare, Hand, ArrowRightLeft, FileText, AlertTriangle, Mail, Link2, Globe, KeyRound, Send, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { decideAgentProposalAction, getAgentQueueSummaryAction, linkRegulatorMailAction, listAgentProposalsAction, listAutonomyPoliciesAction, listPortalJobsAction, listRegulatorMailAction, pollSubmissionsInboxAction, requeuePortalJobAction, runOrderAgentAction, setAutonomyLevelAction } from '@/app/actions/agent-actions';
import type { AgentProposal, AutonomyPolicy, ClientMessagePayload, DocumentDraftPayload, DocumentReviewPayload, EmailSubmissionPayload, HandoffPayload, OtpPayload, PortalHealth, PortalJob, PortalStagePayload, PortalSubmitPayload, RegulatorMail } from '@/lib/agent/types';
import { PROMOTION_THRESHOLD } from '@/lib/agent/types';

const KIND_META: Record<AgentProposal['kind'], { label: string; icon: any; className: string }> = {
  document_review: { label: 'Document', icon: FileCheck2, className: 'bg-amber-50 text-amber-800 border-amber-200' },
  client_message: { label: 'Client message', icon: MessageSquare, className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  handoff: { label: 'Hand-off', icon: Hand, className: 'bg-violet-50 text-violet-800 border-violet-200' },
  document_draft: { label: 'Drafts', icon: FileText, className: 'bg-rose-50 text-rose-800 border-rose-200' },
  email_submission: { label: 'Email to regulator', icon: Mail, className: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  portal_stage: { label: 'Queue portal job', icon: Globe, className: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  portal_submit: { label: 'Press submit', icon: Send, className: 'bg-red-50 text-red-800 border-red-200' },
  otp: { label: 'OTP needed', icon: KeyRound, className: 'bg-orange-50 text-orange-800 border-orange-200' },
  status_change: { label: 'Status', icon: ArrowRightLeft, className: 'bg-sky-50 text-sky-800 border-sky-200' },
};

export default function AgentInboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'pending' | 'approved' | 'edited' | 'rejected' | 'autonomy' | 'mail' | 'portal'>('pending');
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [health, setHealth] = useState<PortalHealth[]>([]);
  const [otpCodes, setOtpCodes] = useState<Record<string, string>>({});
  const [mail, setMail] = useState<RegulatorMail[]>([]);
  const [linkTargets, setLinkTargets] = useState<Record<string, string>>({});
  const [editTo, setEditTo] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [proposals, setProposals] = useState<AgentProposal[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [policies, setPolicies] = useState<AutonomyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentProposal | null>(null);
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');
  const [runOrderId, setRunOrderId] = useState('');
  const [filterOrder, setFilterOrder] = useState('');

  const token = useCallback(async () => {
    const t = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!t) throw new Error('Not signed in');
    return t;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await token();
      if (tab === 'autonomy') {
        const r = await listAutonomyPoliciesAction(t);
        setPolicies(r.policies || []);
      } else if (tab === 'mail') {
        const r = await listRegulatorMailAction(t, { limit: 100 });
        setMail((r.mail || []) as RegulatorMail[]);
      } else if (tab === 'portal') {
        const r = await listPortalJobsAction(t, { limit: 50 });
        setJobs((r.jobs || []) as PortalJob[]);
        setHealth((r.health || []) as PortalHealth[]);
      } else {
        const [p, s] = await Promise.all([listAgentProposalsAction(t, { status: tab }), getAgentQueueSummaryAction(t)]);
        setProposals(p.proposals || []);
        setSummary(s.success ? s : null);
      }
    } catch (e: any) {
      toast({ title: 'Could not load', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tab, token, toast]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => proposals.filter(p => !filterOrder || p.orderNumber.includes(filterOrder) || p.orderId.includes(filterOrder)), [proposals, filterOrder]);

  const decide = async (p: AgentProposal, decision: 'approve' | 'edit' | 'reject', edited?: AgentProposal['payload'], note?: string) => {
    setBusyId(p.id);
    try {
      const r = await decideAgentProposalAction(await token(), p.id, decision, edited, note);
      if (!r.success) throw new Error(r.error);
      toast({ title: decision === 'reject' ? 'Rejected' : 'Done', description: r.executionResult?.message });
      setProposals(prev => prev.filter(x => x.id !== p.id));
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (p: AgentProposal) => {
    setEditing(p);
    if (p.kind === 'client_message') setEditText((p.payload as ClientMessagePayload).text);
    if (p.kind === 'document_review') { const d = p.payload as DocumentReviewPayload; setEditText(d.clientMessage || ''); setEditReason(d.reason || ''); }
    if (p.kind === 'document_draft') setEditText((p.payload as DocumentDraftPayload).clientMessage || '');
    if (p.kind === 'email_submission') { const e = p.payload as EmailSubmissionPayload; setEditText(e.body); setEditTo(e.to); setEditSubject(e.subject); }
  };

  const submitEdit = () => {
    if (!editing) return;
    let payload: AgentProposal['payload'] = editing.payload;
    if (editing.kind === 'client_message') payload = { ...(editing.payload as ClientMessagePayload), text: editText };
    if (editing.kind === 'document_review') payload = { ...(editing.payload as DocumentReviewPayload), clientMessage: editText, reason: editReason };
    if (editing.kind === 'document_draft') payload = { ...(editing.payload as DocumentDraftPayload), clientMessage: editText };
    if (editing.kind === 'email_submission') payload = { ...(editing.payload as EmailSubmissionPayload), body: editText, to: editTo.trim(), subject: editSubject.trim(), addressUnverified: false };
    decide(editing, 'edit', payload);
  };

  const flipDecision = (p: AgentProposal) => {
    const d = p.payload as DocumentReviewPayload;
    const flipped: DocumentReviewPayload = { ...d, decision: d.decision === 'approved' ? 'rejected' : 'approved', reason: `Overridden by reviewer (agent said ${d.decision}).` };
    decide(p, 'edit', flipped, 'Decision flipped');
  };

  const runNow = async () => {
    if (!runOrderId.trim()) return;
    setBusyId('run');
    try {
      const r = await runOrderAgentAction(await token(), runOrderId.trim());
      if (!r.success) throw new Error(r.error || r.run?.error);
      toast({ title: 'Agent ran', description: `${r.run.proposalsCreated.length} proposal(s), ${r.run.modelCalls} model call(s). ${r.run.notes.slice(0, 2).join(' ')}` });
      setRunOrderId('');
      load();
    } catch (e: any) {
      toast({ title: 'Run failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const pollNow = async () => {
    setBusyId('poll');
    try {
      const r = await pollSubmissionsInboxAction(await token());
      if (!r.success || !r.summary) throw new Error(r.error || 'Poll failed');
      toast({ title: 'Mailbox polled', description: `${r.summary.processed} processed, ${r.summary.matched} matched, ${r.summary.unmatched} unmatched${r.summary.errors.length ? '; ' + r.summary.errors[0] : ''}` });
      load();
    } catch (e: any) {
      toast({ title: 'Poll failed', description: e.message, variant: 'destructive' });
    } finally { setBusyId(null); }
  };

  const linkMail = async (mailId: string) => {
    const orderId = (linkTargets[mailId] || '').trim();
    if (!orderId) return;
    try {
      const r = await linkRegulatorMailAction(await token(), mailId, orderId);
      if (!r.success) throw new Error(r.error);
      toast({ title: 'Linked' });
      load();
    } catch (e: any) { toast({ title: 'Could not link', description: e.message, variant: 'destructive' }); }
  };

  const submitOtp = (p: AgentProposal) => {
    const code = (otpCodes[p.id] || '').trim();
    if (!code) { toast({ title: 'Enter the PIN first', variant: 'destructive' }); return; }
    decide(p, 'edit', { ...(p.payload as OtpPayload), code }, 'OTP entered');
  };

  const requeue = async (jobId: string) => {
    try {
      const r = await requeuePortalJobAction(await token(), jobId);
      if (!r.success) throw new Error(r.error);
      toast({ title: 'Re-queued' }); load();
    } catch (e: any) { toast({ title: 'Could not re-queue', description: e.message, variant: 'destructive' }); }
  };

  const promote = async (serviceId: string, key: string, level: 'propose' | 'auto') => {
    try {
      const r = await setAutonomyLevelAction(await token(), serviceId, key, level);
      if (!r.success) throw new Error(r.error);
      toast({ title: level === 'auto' ? 'Promoted' : 'Demoted' });
      load();
    } catch (e: any) {
      toast({ title: 'Not allowed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6 text-primary" /> AI Order Agent</h1>
          <p className="text-sm text-muted-foreground">Everything the agent wants to do, ranked. Nothing a client or regulator sees happens without your approval.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Order ID — run agent now" value={runOrderId} onChange={e => setRunOrderId(e.target.value)} className="h-9 w-56" />
          <Button size="sm" onClick={runNow} disabled={busyId === 'run' || !runOrderId.trim()}>{busyId === 'run' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run'}</Button>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Pending" value={summary.pending} />
          {Object.entries(KIND_META).map(([k, m]) => <Stat key={k} label={m.label} value={summary.byKind?.[k] || 0} />)}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList>
            <TabsTrigger value="pending">Queue</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="edited">Edited</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="autonomy">Autonomy</TabsTrigger>
            <TabsTrigger value="mail">Regulator mail</TabsTrigger>
            <TabsTrigger value="portal">Portal jobs</TabsTrigger>
          </TabsList>
          {tab !== 'autonomy' && <Input placeholder="Filter by order #" value={filterOrder} onChange={e => setFilterOrder(e.target.value)} className="h-8 w-44 text-xs" />}
        </div>

        {(['pending', 'approved', 'edited', 'rejected'] as const).map(s => (
          <TabsContent key={s} value={s} className="space-y-3 mt-4">
            {loading ? <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              : visible.length === 0 ? <p className="text-sm text-muted-foreground italic text-center py-10">Nothing here.</p>
              : visible.map(p => (
                <ProposalCard key={p.id} p={p} busy={busyId === p.id} readOnly={s !== 'pending'}
                  onApprove={() => p.kind === 'otp' ? submitOtp(p) : decide(p, 'approve')} onReject={() => decide(p, 'reject', undefined, 'Rejected in inbox')} onEdit={() => openEdit(p)} onFlip={() => flipDecision(p)}
                  otpCode={otpCodes[p.id] || ''} onOtpChange={v => setOtpCodes(prev => ({ ...prev, [p.id]: v }))} />
              ))}
          </TabsContent>
        ))}

        <TabsContent value="autonomy" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">An action type goes automatic for a service only after {PROMOTION_THRESHOLD} consecutive unedited approvals and a manual switch here. Any edit or rejection afterwards demotes it. Document approvals and status changes are never automated.</p>
          {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : policies.length === 0 ? <p className="text-sm italic text-muted-foreground">No decisions recorded yet.</p> : policies.map(pol => (
            <Card key={pol.serviceId}>
              <CardHeader className="py-3"><CardTitle className="text-sm">Service {pol.serviceId}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(pol.actions).map(([key, a]) => (
                  <div key={key} className="flex items-center justify-between text-xs border rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      {a.level === 'auto' ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-amber-600" />}
                      <span className="font-mono">{key}</span>
                      <Badge variant="outline">{a.level}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{a.consecutiveAccepts}/{PROMOTION_THRESHOLD} consecutive · {a.totalAccepts} ok · {a.totalEdits} edited · {a.totalRejects} rejected</span>
                      {user?.role === 'admin' && (a.level === 'auto'
                        ? <Button size="sm" variant="outline" onClick={() => promote(pol.serviceId, key, 'propose')}>Demote</Button>
                        : <Button size="sm" disabled={a.consecutiveAccepts < PROMOTION_THRESHOLD} onClick={() => promote(pol.serviceId, key, 'auto')}>Promote</Button>)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="mail" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Replies received in the submissions mailbox. Matched mail is already on its order; link unmatched mail by order ID.</p>
            <Button size="sm" variant="outline" onClick={pollNow} disabled={busyId === 'poll'}>{busyId === 'poll' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-1" />Poll mailbox now</>}</Button>
          </div>
          {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : mail.length === 0 ? <p className="text-sm italic text-muted-foreground">No regulator mail recorded yet.</p> : mail.map(m => (
            <Card key={m.id} className={cn('border-l-4', m.orderId ? 'border-l-emerald-400' : 'border-l-amber-400')}>
              <CardContent className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium">{m.subject || '(no subject)'}</span>
                  <span className="text-muted-foreground">{new Date(m.receivedAt).toLocaleString('en-ZA')}</span>
                </div>
                <p className="text-muted-foreground">From {m.from} · {m.orderId ? <Link href={`/admin/orders/${m.orderId}`} className="text-primary hover:underline">order #{m.orderNumber}</Link> : <span className="text-amber-700">unmatched</span>}{m.attachments.length ? ` · ${m.attachments.length} attachment(s)` : ''}</p>
                <p className="line-clamp-3 whitespace-pre-wrap">{m.text}</p>
                {!m.orderId && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input placeholder="Order ID" className="h-7 w-44 text-xs" value={linkTargets[m.id] || ''} onChange={e => setLinkTargets(prev => ({ ...prev, [m.id]: e.target.value }))} />
                    <Button size="sm" variant="outline" onClick={() => linkMail(m.id)}><Link2 className="h-3.5 w-3.5 mr-1" />Link</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="portal" className="mt-4 space-y-3">
          {health.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {health.map(h => <Badge key={h.portalId} variant="outline" className={cn('text-xs', h.ok ? 'text-emerald-700 border-emerald-300' : 'text-red-700 border-red-300')}>{h.ok ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}{h.portalId}: {h.ok ? 'login OK' : h.message} · {new Date(h.checkedAt).toLocaleString('en-ZA')}</Badge>)}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Browser jobs run by the portal worker. Credentials are never shown here. Failed or expired jobs can be re-queued with the same input.</p>
          {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : jobs.length === 0 ? <p className="text-sm italic text-muted-foreground">No portal jobs yet.</p> : jobs.map(j => (
            <Card key={j.id} className={cn('border-l-4', j.status === 'submitted' ? 'border-l-emerald-400' : ['failed', 'handoff', 'expired'].includes(j.status) ? 'border-l-red-400' : ['staged', 'otp_required'].includes(j.status) ? 'border-l-amber-400' : 'border-l-slate-300')}>
              <CardContent className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium"><Badge variant="outline" className="mr-2">{j.status}</Badge>{j.portalId} · {j.procedure} · <Link href={`/admin/orders/${j.orderId}`} className="text-primary hover:underline">#{j.orderNumber}</Link></span>
                  <span className="text-muted-foreground">{new Date(j.createdAt).toLocaleString('en-ZA')}{j.claimedBy ? ` · ${j.claimedBy}` : ''}</span>
                </div>
                {j.result?.reference && <p>Reference: <span className="font-mono">{j.result.reference}</span></p>}
                {j.error && <p className="text-red-700">{j.error}</p>}
                {j.handoff?.reason && <p className="text-amber-800">{j.handoff.reason}</p>}
                {j.log?.length > 0 && <p className="text-muted-foreground line-clamp-2">{j.log.slice(-3).map(l => `${new Date(l.at).toLocaleTimeString('en-ZA')} ${l.message}`).join(' · ')}</p>}
                {(j.result?.screenshots?.length || j.staged?.screenshots?.length || j.handoff?.screenshots?.length) ? <div className="flex gap-1 flex-wrap">{[...(j.result?.screenshots || []), ...(j.staged?.screenshots || []), ...(j.handoff?.screenshots || [])].map((sc, i) => <a key={i} href={sc.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{sc.label}</a>)}</div> : null}
                {['failed', 'expired', 'abandoned', 'handoff'].includes(j.status) && <Button size="sm" variant="outline" onClick={() => requeue(j.id)}><RotateCcw className="h-3.5 w-3.5 mr-1" />Re-queue</Button>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit &amp; approve</DialogTitle>
            <DialogDescription>{editing?.title}</DialogDescription>
          </DialogHeader>
          {editing?.kind === 'document_review' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Internal reason</label>
              <Input value={editReason} onChange={e => setEditReason(e.target.value)} />
            </div>
          )}
          {editing?.kind === 'email_submission' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1"><label className="text-xs text-muted-foreground">To</label><Input value={editTo} onChange={e => setEditTo(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">Subject</label><Input value={editSubject} onChange={e => setEditSubject(e.target.value)} /></div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{editing?.kind === 'document_review' ? 'Message to client (if rejecting)' : 'Message text'}</label>
            <Textarea rows={10} value={editText} onChange={e => setEditText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={busyId === editing?.id}>{busyId === editing?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve edited'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="py-3 px-4"><p className="text-[11px] uppercase text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></CardContent></Card>
  );
}

function ProposalCard({ p, busy, readOnly, onApprove, onReject, onEdit, onFlip, otpCode, onOtpChange }: { p: AgentProposal; busy: boolean; readOnly: boolean; onApprove: () => void; onReject: () => void; onEdit: () => void; onFlip: () => void; otpCode?: string; onOtpChange?: (v: string) => void }) {
  const meta = KIND_META[p.kind];
  const Icon = meta.icon;
  const [open, setOpen] = useState(false);
  const review = p.kind === 'document_review' ? (p.payload as DocumentReviewPayload) : null;
  const msg = p.kind === 'client_message' ? (p.payload as ClientMessagePayload) : null;
  const hand = p.kind === 'handoff' ? (p.payload as HandoffPayload) : null;
  const drafts = p.kind === 'document_draft' ? (p.payload as DocumentDraftPayload) : null;
  const email = p.kind === 'email_submission' ? (p.payload as EmailSubmissionPayload) : null;
  const stage = p.kind === 'portal_stage' ? (p.payload as PortalStagePayload) : null;
  const submit = p.kind === 'portal_submit' ? (p.payload as PortalSubmitPayload) : null;
  const otp = p.kind === 'otp' ? (p.payload as OtpPayload) : null;
  const outcome = p.evidence?.ruleOutcome;

  return (
    <Card className={cn('border-l-4', p.priority >= 60 ? 'border-l-red-400' : p.priority >= 50 ? 'border-l-amber-400' : 'border-l-slate-300')}>
      <CardHeader className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px]', meta.className)}><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
              <Link href={`/admin/orders/${p.orderId}`} className="text-xs font-mono text-primary hover:underline flex items-center gap-1">#{p.orderNumber}<ExternalLink className="h-3 w-3" /></Link>
              <span className="text-xs text-muted-foreground truncate">{p.serviceTitle}</span>
              <span className="text-[10px] text-muted-foreground">· {new Date(p.createdAt).toLocaleString('en-ZA')}</span>
              {review && <Badge className={review.decision === 'approved' ? 'bg-emerald-600' : 'bg-red-600'}>{review.decision === 'approved' ? 'approve' : 'reject'}</Badge>}
            </div>
            <CardTitle className="text-sm">{p.title}</CardTitle>
            <CardDescription className="text-xs">{p.summary}</CardDescription>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1 shrink-0">
              {otp && <Input value={otpCode || ''} onChange={e => onOtpChange?.(e.target.value)} placeholder="PIN" className="h-8 w-28 font-mono" inputMode="numeric" />}
              <Button size="sm" variant={submit ? 'destructive' : 'default'} onClick={onApprove} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : submit ? <><Send className="h-4 w-4 mr-1" />Submit</> : otp ? <><KeyRound className="h-4 w-4 mr-1" />Send PIN</> : <><Check className="h-4 w-4 mr-1" />Approve</>}</Button>
              {(p.kind === 'client_message' || p.kind === 'document_review' || p.kind === 'document_draft' || p.kind === 'email_submission') && <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}><Pencil className="h-4 w-4" /></Button>}
              {review && <Button size="sm" variant="outline" onClick={onFlip} disabled={busy} title={`Flip to ${review.decision === 'approved' ? 'reject' : 'approve'}`}><ArrowRightLeft className="h-4 w-4" /></Button>}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={onReject} disabled={busy}><X className="h-4 w-4" /></Button>
            </div>
          )}
          {readOnly && p.decidedByName && <span className="text-[11px] text-muted-foreground shrink-0">{p.status} by {p.decidedByName}<br />{p.executionResult?.message}</span>}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 space-y-2">
        {msg && <pre className="text-xs whitespace-pre-wrap bg-muted/50 rounded-md p-3 font-sans">{msg.text}</pre>}
        {msg && <p className="text-[11px] text-muted-foreground">{msg.sendEmail ? 'Will also send the document-request email. ' : ''}{msg.setStatus ? `Status → ${msg.setStatus}.` : ''}</p>}
        {review?.clientMessage && <p className="text-xs"><span className="text-muted-foreground">Client will be told: </span>{review.clientMessage}</p>}
        {hand && (
          <div className="text-xs space-y-1">
            {hand.instructions && <p className="bg-amber-50 border border-amber-200 rounded-md p-2 whitespace-pre-wrap">{hand.instructions}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              {hand.sheet.map((r, i) => <div key={i} className="flex justify-between border-b border-dashed py-0.5"><span className="text-muted-foreground">{r.label}</span><span className="font-medium text-right truncate max-w-[60%]">{r.value}</span></div>)}
            </div>
          </div>
        )}
        {drafts && (
          <div className="text-xs space-y-2">
            {drafts.drafts.map(d => (
              <div key={d.draftId} className="flex items-start justify-between gap-2 border rounded-md px-3 py-2">
                <div className="min-w-0">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{d.title}<ExternalLink className="h-3 w-3" /></a>
                  <p className="text-[11px] text-muted-foreground">{d.fileName} · signed by: {d.signature === 'kevin' ? 'Kevin (on approval)' : d.signature === 'client' ? 'client' : d.signature === 'client_commissioner' ? 'client + Commissioner of Oaths' : 'nobody'}</p>
                  {d.warnings.length > 0 && <ul className="text-[11px] text-amber-700 list-disc ml-4">{d.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
                </div>
              </div>
            ))}
            {drafts.failed.map(f => (
              <div key={f.templateId} className="flex items-start gap-2 border border-amber-200 bg-amber-50 rounded-md px-3 py-2 text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span><span className="font-mono">{f.templateId}</span>: {f.error || `missing ${f.missing.join(', ')}`}</span>
              </div>
            ))}
            {drafts.clientMessage && <pre className="whitespace-pre-wrap bg-muted/50 rounded-md p-3 font-sans">{drafts.clientMessage}</pre>}
            <p className="text-[11px] text-muted-foreground">Approving {drafts.drafts.some(d => d.signature === 'kevin') ? 'applies Kevin\'s signature and ' : ''}{drafts.postToClient ? 'posts the files to Communication History for the client.' : 'keeps the files internal.'}</p>
          </div>
        )}
        {email && (
          <div className="text-xs space-y-2">
            {email.addressUnverified && <p className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"><AlertTriangle className="h-3.5 w-3.5" />Regulator address is unverified in the playbook. Edit to confirm before approving.</p>}
            <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5"><span className="text-muted-foreground">To</span><span className="font-medium">{email.to || '—'}</span><span className="text-muted-foreground">Subject</span><span className="font-medium">{email.subject}</span></div>
            <pre className="whitespace-pre-wrap bg-muted/50 rounded-md p-3 font-sans">{email.body}</pre>
            {email.attachments.length > 0 && <ul className="space-y-0.5">{email.attachments.map((a, i) => <li key={i}><a href={a.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1"><FileText className="h-3 w-3" />{a.name}<span className="text-muted-foreground">({a.source})</span></a></li>)}</ul>}
          </div>
        )}
        {stage && (
          <div className="text-xs space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              {Object.entries(stage.input).map(([k, v]) => <div key={k} className="flex justify-between border-b border-dashed py-0.5"><span className="text-muted-foreground">{k}</span><span className="font-medium text-right truncate max-w-[60%]">{typeof v === 'string' ? v : JSON.stringify(v)}</span></div>)}
            </div>
            <p className="text-[11px] text-muted-foreground">{stage.credentials.length} credential(s) will be decrypted inside the worker only. Mode: {stage.submitMode === 'stage' ? 'stage — you press submit' : 'auto-submit'}.</p>
          </div>
        )}
        {submit && (
          <div className="text-xs space-y-2">
            {submit.reviewSheet.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">{submit.reviewSheet.map((r, i) => <div key={i} className="flex justify-between border-b border-dashed py-0.5"><span className="text-muted-foreground">{r.label}</span><span className="font-medium text-right truncate max-w-[60%]">{r.value}</span></div>)}</div>}
            <div className="flex gap-2 flex-wrap">{submit.screenshots.map((sc, i) => <a key={i} href={sc.url} target="_blank" rel="noreferrer" className="block"><img src={sc.url} alt={sc.label} className="h-28 rounded border object-cover" /><span className="text-[10px] text-muted-foreground">{sc.label}</span></a>)}</div>
            <p className="text-[11px] text-red-700">Submit presses the portal's final button. Reject abandons the parked session.</p>
          </div>
        )}
        {otp && <p className="text-xs text-muted-foreground">Requested {new Date(otp.requestedAt).toLocaleTimeString('en-ZA')} · expires {new Date(otp.expiresAt).toLocaleTimeString('en-ZA')}{otp.sentTo ? ` · sent to ${otp.sentTo}` : ''}. Type the PIN in the box and click Send PIN.</p>}
        {outcome && (
          <button type="button" className="text-[11px] text-primary hover:underline" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Show'} evidence ({outcome.checks.filter(c => c.result !== 'skipped').length} checks)</button>
        )}
        {open && outcome && (
          <div className="text-[11px] grid grid-cols-1 md:grid-cols-2 gap-1">
            {outcome.checks.map(c => (
              <div key={c.code} className="flex gap-2"><Badge variant="outline" className={cn('w-24 justify-center', c.result === 'pass' ? 'text-emerald-700' : c.result === 'fail' ? 'text-red-700' : c.result === 'needs_human' ? 'text-amber-700' : 'text-muted-foreground')}>{c.code} {c.result}</Badge><span className="truncate">{c.detail}</span></div>
            ))}
            {p.evidence?.facts && <pre className="col-span-full bg-muted/50 rounded-md p-2 overflow-x-auto max-h-48">{JSON.stringify({ kind: p.evidence.facts.documentKind, names: p.evidence.facts.names, identifiers: p.evidence.facts.identifiers, dates: p.evidence.facts.dates, stamps: { stamp: p.evidence.facts.hasStamp, certified: p.evidence.facts.hasCertificationStamp, digital: p.evidence.facts.hasDigitalVerificationReference }, entity: p.evidence.entity }, null, 2)}</pre>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
