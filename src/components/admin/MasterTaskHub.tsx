'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MasterTask, MasterTaskCategory, MasterTaskStatus, MasterTaskPriority } from '@/lib/types';
import { 
  fetchMasterTasksAction, 
  updateMasterTaskInstructionsAction, 
  updateMasterTaskStatusAction, 
  markMasterTaskAsSpamAction,
  generateMasterTaskAiReplyAction, 
  sendMasterTaskReplyAction 
} from '@/app/actions/master-tasks-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, Sparkles, Send, RefreshCw, CheckCircle2, Clock, AlertTriangle, 
  Paperclip, ExternalLink, MessageSquare, Search, Filter, Bot, Building2, 
  FileText, ShieldCheck, CreditCard, Users, Briefcase, FileCheck, ArrowRight,
  Ban, ShieldAlert, Undo2, Trash2, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function MasterTaskHub() {
  const [tasks, setTasks] = useState<MasterTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Task Modal / Drawer State
  const [selectedTask, setSelectedTask] = useState<MasterTask | null>(null);
  const [instructionsText, setInstructionsText] = useState('');
  const [aiDraftText, setAiDraftText] = useState('');
  const [aiTone, setAiTone] = useState<'executive' | 'formal' | 'supportive' | 'concise'>('executive');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavingInstructions, setIsSavingInstructions] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { toast } = useToast();

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetchMasterTasksAction();
      if (res.success) {
        setTasks(res.tasks);
      } else {
        toast({ title: 'Failed to load tasks', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error loading tasks', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Category counts (exclude Spam and Completed from default active category counts)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0, Completed: 0, Spam: 0 };
    tasks.forEach(t => {
      if (t.status === 'Spam') {
        counts.Spam = (counts.Spam || 0) + 1;
      } else if (t.status === 'Completed') {
        counts.Completed = (counts.Completed || 0) + 1;
      } else {
        counts.All = (counts.All || 0) + 1;
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  // Filtered Tasks:
  // - In 'All' (Active) view: automatically hide BOTH 'Completed' and 'Spam' tasks
  // - In 'Completed' view: show completed tasks
  // - In 'Spam' view: show quarantined spam tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedStatus === 'Spam') {
        if (t.status !== 'Spam') return false;
      } else if (selectedStatus === 'Completed') {
        if (t.status !== 'Completed') return false;
      } else {
        // Active view: hide both Spam and Completed tasks
        if (t.status === 'Spam' || t.status === 'Completed') return false;
        if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
      }

      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchPriority = selectedPriority === 'All' || t.priority === selectedPriority;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        t.title.toLowerCase().includes(q) ||
        t.senderName.toLowerCase().includes(q) ||
        t.senderEmail.toLowerCase().includes(q) ||
        t.bodyText.toLowerCase().includes(q) ||
        (t.customInstructions && t.customInstructions.toLowerCase().includes(q)) ||
        (t.matchedOrderSummary && (
          t.matchedOrderSummary.orderNumber?.toString().includes(q) ||
          t.matchedOrderSummary.companyName?.toLowerCase().includes(q) ||
          t.matchedOrderSummary.customerName?.toLowerCase().includes(q)
        ));

      return matchCat && matchPriority && matchQuery;
    });
  }, [tasks, selectedCategory, selectedStatus, selectedPriority, searchQuery]);

  const handleOpenTask = (task: MasterTask) => {
    setSelectedTask(task);
    setInstructionsText(task.customInstructions || '');
    setAiDraftText(task.aiDraftReply || '');
  };

  const handleSaveInstructions = async () => {
    if (!selectedTask) return;
    setIsSavingInstructions(true);
    try {
      const res = await updateMasterTaskInstructionsAction(selectedTask.id, instructionsText);
      if (res.success) {
        toast({ title: 'Instructions Saved', description: 'Your custom notes have been updated.' });
        setSelectedTask(prev => prev ? { ...prev, customInstructions: instructionsText } : null);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, customInstructions: instructionsText } : t));
      } else {
        toast({ title: 'Save Failed', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingInstructions(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: MasterTaskStatus) => {
    try {
      const res = await updateMasterTaskStatusAction(taskId, newStatus);
      if (res.success) {
        const isNowCompleted = newStatus === 'Completed';
        toast({ 
          title: isNowCompleted ? 'Task Marked Completed' : 'Status Updated', 
          description: isNowCompleted 
            ? 'Task completed and removed from active list.' 
            : `Task set to ${newStatus}.` 
        });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask && selectedTask.id === taskId) {
          if (isNowCompleted) {
            setSelectedTask(null); // auto-close modal on complete
          } else {
            setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleMarkSpam = async (taskId: string, isSpam: boolean = true) => {
    try {
      const res = await markMasterTaskAsSpamAction(taskId, isSpam);
      if (res.success) {
        const newStatus: MasterTaskStatus = isSpam ? 'Spam' : 'Pending';
        toast({ 
          title: isSpam ? 'Marked as Spam' : 'Unmarked Spam', 
          description: isSpam ? 'Task moved to Spam folder.' : 'Task restored to active inbox.' 
        });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        toast({ title: 'Action Failed', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleGenerateAiReply = async () => {
    if (!selectedTask) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateMasterTaskAiReplyAction(selectedTask.id, {
        customPrompt: instructionsText,
        tone: aiTone,
      });

      if (res.success && res.draftReply) {
        setAiDraftText(res.draftReply);
        setSelectedTask(prev => prev ? { ...prev, aiDraftReply: res.draftReply } : null);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, aiDraftReply: res.draftReply } : t));
        toast({ title: 'AI Reply Generated', description: 'Review or edit the response below before dispatching.' });
      } else {
        toast({ title: 'AI Generation Failed', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendReply = async (sendSmtp: boolean, postToOrderNotes: boolean) => {
    if (!selectedTask || !aiDraftText.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await sendMasterTaskReplyAction(selectedTask.id, aiDraftText, {
        sendSmtp,
        postToOrderNotes,
      });

      if (res.success) {
        toast({ title: 'Reply Dispatched', description: res.message });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, status: 'Replied', isReplied: true } : t));
        setSelectedTask(prev => prev ? { ...prev, status: 'Replied', isReplied: true } : null);
      } else {
        toast({ title: 'Send Failed', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSendingReply(false);
    }
  };

  const getCategoryIcon = (cat: MasterTaskCategory) => {
    switch (cat) {
      case 'Supplier Invoices': return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case 'Payroll & EMP201': return <Users className="h-4 w-4 text-blue-600" />;
      case 'SARS Compliance': return <Building2 className="h-4 w-4 text-amber-600" />;
      case 'NCR Applications': return <ShieldCheck className="h-4 w-4 text-purple-600" />;
      case 'COIDA': return <Briefcase className="h-4 w-4 text-indigo-600" />;
      case 'Quotation Requests': return <FileText className="h-4 w-4 text-cyan-600" />;
      case 'Client Instructions': return <MessageSquare className="h-4 w-4 text-sky-600" />;
      default: return <FileCheck className="h-4 w-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: MasterTaskPriority) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border-amber-200">Medium</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-medium uppercase text-slate-500">Low</Badge>;
    }
  };

  const getStatusBadge = (status: MasterTaskStatus) => {
    switch (status) {
      case 'Completed': return <Badge variant="default" className="text-[10px] font-bold bg-emerald-600 text-white">Completed</Badge>;
      case 'Replied': return <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-100 text-indigo-800 border-indigo-200">Replied</Badge>;
      case 'In Progress': return <Badge variant="secondary" className="text-[10px] font-bold bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'Spam': return <Badge variant="destructive" className="text-[10px] font-bold bg-rose-100 text-rose-800 border-rose-200">Spam</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-bold text-amber-700 bg-amber-50 border-amber-200">Pending</Badge>;
    }
  };

  const categories: (MasterTaskCategory | 'All')[] = [
    'All',
    'Supplier Invoices',
    'Payroll & EMP201',
    'SARS Compliance',
    'NCR Applications',
    'COIDA',
    'Quotation Requests',
    'Client Instructions',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl border border-indigo-900/40 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Master Email & Compliance Task Hub</h1>
          </div>
          <p className="text-xs text-indigo-200/80 max-w-2xl">
            Real-time inbox triage for <span className="font-semibold text-white">info@myacc.co.za</span>, spam quarantine, statutory practice compliance, AI response drafts, and order cross-referencing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs h-9"
            onClick={loadTasks}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Hub'}
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const count = categoryCounts[cat] || 0;
          const isSelected = selectedCategory === cat && selectedStatus !== 'Spam';
          return (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); if (selectedStatus === 'Spam') setSelectedStatus('All'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/50'
              }`}
            >
              {cat !== 'All' && getCategoryIcon(cat as MasterTaskCategory)}
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Completed Tab Pill */}
        <button
          onClick={() => { setSelectedStatus('Completed'); setSelectedCategory('All'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ml-auto ${
            selectedStatus === 'Completed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-card text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Completed</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'Completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}`}>
            {categoryCounts.Completed || 0}
          </span>
        </button>

        {/* Spam Tab Pill */}
        <button
          onClick={() => { setSelectedStatus('Spam'); setSelectedCategory('All'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedStatus === 'Spam'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-card text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <Ban className="h-3.5 w-3.5" />
          <span>Spam Quarantine</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'Spam' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'}`}>
            {categoryCounts.Spam || 0}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject, sender, company, order # or instructions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9 text-xs w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Active Tasks</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Replied">Replied</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Spam">🚫 Spam Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="h-9 text-xs w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Mail className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">
              {selectedStatus === 'Spam' ? 'No Spam Messages Found' : 'No Tasks Found'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              {selectedStatus === 'Spam' 
                ? 'Your spam quarantine is currently clean.'
                : 'No tasks match your current filter criteria. Try adjusting the category or search query.'}
            </p>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className={`hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs hover:shadow-sm group cursor-pointer bg-card ${
                task.status === 'Spam' ? 'opacity-70 bg-rose-50/20 border-rose-200/50' : ''
              }`}
              onClick={() => handleOpenTask(task)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        {getCategoryIcon(task.category)}
                        {task.category}
                      </span>
                      <span>•</span>
                      <span className="text-xs text-muted-foreground font-mono">{task.date}</span>
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                      {task.attachments && task.attachments.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-slate-600">
                          <Paperclip className="h-3 w-3" /> {task.attachments.length} Attachment(s)
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-600 transition-colors leading-snug">
                      {task.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-foreground">{task.senderName} ({task.senderEmail}):</span> {task.bodyText}
                    </p>

                    {/* Matched Order Pill */}
                    {task.matchedOrderSummary && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium text-indigo-950 dark:text-indigo-200">
                        <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Matched Order: <strong>#{task.matchedOrderSummary.orderNumber}</strong> ({task.matchedOrderSummary.serviceTitle || 'Order'})</span>
                        {task.matchedOrderSummary.companyName && (
                          <span className="text-indigo-700 dark:text-indigo-300">• {task.matchedOrderSummary.companyName}</span>
                        )}
                      </div>
                    )}

                    {/* Custom Instructions Tag */}
                    {task.customInstructions && (
                      <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Kevin's Note:</strong> {task.customInstructions}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0">
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 shadow-xs"
                        onClick={(e) => { e.stopPropagation(); handleOpenTask(task); }}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Action & Reply
                      </Button>

                      {task.status === 'Spam' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          title="Restore from spam"
                          onClick={(e) => { e.stopPropagation(); handleMarkSpam(task.id, false); }}
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1" /> Not Spam
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Mark as spam"
                          onClick={(e) => { e.stopPropagation(); handleMarkSpam(task.id, true); }}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <Select 
                      value={task.status} 
                      onValueChange={(val: MasterTaskStatus) => handleStatusChange(task.id, val)}
                    >
                      <SelectTrigger className="h-7 text-[11px] w-[115px]" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Replied">Replied</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Spam">🚫 Spam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Task Action & AI Reply Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(selectedTask.category)}
                  <span className="text-xs font-semibold text-muted-foreground uppercase">{selectedTask.category}</span>
                  {getPriorityBadge(selectedTask.priority)}
                  {getStatusBadge(selectedTask.status)}
                </div>

                {selectedTask.status === 'Spam' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => handleMarkSpam(selectedTask.id, false)}
                  >
                    <Undo2 className="h-3 w-3 mr-1" /> Not Spam
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    onClick={() => handleMarkSpam(selectedTask.id, true)}
                  >
                    <Ban className="h-3 w-3 mr-1" /> Mark as Spam
                  </Button>
                )}
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {selectedTask.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                From: <span className="font-semibold text-foreground">{selectedTask.senderName}</span> ({selectedTask.senderEmail}) • Date: {selectedTask.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 my-2">
              {/* Linked Order Card if any */}
              {selectedTask.matchedOrderSummary && (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      Linked Order #{selectedTask.matchedOrderSummary.orderNumber}
                    </div>
                    <div className="text-xs text-indigo-900/80 dark:text-indigo-300/80">
                      {selectedTask.matchedOrderSummary.companyName || selectedTask.matchedOrderSummary.customerName} • {selectedTask.matchedOrderSummary.serviceTitle}
                    </div>
                  </div>
                  <Link 
                    href={`/admin/orders/${selectedTask.matchedOrderId}`} 
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    View Order <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Email Content Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Body / Request Text:
                </label>
                <div className="p-3.5 bg-muted/40 rounded-lg border text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {selectedTask.bodyText}
                </div>
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] font-semibold text-muted-foreground">Attachments:</span>
                    {selectedTask.attachments.map((att, aIdx) => (
                      <Badge key={aIdx} variant="outline" className="text-xs gap-1 py-0.5 bg-background">
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                        {att.filename}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Instructions Box */}
              <div className="space-y-1.5 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Kevin's Custom Instructions / Notes:
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] bg-white dark:bg-slate-900 border-amber-300 text-amber-900"
                    onClick={handleSaveInstructions}
                    disabled={isSavingInstructions}
                  >
                    {isSavingInstructions ? 'Saving...' : 'Save Instructions'}
                  </Button>
                </div>
                <Textarea
                  placeholder="e.g. Include quotation for CIPC foreign company registration; explain SARS debt compromise payment breakdown; request signed CF-1B..."
                  value={instructionsText}
                  onChange={e => setInstructionsText(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 min-h-[65px]"
                />
              </div>

              {/* AI Reply Generator Section */}
              <div className="space-y-2.5 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">AI Response Generator</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={aiTone} onValueChange={(val: any) => setAiTone(val)}>
                      <SelectTrigger className="h-7 text-xs w-[125px] bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="supportive">Supportive</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                      </SelectContent>
                    </Select>

                    {aiDraftText && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200 font-semibold hover:bg-indigo-50 shadow-xs"
                        onClick={() => setIsPreviewOpen(true)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                        Email Preview
                      </Button>
                    )}

                    <Button
                      size="sm"
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                      onClick={handleGenerateAiReply}
                      disabled={isGeneratingAi}
                    >
                      {isGeneratingAi ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      {aiDraftText ? 'Regenerate Draft' : 'Generate AI Reply'}
                    </Button>
                  </div>
                </div>

                {/* Draft Reply Editor */}
                {aiDraftText && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Editable Response Draft:
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPreviewOpen(true)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          <Eye className="h-3 w-3" /> View Outgoing Email Preview
                        </button>
                        <span className="text-[10px] text-indigo-600">Drafted with CIBA #3561 Credentials & Policy</span>
                      </div>
                    </div>
                    <Textarea
                      value={aiDraftText}
                      onChange={e => setAiDraftText(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900 font-sans min-h-[150px] leading-relaxed"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => handleStatusChange(selectedTask.id, 'Completed')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Mark Completed
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {selectedTask.matchedOrderId && aiDraftText && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 border-indigo-200 hover:bg-indigo-50 text-indigo-900"
                    onClick={() => handleSendReply(false, true)}
                    disabled={isSendingReply}
                  >
                    Post to Order Notes
                  </Button>
                )}

                {aiDraftText && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 border-indigo-200 text-indigo-900 hover:bg-indigo-50 font-semibold"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                    Preview Email
                  </Button>
                )}

                {aiDraftText && (
                  <Button
                    size="sm"
                    className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    onClick={() => handleSendReply(true, !!selectedTask.matchedOrderId)}
                    disabled={isSendingReply}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {isSendingReply ? 'Sending...' : 'Send Email Reply'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rendered Email Preview Modal (Outlook / HTML Style) */}
      {selectedTask && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-slate-950">
            {/* Outlook-style header */}
            <div className="p-4 bg-slate-900 text-white border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold tracking-wide uppercase">Outgoing Email Preview</span>
              </div>
              <Badge className="bg-indigo-600 text-white text-[10px] font-mono">HTML Email Output</Badge>
            </div>

            {/* Email Metadata Envelope */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground w-16">From:</span>
                <span className="text-foreground">Kevin Freese &lt;info@myacc.co.za&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground w-16">To:</span>
                <span className="text-foreground">{selectedTask.senderName} &lt;{selectedTask.senderEmail}&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground w-16">Subject:</span>
                <span className="font-semibold text-foreground">
                  {selectedTask.title.toLowerCase().startsWith('re:') ? selectedTask.title : `Re: ${selectedTask.title}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground w-16">Date:</span>
                <span>{format(new Date(), 'dd MMMM yyyy, HH:mm')}</span>
              </div>
            </div>

            {/* Rendered Email Body Canvas */}
            <div className="p-6 bg-white dark:bg-slate-950 font-sans text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-4">
              <div className="space-y-3">
                {aiDraftText.split(/\n\n+/).map((para, pIdx) => {
                  const cleanedPara = para
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/^\s*\*\s*\*\*(.*?)\*\*:?/gm, '• $1:')
                    .replace(/^\s*\*\s+/gm, '• ');

                  const lines = cleanedPara.split('\n');
                  return (
                    <div key={pIdx} className="space-y-1">
                      {lines.map((line, lIdx) => {
                        const trimmed = line.trim();
                        const isStepHeader = /^\d+\.\s+/.test(trimmed);
                        const isBullet = /^[•\-]/.test(trimmed);
                        const isFeeHighlight = /^[•\-]?\s*(Fee|Processing Time|Turnaround|Service|Scope):/i.test(trimmed);

                        if (isStepHeader) {
                          return (
                            <div key={lIdx} className="font-bold text-slate-900 dark:text-white pt-2 text-sm">
                              {trimmed}
                            </div>
                          );
                        }
                        if (isFeeHighlight) {
                          return (
                            <div key={lIdx} className="pl-4 text-slate-700 dark:text-slate-300 font-medium">
                              {trimmed}
                            </div>
                          );
                        }
                        if (isBullet) {
                          return (
                            <div key={lIdx} className="pl-3 text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                              <span>•</span>
                              <span>{trimmed.replace(/^[•\-]\s*/, '')}</span>
                            </div>
                          );
                        }
                        return <p key={lIdx} className="m-0 leading-relaxed">{line}</p>;
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Official Practice Signature Block */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-bold text-slate-900 dark:text-white text-sm">Kevin Freese</div>
                <div className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
                  Chartered Business Accountant in Practice (SA) | CIBA #3561 • PR-0098553
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-300">
                  My Accountant (Pty) Ltd <span className="font-normal text-slate-400">• Reg: 2020 / 548105 / 07</span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px]">
                  <span>Landline: <strong>010 109 1625</strong></span>
                  <span>•</span>
                  <span>Website: <a href="https://myacc.co.za" target="_blank" className="text-indigo-600 hover:underline">www.myacc.co.za</a></span>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setIsPreviewOpen(false)}
              >
                Back to Edit
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  onClick={async () => {
                    await handleSendReply(true, !!selectedTask.matchedOrderId);
                    setIsPreviewOpen(false);
                  }}
                  disabled={isSendingReply}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {isSendingReply ? 'Sending...' : 'Send This Email Now'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
