'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardCheck, Upload, CheckCircle2, AlertTriangle, HelpCircle, 
  FileText, FileSpreadsheet, FileImage, File as FileIcon, Trash2, 
  ExternalLink, Edit3, MessageSquareQuote, ShieldCheck, Clock, 
  Building2, KeyRound, Eye, Sparkles, RefreshCw, Send, CheckCircle,
  Layers, Info, ArrowLeft, Plus, EyeOff, Check, Users
} from 'lucide-react';
import CoidaIndustrySelect from './CoidaIndustrySelect';
import { 
  isDirectorCountRequirement, 
  parseDirectorCount, 
  getNumberedDirectorIndex, 
  evaluateDirectorSlotStatus 
} from '@/lib/director-linkage';

export interface ClientPortalRequirement {
  id?: string;
  label: string;
  type?: 'text' | 'pdf' | 'excel' | 'image' | 'any' | 'coida_industry' | 'datetime';
  helpText?: string;
  isConditional?: boolean;
  conditionalQuestion?: string;
  isRequired?: boolean;
  aiHint?: string;
  documentKind?: string;
  inNameOf?: 'entity' | 'director' | 'either';
  maxAgeDays?: number;
  mustBeCertified?: boolean;
  alternativesText?: string;
  isSecret?: boolean;
}

interface ClientPortalIntakePreviewProps {
  serviceTitle: string;
  serviceCategory?: string;
  department?: string;
  price?: number;
  turnaroundTime?: string;
  requirements: ClientPortalRequirement[];
  onSwitchToEditor?: () => void;
}

interface SimulatedUpload {
  files: { id: string; name: string; size: number; url?: string }[];
  textValue?: string;
  isSecret?: boolean;
  notAvailableReason?: string;
  coidaIndustries?: string[];
  conditionalAnswer?: boolean | null;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileName?: string) {
  if (!fileName) return <FileText className="h-4 w-4 text-primary shrink-0" />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'heic'].includes(ext || '')) {
    return <FileImage className="h-4 w-4 text-indigo-600 shrink-0" />;
  }
  if (ext === 'pdf') {
    return <FileText className="h-4 w-4 text-red-600 shrink-0" />;
  }
  return <FileIcon className="h-4 w-4 text-primary shrink-0" />;
}

