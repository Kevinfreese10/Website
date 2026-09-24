'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { AllocationRule } from '@/lib/types';
import { chartOfAccounts as defaultChartOfAccounts } from '@/lib/chart-of-accounts';
import { allVatTypes } from '@/lib/vat-types';
import { useToast } from '@/hooks/use-toast';
import { syncMasterAllocationRulesAction } from '@/app/actions/allocation-rules-actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Search, Edit, Trash2, Loader2, Sparkles, ArrowLeft, Tag, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { exportPracticeAllocationRulesToExcel } from '@/lib/export-practice-allocation-rules';

const db = getFirestore(firebaseApp);

export const CATEGORY_OPTIONS = [
  { key: 'all', label: 'All Categories' },
  { key: 'telecoms_internet', label: 'Telecoms & Internet' },
  { key: 'fuel_motor_expenses', label: 'Fuel & Motor' },
  { key: 'bank_charges', label: 'Bank Charges' },
  { key: 'software_subscriptions', label: 'Software & IT' },
  { key: 'utilities_municipal', label: 'Utilities & Rates' },
  { key: 'hardware_maintenance', label: 'Hardware & Tools' },
  { key: 'courier_freight', label: 'Courier & Freight' },
  { key: 'office_stationery', label: 'Office & Consumables' },
  { key: 'entertainment_meals', label: 'Meals & Dining' },
  { key: 'travel_transport', label: 'Travel & Tolls' },
  { key: 'advertising_marketing', label: 'Marketing & HR' },
  { key: 'insurance', label: 'Insurance & Tracking' },
  { key: 'security_cleaning', label: 'Security & Hygiene' },
  { key: 'legal_statutory', label: 'Statutory & Compliance' },
  { key: 'sars_statutory', label: 'SARS Tax & Levies' },
];

const ITEMS_PER_PAGE = 30;

