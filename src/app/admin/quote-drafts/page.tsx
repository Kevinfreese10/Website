'use client';

/**
 * info@ cloud agent: review queue (decision 6). Drafts the agent wasn't allowed to send automatically
 * land here and in Telegram. Kevin can edit the recipient, subject or HTML, then Send or Discard.
 * Sending uses the same guarded path as the Telegram [Send] button.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Send, Trash2, Save, Bot } from 'lucide-react';
import {
  discardQuoteDraftAction, getQuoteAgentStatusAction, listQuoteDraftsAction,
  sendQuoteDraftAction, setQuoteAgentModeAction, updateQuoteDraftAction,
} from '@/app/actions/quote-agent-actions';
import type { QuoteDraft, DraftStatus } from '@/lib/quote-agent/store';
import type { AgentMode } from '@/lib/quote-agent/types';

const MODE_LABEL: Record<AgentMode, string> = {
  live: 'Live: auto-sends strict catalog quotes',
  'draft-only': 'Draft-only: nothing sent automatically',
  paused: 'Paused: not reading the inbox',
};

export default function QuoteDraftsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<DraftStatus>('pending');
  const [drafts, setDrafts] = useState<QuoteDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<AgentMode | null>(null);
  const [agentInfo, setAgentInfo] = useState<{ lastRunAt?: string; lastError?: string; pausedReason?: string }>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editTo, setEditTo] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [showHtml, setShowHtml] = useState(false);

  const token = useCallback(async () => {
    const t = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!t) throw new Error('Not signed in');
    return t;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await token();
      const [list, status] = await Promise.all([listQuoteDraftsAction(t, tab), getQuoteAgentStatusAction(t)]);
      if (!list.success) throw new Error(list.error);
      setDrafts(list.drafts);
      if (status.success && status.config) {
        setMode(status.config.mode);
        setAgentInfo({ lastRunAt: status.config.lastRunAt, lastError: status.config.lastError, pausedReason: status.config.pausedReason });
      }
    } catch (e: any) {
      toast({ title: 'Could not load drafts', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [tab, token, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) setSelectedId(id);
  }, []);

  const selected = useMemo(() => drafts.find(d => d.id === selectedId) || null, [drafts, selectedId]);

  useEffect(() => {
    setEditTo(selected?.to || '');
    setEditSubject(selected?.subject || '');
    setEditHtml(selected?.html || '');
    setShowHtml(false);
  }, [selected]);

  const dirty = !!selected && (editTo !== selected.to || editSubject !== selected.subject || editHtml !== selected.html);

  async function run(label: string, fn: (t: string) => Promise<{ success: boolean; error?: string; message?: string }>) {
    setBusy(true);
    try {
      const r = await fn(await token());
      if (!r.success) throw new Error(r.error || 'Failed');
      toast({ title: label, description: r.message });
      await load();
    } catch (e: any) {
      toast({ title: `${label} failed`, description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  const save = () => selected && run('Saved', t => updateQuoteDraftAction(t, selected.id, { to: editTo, subject: editSubject, html: editHtml }));
  const send = async () => {
    if (!selected) return;
    if (dirty) {
      const r = await updateQuoteDraftAction(await token(), selected.id, { to: editTo, subject: editSubject, html: editHtml });
      if (!r.success) { toast({ title: 'Save failed', description: r.error, variant: 'destructive' }); return; }
    }
    if (!confirm(`Send this email to ${editTo}?`)) return;
    await run('Sent', t => sendQuoteDraftAction(t, selected.id));
  };
  const discard = () => selected && confirm('Discard this draft?') && run('Discarded', t => discardQuoteDraftAction(t, selected.id));
  const changeMode = (m: AgentMode) => run(`Mode set to ${m}`, t => setQuoteAgentModeAction(t, m));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6" /> info@ agent: review queue</h1>
          <p className="text-sm text-muted-foreground">Replies the agent drafted but was not allowed to send on its own.</p>
          {agentInfo.lastRunAt && <p className="text-xs text-muted-foreground mt-1">Last run {new Date(agentInfo.lastRunAt).toLocaleString('en-ZA')}{agentInfo.lastError ? ` · last error: ${agentInfo.lastError}` : ''}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['live', 'draft-only', 'paused'] as AgentMode[]).map(m => (
            <Button key={m} size="sm" variant={mode === m ? 'default' : 'outline'} disabled={busy || mode === m} onClick={() => changeMode(m)} title={MODE_LABEL[m]}>
              {m}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>
      </div>
      {mode && <p className="text-sm"><Badge variant={mode === 'live' ? 'default' : 'secondary'}>{MODE_LABEL[mode]}</Badge>{agentInfo.pausedReason && mode === 'paused' ? <span className="ml-2 text-muted-foreground">{agentInfo.pausedReason}</span> : null}</p>}

      <Tabs value={tab} onValueChange={v => { setTab(v as DraftStatus); setSelectedId(null); }}>
        <TabsList>
          <TabsTrigger value="pending">Waiting</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="discarded">Discarded</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="space-y-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here.</p>
          ) : drafts.map(d => (
            <button key={d.id} onClick={() => setSelectedId(d.id)}
              className={`w-full text-left rounded-lg border p-3 transition hover:bg-muted ${selectedId === d.id ? 'border-primary bg-muted' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{d.category}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString('en-ZA')}</span>
              </div>
              <p className="mt-1 text-sm font-medium line-clamp-1">{d.sourceFrom}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{d.summary}</p>
              {d.error && <p className="text-xs text-destructive mt-1 line-clamp-2">{d.error}</p>}
            </button>
          ))}
        </div>

        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{selected.sourceSubject}</CardTitle>
              <CardDescription>{selected.sourceFrom} · {selected.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                <p className="font-medium mb-1">Why it wasn&apos;t sent automatically</p>
                <ul className="list-disc ml-5 space-y-0.5">{selected.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
              {selected.total ? <p className="text-sm">Quote {selected.quoteRef}: <b>R {selected.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</b></p> : null}
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">Original message</summary>
                <pre className="whitespace-pre-wrap mt-2 rounded bg-muted p-3 text-xs max-h-64 overflow-auto">{selected.sourceExcerpt}</pre>
              </details>

              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="text-xs font-medium">To</label><Input value={editTo} onChange={e => setEditTo(e.target.value)} disabled={selected.status !== 'pending'} /></div>
                <div><label className="text-xs font-medium">Subject</label><Input value={editSubject} onChange={e => setEditSubject(e.target.value)} disabled={selected.status !== 'pending'} /></div>
              </div>

              {editHtml ? (
                <iframe title="Email preview" sandbox="" srcDoc={editHtml} className="w-full h-[640px] rounded border bg-white" />
              ) : <p className="text-sm text-muted-foreground">No email body was drafted. Write one in the HTML editor below.</p>}

              {selected.status === 'pending' && (
                <>
                  <Button variant="link" className="px-0" onClick={() => setShowHtml(s => !s)}>{showHtml ? 'Hide' : 'Edit'} HTML</Button>
                  {showHtml && <Textarea value={editHtml} onChange={e => setEditHtml(e.target.value)} className="font-mono text-xs h-80" />}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={send} disabled={busy || !editTo || !editHtml}><Send className="h-4 w-4 mr-2" />Send to client</Button>
                    <Button variant="outline" onClick={save} disabled={busy || !dirty}><Save className="h-4 w-4 mr-2" />Save</Button>
                    <Button variant="ghost" onClick={discard} disabled={busy}><Trash2 className="h-4 w-4 mr-2" />Discard</Button>
                  </div>
                </>
              )}
              {selected.status === 'sent' && <p className="text-sm text-muted-foreground">Sent by {selected.decidedBy} on {selected.decidedAt ? new Date(selected.decidedAt).toLocaleString('en-ZA') : ''}.</p>}
            </CardContent>
          </Card>
        ) : <p className="text-sm text-muted-foreground">Select a draft.</p>}
      </div>
    </div>
  );
}
