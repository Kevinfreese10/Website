'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, FileText, Upload, AlertTriangle, CheckCircle2, Info, FileSpreadsheet, RotateCcw, Trash2, X, Download, Banknote, CornerDownRight } from 'lucide-react';
import { extractStatementPeriod, ExtractStatementPeriodOutput } from '@/ai/flows/extract-statement-period';
import { extractStatementMetadata, ExtractStatementMetadataOutput } from '@/ai/flows/extract-statement-metadata';
import { getFirestore, collection, getDocs, doc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User, ChartOfAccount, ImportedTransaction, AllocationRule } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractStatementChunk } from '@/app/actions';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx-js-style';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const db = getFirestore(firebaseApp);

const formSchema = z.object({
  bankAccountId: z.string().min(1, 'Please select a bank account.'),
  statements: z.custom<FileList>().refine((files) => files && files.length > 0, 'At least one file is required.'),
});

type Transaction = {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  isFee?: boolean;
  parentDescription?: string;
  sourceStmtId?: string;
};

type StatementFile = {
  id: string;
  name: string;
  file: File;
  status: 'pending' | 'analyzing' | 'valid' | 'warning' | 'error';
  error?: string;
  bankName?: string;
  accountNumber?: string;
  holderName?: string;
  startDate?: string;
  endDate?: string;
  openingBalance?: number;
  closingBalance?: number;
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
};

const normalizeBankName = (name?: string) => {
  if (!name) return '';
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (n.includes('firstnational') || n === 'fnb' || n.includes('firstrand')) return 'fnb';
  if (n.includes('standardbank') || n === 'sbsa') return 'standard bank';
  if (n.includes('absa')) return 'absa';
  if (n.includes('nedbank')) return 'nedbank';
  if (n.includes('capitec')) return 'capitec';
  if (n.includes('investec')) return 'investec';
  if (n.includes('discovery')) return 'discovery bank';
  if (n.includes('tyme')) return 'tymebank';
  return n;
};

const matchAccountNumber = (acc1?: string, acc2?: string) => {
  if (!acc1 || !acc2) return false;
  const clean1 = acc1.replace(/[^0-9]/g, '');
  const clean2 = acc2.replace(/[^0-9]/g, '');
  if (!clean1 || !clean2) return false;
  return clean1.endsWith(clean2) || clean2.endsWith(clean1);
};