export default function GlobalAllocationRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Dialog states
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AllocationRule | null>(null);
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleKeywords, setRuleKeywords] = useState('');
  const [ruleAccountId, setRuleAccountId] = useState('');
  const [ruleCategory, setRuleCategory] = useState('telecoms_internet');
  const [ruleVatType, setRuleVatType] = useState('no_vat');
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [ruleToDelete, setRuleToDelete] = useState<AllocationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Realtime subscription to global allocationRules
  useEffect(() => {
    const rulesRef = collection(db, 'allocationRules');
    const unsubscribe = onSnapshot(
      rulesRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as AllocationRule[];

        setRules(list);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching global allocation rules:', error);
        toast({
          title: 'Error loading rules',
          description: 'Failed to fetch global allocation rules from database.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const filteredRules = useMemo(() => {
    let result = rules;
    if (selectedCategory !== 'all') {
      result = result.filter((r) => (r as any).category === selectedCategory);
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter((r) => {
      const descMatch = (r.description || '').toLowerCase().includes(term);
      const keywordsMatch = (r.keywords || []).some((k) => k.toLowerCase().includes(term));
      const accMatch = (r.accountId || '').toLowerCase().includes(term);
      const catMatch = ((r as any).categoryLabel || (r as any).category || '').toLowerCase().includes(term);
      return descMatch || keywordsMatch || accMatch || catMatch;
    });
  }, [rules, selectedCategory, searchTerm]);

  const totalPages = Math.ceil(filteredRules.length / ITEMS_PER_PAGE) || 1;
  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRules.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRules, currentPage]);

  const handleOpenForm = (rule: AllocationRule | null = null) => {
    setSelectedRule(rule);
    if (rule) {
      setRuleDescription(rule.description || '');
      setRuleKeywords(rule.keywords ? rule.keywords.join(', ') : '');
      setRuleAccountId(rule.accountId || defaultChartOfAccounts[0]?.id || '');
      setRuleCategory((rule as any).category || 'telecoms_internet');
      setRuleVatType(rule.vatType || 'no_vat');
    } else {
      setRuleDescription('');
      setRuleKeywords('');
      setRuleAccountId(defaultChartOfAccounts[0]?.id || '');
      setRuleCategory('telecoms_internet');
      setRuleVatType('standard_rated_purchases');
    }
    setIsRuleFormOpen(true);
  };

  const handleSyncMasterRules = async () => {
    setIsSyncing(true);
    try {
      const token = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await syncMasterAllocationRulesAction({ idToken: token });
      toast({
        title: 'Master Rules Synced!',
        description: `Successfully synced ${res.count} South African allocation rules with SARS VAT defaults.`,
      });
    } catch (err: any) {
      console.error('Error syncing rules:', err);
      toast({
        title: 'Sync Failed',
        description: err?.message || 'Failed to sync master rules.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleDescription.trim()) {
      toast({ title: 'Validation Error', description: 'Rule description is required.', variant: 'destructive' });
      return;
    }
    if (!ruleKeywords.trim()) {
      toast({ title: 'Validation Error', description: 'At least one keyword is required.', variant: 'destructive' });
      return;
    }
    if (!ruleAccountId) {
      toast({ title: 'Validation Error', description: 'Mapped GL account is required.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const keywordsArray = Array.from(
        new Set(
          ruleKeywords
            .split(',')
            .map((k) => k.trim().toUpperCase())
            .filter(Boolean)
        )
      );

      // Collision check: Each keyword can only be part of 1 rule
      for (const kw of keywordsArray) {
        const conflict = rules.find(r => 
          r.id !== selectedRule?.id && 
          r.keywords?.some(existingKw => existingKw.trim().toUpperCase() === kw)
        );
        if (conflict) {
          toast({
            title: 'Keyword Conflict',
            description: `Keyword "${kw}" is already assigned to rule: "${conflict.description || conflict.id}". Each keyword can only be part of 1 rule.`,
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }

      const categoryObj = CATEGORY_OPTIONS.find((c) => c.key === ruleCategory);

      const ruleData = {
        description: ruleDescription.trim(),
        keywords: keywordsArray,
        accountId: ruleAccountId,
        vatType: ruleVatType,
        category: ruleCategory,
        categoryLabel: categoryObj?.label || 'General',
        type: 'hard',
        scope: 'global',
        updatedAt: new Date().toISOString(),
      };

      if (selectedRule?.id) {
        await setDoc(doc(db, 'allocationRules', selectedRule.id), ruleData, { merge: true });
        toast({ title: 'Rule Updated', description: 'Global allocation rule updated successfully.' });
      } else {
        const newDocRef = doc(collection(db, 'allocationRules'));
        await setDoc(newDocRef, ruleData);
        toast({ title: 'Rule Created', description: 'New global allocation rule is now active across all clients.' });
      }

      setIsRuleFormOpen(false);
      setSelectedRule(null);
    } catch (err) {
      console.error('Error saving global rule:', err);
      toast({ title: 'Save Failed', description: 'Could not save rule to Firestore.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'allocationRules', ruleToDelete.id));
      toast({ title: 'Rule Deleted', description: 'The global allocation rule was permanently removed.' });
      setRuleToDelete(null);
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast({ title: 'Delete Failed', description: 'Could not delete allocation rule.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getAccountLabel = (accountId: string) => {
    const acc = defaultChartOfAccounts.find((a) => a.id === accountId);
    return acc ? `${acc.accountNumber || acc.id} - ${acc.description}` : accountId;
  };

  const getVatLabel = (vatName: string) => {
    const vt = allVatTypes.find((v) => v.name === vatName);
    return vt ? vt.label : vatName;
  };

  const handleDownloadExcel = () => {
    try {
      const categoryMap = CATEGORY_OPTIONS.reduce((acc, cat) => {
        acc[cat.key] = cat.label;
        return acc;
      }, {} as Record<string, string>);

      const result = exportPracticeAllocationRulesToExcel(filteredRules, {
        categoryLabelMap: categoryMap,
      });

      toast({
        title: 'Excel Downloaded',
        description: `Exported ${result.count} Practice Allocation Rules to ${result.filename}.`,
      });
    } catch (err: any) {
      console.error('Error exporting rules to Excel:', err);
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not export allocation rules to Excel.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
              <Link href="/admin/ai-accountant/clients">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Clients
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Global Allocation Rules
            <Badge variant="secondary" className="font-bold text-xs">
              {rules.length} active
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage global baseline rules used by the AI Accountant engine across all client accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            className="font-medium gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            Download Excel ({filteredRules.length})
          </Button>

          <Button
            variant="outline"
            onClick={handleSyncMasterRules}
            disabled={isSyncing}
            className="font-medium"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2 text-primary" />
            )}
            Sync 170+ SA Rules
          </Button>

          <Button onClick={() => handleOpenForm(null)} className="font-bold">
            <Plus className="h-4 w-4 mr-2" /> Add Global Rule
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORY_OPTIONS.map((cat) => {
          const count = cat.key === 'all'
            ? rules.length
            : rules.filter((r) => (r as any).category === cat.key).length;
          return (
            <Button
              key={cat.key}
              variant={selectedCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs whitespace-nowrap rounded-full px-3 shrink-0"
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.label}
              <span className={`ml-1.5 text-[10px] ${selectedCategory === cat.key ? 'opacity-90' : 'opacity-60'}`}>
                ({count})
              </span>
            </Button>
          );
        })}
      </div>

      {/* Filter and Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg">Rules Database</CardTitle>
              <CardDescription>
                Showing {filteredRules.length} rules matching current criteria.
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rule, keyword or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading global rules...
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="font-medium">No global allocation rules found.</p>
              <p className="text-xs">Create your first rule or adjust your search filter.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Rule & Category</TableHead>
                    <TableHead className="w-[35%]">Matching Keywords</TableHead>
                    <TableHead className="w-[20%]">Mapped Account & VAT</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-semibold text-sm">
                        <div className="space-y-1">
                          <div>{rule.description || 'Unnamed Rule'}</div>
                          {((rule as any).categoryLabel || (rule as any).category) && (
                            <Badge variant="secondary" className="text-[10px] font-normal py-0 px-1.5">
                              {(rule as any).categoryLabel || (rule as any).category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(rule.keywords || []).map((kw, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-mono text-[11px]"
                            >
                              <Tag className="mr-1 h-3 w-3" />
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        <div>{getAccountLabel(rule.accountId)}</div>
                        <span className="text-[10px] text-muted-foreground">
                          VAT: {getVatLabel(rule.vatType || 'no_vat')}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenForm(rule)}>
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRuleToDelete(rule)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredRules.length} total rules)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Rule Dialog */}
      <Dialog open={isRuleFormOpen} onOpenChange={setIsRuleFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedRule ? 'Edit Global Rule' : 'Create Global Rule'}</DialogTitle>
            <DialogDescription>
              Define matching keywords, semantic category, and target account allocation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRule} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rule-desc" className="text-xs font-bold uppercase">
                Rule Description
              </Label>
              <Input
                id="rule-desc"
                placeholder="e.g. Vodacom Monthly Subscription"
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-keywords" className="text-xs font-bold uppercase">
                Keywords (Comma-Separated)
              </Label>
              <Input
                id="rule-keywords"
                placeholder="e.g. VODACOM, VODAPAY, VODACOM RECURRING"
                value={ruleKeywords}
                onChange={(e) => setRuleKeywords(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Guide-matching ensures variations (e.g. &quot;HAND TOOLS&quot; matches &quot;HAND TOOLS SUPPLY&quot;) are handled smoothly.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-category" className="text-xs font-bold uppercase">
                Semantic Category
              </Label>
              <Select value={ruleCategory} onValueChange={setRuleCategory}>
                <SelectTrigger id="rule-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CATEGORY_OPTIONS.filter((c) => c.key !== 'all').map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Enables automatic semantic mapping to client-specific Charts of Accounts.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-account" className="text-xs font-bold uppercase">
                Default Baseline GL Account
              </Label>
              <Select value={ruleAccountId} onValueChange={setRuleAccountId}>
                <SelectTrigger id="rule-account" className="w-full">
                  <SelectValue placeholder="Select general ledger account..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {defaultChartOfAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.accountNumber ? `${acc.accountNumber} - ` : ''}
                      {acc.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-vat" className="text-xs font-bold uppercase">
                Default VAT Treatment (SARS Compliant)
              </Label>
              <Select value={ruleVatType} onValueChange={setRuleVatType}>
                <SelectTrigger id="rule-vat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allVatTypes.map((vt) => (
                    <SelectItem key={vt.name} value={vt.name}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRuleFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="font-bold">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {selectedRule ? 'Update Rule' : 'Save Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Alert Dialog */}
      <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Global Allocation Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the rule <strong>&quot;{ruleToDelete?.description}&quot;</strong>? This will stop matching transactions against these keywords across all clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
