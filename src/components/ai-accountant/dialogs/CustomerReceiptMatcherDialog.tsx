'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, ImportedTransaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import {
  findCustomerReceiptMatchesAction,
  allocateIncomeToCustomerReceiptAction,
  batchAllocateCustomerReceiptsAction,
  TransactionReceiptMatchResult,
  CustomerReceiptCandidate,
} from '@/app/actions/ai-recon';
import { Loader2, CheckCircle2, Search, ArrowRight, Sparkles, Receipt, FileText, CheckCheck, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerReceiptMatcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: User | null;
  bankAccountId: string;
  singleTransaction?: ImportedTransaction | null;
  onAllocationSuccess?: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export function CustomerReceiptMatcherDialog({
  open,
  onOpenChange,
  client,
  bankAccountId,
  singleTransaction,
  onAllocationSuccess,
}: CustomerReceiptMatcherDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAllocating, setIsAllocating] = useState<string | null>(null);
  const [isBatchAllocating, setIsBatchAllocating] = useState(false);
  const [matches, setMatches] = useState<TransactionReceiptMatchResult[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCandidateOverrides, setSelectedCandidateOverrides] = useState<Record<string, CustomerReceiptCandidate>>({});

  const loadMatches = async () => {
    if (!client?.uid) return;
    setIsLoading(true);
    try {
      const token = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await findCustomerReceiptMatchesAction({
        clientId: client.uid,
        bankAccountId: singleTransaction ? undefined : bankAccountId,
        transactionId: singleTransaction ? singleTransaction.id : undefined,
        idToken: token,
      });

      if (res.success) {
        setMatches(res.matches);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to search matches', variant: 'destructive' });
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to search matches', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadMatches();
      setSelectedCandidateOverrides({});
    }
  }, [open, client?.uid, bankAccountId, singleTransaction]);

  const handleAllocate = async (txId: string, candidate: CustomerReceiptCandidate) => {
    if (!client?.uid) return;
    setIsAllocating(txId);
    try {
      const token = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await allocateIncomeToCustomerReceiptAction({
        clientId: client.uid,
        transactionId: txId,
        matchType: candidate.matchType,
        matchId: candidate.candidateId,
        idToken: token,
      });

      if (res.success) {
        toast({
          title: 'Transaction Allocated',
          description: `Allocated to Customer Receipts Control Account (8000-005) for ${candidate.customerName}.`,
        });
        // Remove from local list
        setMatches((prev) => prev.filter((m) => m.transactionId !== txId));
        onAllocationSuccess?.();
      } else {
        toast({ title: 'Allocation Failed', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsAllocating(null);
    }
  };

  const handleBatchAllocateHighConfidence = async () => {
    if (!client?.uid) return;
    const highConfidenceMatches = filteredMatches.filter((m) => {
      const c = selectedCandidateOverrides[m.transactionId] || m.topMatch;
      return c && c.confidence >= 80;
    });

    if (highConfidenceMatches.length === 0) {
      toast({ title: 'No high-confidence matches', description: 'No matches found with >= 80% confidence.' });
      return;
    }

    setIsBatchAllocating(true);
    try {
      const token = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const payload = highConfidenceMatches.map((m) => {
        const c = (selectedCandidateOverrides[m.transactionId] || m.topMatch)!;
        return {
          transactionId: m.transactionId,
          matchType: c.matchType,
          matchId: c.candidateId,
        };
      });

      const res = await batchAllocateCustomerReceiptsAction({
        clientId: client.uid,
        matches: payload,
        idToken: token,
      });

      if (res.success) {
        toast({
          title: 'Batch Allocation Complete',
          description: `Successfully allocated ${res.count} transactions to Customer Receipts Control Account.`,
        });
        const allocatedIds = new Set(payload.map((p) => p.transactionId));
        setMatches((prev) => prev.filter((m) => !allocatedIds.has(m.transactionId)));
        onAllocationSuccess?.();
      } else {
        toast({ title: 'Batch Allocation Failed', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsBatchAllocating(false);
    }
  };

  const filteredMatches = useMemo(() => {
    if (!searchFilter.trim()) return matches;
    const q = searchFilter.toUpperCase();
    return matches.filter((m) => {
      const activeCand = selectedCandidateOverrides[m.transactionId] || m.topMatch;
      return (
        m.description.toUpperCase().includes(q) ||
        m.reference.toUpperCase().includes(q) ||
        (activeCand && activeCand.customerName.toUpperCase().includes(q)) ||
        (activeCand && activeCand.reference.toUpperCase().includes(q))
      );
    });
  }, [matches, searchFilter, selectedCandidateOverrides]);

  const highConfidenceCount = useMemo(() => {
    return filteredMatches.filter((m) => {
      const c = selectedCandidateOverrides[m.transactionId] || m.topMatch;
      return c && c.confidence >= 80;
    }).length;
  }, [filteredMatches, selectedCandidateOverrides]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-600" />
              <div>
                <DialogTitle className="text-xl">Match Customer Receipts</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Scan Customer Receipts Control Account (8000-005) & open customer invoices to allocate income deposits.
                </DialogDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadMatches} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, invoice #, reference..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {matches.length > 1 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleBatchAllocateHighConfidence}
                disabled={isBatchAllocating || highConfidenceCount === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {isBatchAllocating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  <>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Approve {highConfidenceCount} High-Confidence Matches
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm">Scanning customer receipts & open invoices...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No unallocated income matches found</p>
              <p className="text-xs max-w-md mx-auto">
                All income transactions are either allocated, or there are no pending customer receipts in 8000-005 or open invoices matching your search.
              </p>
            </div>
          ) : (
            filteredMatches.map((matchItem) => {
              const activeCandidate =
                selectedCandidateOverrides[matchItem.transactionId] || matchItem.topMatch;

              return (
                <Card key={matchItem.transactionId} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Left: Bank Income Transaction */}
                      <div className="md:col-span-5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">
                            {format(new Date(matchItem.date), 'dd/MM/yyyy')}
                          </span>
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {matchItem.reference || 'No Ref'}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-slate-900 leading-snug">
                          {matchItem.description}
                        </p>
                        <p className="font-mono font-bold text-base text-emerald-700">
                          +{formatPrice(matchItem.amount)}
                        </p>
                      </div>

                      {/* Middle: Arrow indicator */}
                      <div className="md:col-span-1 flex justify-center text-slate-400">
                        <ArrowRight className="h-5 w-5 hidden md:block" />
                      </div>

                      {/* Right: Matched Candidate or Unmatched */}
                      <div className="md:col-span-6">
                        {activeCandidate ? (
                          <div className="p-3 rounded-lg border bg-emerald-50/40 border-emerald-200/80 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={
                                    activeCandidate.matchType === 'receipt'
                                      ? 'border-emerald-500 text-emerald-800 bg-emerald-100/60 font-semibold'
                                      : 'border-blue-500 text-blue-800 bg-blue-100/60 font-semibold'
                                  }
                                >
                                  {activeCandidate.matchType === 'receipt' ? (
                                    <>
                                      <Receipt className="h-3 w-3 mr-1" />
                                      Pre-Marked Receipt
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3 mr-1" />
                                      Open Invoice
                                    </>
                                  )}
                                </Badge>
                                <span className="font-semibold text-sm text-slate-900">
                                  {activeCandidate.customerName}
                                </span>
                              </div>

                              <Badge
                                className={
                                  activeCandidate.confidence >= 85
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : activeCandidate.confidence >= 65
                                    ? 'bg-amber-500 text-white font-bold'
                                    : 'bg-slate-400 text-white'
                                }
                              >
                                {activeCandidate.confidence}% Confidence
                              </Badge>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-600">
                              <span>Ref: <strong className="font-mono">{activeCandidate.reference}</strong></span>
                              <span>Target Amount: <strong className="font-mono">{formatPrice(activeCandidate.amount)}</strong></span>
                            </div>

                            <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                              {activeCandidate.matchReasons.map((reason, idx) => (
                                <span key={idx} className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>

                            {/* Candidate Picker if multiple candidates exist */}
                            {matchItem.candidates.length > 1 && (
                              <div className="pt-1 flex items-center gap-2">
                                <span className="text-[11px] text-slate-500 font-medium">Other options:</span>
                                <div className="flex flex-wrap gap-1">
                                  {matchItem.candidates.map((c, cIdx) => (
                                    <button
                                      key={cIdx}
                                      type="button"
                                      onClick={() =>
                                        setSelectedCandidateOverrides((prev) => ({
                                          ...prev,
                                          [matchItem.transactionId]: c,
                                        }))
                                      }
                                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                        activeCandidate.candidateId === c.candidateId
                                          ? 'bg-slate-800 text-white font-bold'
                                          : 'bg-white hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {c.customerName.slice(0, 15)} ({formatPrice(c.amount)})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Allocate Button */}
                            <div className="pt-2 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleAllocate(matchItem.transactionId, activeCandidate)}
                                disabled={isAllocating === matchItem.transactionId}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8"
                              >
                                {isAllocating === matchItem.transactionId ? (
                                  <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Allocating...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                    Allocate & Clear
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                            No automatic receipt or invoice match found.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-slate-50 flex items-center justify-between sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Allocations automatically post to Customer Receipts Control Account (8000-005) with 0% VAT.
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