export default function ClientPortalIntakePreview({
  serviceTitle,
  serviceCategory,
  department,
  price,
  turnaroundTime,
  requirements = [],
  onSwitchToEditor,
}: ClientPortalIntakePreviewProps) {
  // Preset simulation states: 'custom', 'empty', 'partial', 'approved', 'rejected'
  const [simMode, setSimMode] = useState<'custom' | 'empty' | 'partial' | 'approved' | 'rejected'>('custom');
  
  // Custom user interactions state
  const [simUploads, setSimUploads] = useState<Record<string, SimulatedUpload>>({});
  const [activeUnavailableNotes, setActiveUnavailableNotes] = useState<Record<string, boolean>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [showNotifySuccess, setShowNotifySuccess] = useState(false);

  // Filter non-empty requirements
  const validRequirements = useMemo(() => {
    return requirements.filter(r => r && r.label && r.label.trim().length > 0);
  }, [requirements]);

  // Compute active upload state per requirement based on simMode
  const getRequirementState = (req: ClientPortalRequirement, index: number): SimulatedUpload => {
    const key = req.id || `req_${index}`;

    if (simMode === 'empty') {
      return { files: [], textValue: '', conditionalAnswer: null };
    }

    if (simMode === 'approved') {
      return {
        files: req.type !== 'text' && req.type !== 'coida_industry' && req.type !== 'datetime'
          ? [{ id: 'sim_1', name: `${req.label.replace(/[^a-zA-Z0-9]/g, '_')}_verified.pdf`, size: 1420500 }]
          : [],
        textValue: req.type === 'datetime' 
          ? 'Tomorrow 10:00 - 12:00 | Phone: 082 555 1234'
          : req.type === 'text' 
          ? 'Acme Holdings (Pty) Ltd - 2023/123456/07' 
          : '',
        coidaIndustries: req.type === 'coida_industry' ? ['0500', '2210'] : undefined,
        conditionalAnswer: true,
        status: 'approved',
      };
    }

    if (simMode === 'rejected') {
      return {
        files: req.type !== 'text' && req.type !== 'coida_industry' && req.type !== 'datetime'
          ? [{ id: 'sim_rej', name: `document_scan.jpg`, size: 850000 }]
          : [],
        textValue: req.type === 'datetime' ? 'Slot Unavailable' : req.type === 'text' ? 'Invalid entry' : '',
        conditionalAnswer: true,
        status: 'rejected',
        rejectionReason: req.type === 'datetime'
          ? 'The selected time window could not be reached. Please pick a new slot and verify your phone number.'
          : req.mustBeCertified
          ? 'The uploaded copy was not certified by a Commissioner of Oaths within the last 3 months. Please upload a certified copy.'
          : req.maxAgeDays
          ? `Document date exceeds the statutory limit of ${req.maxAgeDays} days. Please upload a recent issue.`
          : 'Document is illegible or does not match the company registered details.',
      };
    }

    if (simMode === 'partial') {
      const isCompleted = index % 2 === 0;
      if (isCompleted) {
        return {
          files: req.type !== 'text' && req.type !== 'coida_industry' && req.type !== 'datetime'
            ? [{ id: 'sim_part', name: `${req.label.slice(0, 20)}_sample.pdf`, size: 1048576 }]
            : [],
          textValue: req.type === 'datetime'
            ? 'Today 14:00 - 16:00 | Phone: 082 555 1234'
            : req.type === 'text'
            ? 'Provided client response'
            : '',
          coidaIndustries: req.type === 'coida_industry' ? ['0500'] : undefined,
          conditionalAnswer: true,
          status: 'pending',
        };
      }
      return { files: [], textValue: '', conditionalAnswer: null };
    }

    // Default 'custom' mode (interactive state)
    return simUploads[key] || { files: [], textValue: '', conditionalAnswer: null };
  };

  const handleSimulateFileUpload = (reqKey: string, fileNames: string[]) => {
    setSimUploads(prev => {
      const current = prev[reqKey]?.files || [];
      const newFiles = fileNames.map((name, i) => ({
        id: `f_${Date.now()}_${i}`,
        name,
        size: Math.floor(Math.random() * (3500000 - 450000) + 450000),
      }));
      return {
        ...prev,
        [reqKey]: {
          ...(prev[reqKey] || { files: [] }),
          files: [...current, ...newFiles],
          status: 'pending',
        },
      };
    });
  };

  const handleRemoveFile = (reqKey: string, fileId: string) => {
    setSimUploads(prev => {
      const current = prev[reqKey]?.files || [];
      return {
        ...prev,
        [reqKey]: {
          ...prev[reqKey],
          files: current.filter(f => f.id !== fileId),
        },
      };
    });
  };

  const handleTextChange = (reqKey: string, text: string, isSecret = false) => {
    setSimUploads(prev => ({
      ...prev,
      [reqKey]: {
        ...(prev[reqKey] || { files: [] }),
        textValue: text,
        isSecret,
        status: 'pending',
      },
    }));
  };

  const handleConditionalAnswer = (reqKey: string, answer: boolean) => {
    setSimUploads(prev => ({
      ...prev,
      [reqKey]: {
        ...(prev[reqKey] || { files: [] }),
        conditionalAnswer: answer,
        status: 'pending',
      },
    }));
  };

  const handleSaveUnavailableNote = (reqKey: string) => {
    const note = noteInputs[reqKey] || '';
    if (!note.trim()) return;
    setSimUploads(prev => ({
      ...prev,
      [reqKey]: {
        ...(prev[reqKey] || { files: [] }),
        notAvailableReason: note,
        status: 'pending',
      },
    }));
    setActiveUnavailableNotes(prev => ({ ...prev, [reqKey]: false }));
  };

  // Completion calculation
  const dirCountReq = validRequirements.find(r => isDirectorCountRequirement(r.label));
  const dirCountVal = dirCountReq ? getRequirementState(dirCountReq, validRequirements.indexOf(dirCountReq)).textValue : null;

  const requiredCount = validRequirements.filter(r => {
    if (r.isRequired === false) return false;
    const slotStatus = evaluateDirectorSlotStatus(r.label, dirCountVal);
    if (slotStatus === 'skipped') return false;
    return true;
  }).length;

  const completedCount = validRequirements.filter((r, idx) => {
    const slotStatus = evaluateDirectorSlotStatus(r.label, dirCountVal);
    if (slotStatus === 'skipped') return false;

    const st = getRequirementState(r, idx);
    const hasFiles = (st.files && st.files.length > 0);
    const hasText = Boolean(st.textValue && st.textValue.trim().length > 0);
    const hasCoida = Boolean(st.coidaIndustries && st.coidaIndustries.length > 0);
    const hasNote = Boolean(st.notAvailableReason && st.notAvailableReason.trim().length > 0);
    const isConditionalNo = r.isConditional && st.conditionalAnswer === false;
    return hasFiles || hasText || hasCoida || hasNote || isConditionalNo;
  }).length;

  const progressPercent = requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 100;
  const isAllCompleted = completedCount >= requiredCount && requiredCount > 0;

  return (
    <div className="space-y-6">
      {/* Top Client View Simulation Banner & Mode Controls */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-indigo-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/40 text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5">
                <Eye className="w-3 h-3 mr-1 inline" /> Client Portal View
              </Badge>
              <span className="text-xs text-blue-200/80 font-mono">/dashboard/orders/[orderId]</span>
            </div>
            <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Customer Experience Simulation
            </h3>
            <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
              This preview reflects the interactive document intake, guidelines, statutory flags, and error handling as seen by your client. Test inputs, uploads, and conditional questions below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onSwitchToEditor && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSwitchToEditor}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-1.5 h-8 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" /> Back to Editor
              </Button>
            )}
          </div>
        </div>

        {/* Simulation State Presets */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Simulate State:</span>
            <div className="inline-flex rounded-lg bg-black/40 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setSimMode('custom')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  simMode === 'custom' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                Interactive Playground
              </button>
              <button
                type="button"
                onClick={() => setSimMode('empty')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  simMode === 'empty' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                Fresh (0%)
              </button>
              <button
                type="button"
                onClick={() => setSimMode('partial')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  simMode === 'partial' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                In Progress (~50%)
              </button>
              <button
                type="button"
                onClick={() => setSimMode('approved')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  simMode === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                ✓ All Verified
              </button>
              <button
                type="button"
                onClick={() => setSimMode('rejected')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  simMode === 'rejected' ? 'bg-rose-600 text-white shadow-xs' : 'text-blue-200 hover:text-white'
                }`}
              >
                ⚠️ Revision Required
              </button>
            </div>
          </div>

          <div className="text-[11px] text-blue-200/90 font-mono">
            {validRequirements.length} Requirement{validRequirements.length === 1 ? '' : 's'} Configured
          </div>
        </div>
      </div>

      {/* RENDER THE ACTUAL CLIENT PORTAL CARD & INTAKE SECTION */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {/* Simulated Order Header */}
        <div className="bg-muted/40 border-b p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-xl font-black tracking-tight text-foreground">
                  Order #ORD-SIMULATED
                </h4>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold uppercase tracking-wider">
                  Pending Client Intake
                </Badge>
                {serviceCategory && (
                  <Badge variant="secondary" className="text-xs">
                    {serviceCategory}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Item: <strong className="text-foreground">{serviceTitle || 'Untitled Service'}</strong>
                {price !== undefined && ` · R${price.toFixed(2)}`}
                {turnaroundTime && ` · Turnaround: ${turnaroundTime}`}
                {department && ` · Dept: ${department}`}
              </p>
            </div>

            {/* Notification / Submission Trigger */}
            <div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setShowNotifySuccess(true);
                  setTimeout(() => setShowNotifySuccess(false), 4000);
                }}
                disabled={!isAllCompleted && simMode !== 'approved'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Submit Intake & Notify Consultant
              </Button>
            </div>
          </div>

          {/* Submission Success Toast Banner */}
          {showNotifySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulated: Documents submitted successfully and automated AI audit triggered!</span>
              </div>
            </div>
          )}

          {/* Progress Bar & Status */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Required Intake Progress
              </span>
              <span className="text-foreground font-mono font-bold">
                {completedCount} of {requiredCount} completed ({progressPercent}%)
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 rounded-full" />
          </div>
        </div>

        {/* Requirements List (Exact Client Portal Card Component Format) */}
        <div className="p-5 space-y-4">
          {validRequirements.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed rounded-xl space-y-3 bg-muted/10">
              <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <h5 className="text-sm font-bold text-foreground">No Client Documents Configured</h5>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                This service currently has no required uploads or intake fields. Add documents in the editor tab to configure the client's intake checklist.
              </p>
              {onSwitchToEditor && (
                <Button type="button" variant="outline" size="sm" onClick={onSwitchToEditor} className="text-xs font-bold mt-2">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Requirements in Editor
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {validRequirements.map((req, index) => {
                const reqKey = req.id || `req_${index}`;
                const state = getRequirementState(req, index);
                const hasFiles = state.files && state.files.length > 0;
                const hasText = Boolean(state.textValue && state.textValue.trim().length > 0);
                const hasCoida = Boolean(state.coidaIndustries && state.coidaIndustries.length > 0);
                const hasNote = Boolean(state.notAvailableReason && state.notAvailableReason.trim().length > 0);
                const isConditional = !!req.isConditional;
                const isConditionalYes = isConditional && state.conditionalAnswer === true;
                const isConditionalNo = isConditional && state.conditionalAnswer === false;
                const isApproved = state.status === 'approved';
                const isRejected = state.status === 'rejected';

                const isOtpTimeReq = /best time.*sars otp/i.test(req.label) || (req.type === 'datetime' && /otp/i.test(req.label));
                const sisterOtpReq = isOtpTimeReq ? validRequirements.find(r => /otp.*required/i.test(r.label)) : null;
                const sisterOtpState = sisterOtpReq ? getRequirementState(sisterOtpReq, validRequirements.indexOf(sisterOtpReq)) : null;
                const isSisterOtpNo = sisterOtpState?.textValue?.toLowerCase().includes('no');
                const isSisterOtpYes = sisterOtpState?.textValue?.toLowerCase().includes('yes');

                // Director count and numbered slot linkage
                const isDirCountReq = isDirectorCountRequirement(req.label);
                const sisterDirCountReq = validRequirements.find(r => isDirectorCountRequirement(r.label));
                const sisterDirCountState = sisterDirCountReq ? getRequirementState(sisterDirCountReq, validRequirements.indexOf(sisterDirCountReq)) : null;
                const activeDirCountVal = sisterDirCountState?.textValue || (isDirCountReq ? state.textValue : null);
                const activeDirCount = parseDirectorCount(activeDirCountVal);

                const directorSlotStatus = evaluateDirectorSlotStatus(req.label, activeDirCountVal);
                const isDirectorSlotSkipped = directorSlotStatus === 'skipped';
                const isDirectorSlotActive = directorSlotStatus === 'active';
                const isDirectorSlotPendingCount = directorSlotStatus === 'pending_count';

                const isEffectivelyConditionalNo = isConditionalNo || isSisterOtpNo || isDirectorSlotSkipped;

                const isCardActive = isRejected 
                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                  : isApproved
                  ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10 shadow-2xs'
                  : hasFiles || hasText || hasCoida || hasNote || isEffectivelyConditionalNo
                  ? 'border-border bg-card shadow-2xs'
                  : 'border-dashed border-muted-foreground/30 bg-muted/10';

                return (
                  <div
                    key={reqKey}
                    className={`space-y-3 p-4 rounded-xl border transition-all ${isCardActive}`}
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                          <ClipboardCheck className="h-4 w-4 text-primary shrink-0" />
                          <span>{req.label}</span>
                          {req.isRequired === false ? (
                            <Badge variant="outline" className="text-[10px] py-0 font-normal border-dashed text-muted-foreground">
                              Optional
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 font-bold bg-primary/10 text-primary border-primary/20">
                              Required
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono py-0">
                            {req.type || 'PDF'}
                          </Badge>
                        </label>

                        {/* Credential Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {req.isSecret && (
                            <Badge className="bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 text-[10px] font-semibold py-0.5">
                              <KeyRound className="w-3 h-3 mr-1 text-indigo-600" /> Encrypted Credential
                            </Badge>
                          )}
                        </div>

                        {/* Client Instructions & Help Text */}
                        {req.helpText && (
                          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2 mt-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{req.helpText}</p>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="shrink-0">
                        {isApproved && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified & Approved
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="destructive" className="text-xs font-bold gap-1 px-2.5 py-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Revision Required
                          </Badge>
                        )}
                        {!isApproved && !isRejected && (hasFiles || hasText || hasCoida || hasNote || isEffectivelyConditionalNo) && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-xs font-semibold gap-1 px-2.5 py-1">
                            {hasNote ? <HelpCircle className="h-3.5 w-3.5 text-amber-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                            {hasNote ? 'Note Attached' : isEffectivelyConditionalNo ? 'Marked N/A' : 'Under Review'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rejection Alert Box */}
                    {isRejected && (
                      <div className="p-3 bg-rose-100/70 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-xs text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <span className="font-bold">Reason for Revision:</span>
                          <p className="leading-relaxed">{state.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Sister OTP Question Answered No (Skipped) */}
                    {isSisterOtpNo && (
                      <div className="p-3 bg-muted/30 border border-dashed rounded-lg text-xs flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Check className="h-4 w-4 text-emerald-600" /> Skipped: SARS OTP is marked as Not Required (Direct Login).
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            if (sisterOtpReq) {
                              const sKey = sisterOtpReq.id || `req_${validRequirements.indexOf(sisterOtpReq)}`;
                              handleTextChange(sKey, 'Yes (OTP / Mobile App Push Required)', false);
                            }
                            handleConditionalAnswer(reqKey, true);
                          }}
                          className="h-7 text-xs text-primary"
                        >
                          Change to Yes (OTP Required)
                        </Button>
                      </div>
                    )}

                    {/* Director Slot Skipped (Only N directors specified) */}
                    {isDirectorSlotSkipped && (
                      <div className="p-3 bg-muted/30 border border-dashed rounded-lg text-xs flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Check className="h-4 w-4 text-emerald-600" /> Skipped: Only {activeDirCount} director{activeDirCount && activeDirCount > 1 ? 's' : ''} specified.
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            if (sisterDirCountReq) {
                              const sKey = sisterDirCountReq.id || `req_${validRequirements.indexOf(sisterDirCountReq)}`;
                              handleTextChange(sKey, String(getNumberedDirectorIndex(req.label) || 2), false);
                            }
                          }}
                          className="h-7 text-xs text-primary font-semibold"
                        >
                          Increase to {getNumberedDirectorIndex(req.label)} Directors
                        </Button>
                      </div>
                    )}

                    {/* Director Slot Pending Count (Count not selected yet) */}
                    {isDirectorSlotPendingCount && (
                      <div className="p-3 bg-muted/20 border border-dashed rounded-lg text-xs flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Please select the number of directors above to unlock this field.</span>
                      </div>
                    )}

                    {/* Conditional Question Gate */}
                    {!isSisterOtpNo && !isDirectorSlotSkipped && !isDirectorSlotPendingCount && isConditional && state.conditionalAnswer === null && !isSisterOtpYes && !isDirectorSlotActive && (
                      <div className="p-3.5 bg-muted/40 rounded-lg border border-border space-y-2.5">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-primary" />
                          {req.conditionalQuestion || `Does your company require or possess ${req.label}?`}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleConditionalAnswer(reqKey, true)}
                            className="h-8 text-xs font-bold px-4"
                          >
                            Yes, I have this
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleConditionalAnswer(reqKey, false)}
                            className="h-8 text-xs font-semibold px-4"
                          >
                            No, Not Applicable
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isSisterOtpNo && !isDirectorSlotSkipped && !isDirectorSlotPendingCount && isConditional && state.conditionalAnswer === false && (
                      <div className="p-3 bg-muted/30 border rounded-lg text-xs flex items-center justify-between text-muted-foreground">
                        <span>Answered: <strong>Not Applicable (No)</strong></span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => handleConditionalAnswer(reqKey, true)}
                          className="h-7 text-xs text-primary"
                        >
                          Change to Yes
                        </Button>
                      </div>
                    )}

                    {/* Main Intake Form Elements (When not gated by conditional No, sister OTP No, or skipped director slot) */}
                    {!isSisterOtpNo && !isDirectorSlotSkipped && !isDirectorSlotPendingCount && (!isConditional || state.conditionalAnswer === true || isSisterOtpYes || isDirectorSlotActive) && (
                      <div className="space-y-3 pt-1">
                        {/* 1. Missing Document / Unavailable Note Display */}
                        {hasNote && (
                          <div className="p-3 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                                <MessageSquareQuote className="h-4 w-4 text-amber-600" />
                                Your Explanation for Missing Document:
                              </span>
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                className="h-6 text-xs bg-background"
                                onClick={() => setActiveUnavailableNotes(prev => ({ ...prev, [reqKey]: true }))}
                              >
                                Edit Note
                              </Button>
                            </div>
                            <p className="pl-5 text-muted-foreground italic leading-relaxed">"{state.notAvailableReason}"</p>
                          </div>
                        )}

                        {/* 2. Uploaded Files Display */}
                        {hasFiles && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span>{state.files.length} file{state.files.length === 1 ? '' : 's'} uploaded:</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => handleSimulateFileUpload(reqKey, ['additional_document_page2.pdf'])}
                                className="h-6 text-xs text-primary"
                              >
                                <Plus className="h-3 w-3 mr-1" /> + Add Another File
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5">
                              {state.files.map((f) => (
                                <div
                                  key={f.id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs gap-3"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {getFileIcon(f.name)}
                                    <span className="font-semibold truncate text-foreground">{f.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">({formatFileSize(f.size)})</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mr-2">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleRemoveFile(reqKey, f.id)}
                                      title="Remove file"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Text & Credential Input Element */}
                        {req.type === 'text' && /otp.*required/i.test(req.label) ? (
                          <div className="space-y-2.5 p-3 bg-muted/20 border rounded-lg">
                            <label className="text-[11px] font-semibold text-muted-foreground">Is an SMS OTP or Mobile App push confirmation required to log in?</label>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={state.textValue?.toLowerCase().includes('yes') ? 'default' : 'outline'}
                                onClick={() => {
                                  handleTextChange(reqKey, 'Yes (OTP / Mobile App Push Required)', false);
                                  const timeReq = validRequirements.find(r => /best time.*sars otp/i.test(r.label) || (r.type === 'datetime' && /otp/i.test(r.label)));
                                  if (timeReq) {
                                    const timeKey = timeReq.id || `req_${validRequirements.indexOf(timeReq)}`;
                                    handleConditionalAnswer(timeKey, true);
                                  }
                                }}
                                className="h-8 text-xs font-bold gap-1.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Yes (OTP / App Push Required)
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={state.textValue?.toLowerCase().includes('no') ? 'default' : 'outline'}
                                onClick={() => {
                                  handleTextChange(reqKey, 'No (Direct Login Without OTP)', false);
                                  const timeReq = validRequirements.find(r => /best time.*sars otp/i.test(r.label) || (r.type === 'datetime' && /otp/i.test(r.label)));
                                  if (timeReq) {
                                    const timeKey = timeReq.id || `req_${validRequirements.indexOf(timeReq)}`;
                                    handleConditionalAnswer(timeKey, false);
                                  }
                                }}
                                className="h-8 text-xs font-semibold gap-1.5"
                              >
                                No (Direct Login)
                              </Button>
                            </div>
                            {state.textValue && (
                              <p className="text-[11px] text-muted-foreground pt-0.5">
                                Status: <strong className="text-foreground">{state.textValue}</strong>
                              </p>
                            )}
                          </div>
                        ) : isDirCountReq ? (
                          <div className="space-y-2.5 p-3 bg-muted/20 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                Select number of directors:
                              </label>
                              {state.textValue && (
                                <span className="text-[11px] font-bold text-primary">
                                  Selected: {state.textValue}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {['1', '2', '3', '4', '5', '5+'].map((countOption) => {
                                const currentVal = (state.textValue || '').trim();
                                const isSelected = currentVal === countOption || (countOption === '1' && currentVal === '1 (Sole Director)');
                                return (
                                  <Button
                                    key={countOption}
                                    type="button"
                                    size="sm"
                                    variant={isSelected ? 'default' : 'outline'}
                                    className={`h-8 px-3 text-xs font-bold gap-1.5 ${isSelected ? 'shadow-xs' : 'bg-background'}`}
                                    onClick={() => handleTextChange(reqKey, countOption, false)}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {countOption}
                                  </Button>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Specifying the count automatically updates the required director details below.
                            </p>
                          </div>
                        ) : req.type === 'text' ? (
                          <div className="space-y-1.5">
                            <div className="relative">
                              <Input
                                type={req.isSecret && !revealedSecrets[reqKey] ? 'password' : 'text'}
                                placeholder={
                                  req.isSecret 
                                    ? 'Enter sensitive access credential / PIN...' 
                                    : getNumberedDirectorIndex(req.label)
                                    ? `e.g. Full legal first name(s) and surname of Director ${getNumberedDirectorIndex(req.label)}`
                                    : 'Enter requested details here...'
                                }
                                value={state.textValue || ''}
                                onChange={(e) => handleTextChange(reqKey, e.target.value, req.isSecret)}
                                className="h-9 text-xs pr-10"
                              />
                              {req.isSecret && (
                                <button
                                  type="button"
                                  onClick={() => setRevealedSecrets(prev => ({ ...prev, [reqKey]: !prev[reqKey] }))}
                                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                  title={revealedSecrets[reqKey] ? 'Hide' : 'Show'}
                                >
                                  {revealedSecrets[reqKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                            {req.isSecret && (
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                                <ShieldCheck className="w-3 h-3" /> Credentials are encrypted in storage with AES-256-GCM.
                              </p>
                            )}
                          </div>
                        ) : null}

                        {/* 4. COIDA Classification of Industries Dropdown */}
                        {req.type === 'coida_industry' && (
                          <div className="space-y-2">
                            <CoidaIndustrySelect
                              value={state.coidaIndustries || []}
                              onChange={(val) => {
                                setSimUploads(prev => ({
                                  ...prev,
                                  [reqKey]: {
                                    ...(prev[reqKey] || { files: [] }),
                                    coidaIndustries: val,
                                    status: 'pending',
                                  },
                                }));
                              }}
                            />
                          </div>
                        )}

                        {/* 5. Date & Time Selector (Appointment / OTP Window) */}
                        {req.type === 'datetime' && (
                          <div className="space-y-3 p-3.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>Select Preferred Date & Contact Window for Live OTP Coordination</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-muted-foreground">Appointment / Coordination Date</label>
                                <Input
                                  type="date"
                                  className="h-8 text-xs bg-background"
                                  defaultValue={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    const val = `${e.target.value} (${state.textValue?.split('(')[1] || '10:00 - 12:00) | Phone: 082 555 1234'}`;
                                    handleTextChange(reqKey, val);
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-muted-foreground">Direct Phone / Mobile Number</label>
                                <Input
                                  type="tel"
                                  placeholder="e.g. 082 123 4567"
                                  className="h-8 text-xs bg-background"
                                  defaultValue="082 555 1234"
                                  onChange={(e) => {
                                    const val = `${state.textValue?.split('|')[0] || 'Selected Date'} | Phone: ${e.target.value}`;
                                    handleTextChange(reqKey, val);
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-[11px] font-semibold text-muted-foreground">Quick Time Window Presets</label>
                              <div className="flex flex-wrap gap-1.5">
                                {['09:00 - 11:00 (Morning)', '11:00 - 13:00 (Mid-day)', '14:00 - 16:00 (Afternoon)', '16:00 - 18:00 (Late Afternoon)'].map((slot) => (
                                  <Button
                                    key={slot}
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    className="h-7 text-xs bg-background hover:bg-amber-100 dark:hover:bg-amber-950/50 border-amber-300"
                                    onClick={() => {
                                      const todayStr = new Date().toISOString().split('T')[0];
                                      handleTextChange(reqKey, `${todayStr} (${slot}) | Phone: 082 555 1234`);
                                    }}
                                  >
                                    {slot}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {state.textValue && (
                              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                                <span className="font-semibold flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Selected: <strong>{state.textValue}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 6. File Upload Dropzone Simulation (For PDF, Image, Excel, Any) */}
                        {req.type !== 'text' && req.type !== 'coida_industry' && req.type !== 'datetime' && !hasFiles && (
                          <div className="space-y-2">
                            <div
                              onClick={() => {
                                const sampleNames: Record<string, string[]> = {
                                  pdf: [`${req.label.replace(/[^a-zA-Z0-9]/g, '_')}_scan.pdf`],
                                  image: [`${req.label.replace(/[^a-zA-Z0-9]/g, '_')}_photo.jpg`],
                                  excel: [`${req.label.replace(/[^a-zA-Z0-9]/g, '_')}_schedule.xlsx`],
                                  any: [`${req.label.replace(/[^a-zA-Z0-9]/g, '_')}_document.pdf`],
                                };
                                handleSimulateFileUpload(reqKey, sampleNames[req.type || 'pdf'] || ['sample_upload.pdf']);
                              }}
                              className="border border-dashed border-primary/40 hover:border-primary rounded-xl p-4 text-center cursor-pointer bg-primary/5 hover:bg-primary/10 transition-all space-y-1.5"
                            >
                              <Upload className="w-6 h-6 mx-auto text-primary" />
                              <p className="text-xs font-bold text-foreground">
                                Click to Upload {req.type === 'image' ? 'Image / Photo' : req.type === 'excel' ? 'Excel / CSV' : 'PDF Document'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Supports drag & drop · Max size 25MB · Multi-page files supported
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 7. Document Unavailable Note Expander */}
                        {req.type !== 'text' && req.type !== 'datetime' && !hasNote && (
                          <div>
                            {activeUnavailableNotes[reqKey] ? (
                              <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-200 rounded-md text-amber-900">
                                      <HelpCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                                        Document Unavailable Note
                                      </h6>
                                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
                                        Explain why you cannot provide this document so your consultant can continue.
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setActiveUnavailableNotes(prev => ({ ...prev, [reqKey]: false }))}
                                    className="h-6 text-xs text-amber-900/70 hover:text-amber-950"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                <Textarea
                                  rows={2}
                                  placeholder="e.g. Company newly formed and bank confirmation will follow in 2 days..."
                                  value={noteInputs[reqKey] || ''}
                                  onChange={(e) => setNoteInputs(prev => ({ ...prev, [reqKey]: e.target.value }))}
                                  className="text-xs bg-background border-amber-300 focus-visible:ring-amber-500"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSaveUnavailableNote(reqKey)}
                                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                  >
                                    Save Note
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveUnavailableNotes(prev => ({ ...prev, [reqKey]: true }))}
                                className="text-[11px] text-muted-foreground hover:text-foreground underline inline-flex items-center gap-1"
                              >
                                <HelpCircle className="w-3 h-3" /> Don't have this document right now? Add an explanation note
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
