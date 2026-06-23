'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Inbox,
  Search,
  Star,
  Archive,
  Clock,
  Send,
  RefreshCw,
  Tag,
  AlertTriangle,
  CheckCircle,
  User,
  Sparkles,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Plus,
  Paperclip,
  ExternalLink,
  Bot,
  Copy,
  ArrowLeft,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  ClipboardList,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Settings,
  Forward,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Email, EmailCategory } from '@/lib/types';
import {
  syncEmails,
  markEmailRead,
  markEmailUnread,
  archiveEmail,
  starEmail,
  getAiDraftReply,
  getAiActionItems,
  createTaskFromEmail,
  sendEmailReply,
  addEmailNote,
  getEmailSettings,
  saveEmailSettings,
  getEmailsList,
  forwardEmail,
  deleteEmail,
} from '@/app/actions/email-actions';

// ─── Constants ─────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'archived' | EmailCategory;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'urgent_deadline', label: 'Urgent' },
  { value: 'client_query', label: 'Client Queries' },
  { value: 'sars_correspondence', label: 'SARS' },
  { value: 'document_submission', label: 'Documents' },
  { value: 'payment_related', label: 'Payments' },
  { value: 'complaint', label: 'Complaints' },
  { value: 'archived', label: 'Archived' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  client_query: 'Client Query',
  document_submission: 'Document',
  payment_related: 'Payment',
  sars_correspondence: 'SARS',
  new_client_inquiry: 'New Client',
  complaint: 'Complaint',
  partner_communication: 'Partner',
  spam_marketing: 'Spam',
  internal: 'Internal',
  urgent_deadline: 'Urgent',
  other: 'Other',
};

