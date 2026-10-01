'use client';

import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { CVLead } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Search, 
  Mail, 
  Trash2, 
  Send, 
  FileText, 
  ExternalLink, 
  UserCheck, 
  Sparkles, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const db = getFirestore(firebaseApp);

export default function CVLeadsPage() {
  const [leads, setLeads] = useState<CVLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  
  // Modals state
  const [selectedLead, setSelectedLead] = useState<CVLead | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedEmailLead, setSelectedEmailLead] = useState<CVLead | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'cvLeads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as CVLead));
      setLeads(fetchedLeads);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching CV leads:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this candidate application?')) {
      try {
        await deleteDoc(doc(db, 'cvLeads', id));
        toast({
          title: "Application Deleted",
          description: "Candidate submission was removed.",
        });
      } catch (error) {
        console.error("Error deleting CV lead:", error);
        toast({
          title: "Error",
          description: "Failed to delete application.",
          variant: "destructive"
        });
      }
    }
  };

  const openEmailModal = (lead: CVLead) => {
    setSelectedEmailLead(lead);
    setEmailSubject(`My Accountant - Application for ${lead.role || 'Accounting Role'}`);
    setEmailBody(`Hi,\n\nThank you for submitting your CV for the ${lead.role || 'position'} at My Accountant.\n\nWe were impressed by your profile and would love to schedule a brief introductory conversation. Are you available for a 15-minute call sometime this week?\n\nBest regards,\nKevin Freese\nMy Accountant Team`);
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedEmailLead) return;
    setIsSendingEmail(true);
    try {
      const auth = getAuth(firebaseApp);
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          to: selectedEmailLead.email,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br/>'),
        }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      
      toast({
        title: "Email Sent",
        description: `Successfully contacted ${selectedEmailLead.email}`,
      });
      setIsEmailModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to send the email.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Email Copied",
      description: email,
    });
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.role || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const score = lead.score || 0;
      if (scoreFilter === 'high') return score >= 80;
      if (scoreFilter === 'mid') return score >= 60 && score < 80;
      if (scoreFilter === 'low') return score < 60;
      return true;
    });
  }, [leads, searchTerm, scoreFilter]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const avgScore = total > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / total) : 0;
    const highScores = leads.filter(l => (l.score || 0) >= 80).length;
    const uniqueRoles = new Set(leads.map(l => (l.role || '').trim()).filter(Boolean)).size;
    return { total, avgScore, highScores, uniqueRoles };
  }, [leads]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    try {
      return format(date, 'dd MMM yyyy, HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const getScoreBadge = (score?: number) => {
    const s = score || 0;
    if (s >= 80) {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">{s}% Match</Badge>;
    }
    if (s >= 60) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold">{s}% Moderate</Badge>;
    }
    return <Badge variant="destructive" className="font-bold">{s}% Needs Work</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-850">
              Candidate Applications
            </h1>
            <Badge variant="outline" className="text-xs font-bold text-emerald-700 border-emerald-300 bg-emerald-50">
              Talent Pool
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Review candidate CV submissions, AI ATS benchmark scores, and automated profile analyses.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                Total Applicants
              </span>
              <div className="text-2xl font-black text-slate-850">{kpis.total}</div>
              <p className="text-[11px] text-slate-400 font-medium">CV Submissions</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                Average ATS Score
              </span>
              <div className="text-2xl font-black text-slate-850">{kpis.avgScore}%</div>
              <p className="text-[11px] text-slate-400 font-medium">Overall quality</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">
                Top Candidates (80%+)
              </span>
              <div className="text-2xl font-black text-slate-850">{kpis.highScores}</div>
              <p className="text-[11px] text-slate-400 font-medium">High Match</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-600 tracking-wider">
                Target Roles
              </span>
              <div className="text-2xl font-black text-slate-850">{kpis.uniqueRoles}</div>
              <p className="text-[11px] text-slate-400 font-medium">Unique positions</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-lg font-black text-slate-850">
              All Applications ({filteredLeads.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Click &quot;View ATS Analysis&quot; to inspect detailed scoring, AI rewrites, and candidate strengths.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Select value={scoreFilter} onValueChange={(val: any) => setScoreFilter(val)}>
              <SelectTrigger className="h-9 text-xs w-full sm:w-36">
                <SelectValue placeholder="Filter Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">80%+ (High)</SelectItem>
                <SelectItem value="mid">60-79% (Mid)</SelectItem>
                <SelectItem value="low">&lt;60% (Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Loading candidate applications...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserCheck className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-base font-bold text-slate-700">No applications found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || scoreFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Candidate CV submissions will appear here once submitted.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-black text-slate-600">Candidate Email</TableHead>
                    <TableHead className="text-xs font-black text-slate-600">Target Role</TableHead>
                    <TableHead className="text-xs font-black text-slate-600 text-center">ATS Match Score</TableHead>
                    <TableHead className="text-xs font-black text-slate-600">Submitted</TableHead>
                    <TableHead className="text-xs font-black text-slate-600 text-center">CV Document</TableHead>
                    <TableHead className="text-xs font-black text-slate-600 text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="font-semibold text-xs text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{lead.email}</span>
                          <button
                            onClick={() => copyEmail(lead.email)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                            title="Copy email address"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        <Badge variant="outline" className="text-xs font-semibold bg-white border-slate-200">
                          {lead.role || 'Unspecified Role'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getScoreBadge(lead.score)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        {lead.cvUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-7 text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          >
                            <a href={lead.cvUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-3.5 w-3.5 mr-1" /> View CV
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No File</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.analysis && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsAnalysisModalOpen(true);
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1 text-emerald-600" />
                              ATS Analysis
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-600 hover:text-primary"
                            onClick={() => openEmailModal(lead)}
                            title="Send email to candidate"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(lead.id)}
                            title="Delete submission"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAILED ATS ANALYSIS MODAL */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          {selectedLead && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <DialogTitle className="text-xl font-black text-slate-850 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      ATS & Candidate Analysis
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-1">
                      {selectedLead.email} &bull; Target Role: <strong className="text-slate-700">{selectedLead.role || 'General'}</strong>
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getScoreBadge(selectedLead.score)}
                    {selectedLead.cvUrl && (
                      <Button size="sm" variant="outline" asChild className="h-8 text-xs font-bold">
                        <a href={selectedLead.cvUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open CV
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Sub-Score Breakdown */}
              {selectedLead.analysis?.scores && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Score Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ATS Readiness</p>
                      <p className="text-xl font-black text-slate-800">{selectedLead.analysis.scores.atsReadiness ?? 'N/A'}%</p>
                      <Progress value={selectedLead.analysis.scores.atsReadiness || 0} className="h-1.5 mt-2" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Achievements</p>
                      <p className="text-xl font-black text-slate-800">{selectedLead.analysis.scores.impactAndAchievements ?? 'N/A'}%</p>
                      <Progress value={selectedLead.analysis.scores.impactAndAchievements || 0} className="h-1.5 mt-2" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Readability</p>
                      <p className="text-xl font-black text-slate-800">{selectedLead.analysis.scores.structureAndReadability ?? 'N/A'}%</p>
                      <Progress value={selectedLead.analysis.scores.structureAndReadability || 0} className="h-1.5 mt-2" />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Role Fit</p>
                      <p className="text-xl font-black text-slate-800">{selectedLead.analysis.scores.roleFit ?? 'N/A'}%</p>
                      <Progress value={selectedLead.analysis.scores.roleFit || 0} className="h-1.5 mt-2" />
                    </div>
                  </div>
                </div>
              )}

              {/* Improved Executive Summary */}
              {selectedLead.analysis?.improvedSummary && (
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    AI-Enhanced Professional Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {selectedLead.analysis.improvedSummary}
                  </p>
                </div>
              )}

              {/* Rationales */}
              {selectedLead.analysis?.rationales && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Score Rationales & Observations
                  </h4>
                  <div className="space-y-2 text-xs">
                    {selectedLead.analysis.rationales.atsReadiness && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">ATS Parsing & Keywords:</strong>
                        <p className="text-slate-600 mt-1">{selectedLead.analysis.rationales.atsReadiness}</p>
                      </div>
                    )}
                    {selectedLead.analysis.rationales.roleFit && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">Role Alignment:</strong>
                        <p className="text-slate-600 mt-1">{selectedLead.analysis.rationales.roleFit}</p>
                      </div>
                    )}
                    {selectedLead.analysis.rationales.impactAndAchievements && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">Quantifiable Impact:</strong>
                        <p className="text-slate-600 mt-1">{selectedLead.analysis.rationales.impactAndAchievements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Missing Info & Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLead.analysis?.missingInformation && selectedLead.analysis.missingInformation.length > 0 && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                    <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      Missing Information
                    </h4>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {selectedLead.analysis.missingInformation.map((item, idx) => (
                        <li key={idx} className="font-medium">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedLead.analysis?.suggestions && selectedLead.analysis.suggestions.length > 0 && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                    <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                      Actionable Recommendations
                    </h4>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {selectedLead.analysis.suggestions.map((item, idx) => (
                        <li key={idx} className="font-medium">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Bullet Point Rewrites */}
              {selectedLead.analysis?.bulletPointRewrites && selectedLead.analysis.bulletPointRewrites.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Experience Bullet Rewrites (Original vs Optimized)
                  </h4>
                  <div className="space-y-3">
                    {selectedLead.analysis.bulletPointRewrites.map((rw, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="line-through text-slate-400">
                          <strong>Original:</strong> &ldquo;{rw.original}&rdquo;
                        </div>
                        <div className="text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 font-medium">
                          <strong>Rewritten:</strong> &ldquo;{rw.improved}&rdquo;
                        </div>
                        {rw.reason && (
                          <p className="text-[11px] text-slate-500 italic">
                            Reason: {rw.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between border-t pt-3">
                <Button variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>
                  Close
                </Button>
                <Button 
                  className="bg-primary text-white font-bold"
                  onClick={() => {
                    setIsAnalysisModalOpen(false);
                    openEmailModal(selectedLead);
                  }}
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Contact Candidate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* OUTREACH EMAIL MODAL */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Contact Candidate
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Send an outreach message directly to {selectedEmailLead?.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Recipient</Label>
              <Input value={selectedEmailLead?.email || ''} readOnly className="h-9 text-xs bg-slate-50" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Subject</Label>
              <Input 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)} 
                className="h-9 text-xs" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Message Body</Label>
              <Textarea 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)} 
                rows={6}
                className="text-xs font-normal" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailModalOpen(false)} disabled={isSendingEmail}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail} className="bg-primary text-white font-bold">
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