export default function AIStatementImportDialog({ 
    open, 
    onOpenChange, 
    client, 
    bankAccountId: initialBankAccountId,
    onImportComplete
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    client: User; 
    bankAccountId?: string;
    onImportComplete: () => void;
}) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [extractedTransactions, setExtractedTransactions] = useState<Transaction[]>([]);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Pre-Analysis / Multi-file Validation states
  const [statementFiles, setStatementFiles] = useState<StatementFile[]>([]);
  const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);
  const [preAnalysisCompleted, setPreAnalysisCompleted] = useState(false);
  const [gaps, setGaps] = useState<{ start: string; end: string }[]>([]);
  const [overlaps, setOverlaps] = useState<{ start: string; end: string }[]>([]);
  const [mismatchedAccountsCount, setMismatchedAccountsCount] = useState(0);
  const [overrideAccountMismatch, setOverrideAccountMismatch] = useState(false);
  const [linkAccountMetadata, setLinkAccountMetadata] = useState(false);
  const [linkableMetadata, setLinkableMetadata] = useState<{ bankName: string; accountNumber: string } | null>(null);

  // Manual edited balances
  const [editedOpeningBalance, setEditedOpeningBalance] = useState<number | null>(null);
  const [editedClosingBalance, setEditedClosingBalance] = useState<number | null>(null);

  // Filtering states
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());

  const [existingTransactions, setExistingTransactions] = useState<ImportedTransaction[]>([]);
  const [currentAccountData, setCurrentAccountData] = useState<{ balance: number }>({ balance: 0 });
  const [createOpeningBalance, setCreateOpeningBalance] = useState(false);
  
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { bankAccountId: initialBankAccountId || '' },
  });

  const watchBankAccountId = form.watch('bankAccountId');

  useEffect(() => {
      if (open && initialBankAccountId) {
          form.setValue('bankAccountId', initialBankAccountId);
      }
  }, [open, initialBankAccountId, form]);

  useEffect(() => {
    const fetchAccountStats = async () => {
        if (!client.id || !watchBankAccountId) return;
        
        const transRef = collection(db, 'aiAccountantClients', client.id, 'transactions');
        const q = query(transRef, where('bankAccountId', '==', watchBankAccountId));
        const snap = await getDocs(q);
        const txs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ImportedTransaction));
        setExistingTransactions(txs);

        const balance = txs.reduce((s, t) => s + t.amount, 0);
        setCurrentAccountData({ balance });
    };
    if (open) fetchAccountStats();
  }, [client.id, watchBankAccountId, open]);

  // Reset file/pre-analysis state when bankAccountId changes
  useEffect(() => {
    setStatementFiles([]);
    setPreAnalysisCompleted(false);
    setGaps([]);
    setOverlaps([]);
    setMismatchedAccountsCount(0);
    setOverrideAccountMismatch(false);
    setLinkableMetadata(null);
    setEditedOpeningBalance(null);
    setEditedClosingBalance(null);
    setExtractedTransactions([]);
    form.setValue('statements', undefined as any);
  }, [watchBankAccountId, form]);

  const isDuplicateAt = useCallback((tx: Transaction, indexInList: number, list: Transaction[]) => {
    const key = `${tx.date}_${tx.description.toLowerCase().trim()}_${tx.amount.toFixed(2)}`;
    const dbCount = existingTransactions.filter(e => {
        const eDate = format(new Date(e.date), 'yyyy-MM-dd');
        return eDate === tx.date &&
               e.description.toLowerCase().trim() === tx.description.toLowerCase().trim() &&
               Math.abs(e.amount - tx.amount) < 0.01;
    }).length;

    let currentOccurrence = 0;
    for (let i = 0; i <= indexInList; i++) {
        const item = list[i];
        const itemKey = `${item.date}_${item.description.toLowerCase().trim()}_${item.amount.toFixed(2)}`;
        if (itemKey === key) {
            currentOccurrence++;
        }
    }
    return currentOccurrence <= dbCount;
  }, [existingTransactions]);

  const filteredTransactions = useMemo(() => {
    return extractedTransactions.filter((tx, index) => {
        if (excludedIndices.has(index)) return false;
        if (filterStartDate && tx.date < filterStartDate) return false;
        if (filterEndDate && tx.date > filterEndDate) return false;
        return true;
    });
  }, [extractedTransactions, excludedIndices, filterStartDate, filterEndDate]);

  const duplicatesInCurrentList = useMemo(() => {
      return filteredTransactions.filter((tx, idx) => isDuplicateAt(tx, idx, filteredTransactions));
  }, [filteredTransactions, isDuplicateAt]);

  const combinedStatementMeta = useMemo(() => {
    if (statementFiles.length === 0 || !preAnalysisCompleted) return null;
    const sorted = [...statementFiles]
      .filter(s => s.status === 'valid' || s.status === 'warning' || (s.status === 'error' && overrideAccountMismatch))
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    if (sorted.length === 0) return null;
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    return {
      startDate: first.startDate || '',
      endDate: last.endDate || '',
      openingBalance: first.openingBalance || 0,
      closingBalance: last.closingBalance || 0,
    };
  }, [statementFiles, preAnalysisCompleted, overrideAccountMismatch]);

  useEffect(() => {
    if (combinedStatementMeta) {
      setEditedOpeningBalance(combinedStatementMeta.openingBalance);
      setEditedClosingBalance(combinedStatementMeta.closingBalance);
    } else {
      setEditedOpeningBalance(null);
      setEditedClosingBalance(null);
    }
  }, [combinedStatementMeta, setEditedOpeningBalance, setEditedClosingBalance]);

  const calculatedRecon = useMemo(() => {
    if (!combinedStatementMeta || editedOpeningBalance === null || editedClosingBalance === null) return null;
    const importTotal = filteredTransactions.reduce((s, t) => s + t.amount, 0);
    // Use the statement's opening balance to validate the extraction itself, not the current DB balance
    const startingBalance = editedOpeningBalance;
    const projectedBalance = startingBalance + importTotal;
    const diff = Math.abs(projectedBalance - editedClosingBalance);
    const isMatched = diff < 0.01;

    return { importTotal, projectedBalance, diff, isMatched };
  }, [combinedStatementMeta, editedOpeningBalance, editedClosingBalance, filteredTransactions]);

  const runningBalances = useMemo(() => {
      let currentBal = editedOpeningBalance || 0;
      return extractedTransactions.map((tx, idx) => {
          const isExcluded = excludedIndices.has(idx);
          const isOutOfDateRange = (filterStartDate && tx.date < filterStartDate) || (filterEndDate && tx.date > filterEndDate);
          
          if (!isExcluded && !isOutOfDateRange) {
              currentBal += tx.amount;
          }
          return currentBal;
      });
  }, [extractedTransactions, excludedIndices, filterStartDate, filterEndDate, editedOpeningBalance]);

  const handlePreAnalyze = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsPreAnalyzing(true);
    setPreAnalysisCompleted(false);
    setGaps([]);
    setOverlaps([]);
    setMismatchedAccountsCount(0);
    setLinkableMetadata(null);
    setEditedOpeningBalance(null);
    setEditedClosingBalance(null);
    setExtractedTransactions([]);

    const selectedAccount = client.chartOfAccounts?.find(acc => acc.id === watchBankAccountId) as (ChartOfAccount & { bankName?: string; bankAccountNumber?: string }) | undefined;
    const targetBankName = selectedAccount?.bankName;
    const targetAccountNumber = selectedAccount?.bankAccountNumber;

    const initialFiles: StatementFile[] = Array.from(files).map((f, index) => ({
      id: `${f.name}-${index}-${Date.now()}`,
      name: f.name,
      file: f,
      status: 'pending'
    }));

    setStatementFiles(initialFiles);

    const analyzedFiles: StatementFile[] = [];

    for (const stmt of initialFiles) {
      setStatementFiles(prev => prev.map(s => s.id === stmt.id ? { ...s, status: 'analyzing' } : s));
      
      try {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(stmt.file);
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = (e) => reject(e);
        });

        // Load PDF and extract first page
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        
        if (pdfDoc.getPageCount() === 0) {
          throw new Error('PDF has no pages');
        }

        const firstPageDoc = await PDFDocument.create();
        const pages = await firstPageDoc.copyPages(pdfDoc, [0]);
        firstPageDoc.addPage(pages[0]);
        const firstPageBase64 = `data:application/pdf;base64,${await firstPageDoc.saveAsBase64()}`;

        const metadata = await extractStatementMetadata({ statementPdf: firstPageBase64 });

        let status: StatementFile['status'] = 'valid';
        let errorMsg = '';

        // Validation 1: Compare with selected cashbook account details if linked
        if (targetBankName || targetAccountNumber) {
          let matched = true;
          if (targetAccountNumber && metadata.accountNumber && metadata.accountNumber !== 'Unknown') {
            if (!matchAccountNumber(targetAccountNumber, metadata.accountNumber)) {
              matched = false;
              errorMsg = `Mismatched account number: expected ${targetAccountNumber}, got ${metadata.accountNumber}`;
            }
          }
          if (targetBankName && metadata.bankName && metadata.bankName !== 'Unknown') {
            if (normalizeBankName(targetBankName) !== normalizeBankName(metadata.bankName)) {
              matched = false;
              errorMsg = errorMsg ? `${errorMsg} & Mismatched bank: expected ${targetBankName}, got ${metadata.bankName}` : `Mismatched bank: expected ${targetBankName}, got ${metadata.bankName}`;
            }
          }

          if (!matched) {
            status = 'error';
          }
        } else {
          // No linked details: compare with account description for warning
          const accDesc = selectedAccount?.description || '';
          if (metadata.bankName && metadata.bankName !== 'Unknown') {
            const normalizedMetaBank = normalizeBankName(metadata.bankName);
            const normalizedDesc = normalizeBankName(accDesc);
            if (normalizedMetaBank && !normalizedDesc.includes(normalizedMetaBank)) {
              status = 'warning';
              errorMsg = `Bank mismatch warning: Selected account is "${accDesc}" but statement is for ${metadata.bankName}`;
            }
          }
        }

        const analyzed: StatementFile = {
          ...stmt,
          status,
          error: errorMsg || undefined,
          bankName: metadata.bankName || 'Unknown',
          accountNumber: metadata.accountNumber || 'Unknown',
          holderName: metadata.holderName || 'Unknown',
          startDate: metadata.startDate || '',
          endDate: metadata.endDate || '',
          openingBalance: metadata.openingBalance ?? 0,
          closingBalance: metadata.closingBalance ?? 0
        };

        analyzedFiles.push(analyzed);
        setStatementFiles(prev => prev.map(s => s.id === stmt.id ? analyzed : s));
      } catch (err: any) {
        console.error("Error pre-analyzing file:", stmt.name, err);
        const failed: StatementFile = {
          ...stmt,
          status: 'error',
          error: err.message || 'Failed to extract metadata'
        };
        analyzedFiles.push(failed);
        setStatementFiles(prev => prev.map(s => s.id === stmt.id ? failed : s));
      }
    }

    setIsPreAnalyzing(false);

    // Filter out failed pre-analyses for structural checks
    const successful = analyzedFiles.filter(s => s.status !== 'error' || s.error?.includes('Mismatched'));
    
    // Check if multiple account numbers are present among uploaded files
    const uniqueAccounts = Array.from(new Set(successful.map(s => s.accountNumber).filter(acc => acc && acc !== 'Unknown')));
    if (uniqueAccounts.length > 1) {
      const primaryAcc = uniqueAccounts[0];
      const updatedFiles = analyzedFiles.map(s => {
        if (s.accountNumber && s.accountNumber !== 'Unknown' && s.accountNumber !== primaryAcc) {
          return {
            ...s,
            status: 'error' as const,
            error: `Inconsistent account number. Belongs to account ${s.accountNumber} instead of ${primaryAcc}.`
          };
        }
        return s;
      });
      setStatementFiles(updatedFiles);
      toast({ title: 'Multiple Accounts Detected', description: 'Some statements belong to different bank accounts.', variant: 'destructive' });
    }

    // Gap & Overlap detection
    const sorted = [...successful].filter(s => s.startDate).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
    const detectedGaps: { start: string; end: string }[] = [];
    const detectedOverlaps: { start: string; end: string }[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i+1];
      if (current.endDate && next.startDate) {
        const curEnd = new Date(current.endDate);
        const nextStart = new Date(next.startDate);
        const diffTime = nextStart.getTime() - curEnd.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 4) {
          detectedGaps.push({ start: current.endDate, end: next.startDate });
        } else if (diffDays < 0) {
          detectedOverlaps.push({ start: next.startDate, end: current.endDate });
        }
      }
    }

    setGaps(detectedGaps);
    setOverlaps(detectedOverlaps);

    // Count mismatched accounts to enforce override check
    const mismatches = analyzedFiles.filter(s => s.status === 'error' && s.error?.includes('Mismatched')).length;
    setMismatchedAccountsCount(mismatches);

    // Set linkable metadata if target doesn't have details linked yet
    if (!targetBankName && !targetAccountNumber) {
      const validStmt = successful.find(s => s.bankName && s.bankName !== 'Unknown' && s.accountNumber && s.accountNumber !== 'Unknown');
      if (validStmt) {
        setLinkableMetadata({
          bankName: validStmt.bankName!,
          accountNumber: validStmt.accountNumber!
        });
        setLinkAccountMetadata(true);
      }
    }

    setPreAnalysisCompleted(true);
  };

  const handleExtract = async () => {
    const statementsToProcess = statementFiles.filter(
      s => s.status === 'valid' || s.status === 'warning' || (s.status === 'error' && overrideAccountMismatch)
    );

    if (statementsToProcess.length === 0) {
      toast({ title: 'No Statements to Process', description: 'Please select or resolve statement issues first.', variant: 'destructive' });
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(0);
    setStatusMessage('Initializing extraction...');
    setExtractedTransactions([]);
    setExcludedIndices(new Set());

    let allTransactions: Transaction[] = [];
    let totalProcessedPages = 0;
    
    const pageCounts: { [id: string]: number } = {};
    let totalPages = 0;

    try {
      setStatusMessage('Reading PDF files...');
      for (const stmt of statementsToProcess) {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(stmt.file);
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = (e) => reject(e);
        });

        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const count = pdfDoc.getPageCount();
        pageCounts[stmt.id] = count;
        totalPages += count;
      }

      setStatusMessage(`Found ${totalPages} pages in total. Starting extraction...`);

      for (let sIdx = 0; sIdx < statementsToProcess.length; sIdx++) {
        const stmt = statementsToProcess[sIdx];
        setStatusMessage(`Processing "${stmt.name}" (${sIdx + 1} of ${statementsToProcess.length})...`);

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(stmt.file);
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = (e) => reject(e);
        });

        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pageCounts[stmt.id];
        const chunkSize = 5;

        for (let i = 0; i < pageCount; i += chunkSize) {
          const start = i;
          const end = Math.min(i + chunkSize, pageCount);
          
          const overallProgress = Math.round((totalProcessedPages / totalPages) * 100);
          setExtractionProgress(overallProgress);
          setStatusMessage(`Extracting "${stmt.name}": pages ${start + 1} to ${end}...`);

          const chunkDoc = await PDFDocument.create();
          const pagesToCopy = Array.from({ length: end - start }, (_, idx) => start + idx);
          const copiedPages = await chunkDoc.copyPages(pdfDoc, pagesToCopy);
          copiedPages.forEach(p => chunkDoc.addPage(p));
          
          const chunkBase64 = `data:application/pdf;base64,${await chunkDoc.saveAsBase64()}`;
          const result = await extractStatementChunk({ chunkBase64 });

          if (result.success && result.transactions) {
            const txsWithSource = result.transactions.map((tx: Transaction) => ({ ...tx, sourceStmtId: stmt.id }));
            allTransactions = [...allTransactions, ...txsWithSource];
            setExtractedTransactions([...allTransactions]);
          } else {
            throw new Error(result.error || `Failed to extract transactions from pages ${start + 1} to ${end} of ${stmt.name}`);
          }

          totalProcessedPages += (end - start);
        }
      }

      // Post-processing to detect and group fees
      const processedList: Transaction[] = [];
      const feeItems: Transaction[] = [];
      const mainItems: Transaction[] = [];

      allTransactions.sort((a, b) => a.date.localeCompare(b.date));

      // Smart deduplication across statements that preserves legitimate same-day duplicates
      const uniqueTransactions: Transaction[] = [];
      const txGroups = new Map<string, Transaction[]>();

      allTransactions.forEach(tx => {
        const key = `${tx.date}_${tx.description.toLowerCase().trim()}_${tx.amount.toFixed(2)}`;
        if (!txGroups.has(key)) txGroups.set(key, []);
        txGroups.get(key)!.push(tx);
      });

      txGroups.forEach((groupTxs) => {
        const countsPerStmt = new Map<string, number>();
        groupTxs.forEach(tx => {
           if (tx.sourceStmtId) {
               countsPerStmt.set(tx.sourceStmtId, (countsPerStmt.get(tx.sourceStmtId) || 0) + 1);
           }
        });
        
        let maxCount = groupTxs.length;
        if (countsPerStmt.size > 0) {
            maxCount = Math.max(...Array.from(countsPerStmt.values()));
        }

        for (let i = 0; i < maxCount; i++) {
            uniqueTransactions.push(groupTxs[i]);
        }
      });

      uniqueTransactions.forEach(tx => {
        const descUpper = tx.description.toUpperCase();
        if (descUpper.includes('(BANK FEE)') || descUpper.startsWith('BANK FEE:')) {
          tx.isFee = true;
          feeItems.push(tx);
        } else {
          mainItems.push(tx);
        }
      });

      mainItems.forEach(mainTx => {
        processedList.push(mainTx);
        
        const cleanMainDesc = mainTx.description.toUpperCase()
          .replace(/^(?:CARD PURCHASE|EFT PAYMENT|EFT CREDIT|ELECTRONIC PAYMENT|ONLINE PAYMENT|DEBIT ORDER|NAEDO|CHEQUE CARD PURCHASE|POS PURCHASE|BANKING APP CASH SENT:|BANKING APP IMMEDIATE PAYMENT:|BANKING APP BILL PAYMENT)\s+/i, '')
          .trim();
        
        if (cleanMainDesc.length > 2) {
          const matchingFees = feeItems.filter(fee => {
            if (fee.date !== mainTx.date) return false;
            const cleanFeeDesc = fee.description.toUpperCase()
              .replace('(BANK FEE)', '')
              .replace('BANK FEE:', '')
              .trim();
            return cleanFeeDesc.includes(cleanMainDesc) || cleanMainDesc.includes(cleanFeeDesc);
          });

          matchingFees.forEach(fee => {
            fee.parentDescription = mainTx.description;
            processedList.push(fee);
            const idx = feeItems.indexOf(fee);
            if (idx > -1) feeItems.splice(idx, 1);
          });
        }
      });

      feeItems.forEach(fee => {
        processedList.push(fee);
      });

      setExtractedTransactions(processedList);
      setExtractionProgress(100);
      setStatusMessage('Complete!');
      toast({ title: 'AI Extraction Complete', description: `Extracted transactions from ${statementsToProcess.length} statements.` });

      if (processedList.length > 0) {
        setFilterStartDate(processedList[0].date);
        setFilterEndDate(processedList[processedList.length - 1].date);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({ title: 'AI Error', description: 'Failed to extract data from statement.', variant: 'destructive' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveDuplicates = () => {
      const newExcluded = new Set(excludedIndices);
      extractedTransactions.forEach((tx, idx) => {
          if (isDuplicateAt(tx, idx, extractedTransactions)) newExcluded.add(idx);
      });
      setExcludedIndices(newExcluded);
      toast({ title: "Duplicates Excluded" });
  };

  const handleUpdateTransaction = (index: number, field: keyof Transaction, value: any) => {
      const updated = [...extractedTransactions];
      updated[index] = { ...updated[index], [field]: value };
      setExtractedTransactions(updated);
  };

  const handleDownloadExcel = () => {
      if (filteredTransactions.length === 0) return;
      const ws = XLSX.utils.book_new();
      const wsData = filteredTransactions.map(tx => ({
          Date: tx.date,
          Description: tx.description,
          Amount: tx.amount
      }));
      const worksheet = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(ws, worksheet, "Extracted Transactions");
      XLSX.writeFile(ws, `Extracted_Statement_${client.name}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleImport = async () => {
    if (!client.id || !watchBankAccountId || filteredTransactions.length === 0) return;
    setIsImporting(true);
    
    try {
        let allRules = [...(client.allocationRules || [])];
        
        if (!client.disableGlobalRules) {
            const rulesRef = collection(db, "allocationRules");
            const rulesSnap = await getDocs(rulesRef);
            const globalRules = rulesSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule));
            allRules = [...allRules, ...globalRules];
        }
        
        allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        const batch = writeBatch(db);

        // Update Client's ChartOfAccount metadata in Firestore if requested
        if (linkAccountMetadata && linkableMetadata) {
            const clientRef = doc(db, 'aiAccountantClients', client.id);
            const updatedChart = client.chartOfAccounts?.map(acc => {
                if (acc.id === watchBankAccountId) {
                    return {
                        ...acc,
                        bankName: linkableMetadata.bankName,
                        bankAccountNumber: linkableMetadata.accountNumber
                    };
                }
                return acc;
            }) || [];
            
            batch.update(clientRef, { chartOfAccounts: updatedChart });
        }

        if (createOpeningBalance && combinedStatementMeta && editedOpeningBalance !== null) {
            const openBalRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            const openBalDate = filterStartDate || combinedStatementMeta.startDate;
            
            batch.set(openBalRef, {
                clientId: client.id,
                date: new Date(openBalDate).toISOString(),
                reference: `OPEN-BAL-${Date.now()}`,
                description: editedOpeningBalance < 0 ? "OPENING BALANCE (OVERDRAFT)" : "OPENING BALANCE",
                amount: editedOpeningBalance,
                isExpense: editedOpeningBalance < 0,
                bankAccountId: watchBankAccountId,
                status: 'allocated',
                allocatedTo: { value: '9500-002', type: 'account' },
                vatType: 'no_vat',
                allocatedAt: serverTimestamp(),
                allocationSource: 'manual'
            });
        }

        filteredTransactions.forEach(tx => {
            const isExpense = tx.amount < 0;
            const match = isExpense ? allRules.find(r => r.keywords.some(kw => tx.description.toUpperCase().includes(kw.toUpperCase()))) : null;
            
            const txData: any = {
                clientId: client.id,
                date: new Date(tx.date).toISOString(),
                reference: `AI-PDF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                description: tx.description.toUpperCase(),
                amount: tx.amount,
                isExpense: isExpense,
                bankAccountId: watchBankAccountId,
                status: (isExpense && match) ? 'reviewed' : 'new'
            };

            if (isExpense && match) {
                const keyword = match.keywords.find(kw => tx.description.toUpperCase().includes(kw.toUpperCase()));
                txData.allocatedTo = { value: match.accountId, type: 'account' };
                txData.vatType = client.isVatRegistered ? match.vatType : 'no_vat';
                txData.allocatedAt = serverTimestamp();
                txData.allocationSource = 'rule';
                txData.matchedRuleId = match.id;
                txData.matchedKeyword = keyword;
            } else if (tx.isFee) {
                const bankChargesAcc = client.chartOfAccounts?.find(acc => acc.accountNumber === '3000-004' || acc.description.toLowerCase() === 'bank charges');
                if (bankChargesAcc) {
                    txData.allocatedTo = { value: bankChargesAcc.id, type: 'account' };
                    txData.vatType = client.isVatRegistered ? 'standard_rated_purchases' : 'no_vat';
                    txData.status = 'reviewed';
                    txData.allocatedAt = serverTimestamp();
                    txData.allocationSource = 'auto_fee';
                }
                txData.isBankFee = true;
                if (tx.parentDescription) {
                    txData.parentTxDescription = tx.parentDescription.toUpperCase();
                }
            }

            const newRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
            batch.set(newRef, txData);
        });

        await batch.commit();
        toast({ title: 'Import Successful' });
        onImportComplete();
        onOpenChange(false);
    } catch (e) {
        console.error("Import error:", e);
        toast({ title: 'Import Failed', variant: 'destructive' });
    } finally {
        setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Bank Statement Importer
          </DialogTitle>
          <DialogDescription>
            Extract and reconcile transactions for <strong>{client.companyName || client.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          <aside className="lg:col-span-4 p-6 border-r space-y-6 overflow-y-auto flex flex-col">
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); handleExtract(); }} className="space-y-4 flex-shrink-0">
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Cashbook Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {client.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('8400-')).map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchBankAccountId && (
                    <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium">Existing Book Balance:</span>
                        </div>
                        <span className="text-xs font-bold font-mono">{formatPrice(currentAccountData.balance)}</span>
                    </div>
                )}

                <FormField
                  control={form.control}
                  name="statements"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Upload PDF Statements</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="application/pdf"
                          multiple
                          onChange={(e) => {
                            onChange(e.target.files);
                            if (e.target.files && e.target.files.length > 0) {
                              handlePreAnalyze(e.target.files);
                            }
                          }}
                          disabled={isExtracting || isPreAnalyzing || !watchBankAccountId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pre-Analysis Loading Spinner */}
                {isPreAnalyzing && (
                  <div className="flex items-center justify-center p-4 bg-muted/30 rounded-xl space-x-2 animate-in fade-in">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs font-medium">Pre-analyzing uploaded files...</span>
                  </div>
                )}

                {/* Pre-Analysis Files List */}
                {preAnalysisCompleted && statementFiles.length > 0 && (
                  <div className="space-y-3 animate-in fade-in">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Uploaded Statements</Label>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {statementFiles.map((stmt) => (
                        <div key={stmt.id} className="p-3 border rounded-lg bg-muted/20 space-y-1.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold truncate max-w-[180px]">{stmt.name}</span>
                            <Badge 
                              variant={
                                stmt.status === 'valid' ? 'default' : 
                                stmt.status === 'warning' ? 'secondary' : 
                                'destructive'
                              }
                              className={cn(
                                "text-[9px] px-1.5 py-0 h-5 font-bold uppercase shrink-0",
                                stmt.status === 'valid' && "bg-green-600 hover:bg-green-600",
                                stmt.status === 'warning' && "bg-yellow-600 hover:bg-yellow-600 text-white"
                              )}
                            >
                              {stmt.status}
                            </Badge>
                          </div>
                          {stmt.status !== 'error' && (
                            <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
                              <div>Bank: {stmt.bankName}</div>
                              <div>Acc No: {stmt.accountNumber}</div>
                              <div>Period: {stmt.startDate} to {stmt.endDate}</div>
                            </div>
                          )}
                          {stmt.error && (
                            <div className="text-[10px] text-destructive bg-destructive/5 p-1.5 rounded border border-destructive/15 mt-1 font-medium">
                              {stmt.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gap, Overlap and Link Metadata Alerts */}
                {preAnalysisCompleted && (
                  <div className="space-y-2.5 animate-in fade-in">
                    {/* Gap Detection Alert */}
                    {gaps.map((gap, i) => (
                      <div key={`gap-${i}`} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-yellow-800">Missing Statement Gap</div>
                          <p className="text-[10px] text-yellow-700 leading-normal">
                            A gap was detected between <strong>{gap.start}</strong> and <strong>{gap.end}</strong>. Please upload the missing statements if possible.
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Overlap Detection Alert */}
                    {overlaps.map((overlap, i) => (
                      <div key={`overlap-${i}`} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <div className="font-bold text-yellow-800">Overlapping Periods</div>
                          <p className="text-[10px] text-yellow-700 leading-normal">
                            Multiple statements cover the period <strong>{overlap.start}</strong> to <strong>{overlap.end}</strong>. AI will automatically deduplicate transactions.
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Account Mismatch Error & Override */}
                    {mismatchedAccountsCount > 0 && (
                      <div className="bg-destructive/5 border border-destructive/20 p-3 rounded-lg space-y-3">
                        <div className="flex items-start gap-2.5 text-xs">
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-bold text-destructive">Account Details Mismatch</div>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                              {mismatchedAccountsCount} statement(s) appear to belong to a different account than the one selected.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-destructive/10 p-2 rounded border border-destructive/15">
                          <Checkbox 
                            id="override-mismatch" 
                            checked={overrideAccountMismatch} 
                            onCheckedChange={(v) => setOverrideAccountMismatch(!!v)} 
                          />
                          <Label htmlFor="override-mismatch" className="text-[10px] font-bold text-destructive leading-tight cursor-pointer">
                            Override mismatch warning and extract anyway
                          </Label>
                        </div>
                      </div>
                    )}

                    {/* Link Metadata Checkbox */}
                    {linkableMetadata && (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex items-start gap-2.5">
                        <Checkbox 
                          id="link-metadata" 
                          checked={linkAccountMetadata} 
                          onCheckedChange={(v) => setLinkAccountMetadata(!!v)} 
                          className="mt-0.5"
                        />
                        <div className="space-y-1 text-xs">
                          <Label htmlFor="link-metadata" className="font-bold text-primary cursor-pointer leading-tight block">
                            Link Bank Details to Cashbook
                          </Label>
                          <p className="text-[9px] text-muted-foreground leading-normal">
                            This will save the bank name (<strong>{linkableMetadata.bankName}</strong>) and account number (<strong>{linkableMetadata.accountNumber}</strong>) to this cashbook account for future validation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 font-bold mt-2" 
                  disabled={
                    isExtracting || 
                    isPreAnalyzing || 
                    !preAnalysisCompleted || 
                    (mismatchedAccountsCount > 0 && !overrideAccountMismatch) || 
                    !watchBankAccountId
                  }
                >
                  {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isExtracting ? 'Extracting Transactions...' : 'Extract Transactions'}
                </Button>
              </form>
            </Form>

            {isExtracting && (
                <div className="space-y-2 animate-in fade-in mt-4 flex-shrink-0">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-primary">
                        <span>{statusMessage}</span>
                        <span>{extractionProgress}%</span>
                    </div>
                    <Progress value={extractionProgress} className="h-1.5" />
                </div>
            )}

            {preAnalysisCompleted && combinedStatementMeta && editedOpeningBalance !== null && editedClosingBalance !== null && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 mt-4 flex-shrink-0">
                    <Separator />
                    <div className="p-4 rounded-xl border bg-primary/5 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Info className="h-3 w-3" /> Header Detection
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase">Opening Bal</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={editedOpeningBalance} 
                                    onChange={(e) => setEditedOpeningBalance(parseFloat(e.target.value) || 0)}
                                    className="h-8 font-mono bg-white text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] uppercase">Closing Bal</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={editedClosingBalance} 
                                    onChange={(e) => setEditedClosingBalance(parseFloat(e.target.value) || 0)}
                                    className="h-8 font-mono bg-white text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </aside>

          <main className="lg:col-span-8 p-6 overflow-y-auto space-y-6">
            {extractedTransactions.length > 0 ? (
              <div className="space-y-6 animate-in fade-in zoom-in-95">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-muted/20 border-dashed">
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs uppercase">Import Filters</CardTitle>
                            <Button variant="ghost" size="sm" onClick={handleDownloadExcel} className="h-7 text-[10px] gap-1">
                                <Download className="h-3 w-3" /> Export Excel
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase">Start Date</Label>
                                    <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase">End Date</Label>
                                    <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-8 text-xs" />
                                </div>
                            </div>
                            {duplicatesInCurrentList.length > 0 && (
                                <Button variant="outline" size="sm" onClick={handleRemoveDuplicates} className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 text-[10px] h-7">
                                    <X className="mr-1 h-3 w-3" /> Exclude {duplicatesInCurrentList.length} Duplicates
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <div className={cn("p-4 rounded-xl border flex flex-col justify-center items-center text-center space-y-1 transition-colors", calculatedRecon?.isMatched ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20")}>
                        {calculatedRecon?.isMatched ? (
                            <>
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <p className="text-xs font-bold text-green-800">Balanced!</p>
                                <p className="text-[10px] text-green-700 font-medium">Matches detected closing balance.</p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                                <p className="text-xs font-bold text-destructive">Recon Mismatch</p>
                                <p className="text-muted-foreground text-[10px] font-medium">Diff: {formatPrice(calculatedRecon?.diff || 0)}</p>
                            </>
                        )}
                    </div>
                </div>

                {combinedStatementMeta && editedOpeningBalance !== null && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-3">
                        <Checkbox id="create-open-check" checked={createOpeningBalance} onCheckedChange={(v) => setCreateOpeningBalance(!!v)} className="mt-1" />
                        <div className="space-y-1">
                            <Label htmlFor="create-open-check" className="text-xs font-bold text-yellow-800">Post Opening Balance?</Label>
                            <p className="text-[10px] text-yellow-700">
                                Create a transaction for <strong>{formatPrice(editedOpeningBalance)}</strong> dated <strong>{filterStartDate || combinedStatementMeta.startDate}</strong>.
                            </p>
                        </div>
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-2 border-b flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-2">Editable Preview ({filteredTransactions.length} items)</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="text-[10px] py-2">Date</TableHead>
                                    <TableHead className="text-[10px] py-2">Description</TableHead>
                                    <TableHead className="text-right text-[10px] py-2">Amount</TableHead>
                                    <TableHead className="text-right text-[10px] py-2">Calc Bal</TableHead>
                                    <TableHead className="text-right text-[10px] py-2">Stmt Bal</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {extractedTransactions.map((tx, idx) => {
                                    const isExcluded = excludedIndices.has(idx);
                                    const isOutOfDateRange = (filterStartDate && tx.date < filterStartDate) || (filterEndDate && tx.date > filterEndDate);
                                    const isDup = isDuplicateAt(tx, idx, extractedTransactions);
                                    
                                    if (isOutOfDateRange) return null;

                                    return (
                                        <TableRow key={idx} className={cn(
                                            isExcluded && "opacity-30 bg-muted/50 grayscale",
                                            isDup && !isExcluded && "bg-destructive/5"
                                        )}>
                                            <TableCell className="p-1">
                                                <Input 
                                                    type="date" 
                                                    value={tx.date} 
                                                    onChange={(e) => handleUpdateTransaction(idx, 'date', e.target.value)}
                                                    className={cn("h-7 text-[10px] border-none bg-transparent", tx.isFee && "opacity-70")}
                                                />
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <div className={cn("flex flex-col", tx.isFee && "pl-6")}>
                                                    <div className="flex items-center gap-1 w-full">
                                                        {tx.isFee && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                                        <Input 
                                                            value={tx.description} 
                                                            onChange={(e) => handleUpdateTransaction(idx, 'description', e.target.value)}
                                                            className="h-7 text-[10px] border-none bg-transparent font-medium"
                                                        />
                                                    </div>
                                                    {isDup && !isExcluded && (
                                                        <div className={cn("mt-0.5", tx.isFee ? "pl-5" : "pl-3")}>
                                                            <Badge variant="destructive" className="text-[8px] py-0 px-1 font-bold h-4">Duplicate in DB</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-1">
                                                <Input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={tx.amount} 
                                                    onChange={(e) => handleUpdateTransaction(idx, 'amount', parseFloat(e.target.value) || 0)}
                                                    className={cn("h-7 text-[10px] border-none bg-transparent text-right font-mono", tx.amount < 0 ? "text-destructive" : "text-green-600")}
                                                />
                                            </TableCell>
                                            <TableCell className="p-1 text-right text-[10px] font-mono text-muted-foreground pr-4">
                                                {formatPrice(runningBalances[idx])}
                                            </TableCell>
                                            <TableCell className="p-1 text-right text-[10px] font-mono pr-4">
                                                {tx.balance !== undefined ? (
                                                    <span className={Math.abs(runningBalances[idx] - tx.balance) > 0.01 ? "text-destructive font-bold" : "text-green-600"}>
                                                        {formatPrice(tx.balance)}
                                                    </span>
                                                ) : <span className="text-muted-foreground opacity-50">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right py-2 pr-4">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        const newExcluded = new Set(excludedIndices);
                                                        if (isExcluded) newExcluded.delete(idx);
                                                        else newExcluded.add(idx);
                                                        setExcludedIndices(newExcluded);
                                                    }}
                                                >
                                                    {isExcluded ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                            </TableBody>
                        </Table>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center text-center space-y-4 border-2 border-dashed rounded-xl bg-muted/5 p-8">
                <FileText className="h-16 w-16 opacity-10" />
                <p className="text-lg font-bold">Ready for Analysis</p>
                <p className="text-sm text-muted-foreground max-w-sm">Upload one or more PDF statements to begin automated extraction and reconciliation.</p>
              </div>
            )}
          </main>
        </div>

        <DialogFooter className="border-t p-6">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
                onClick={handleImport} 
                disabled={isImporting || filteredTransactions.length === 0}
                className="font-bold min-w-[200px]"
            >
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {filteredTransactions.length} Transactions
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