const CATEGORY_STYLES: Record<string, string> = {
  client_query: 'bg-blue-50 text-blue-700 border-blue-200',
  document_submission: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  payment_related: 'bg-amber-50 text-amber-700 border-amber-200',
  sars_correspondence: 'bg-purple-50 text-purple-700 border-purple-200',
  new_client_inquiry: 'bg-teal-50 text-teal-700 border-teal-200',
  complaint: 'bg-red-50 text-red-700 border-red-200',
  partner_communication: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  spam_marketing: 'bg-gray-50 text-gray-500 border-gray-200',
  internal: 'bg-slate-50 text-slate-700 border-slate-200',
  urgent_deadline: 'bg-red-50 text-red-700 border-red-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-emerald-500',
  neutral: 'bg-gray-400',
  negative: 'bg-amber-500',
  angry: 'bg-red-500',
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-700',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getAvatarColor(letter: string): string {
  const index = (letter?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function formatTimestamp(ts: any): string {
  if (!ts) return 'Just now';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

function formatDate(ts: any, fmt: string = 'dd MMM yyyy, HH:mm'): string {
  if (!ts) return '';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, fmt);
  } catch {
    return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminInboxPage() {
  // ─── State ───────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // AI Draft Reply
  const [aiDraft, setAiDraft] = useState('');
  const [aiDraftSubject, setAiDraftSubject] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftInstructions, setDraftInstructions] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});

  // AI Actions
  const [aiActionItems, setAiActionItems] = useState<string[]>([]);
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [isExtractingActions, setIsExtractingActions] = useState(false);

  // Dialogs
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Task creation
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // AI Insights panel
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  // Forwarding States
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardEmailAddress, setForwardEmailAddress] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [emailToForward, setEmailToForward] = useState<Email | null>(null);

  // Mobile
  const [showDetail, setShowDetail] = useState(false);

  // Email Settings
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [connectionSettings, setConnectionSettings] = useState({
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPass: '',
    smtpHost: '',
    smtpPort: '465',
    smtpUser: '',
    smtpPass: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Fetch Emails Loader ─────────────────────────────────────────────
  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getEmailsList();
      if (res.success && res.emails) {
        setEmails(res.emails);
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Could not load emails.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error loading emails:', err);
      toast({
        title: 'Error',
        description: 'Failed to load emails from server.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // ─── Derived state ──────────────────────────────────────────────────
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // If active filter is "archived", only show archived emails.
      // Otherwise, hide archived emails from all other tabs.
      if (activeFilter === 'archived') {
        if (email.status !== 'archived') return false;
      } else {
        if (email.status === 'archived') return false;
      }

      // Filter by category tab
      if (activeFilter !== 'all' && activeFilter !== 'archived' && email.aiCategory !== activeFilter) return false;

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          email.subject?.toLowerCase().includes(term) ||
          email.from?.name?.toLowerCase().includes(term) ||
          email.from?.email?.toLowerCase().includes(term) ||
          email.aiSummary?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [emails, activeFilter, searchTerm]);

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) || null,
    [emails, selectedEmailId]
  );

  const threadEmails = useMemo(() => {
    if (!selectedEmail || !selectedEmail.threadId) return [];
    return emails
      .filter((e) => e.threadId === selectedEmail.threadId)
      .sort((a, b) => {
        const aDate = a.date ? new Date(a.date) : new Date(0);
        const bDate = b.date ? new Date(b.date) : new Date(0);
        return aDate.getTime() - bDate.getTime(); // Oldest first
      });
  }, [emails, selectedEmail]);

  const unreadCount = useMemo(
    () => emails.filter((e) => e.status === 'unread').length,
    [emails]
  );

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleSelectEmail = useCallback(
    async (email: Email) => {
      setSelectedEmailId(email.id);
      setShowDetail(true);
      // Reset or load pre-generated AI draft reply
      if (email.aiDraftReply) {
        setAiDraft(email.aiDraftReply);
        setAiDraftSubject(email.aiDraftReplySubject || '');
        setReplyText(email.aiDraftReply);
      } else {
        setAiDraft('');
        setAiDraftSubject('');
        setReplyText('');
      }
      setDraftInstructions('');
      setAiActionItems(email.aiActionItems || []);
      setCheckedActions({});
      setInsightsExpanded(true);

      // Auto mark as read
      if (email.status === 'unread') {
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, status: 'read' as const } : e))
        );
        try {
          await markEmailRead(email.id);
        } catch (err) {
          console.error('Failed to mark email read:', err);
          setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, status: 'unread' as const } : e))
          );
        }
      }
    },
    []
  );

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncEmails();
      if (result.success) {
        setLastSyncTime(new Date());
        toast({
          title: 'Sync Complete',
          description: `${result.count || 0} new emails synced.`,
        });
        await fetchEmails();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Could not sync emails.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Sync Error',
        description: 'An unexpected error occurred during sync.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast, fetchEmails]);

  const handleStar = useCallback(
    async (e: React.MouseEvent, emailId: string, currentStarred: boolean) => {
      e.stopPropagation();
      setEmails((prev) =>
        prev.map((email) =>
          email.id === emailId ? { ...email, isStarred: !currentStarred } : email
        )
      );
      try {
        await starEmail(emailId, !currentStarred);
      } catch {
        setEmails((prev) =>
          prev.map((email) =>
            email.id === emailId ? { ...email, isStarred: currentStarred } : email
          )
        );
        toast({ title: 'Error', description: 'Could not update star.', variant: 'destructive' });
      }
    },
    [toast]
  );

  const handleArchive = useCallback(async () => {
    if (!selectedEmailId) return;
    const originalEmails = [...emails];
    setEmails((prev) => prev.filter((email) => email.id !== selectedEmailId));
    try {
      await archiveEmail(selectedEmailId);
      setSelectedEmailId(null);
      setShowDetail(false);
      toast({ title: 'Archived', description: 'Email has been archived.' });
    } catch {
      setEmails(originalEmails);
      toast({ title: 'Error', description: 'Could not archive email.', variant: 'destructive' });
    }
  }, [selectedEmailId, emails, toast]);

  const handleToggleRead = useCallback(async () => {
    if (!selectedEmail) return;
    const currentStatus = selectedEmail.status;
    const newStatus = currentStatus === 'unread' ? 'read' : 'unread';
    setEmails((prev) =>
      prev.map((email) =>
        email.id === selectedEmail.id ? { ...email, status: newStatus } : email
      )
    );
    try {
      if (currentStatus === 'unread') {
        await markEmailRead(selectedEmail.id);
      } else {
        await markEmailUnread(selectedEmail.id);
      }
    } catch {
      setEmails((prev) =>
        prev.map((email) =>
          email.id === selectedEmail.id ? { ...email, status: currentStatus } : email
        )
      );
      toast({ title: 'Error', description: 'Could not update read status.', variant: 'destructive' });
    }
  }, [selectedEmail, toast]);

  const handleGenerateDraft = useCallback(async () => {
    if (!selectedEmailId) return;
    setIsGeneratingDraft(true);
    try {
      const result = await getAiDraftReply(selectedEmailId, draftInstructions || undefined);
      if (result.success && result.draft) {
        setAiDraft(result.draft);
        setAiDraftSubject(result.subject || '');
        setReplyText(result.draft);
        toast({ title: 'Draft Generated', description: 'AI reply draft is ready.' });
      } else {
        toast({
          title: 'Draft Failed',
          description: result.error || 'Could not generate draft.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate AI draft.', variant: 'destructive' });
    } finally {
      setIsGeneratingDraft(false);
    }
  }, [selectedEmailId, draftInstructions, toast]);

  const handleExtractActions = useCallback(async () => {
    if (!selectedEmailId) return;
    setIsExtractingActions(true);
    try {
      const result = await getAiActionItems(selectedEmailId);
      if (result.success && result.data) {
        setAiActionItems(result.data);
        setCheckedActions({});
        // Update local state
        setEmails((prev) =>
          prev.map((email) =>
            email.id === selectedEmailId ? { ...email, aiActionItems: result.data } : email
          )
        );
        toast({ title: 'Actions Extracted', description: `Found ${result.data.length} action items.` });
      } else {
        toast({
          title: 'Extraction Failed',
          description: result.error || 'Could not extract actions.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to extract action items.', variant: 'destructive' });
    } finally {
      setIsExtractingActions(false);
    }
  }, [selectedEmailId, toast]);

  const handleSendReply = useCallback(async () => {
    if (!selectedEmailId || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const result = await sendEmailReply(selectedEmailId, replyText, aiDraftSubject || undefined);
      if (result.success) {
        toast({ title: 'Reply Sent', description: 'Your reply has been sent successfully.' });
        setReplyText('');
        setAiDraft('');
        setAiDraftSubject('');
        setDraftInstructions('');
      } else {
        toast({ title: 'Send Failed', description: 'Could not send reply.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send reply.', variant: 'destructive' });
    } finally {
      setIsSendingReply(false);
    }
  }, [selectedEmailId, replyText, aiDraftSubject, toast]);

  const handleCopyDraft = useCallback(() => {
    if (replyText) {
      navigator.clipboard.writeText(replyText);
      toast({ title: 'Copied', description: 'Draft copied to clipboard.' });
    }
  }, [replyText, toast]);

  const handleCreateTask = useCallback(async () => {
    if (!selectedEmailId || !taskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      let mappedPriority: 'High' | 'Medium' | 'Low' = 'Medium';
      if (taskPriority === 'urgent' || taskPriority === 'high') {
        mappedPriority = 'High';
      } else if (taskPriority === 'low') {
        mappedPriority = 'Low';
      }

      const assignees = taskAssignee ? [taskAssignee] : [];

      const result = await createTaskFromEmail(
        selectedEmailId,
        taskTitle,
        taskDescription,
        mappedPriority,
        assignees
      );
      if (result.success) {
        // Update local state
        setEmails((prev) =>
          prev.map((email) =>
            email.id === selectedEmailId ? { ...email, linkedTaskId: result.taskId } : email
          )
        );
        toast({ title: 'Task Created', description: 'Task has been created from this email.' });
        setShowCreateTask(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('medium');
        setTaskAssignee('');
      } else {
        toast({ title: 'Error', description: 'Could not create task.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create task.', variant: 'destructive' });
    } finally {
      setIsCreatingTask(false);
    }
  }, [selectedEmailId, taskTitle, taskDescription, taskPriority, taskAssignee, toast]);

  const handleAddNote = useCallback(async () => {
    if (!selectedEmailId || !noteText.trim()) return;
    setIsSavingNote(true);
    try {
      const result = await addEmailNote(selectedEmailId, noteText);
      if (result.success) {
        // Update local state
        setEmails((prev) =>
          prev.map((email) =>
            email.id === selectedEmailId ? { ...email, notes: noteText } : email
          )
        );
        toast({ title: 'Note Added', description: 'Note saved to this email.' });
        setShowAddNote(false);
        setNoteText('');
      } else {
        toast({ title: 'Error', description: 'Could not save note.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save note.', variant: 'destructive' });
    } finally {
      setIsSavingNote(false);
    }
  }, [selectedEmailId, noteText, toast]);

  const handleOpenCreateTask = useCallback(() => {
    if (selectedEmail) {
      setTaskTitle(`Follow up: ${selectedEmail.subject}`);
      setTaskDescription(selectedEmail.aiSummary || selectedEmail.bodyText?.substring(0, 200) || '');
      setTaskPriority(selectedEmail.aiPriority === 'urgent' || selectedEmail.aiPriority === 'high' ? 'high' : 'medium');
    }
    setShowCreateTask(true);
  }, [selectedEmail]);

  const handleOpenCreateTaskForEmail = useCallback((email: Email, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEmailId(email.id);
    setTaskTitle(`Follow up: ${email.subject}`);
    setTaskDescription(email.aiSummary || email.bodyText?.substring(0, 200) || '');
    setTaskPriority(email.aiPriority === 'urgent' || email.aiPriority === 'high' ? 'high' : 'medium');
    setShowCreateTask(true);
  }, []);

  const handleOpenSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    setShowSettings(true);
    try {
      const res = await getEmailSettings();
      if (res.success && res.settings) {
        setConnectionSettings(res.settings);
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Could not fetch settings.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load email settings.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingSettings(false);
    }
  }, [toast]);

  const handleSaveSettings = useCallback(async () => {
    setIsSavingSettings(true);
    try {
      const res = await saveEmailSettings(connectionSettings);
      if (res.success) {
        toast({
          title: 'Settings Saved',
          description: 'Connection details have been updated successfully.',
        });
        setShowSettings(false);
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Could not save settings.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save email settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSettings(false);
    }
  }, [connectionSettings, toast]);

  const handleBackToList = useCallback(() => {
    setShowDetail(false);
  }, []);

  const handleForward = useCallback(async () => {
    if (!emailToForward || !forwardEmailAddress.trim()) return;
    setIsForwarding(true);
    try {
      const res = await forwardEmail(emailToForward.id, forwardEmailAddress.trim());
      if (res.success) {
        toast({
          title: 'Email Forwarded',
          description: `Successfully forwarded to ${forwardEmailAddress.trim()}`,
        });
        setShowForwardDialog(false);
        setForwardEmailAddress('');
        setEmailToForward(null);
      } else {
        toast({
          title: 'Forward Failed',
          description: res.error || 'Could not forward email.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during forwarding.',
        variant: 'destructive',
      });
    } finally {
      setIsForwarding(false);
    }
  }, [emailToForward, forwardEmailAddress, toast]);

  const handleQuickArchive = useCallback(async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    const originalEmails = [...emails];
    setEmails((prev) => prev.map(email => email.id === emailId ? { ...email, status: 'archived' as const } : email));
    try {
      const res = await archiveEmail(emailId);
      if (res.success) {
        toast({ title: 'Archived', description: 'Email archived successfully.' });
        if (selectedEmailId === emailId) {
          setSelectedEmailId(null);
          setShowDetail(false);
        }
      } else {
        setEmails(originalEmails);
        toast({ title: 'Error', description: res.error || 'Could not archive email.', variant: 'destructive' });
      }
    } catch {
      setEmails(originalEmails);
      toast({ title: 'Error', description: 'Failed to archive email.', variant: 'destructive' });
    }
  }, [emails, selectedEmailId, toast]);

  const handleQuickDelete = useCallback(async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    const originalEmails = [...emails];
    setEmails((prev) => prev.filter(email => email.id !== emailId));
    try {
      const res = await deleteEmail(emailId);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Email deleted permanently.' });
        if (selectedEmailId === emailId) {
          setSelectedEmailId(null);
          setShowDetail(false);
        }
      } else {
        setEmails(originalEmails);
        toast({ title: 'Error', description: res.error || 'Could not delete email.', variant: 'destructive' });
      }
    } catch {
      setEmails(originalEmails);
      toast({ title: 'Error', description: 'Failed to delete email.', variant: 'destructive' });
    }
  }, [emails, selectedEmailId, toast]);

  const handleOpenForwardDialog = useCallback((e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    setEmailToForward(email);
    setShowForwardDialog(true);
  }, []);

  const handleSendQuickReply = useCallback(async (
    e: React.MouseEvent,
    emailId: string,
    replyBody: string,
    replySubject: string
  ) => {
    e.stopPropagation();
    try {
      toast({ title: 'Sending Reply...', description: 'Sending prepared email reply.' });
      const result = await sendEmailReply(emailId, replyBody, replySubject);
      if (result.success) {
        toast({ title: 'Reply Sent', description: 'Your reply has been sent successfully.' });
        // Update local state to show it was replied
        setEmails((prev) =>
          prev.map((email) =>
            email.id === emailId ? { ...email, status: 'replied' as const } : email
          )
        );
      } else {
        toast({ title: 'Send Failed', description: 'Could not send reply.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send reply.', variant: 'destructive' });
    }
  }, [toast]);

  // ─── Render ──────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4 max-w-[1600px] mx-auto">
        {/* ─── Header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-[#1877F2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Email Inbox
                </h1>
                {unreadCount > 0 && (
                  <Badge className="bg-[#1877F2] text-white hover:bg-[#1877F2] text-xs font-bold px-2 py-0.5">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-powered email management and smart replies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
              </span>
            )}
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-2 border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Syncing...' : 'Sync Emails'}
            </Button>
            <Button
              onClick={handleOpenSettings}
              variant="outline"
              size="sm"
              className="h-9 text-xs font-bold gap-2 border-slate-200 hover:bg-slate-50"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </div>
        </div>

        {/* ─── Filter Tabs ──────────────────────────────────────────── */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap border',
                activeFilter === tab.value
                  ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Main Split Pane ──────────────────────────────────────── */}
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* ─── Left Panel: Email List ─────────────────────────────── */}
          <div
            className={cn(
              'w-full flex-col',
              showDetail ? 'hidden' : 'flex'
            )}
          >
            <Card className="flex flex-col h-full border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search emails..."
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-[#1877F2] text-slate-900 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Email List */}
              <ScrollArea className="flex-1">
                {isLoading && emails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <Loader2 className="h-7 w-7 animate-spin text-[#1877F2]" />
                    <p className="text-xs font-semibold">Loading emails...</p>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 p-4">
                    <Inbox className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">No emails found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'Try adjusting your search term'
                        : 'Click "Sync Emails" to fetch new messages'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredEmails.map((email) => {
                      const isSelected = selectedEmailId === email.id;
                      const isUnread = email.status === 'unread';
                      const firstLetter = email.from?.name?.[0] || '?';

                      return (
                        <div
                          key={email.id}
                          onClick={() => handleSelectEmail(email)}
                          className={cn(
                            'w-full text-left p-4 rounded-xl cursor-pointer transition-all border flex gap-3',
                            isSelected
                              ? 'bg-[#1877F2]/5 border-[#1877F2]/30 shadow-sm'
                              : 'bg-white border-slate-100 hover:bg-slate-50/80 hover:border-slate-200 shadow-sm'
                          )}
                        >
                          {/* Left: Unread dot + Avatar */}
                          <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-1">
                              {isUnread && (
                                <div className="h-1.5 w-1.5 rounded-full bg-[#1877F2]" />
                              )}
                            </div>
                            <div
                              className={cn(
                                'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 select-none',
                                getAvatarColor(firstLetter)
                              )}
                            >
                              {getInitials(email.from?.name || '')}
                            </div>
                          </div>

                          {/* Middle: Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Row 1: Sender & Date */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={cn(
                                    'text-sm truncate',
                                    isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                                  )}
                                >
                                  {email.from?.name || email.from?.email || 'Unknown'}
                                </span>
                                <span className="text-xs text-slate-400 font-normal truncate hidden sm:inline">
                                  &lt;{email.from?.email}&gt;
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                                {formatTimestamp(email.date)}
                              </span>
                            </div>

                            <p
                              className={cn(
                                'text-xs font-semibold truncate',
                                isUnread ? 'text-slate-800' : 'text-slate-600'
                              )}
                            >
                              {email.subject || '(No subject)'}
                            </p>

                            {/* Summary */}
                            {email.aiSummary && (
                              <div className="text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100/50 leading-relaxed animate-in fade-in duration-300">
                                <p className="font-semibold text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">AI Summary</p>
                                {email.aiSummary}
                              </div>
                            )}

                            {/* AI Insights & Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {email.aiPriority && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[9px] font-bold py-0.5 px-1.5 capitalize',
                                    PRIORITY_STYLES[email.aiPriority]
                                  )}
                                >
                                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                  {email.aiPriority}
                                </Badge>
                              )}
                              {email.aiCategory && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[9px] font-bold py-0.5 px-1.5',
                                    CATEGORY_STYLES[email.aiCategory] || CATEGORY_STYLES.other
                                  )}
                                >
                                  <Tag className="h-2.5 w-2.5 mr-1" />
                                  {CATEGORY_LABELS[email.aiCategory] || email.aiCategory}
                                </Badge>
                              )}
                              {email.aiSentiment && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-medium py-0.5 px-1.5 bg-slate-50 text-slate-600 border-slate-200"
                                >
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full mr-1 inline-block',
                                      SENTIMENT_COLORS[email.aiSentiment]
                                    )}
                                  />
                                  <span className="capitalize">{email.aiSentiment}</span>
                                </Badge>
                              )}
                              {email.attachments?.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-medium py-0.5 px-1.5 bg-slate-50 text-slate-500 border-slate-200 gap-1"
                                >
                                  <Paperclip className="h-2.5 w-2.5" />
                                  {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>

                            {/* AI Action Items */}
                            {email.aiActionItems && email.aiActionItems.length > 0 && (
                              <div className="space-y-1.5 border-l-2 border-purple-200 pl-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  AI Action Items
                                </p>
                                <div className="space-y-1">
                                  {email.aiActionItems.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
                                      <span className="text-purple-400 select-none mt-0.5 font-bold">•</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* AI Prepared Draft Reply */}
                            {email.aiDraftReply && (
                              <Card
                                onClick={(e) => e.stopPropagation()}
                                className="border border-purple-100 bg-purple-50/20 overflow-hidden rounded-lg mt-2"
                              >
                                <div className="p-2 border-b border-purple-100/50 bg-purple-50/40 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <Bot className="h-3.5 w-3.5 text-purple-600" />
                                    <span className="text-[11px] font-bold text-purple-900">AI Prepared Reply Draft</span>
                                  </div>
                                  <Badge className="bg-purple-100 text-purple-800 text-[9px] border-none font-semibold">
                                    For Approval
                                  </Badge>
                                </div>
                                <div className="p-2.5 space-y-2">
                                  <Textarea
                                    placeholder="Triage draft reply..."
                                    className="min-h-[80px] text-xs bg-white border-purple-100/80 focus-visible:ring-purple-500 focus-visible:border-purple-500 resize-y"
                                    value={draftEdits[email.id] !== undefined ? draftEdits[email.id] : email.aiDraftReply}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDraftEdits((prev) => ({ ...prev, [email.id]: val }));
                                    }}
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      className="h-7 text-[10px] font-bold bg-[#1877F2] hover:bg-[#1565C0] text-white gap-1"
                                      onClick={(e) => {
                                        const body = draftEdits[email.id] !== undefined ? draftEdits[email.id] : email.aiDraftReply;
                                        handleSendQuickReply(e, email.id, body || '', email.aiDraftReplySubject || `Re: ${email.subject}`);
                                      }}
                                    >
                                      <Send className="h-3 w-3" />
                                      Approve & Send
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            )}

                            {/* Card Bottom Row: Quick Actions + View Email option */}
                            <div
                              className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 gap-1"
                                onClick={() => handleSelectEmail(email)}
                              >
                                <Eye className="h-3 w-3 text-[#1877F2]" />
                                View Email
                              </Button>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] font-semibold hover:bg-purple-50 text-purple-700 gap-1 px-2"
                                  onClick={(e) => handleOpenCreateTaskForEmail(email, e)}
                                >
                                  <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                                  Create Task
                                </Button>

                                <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-amber-500 hover:bg-slate-50"
                                        onClick={(e) => handleStar(e, email.id, email.isStarred)}
                                      >
                                        <Star
                                          className={cn(
                                            'h-3.5 w-3.5',
                                            email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                          )}
                                        />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Star</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                        onClick={(e) => handleQuickArchive(e, email.id)}
                                      >
                                        <Archive className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Archive</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                        onClick={(e) => handleOpenForwardDialog(e, email)}
                                      >
                                        <Forward className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Forward</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-slate-50"
                                        onClick={(e) => handleQuickDelete(e, email.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* ─── Right Panel: Email Detail ──────────────────────────── */}
          <div
            className={cn(
              'w-full flex-col min-w-0',
              !showDetail ? 'hidden' : 'flex'
            )}
          >
            {selectedEmail ? (
              <Card className="flex flex-col h-full border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
                {/* Detail Header */}
                <div className="p-4 border-b border-slate-100 shrink-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Back button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={handleBackToList}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>

                      <div className="min-w-0 space-y-1">
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                          {selectedEmail.subject || '(No subject)'}
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {selectedEmail.from?.name || 'Unknown'}
                          </span>
                          <span className="text-slate-400">
                            &lt;{selectedEmail.from?.email}&gt;
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{formatDate(selectedEmail.date)}</span>
                        </div>
                        {selectedEmail.to?.length > 0 && (
                          <p className="text-[11px] text-slate-400">
                            To: {selectedEmail.to.map((t) => t.name || t.email).join(', ')}
                          </p>
                        )}
                        {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                          <p className="text-[11px] text-slate-400">
                            CC: {selectedEmail.cc.map((c) => c.name || c.email).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleRead}>
                            {selectedEmail.status === 'unread' ? (
                              <Eye className="h-4 w-4 text-slate-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-slate-500" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {selectedEmail.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleArchive}>
                            <Archive className="h-4 w-4 text-slate-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Archive</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenCreateTask}>
                            <ClipboardList className="h-4 w-4 text-slate-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Create Task</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setNoteText(selectedEmail.notes || '');
                              setShowAddNote(true);
                            }}
                          >
                            <StickyNote className="h-4 w-4 text-slate-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add Note</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* ─── AI Insights Card ───────────────────────────── */}
                    {(selectedEmail.aiSummary || selectedEmail.aiCategory || selectedEmail.aiPriority) && (
                      <Card className="border border-purple-100 bg-gradient-to-br from-purple-50/50 to-blue-50/30 overflow-hidden">
                        <button
                          onClick={() => setInsightsExpanded(!insightsExpanded)}
                          className="w-full p-3 flex items-center justify-between text-left hover:bg-purple-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-bold text-purple-900">AI Insights</span>
                          </div>
                          {insightsExpanded ? (
                            <ChevronUp className="h-4 w-4 text-purple-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-purple-400" />
                          )}
                        </button>

                        {insightsExpanded && (
                          <CardContent className="px-3 pb-3 pt-0 space-y-3">
                            {/* Summary */}
                            {selectedEmail.aiSummary && (
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {selectedEmail.aiSummary}
                              </p>
                            )}

                            {/* Badges Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {selectedEmail.aiCategory && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] font-bold',
                                    CATEGORY_STYLES[selectedEmail.aiCategory] || CATEGORY_STYLES.other
                                  )}
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {CATEGORY_LABELS[selectedEmail.aiCategory] || selectedEmail.aiCategory}
                                </Badge>
                              )}
                              {selectedEmail.aiPriority && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] font-bold capitalize',
                                    PRIORITY_STYLES[selectedEmail.aiPriority]
                                  )}
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {selectedEmail.aiPriority}
                                </Badge>
                              )}
                              {selectedEmail.aiSentiment && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                                  <span
                                    className={cn(
                                      'h-2 w-2 rounded-full',
                                      SENTIMENT_COLORS[selectedEmail.aiSentiment]
                                    )}
                                  />
                                  <span className="capitalize">{selectedEmail.aiSentiment}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Items */}
                            {aiActionItems.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Action Items
                                </p>
                                {aiActionItems.map((item, i) => (
                                  <label
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer group"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checkedActions[i] || false}
                                      onChange={(e) =>
                                        setCheckedActions((prev) => ({
                                          ...prev,
                                          [i]: e.target.checked,
                                        }))
                                      }
                                      className="mt-0.5 rounded border-slate-300 text-[#1877F2] focus:ring-[#1877F2] h-3.5 w-3.5 accent-[#1877F2]"
                                    />
                                    <span
                                      className={cn(
                                        'leading-relaxed',
                                        checkedActions[i] && 'line-through text-slate-400'
                                      )}
                                    >
                                      {item}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                             {/* Automated Actions Indicator */}
                             {(selectedEmail.aiDraftReply || selectedEmail.linkedTaskId) && (
                               <div className="border-t border-purple-100/50 pt-2.5 space-y-1">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                   Automated Actions
                                 </p>
                                 <div className="flex gap-1.5 flex-wrap">
                                   {selectedEmail.aiDraftReply && (
                                     <Badge className="bg-purple-100 hover:bg-purple-100 text-purple-800 border-purple-200 text-[9px] font-bold py-0.5 px-1.5">
                                       <Bot className="h-3 w-3 mr-1 inline" /> AI Auto-Drafted
                                     </Badge>
                                   )}
                                   {selectedEmail.linkedTaskId && (
                                     <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border-blue-200 text-[9px] font-bold py-0.5 px-1.5">
                                       <ClipboardList className="h-3 w-3 mr-1 inline" /> Task Auto-Created
                                     </Badge>
                                   )}
                                 </div>
                               </div>
                             )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-bold border-purple-200 text-purple-700 hover:bg-purple-50"
                              onClick={handleExtractActions}
                              disabled={isExtractingActions}
                            >
                              {isExtractingActions ? (
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1.5" />
                              )}
                              {isExtractingActions ? 'Extracting...' : 'Extract Actions'}
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    )}

                    {/* ─── Email Thread / Body ─────────────────────────── */}
                    <div className="space-y-4">
                      {threadEmails.length > 1 ? (
                        threadEmails.map((threadEmail, idx) => {
                          const isLast = idx === threadEmails.length - 1;
                          const formattedDate = formatDate(threadEmail.date);
                          return (
                            <div 
                              key={threadEmail.id} 
                              className={cn(
                                "border rounded-xl p-4 bg-white shadow-sm transition-all",
                                isLast ? "border-slate-200" : "border-slate-100 opacity-80 hover:opacity-100"
                              )}
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                <div className="text-xs font-semibold text-slate-700">
                                  {threadEmail.from?.name || threadEmail.from?.email} &lt;{threadEmail.from?.email}&gt;
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {formattedDate}
                                </div>
                              </div>
                              {threadEmail.bodyHtml ? (
                                <div
                                  className="prose prose-sm prose-slate max-w-none text-sm [&_img]:max-w-full [&_img]:rounded-lg [&_a]:text-[#1877F2]"
                                  dangerouslySetInnerHTML={{ __html: threadEmail.bodyHtml }}
                                />
                              ) : (
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                                  {threadEmail.bodyText || 'No content available.'}
                                </pre>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="border border-slate-100 rounded-xl p-4 bg-white">
                          {selectedEmail.bodyHtml ? (
                            <div
                              className="prose prose-sm prose-slate max-w-none text-sm [&_img]:max-w-full [&_img]:rounded-lg [&_a]:text-[#1877F2]"
                              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                            />
                          ) : (
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                              {selectedEmail.bodyText || 'No content available.'}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ─── Attachments ────────────────────────────────── */}
                    {selectedEmail.attachments?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5" />
                          Attachments ({selectedEmail.attachments.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedEmail.attachments.map((att, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors"
                            >
                              <div className="h-8 w-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center shrink-0">
                                <Paperclip className="h-3.5 w-3.5 text-[#1877F2]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-700 truncate">
                                  {att.filename}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {formatFileSize(att.size)}
                                </p>
                              </div>
                              {att.storageUrl && (
                                <a
                                  href={att.storageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1877F2] hover:text-[#1565C0]"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ─── Notes ──────────────────────────────────────── */}
                    {selectedEmail.notes && (
                      <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/50">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <StickyNote className="h-3 w-3" /> Notes
                        </p>
                        <p className="text-xs text-amber-900 whitespace-pre-wrap">
                          {selectedEmail.notes}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* ─── AI Draft Reply Section ─────────────────────── */}
                    <Card className="border border-slate-200 bg-slate-50/30">
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Bot className="h-4 w-4 text-[#1877F2]" />
                          AI Reply Assistant
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-500">
                          Generate an AI-powered reply or write your own
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 space-y-3">
                        {/* Instructions */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add instructions for AI... (e.g., 'mention the March deadline')"
                            className="text-xs h-8 bg-white border-slate-200 focus-visible:ring-[#1877F2]"
                            value={draftInstructions}
                            onChange={(e) => setDraftInstructions(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-[#1877F2] hover:bg-[#1565C0] text-white gap-1.5 shrink-0"
                            onClick={handleGenerateDraft}
                            disabled={isGeneratingDraft}
                          >
                            {isGeneratingDraft ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {isGeneratingDraft
                              ? 'Generating...'
                              : aiDraft
                                ? 'Regenerate'
                                : 'Generate AI Reply'}
                          </Button>
                        </div>

                        {/* Draft/Reply Area */}
                        <Textarea
                          placeholder="AI draft will appear here, or type your reply..."
                          className="min-h-[120px] text-xs bg-white border-slate-200 focus-visible:ring-[#1877F2] resize-y"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-2">
                            {replyText && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs font-medium gap-1.5"
                                onClick={handleCopyDraft}
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </Button>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold bg-[#1877F2] hover:bg-[#1565C0] text-white gap-1.5"
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || isSendingReply}
                          >
                            {isSendingReply ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            {isSendingReply ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </Card>
            ) : (
              /* No email selected */
              <Card className="flex flex-col h-full items-center justify-center border border-slate-200/80 shadow-sm bg-white rounded-2xl p-6 text-center select-none">
                <div className="h-16 w-16 bg-[#1877F2]/5 border border-[#1877F2]/10 text-[#1877F2] rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Select an email to view
                </CardTitle>
                <CardDescription className="max-w-xs mt-2 text-sm text-slate-500">
                  Choose an email from the list to read its content, view AI insights, and compose replies.
                </CardDescription>
              </Card>
            )}
          </div>
        </div>

        {/* ─── Create Task Dialog ──────────────────────────────────── */}
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#1877F2]" />
                Create Task from Email
              </DialogTitle>
              <DialogDescription>
                Create a task linked to this email for follow-up.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Title</label>
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="text-xs h-9"
                  placeholder="Task title..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="text-xs min-h-[80px] resize-y"
                  placeholder="Task description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Priority
                  </label>
                  <Select
                    value={taskPriority}
                    onValueChange={(v) => setTaskPriority(v as any)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    Assign To
                  </label>
                  <Input
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="text-xs h-9"
                    placeholder="Name or email..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1877F2] hover:bg-[#1565C0] text-white"
                onClick={handleCreateTask}
                disabled={!taskTitle.trim() || isCreatingTask}
              >
                {isCreatingTask ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isCreatingTask ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Add Note Dialog ─────────────────────────────────────── */}
        <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-amber-600" />
                Add Note
              </DialogTitle>
              <DialogDescription>
                Add a private note to this email for reference.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="text-xs min-h-[100px] resize-y"
                placeholder="Type your note here..."
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowAddNote(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleAddNote}
                disabled={!noteText.trim() || isSavingNote}
              >
                {isSavingNote ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Email Settings Dialog ─────────────────────────────────── */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#1877F2]" />
                Email Connection Settings
              </DialogTitle>
              <DialogDescription>
                Configure the IMAP (incoming) and SMTP (outgoing) mail servers.
              </DialogDescription>
            </DialogHeader>

            {isFetchingSettings ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-[#1877F2]" />
                <p className="text-xs font-semibold">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                {/* IMAP Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                    <Inbox className="h-4 w-4 text-[#1877F2]" />
                    IMAP Incoming Settings
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">IMAP Host</label>
                      <Input
                        value={connectionSettings.imapHost}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, imapHost: e.target.value }))}
                        placeholder="imap.example.com"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">IMAP Port</label>
                      <Input
                        value={connectionSettings.imapPort}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, imapPort: e.target.value }))}
                        placeholder="993"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">IMAP Username</label>
                      <Input
                        value={connectionSettings.imapUser}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, imapUser: e.target.value }))}
                        placeholder="username@example.com"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">IMAP Password</label>
                      <Input
                        type="password"
                        value={connectionSettings.imapPass}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, imapPass: e.target.value }))}
                        placeholder={connectionSettings.imapPass ? '••••••••' : 'Enter password'}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SMTP Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5">
                    <Send className="h-4 w-4 text-[#1877F2]" />
                    SMTP Outgoing Settings
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Host</label>
                      <Input
                        value={connectionSettings.smtpHost}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.example.com"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Port</label>
                      <Input
                        value={connectionSettings.smtpPort}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                        placeholder="465"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Username</label>
                      <Input
                        value={connectionSettings.smtpUser}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                        placeholder="username@example.com"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">SMTP Password</label>
                      <Input
                        type="password"
                        value={connectionSettings.smtpPass}
                        onChange={(e) => setConnectionSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                        placeholder={connectionSettings.smtpPass ? '••••••••' : 'Enter password'}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                onClick={handleSaveSettings}
                disabled={isSavingSettings || isFetchingSettings}
              >
                {isSavingSettings ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Forward Email Dialog ─────────────────────────────────── */}
        <Dialog open={showForwardDialog} onOpenChange={setShowForwardDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Forward className="h-5 w-5 text-[#1877F2]" />
                Forward Email
              </DialogTitle>
              <DialogDescription>
                Enter the email address to forward this message to.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">To Email Address</label>
                <Input
                  value={forwardEmailAddress}
                  onChange={(e) => setForwardEmailAddress(e.target.value)}
                  className="text-xs h-9"
                  placeholder="recipient@example.com"
                  type="email"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => {
                setShowForwardDialog(false);
                setForwardEmailAddress('');
                setEmailToForward(null);
              }}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1877F2] hover:bg-[#1565C0] text-white"
                onClick={handleForward}
                disabled={!forwardEmailAddress.trim() || isForwarding}
              >
                {isForwarding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Forward className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isForwarding ? 'Forwarding...' : 'Forward'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
