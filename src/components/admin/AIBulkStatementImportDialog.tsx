'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Sparkles, FileText, Upload, AlertTriangle, CheckCircle2, 
  Info, RotateCcw, Trash2, X, Download, Banknote, CornerDownRight, Plus, 
  Check, AlertCircle, Calendar
} from 'lucide-react';
import { extractStatementMetadata } from '@/ai/flows/extract-statement-metadata';
import { getFirestore, collection, getDocs, doc, query, where, writeBatch, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { User, ChartOfAccount, ImportedTransaction, AllocationRule } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractStatementChunk } from '@/app/actions';
import { matchesRuleKeyword } from '@/lib/bank-cleaner';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx-js-style';
import { Progress } from '@/components/ui/progress';

const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
  const token = await getAuth(firebaseApp).currentUser?.getIdToken();
  if (!token) throw new Error('You must be signed in to do this.');
  return token;
}

type Transaction = {
  date: string;
  description: string;
  amount: number;
  isFee?: boolean;
  parentDescription?: string;
};

type StatementFile = {
  id: string;
  name: string;
  file: File;
  status: 'pending' | 'analyzing' | 'valid' | 'error';
  error?: string;
  bankName?: string;
  accountNumber?: string;
  holderName?: string;
  startDate?: string;
  endDate?: string;
  openingBalance?: number;
  closingBalance?: number;
};

type DetectedAccount = {
  accountNumber: string;
  bankName: string;
  holderName: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  files: StatementFile[];
  isExisting: boolean;
  existingAccountId?: string;
  customDescription: string;
  proposedAccountId?: string;
};

type AccountImportState = {
  accountId: string;
  accountNumber: string;
  description: string;
  transactions: Transaction[];
  openingBalance: number;
  closingBalance: number;
  filterStartDate: string;
  filterEndDate: string;
  createOpeningBalance: boolean;
  excludedIndices: Set<number>;
  existingTransactions: ImportedTransaction[];
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

export default function AIBulkStatementImportDialog({
  open,
  onOpenChange,
  client,
  onImportComplete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: User;
  onImportComplete: () => void;
}) {
  const [step, setStep] = useState<'upload' | 'extracting' | 'preview'>('upload');
  const [statementFiles, setStatementFiles] = useState<StatementFile[]>([]);
  const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);
  const [preAnalysisCompleted, setPreAnalysisCompleted] = useState(false);

  // Match / Creation states
  const [detectedAccounts, setDetectedAccounts] = useState<DetectedAccount[]>([]);

  // Extraction states
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Preview & Reconcile states
  const [accountStates, setAccountStates] = useState<{ [accountId: string]: AccountImportState }>({});
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();

  // Reset dialog state when opened/closed
  useEffect(() => {
    if (!open) {
      setStep('upload');
      setStatementFiles([]);
      setIsPreAnalyzing(false);
      setPreAnalysisCompleted(false);
      setDetectedAccounts([]);
      setExtractionProgress(0);
      setStatusMessage('');
      setAccountStates({});
      setActiveAccountId('');
    }
  }, [open]);

  // Run metadata extraction on uploaded files
  const handlePreAnalyze = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsPreAnalyzing(true);
    setPreAnalysisCompleted(false);
    setDetectedAccounts([]);

    const initialFiles: StatementFile[] = Array.from(files).map((f, index) => ({
      id: `${f.name}-${index}-${Date.now()}`,
      name: f.name,
      file: f,
      status: 'pending'
    }));

    setStatementFiles(initialFiles);

    const analyzedFiles: StatementFile[] = [];

    // Analyze files sequentially
    for (const stmt of initialFiles) {
      setStatementFiles(prev => prev.map(s => s.id === stmt.id ? { ...s, status: 'analyzing' } : s));

      try {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(stmt.file);
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = (e) => reject(e);
        });

        // Load PDF and extract page 1
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        if (pdfDoc.getPageCount() === 0) {
          throw new Error('PDF has no pages');
        }

        const firstPageDoc = await PDFDocument.create();
        const pages = await firstPageDoc.copyPages(pdfDoc, [0]);
        firstPageDoc.addPage(pages[0]);
        const firstPageBase64 = `data:application/pdf;base64,${await firstPageDoc.saveAsBase64()}`;

        const metadata = await extractStatementMetadata({ statementPdf: firstPageBase64 });

        const analyzed: StatementFile = {
          ...stmt,
          status: 'valid',
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

    // Group the valid files by accountNumber
    const validAnalyzed = analyzedFiles.filter(s => s.status === 'valid' && s.accountNumber && s.accountNumber !== 'Unknown');
    if (validAnalyzed.length === 0) {
      toast({ title: 'No Valid Accounts', description: 'Could not extract valid bank account details from statements.', variant: 'destructive' });
      return;
    }

    // Identify unique accounts
    const accountsMap: { [accNum: string]: StatementFile[] } = {};
    validAnalyzed.forEach(f => {
      const num = f.accountNumber!;
      if (!accountsMap[num]) accountsMap[num] = [];
      accountsMap[num].push(f);
    });

    const detected: DetectedAccount[] = [];

    // Map each unique account details
    Object.entries(accountsMap).forEach(([accNum, files]) => {
      // Sort files by startDate to determine opening/closing balances and complete date range
      const sortedFiles = [...files].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
      const firstFile = sortedFiles[0];
      const lastFile = sortedFiles[sortedFiles.length - 1];

      const bankName = firstFile.bankName || 'Unknown';
      const holderName = firstFile.holderName || 'Unknown';
      const startDate = firstFile.startDate || '';
      const endDate = lastFile.endDate || '';
      const openingBalance = firstFile.openingBalance ?? 0;
      const closingBalance = lastFile.closingBalance ?? 0;

      // Find if this account matches any in Chart of Accounts
      const existingAccount = client.chartOfAccounts?.find(acc => {
        const details = acc as ChartOfAccount & { bankName?: string; bankAccountNumber?: string };
        return details.accountNumber.startsWith('8400-') && 
               (matchAccountNumber(details.bankAccountNumber, accNum) || 
                details.description.toLowerCase().includes(accNum.toLowerCase()));
      }) as (ChartOfAccount & { bankName?: string; bankAccountNumber?: string }) | undefined;

      detected.push({
        accountNumber: accNum,
        bankName,
        holderName,
        startDate,
        endDate,
        openingBalance,
        closingBalance,
        files: sortedFiles,
        isExisting: !!existingAccount,
        existingAccountId: existingAccount?.id,
        customDescription: existingAccount ? existingAccount.description : `${bankName} - ${accNum}`,
      });
    });

    setDetectedAccounts(detected);
    setPreAnalysisCompleted(true);
  };

  // Run the full process: Create accounts if needed, then run AI OCR transaction extraction
  const handleProcessAndExtract = async () => {
    if (detectedAccounts.length === 0) return;
    setStep('extracting');
    setExtractionProgress(0);
    setStatusMessage('Initializing...');

    try {
      // 1. Create missing bank accounts sequentially
      setStatusMessage('Creating cashbook accounts in database...');
      const accountsToResolve = [...detectedAccounts];
      const clientRef = doc(db, 'aiAccountantClients', client.id);

      // Fetch fresh client doc to prevent race conditions on chartOfAccounts sequence numbers
      const freshSnap = await getDoc(clientRef);
      if (!freshSnap.exists()) {
        throw new Error('Client document not found.');
      }
      const freshData = freshSnap.data() as User;
      let chartOfAccounts = [...(freshData.chartOfAccounts || [])];

      // Propose sequences
      const resolvedAccountsMap: { [accNum: string]: { id: string; description: string } } = {};

      for (let i = 0; i < accountsToResolve.length; i++) {
        const acc = accountsToResolve[i];
        if (acc.isExisting && acc.existingAccountId) {
          resolvedAccountsMap[acc.accountNumber] = {
            id: acc.existingAccountId,
            description: acc.customDescription
          };
        } else {
          // Find next 8400- account number
          const existingBankAccounts = chartOfAccounts.filter(a => a.accountNumber.startsWith('8400-'));
          const existingNumbers = existingBankAccounts.map(a => {
            const parts = a.accountNumber.split('-');
            return parts.length > 1 ? parseInt(parts[1], 10) : 0;
          });
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          const newAccountNumber = `8400-${String(nextNumber).padStart(3, '0')}`;

          const newAccount = {
            id: newAccountNumber,
            accountNumber: newAccountNumber,
            description: acc.customDescription,
            section: 'Balance Sheet',
            bankName: acc.bankName,
            bankAccountNumber: acc.accountNumber
          };

          chartOfAccounts.push(newAccount);
          resolvedAccountsMap[acc.accountNumber] = {
            id: newAccountNumber,
            description: acc.customDescription
          };
        }
      }

      // Update Chart of Accounts in Firestore
      await updateDoc(clientRef, { chartOfAccounts });

      // 2. Perform Extraction for all files across all accounts
      let totalPages = 0;
      const filePageCounts: { [id: string]: number } = {};

      // Load PDF structures and calculate total pages
      setStatusMessage('Analyzing PDF page counts...');
      const statementsToProcess = detectedAccounts.flatMap(acc => acc.files);

      for (const stmt of statementsToProcess) {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(stmt.file);
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = (e) => reject(e);
        });
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const count = pdfDoc.getPageCount();
        filePageCounts[stmt.id] = count;
        totalPages += count;
      }

      let totalProcessedPages = 0;
      const transactionsByAccount: { [accountId: string]: Transaction[] } = {};

      // For each file, run page extraction
      for (let sIdx = 0; sIdx < statementsToProcess.length; sIdx++) {
        const stmt = statementsToProcess[sIdx];
        const accNum = stmt.accountNumber!;
        const resolvedAcc = resolvedAccountsMap[accNum];
        const accountId = resolvedAcc.id;

        if (!transactionsByAccount[accountId]) {
          transactionsByAccount[accountId] = [];
        }

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(stmt.file);
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = (e) => reject(e);
        });

        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = filePageCounts[stmt.id];
        const chunkSize = 5;

        for (let i = 0; i < pageCount; i += chunkSize) {
          const start = i;
          const end = Math.min(i + chunkSize, pageCount);
          
          const overallProgress = Math.round((totalProcessedPages / totalPages) * 100);
          setExtractionProgress(overallProgress);
          setStatusMessage(`Extracting "${stmt.name}" for ${resolvedAcc.description} (pages ${start + 1} to ${end})...`);

          const chunkDoc = await PDFDocument.create();
          const pagesToCopy = Array.from({ length: end - start }, (_, idx) => start + idx);
          const copiedPages = await chunkDoc.copyPages(pdfDoc, pagesToCopy);
          copiedPages.forEach(p => chunkDoc.addPage(p));
          
          const chunkBase64 = `data:application/pdf;base64,${await chunkDoc.saveAsBase64()}`;
          const result = await extractStatementChunk({ chunkBase64, idToken: await getIdToken() });

          if (result.success && result.transactions) {
            transactionsByAccount[accountId] = [...transactionsByAccount[accountId], ...result.transactions];
          } else {
            throw new Error(result.error || `Failed to extract transactions from pages ${start + 1} to ${end} of ${stmt.name}`);
          }

          totalProcessedPages += (end - start);
        }
      }

      setExtractionProgress(100);
      setStatusMessage('Extraction completed. Fetching history and post-processing...');

      // 3. Post-Process per account and fetch existing database transactions for duplicate checks
      const initialAccountStates: { [accountId: string]: AccountImportState } = {};

      for (const acc of detectedAccounts) {
        const resolvedAcc = resolvedAccountsMap[acc.accountNumber];
        const accountId = resolvedAcc.id;

        // Fetch DB transactions for duplicate checks
        const transRef = collection(db, 'aiAccountantClients', client.id, 'transactions');
        const q = query(transRef, where('bankAccountId', '==', accountId));
        const snap = await getDocs(q);
        const dbTxs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ImportedTransaction));

        const rawTxs = transactionsByAccount[accountId] || [];
        rawTxs.sort((a, b) => a.date.localeCompare(b.date));

        // Deduplicate raw list internally
        const uniqueRaw: Transaction[] = [];
        const seenKeys = new Set<string>();
        rawTxs.forEach(t => {
          const key = `${t.date}_${t.description.toLowerCase().trim()}_${t.amount.toFixed(2)}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueRaw.push(t);
          }
        });

        // Split fees and main items
        const processedList: Transaction[] = [];
        const feeItems: Transaction[] = [];
        const mainItems: Transaction[] = [];

        uniqueRaw.forEach(tx => {
          const descUpper = tx.description.toUpperCase();
          if (descUpper.includes('(BANK FEE)') || descUpper.startsWith('BANK FEE:')) {
            tx.isFee = true;
            feeItems.push(tx);
          } else {
            mainItems.push(tx);
          }
        });

        // Group fees under parent transactions
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

        initialAccountStates[accountId] = {
          accountId,
          accountNumber: acc.accountNumber,
          description: resolvedAcc.description,
          transactions: processedList,
          openingBalance: acc.openingBalance,
          closingBalance: acc.closingBalance,
          filterStartDate: acc.startDate,
          filterEndDate: acc.endDate,
          createOpeningBalance: false,
          excludedIndices: new Set(),
          existingTransactions: dbTxs
        };
      }

      setAccountStates(initialAccountStates);
      
      // Set the first account as active
      const firstAccountId = Object.keys(initialAccountStates)[0];
      setActiveAccountId(firstAccountId || '');
      setStep('preview');
      toast({ title: 'Extraction Success', description: 'All statements processed successfully.' });
    } catch (e: any) {
      console.error('Bulk extraction failed:', e);
      toast({ title: 'Extraction Failed', description: e.message || 'An error occurred during extraction.', variant: 'destructive' });
      setStep('upload');
    }
  };

  // Duplicate check helper
  const checkDuplicate = (tx: Transaction, idx: number, list: Transaction[], dbTxs: ImportedTransaction[]) => {
    const key = `${tx.date}_${tx.description.toLowerCase().trim()}_${tx.amount.toFixed(2)}`;
    const dbCount = dbTxs.filter(e => {
      const eDate = format(new Date(e.date), 'yyyy-MM-dd');
      return eDate === tx.date &&
             e.description.toLowerCase().trim() === tx.description.toLowerCase().trim() &&
             Math.abs(e.amount - tx.amount) < 0.01;
    }).length;

    let currentOccurrence = 0;
    for (let i = 0; i <= idx; i++) {
      const item = list[i];
      const itemKey = `${item.date}_${item.description.toLowerCase().trim()}_${item.amount.toFixed(2)}`;
      if (itemKey === key) {
        currentOccurrence++;
      }
    }
    return currentOccurrence <= dbCount;
  };

  // Exclude all duplicate transactions for current active account
  const handleExcludeDuplicates = (accountId: string) => {
    const state = accountStates[accountId];
    if (!state) return;

    const newExcluded = new Set(state.excludedIndices);
    state.transactions.forEach((tx, idx) => {
      if (checkDuplicate(tx, idx, state.transactions, state.existingTransactions)) {
        newExcluded.add(idx);
      }
    });

    setAccountStates(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        excludedIndices: newExcluded
      }
    }));
    toast({ title: "Duplicates Excluded", description: `Excluded duplicate transactions for ${state.description}.` });
  };

  // Update specific transaction in preview
  const handleUpdateTransaction = (accountId: string, index: number, field: keyof Transaction, value: any) => {
    setAccountStates(prev => {
      const target = prev[accountId];
      if (!target) return prev;
      const updatedList = [...target.transactions];
      updatedList[index] = { ...updatedList[index], [field]: value };
      return {
        ...prev,
        [accountId]: {
          ...target,
          transactions: updatedList
        }
      };
    });
  };

  // Exclude/Include individual transaction
  const handleToggleExclude = (accountId: string, index: number) => {
    setAccountStates(prev => {
      const target = prev[accountId];
      if (!target) return prev;
      const newExcluded = new Set(target.excludedIndices);
      if (newExcluded.has(index)) {
        newExcluded.delete(index);
      } else {
        newExcluded.add(index);
      }
      return {
        ...prev,
        [accountId]: {
          ...target,
          excludedIndices: newExcluded
        }
      };
    });
  };

  // Reconcile and calculate differences
  const calculateRecon = (state: AccountImportState) => {
    const { transactions, openingBalance, closingBalance, filterStartDate, filterEndDate, excludedIndices, existingTransactions } = state;
    
    // Filter transactions by date range and exclude marked ones
    const activeTxs = transactions.filter((tx, idx) => {
      const isExcluded = excludedIndices.has(idx);
      const isOutOfRange = (filterStartDate && tx.date < filterStartDate) || (filterEndDate && tx.date > filterEndDate);
      return !isExcluded && !isOutOfRange;
    });

    const netChange = activeTxs.reduce((sum, t) => sum + t.amount, 0);
    const dbBalance = existingTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // If opening balance isn't in database, computed balance starts at openingBalance + netChange
    const computedEnd = openingBalance + netChange;
    const diff = closingBalance - computedEnd;
    const isMatched = Math.abs(diff) < 0.01;

    return {
      netChange,
      dbBalance,
      computedEnd,
      diff,
      isMatched,
      activeCount: activeTxs.length
    };
  };

  const handleDownloadExcel = (accountId: string) => {
    const state = accountStates[accountId];
    if (!state) return;
    const { transactions, filterStartDate, filterEndDate, excludedIndices } = state;

    const filtered = transactions.filter((tx, idx) => {
      const isExcluded = excludedIndices.has(idx);
      const isOutOfRange = (filterStartDate && tx.date < filterStartDate) || (filterEndDate && tx.date > filterEndDate);
      return !isExcluded && !isOutOfRange;
    });

    const wsData = filtered.map(tx => ({
      Date: tx.date,
      Description: tx.description,
      Amount: tx.amount
    }));
    
    const ws = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(ws, worksheet, "Transactions");
    XLSX.writeFile(ws, `Transactions_${state.description}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  // Commit everything to Firestore
  const handleImport = async () => {
    setIsImporting(true);

    try {
      // 1. Fetch rules for allocation (global + client specific)
      let allRules = [...(client.allocationRules || [])];
      if (!client.disableGlobalRules) {
        const rulesRef = collection(db, "allocationRules");
        const rulesSnap = await getDocs(rulesRef);
        const globalRules = rulesSnap.docs.map(d => ({ ...d.data(), id: d.id } as AllocationRule));
        allRules = [...allRules, ...globalRules];
      }
      allRules.sort((a, b) => (a.priority || 99) - (b.priority || 99));

      const writeOperations: { ref: any; data: any; type: 'set' | 'update' }[] = [];

      // Compile all writes across all accounts
      Object.entries(accountStates).forEach(([accountId, state]) => {
        const { transactions, openingBalance, createOpeningBalance, filterStartDate, filterEndDate, excludedIndices } = state;

        // Post Opening Balance if requested
        if (createOpeningBalance) {
          const openBalRef = doc(collection(db, 'aiAccountantClients', client.id, 'transactions'));
          const openBalDate = filterStartDate || state.filterStartDate;
          
          writeOperations.push({
            ref: openBalRef,
            type: 'set',
            data: {
              clientId: client.id,
              date: new Date(openBalDate).toISOString(),
              reference: `OPEN-BAL-${Date.now()}`,
              description: openingBalance < 0 ? "OPENING BALANCE (OVERDRAFT)" : "OPENING BALANCE",
              amount: openingBalance,
              isExpense: openingBalance < 0,
              bankAccountId: accountId,
              status: 'allocated',
              allocatedTo: { value: '9500-002', type: 'account' },
              vatType: 'no_vat',
              allocatedAt: serverTimestamp(),
              allocationSource: 'manual'
            }
          });
        }

        // Transactions to import
        const filtered = transactions.filter((tx, idx) => {
          const isExcluded = excludedIndices.has(idx);
          const isOutOfRange = (filterStartDate && tx.date < filterStartDate) || (filterEndDate && tx.date > filterEndDate);
          return !isExcluded && !isOutOfRange;
        });

        filtered.forEach(tx => {
          const isExpense = tx.amount < 0;
          const match = isExpense ? allRules.find(r => r.keywords.some(kw => matchesRuleKeyword(tx.description, kw))) : null;

          const txData: any = {
            clientId: client.id,
            date: new Date(tx.date).toISOString(),
            reference: `AI-PDF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            description: tx.description.toUpperCase(),
            amount: tx.amount,
            isExpense: isExpense,
            bankAccountId: accountId,
            status: (isExpense && match) ? 'reviewed' : 'new'
          };

          if (isExpense && match) {
            const keyword = match.keywords.find(kw => matchesRuleKeyword(tx.description, kw));
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
          writeOperations.push({
            ref: newRef,
            type: 'set',
            data: txData
          });
        });
      });

      if (writeOperations.length === 0) {
        toast({ title: 'No Transactions', description: 'There are no transactions to import.' });
        setIsImporting(false);
        return;
      }

      // Commit operations in chunked batches (400 items per batch to stay under 500 limit)
      const BATCH_SIZE = 400;
      let batch = writeBatch(db);
      let count = 0;

      for (let i = 0; i < writeOperations.length; i++) {
        const op = writeOperations[i];
        if (op.type === 'set') {
          batch.set(op.ref, op.data);
        } else {
          batch.update(op.ref, op.data);
        }
        count++;

        if (count >= BATCH_SIZE) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      toast({ title: 'Import Successful', description: `Successfully imported transactions across accounts.` });
      onImportComplete();
      onOpenChange(false);
    } catch (e: any) {
      console.error('Import failed:', e);
      toast({ title: 'Import Failed', description: e.message || 'Failed to save transactions to database.', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  // Render variables
  const activeState = accountStates[activeAccountId];
  const activeRecon = activeState ? calculateRecon(activeState) : null;
  const activeDuplicatesCount = useMemo(() => {
    if (!activeState) return 0;
    return activeState.transactions.filter((tx, idx) => {
      if (activeState.excludedIndices.has(idx)) return false;
      const isOutOfRange = (activeState.filterStartDate && tx.date < activeState.filterStartDate) || (activeState.filterEndDate && tx.date > activeState.filterEndDate);
      if (isOutOfRange) return false;
      return checkDuplicate(tx, idx, activeState.transactions, activeState.existingTransactions);
    }).length;
  }, [activeState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-background">
        
        {/* Dialog Header */}
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0 bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            Bulk AI Bank Statement Importer
          </DialogTitle>
          <DialogDescription className="text-sm">
            Bulk upload PDF bank statements. We will auto-detect accounts, match or create cashbook ledger accounts, and extract transactions.
          </DialogDescription>
        </DialogHeader>

        {/* Dynamic Steps Content */}
        <div className="flex-grow overflow-hidden flex flex-col">
          
          {/* STEP 1: UPLOAD & MATCHING */}
          {step === 'upload' && (
            <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* File Upload Zone */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Card className="border-2 border-dashed bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer relative group">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Drag & Drop Bank Statements</p>
                      <p className="text-xs text-muted-foreground">Or click to select multiple PDF files</p>
                    </div>
                    <Input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isPreAnalyzing}
                      onChange={(e) => handlePreAnalyze(e.target.files!)}
                    />
                  </CardContent>
                </Card>

                {/* Pre-analysis Status / File List */}
                {isPreAnalyzing && (
                  <div className="flex items-center justify-center p-6 bg-muted/40 rounded-xl space-x-3 animate-in fade-in">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground">Extracting metadata from PDF headers...</span>
                  </div>
                )}

                {preAnalysisCompleted && statementFiles.length > 0 && (
                  <div className="space-y-3 animate-in fade-in">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded Documents ({statementFiles.length})</Label>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {statementFiles.map((stmt) => (
                        <div key={stmt.id} className="p-3 border rounded-lg bg-muted/20 space-y-1.5 text-xs flex justify-between items-start">
                          <div className="space-y-1 truncate">
                            <span className="font-semibold block truncate">{stmt.name}</span>
                            {stmt.status === 'valid' && (
                              <span className="text-[10px] text-muted-foreground font-mono block">
                                {stmt.bankName} • Acc: {stmt.accountNumber}
                              </span>
                            )}
                            {stmt.error && (
                              <span className="text-[10px] text-destructive font-medium block">
                                Error: {stmt.error}
                              </span>
                            )}
                          </div>
                          <Badge 
                            variant={stmt.status === 'valid' ? 'default' : 'destructive'}
                            className={cn(
                              "text-[9px] px-1.5 py-0 h-5 font-bold uppercase shrink-0",
                              stmt.status === 'valid' && "bg-green-600 hover:bg-green-600"
                            )}
                          >
                            {stmt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Detected Accounts Panel */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detected Bank Accounts</h3>
                
                {detectedAccounts.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl bg-muted/5 min-h-[300px]">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mb-2" />
                    <p className="font-bold text-muted-foreground text-sm">No Accounts Detected</p>
                    <p className="text-xs text-muted-foreground/80 max-w-xs mt-1">Upload PDF statements to extract details and automatically match them with your ledger.</p>
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-[450px] pr-2">
                    {detectedAccounts.map((acc, index) => (
                      <Card key={index} className="border bg-card shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-foreground">{acc.bankName}</h4>
                                <Badge variant={acc.isExisting ? "outline" : "default"} className={cn("text-[9px] font-bold px-1.5 h-4.5", acc.isExisting ? "border-green-600 text-green-700 bg-green-50" : "bg-blue-600 hover:bg-blue-600")}>
                                  {acc.isExisting ? "Matched" : "New Account"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">Account Number: {acc.accountNumber}</p>
                              <p className="text-[11px] text-muted-foreground">Holder: {acc.holderName}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground font-mono space-y-0.5 shrink-0">
                              <div>Period: {acc.startDate} to {acc.endDate}</div>
                              <div>Op Bal: {formatPrice(acc.openingBalance)}</div>
                              <div>Cl Bal: {formatPrice(acc.closingBalance)}</div>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {acc.isExisting ? "Cashbook Ledger Account" : "Propose New Cashbook Account Name"}
                            </Label>
                            {acc.isExisting ? (
                              <div className="p-2 border rounded-lg bg-green-50/50 border-green-200 text-xs font-semibold text-green-800 flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                Matches account: {acc.customDescription}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                                <Input 
                                  value={acc.customDescription} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDetectedAccounts(prev => prev.map((item, idx) => idx === index ? { ...item, customDescription: val } : item));
                                  }}
                                  className="h-8 text-xs font-medium"
                                  placeholder="Enter name for cashbook account..."
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: EXTRACTION PROGRESS */}
          {step === 'extracting' && (
            <div className="flex-grow flex flex-col items-center justify-center p-12 space-y-6 max-w-xl mx-auto text-center animate-in fade-in">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="space-y-2 w-full">
                <h3 className="text-lg font-bold text-foreground">AI Transaction Extraction In Progress</h3>
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              </div>
              <div className="w-full space-y-2">
                <Progress value={extractionProgress} className="h-2 w-full" />
                <span className="text-xs font-bold text-primary font-mono">{extractionProgress}% Complete</span>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & RECONCILE */}
          {step === 'preview' && activeState && (
            <div className="flex-grow overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Left Column - Sidebar (Bank Accounts List) */}
              <aside className="lg:col-span-4 border-r overflow-y-auto p-4 space-y-4 bg-muted/10">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Uploaded Accounts</h3>
                <div className="space-y-2">
                  {Object.entries(accountStates).map(([accountId, state]) => {
                    const recon = calculateRecon(state);
                    const isActive = activeAccountId === accountId;

                    return (
                      <button
                        key={accountId}
                        onClick={() => setActiveAccountId(accountId)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5",
                          isActive 
                            ? "bg-primary/5 border-primary shadow-sm text-primary" 
                            : "bg-card border-border hover:bg-muted/40 text-foreground"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2 w-full">
                          <span className="font-bold text-xs truncate">{state.description}</span>
                          <Badge variant="outline" className={cn("text-[9px] font-bold font-mono h-4.5 px-1 py-0 border-none shrink-0", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            {recon.activeCount} txs
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Acc: {state.accountNumber}
                        </span>

                        <div className="flex justify-between items-center w-full pt-1.5 border-t border-dashed mt-0.5 text-[10px]">
                          <span className="text-muted-foreground">Status:</span>
                          {recon.isMatched ? (
                            <span className="text-green-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Reconciled
                            </span>
                          ) : (
                            <span className="text-destructive font-bold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Diff: {formatPrice(Math.abs(recon.diff))}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Column - Main Area (Active Account Details & Transactions) */}
              <main className="lg:col-span-8 overflow-y-auto p-6 space-y-6 flex flex-col h-full">
                
                {/* Header detail */}
                <div className="flex flex-col gap-0.5 border-b pb-4 shrink-0">
                  <h3 className="font-bold text-lg text-foreground">{activeState.description}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                    <span>Account Number: {activeState.accountNumber}</span>
                    <span>•</span>
                    <span>Range: {activeState.filterStartDate} to {activeState.filterEndDate}</span>
                  </div>
                </div>

                {/* Balances & Reconciliations Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 shrink-0">
                  
                  {/* Values Override Card */}
                  <Card className="md:col-span-8 bg-muted/20 border-dashed">
                    <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Statement Balances</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadExcel(activeAccountId)} className="h-7 text-[10px] gap-1 px-2">
                        <Download className="h-3.5 w-3.5" /> Export Excel
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground">Opening Balance</Label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={activeState.openingBalance} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setAccountStates(prev => ({
                                ...prev,
                                [activeAccountId]: {
                                  ...prev[activeAccountId],
                                  openingBalance: val
                                }
                              }));
                            }}
                            className="h-8 font-mono text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] uppercase font-bold text-muted-foreground">Closing Balance</Label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={activeState.closingBalance} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setAccountStates(prev => ({
                                ...prev,
                                [activeAccountId]: {
                                  ...prev[activeAccountId],
                                  closingBalance: val
                                }
                              }));
                            }}
                            className="h-8 font-mono text-xs bg-background"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reconciliation Status Indicator */}
                  <div className={cn(
                    "md:col-span-4 p-4 rounded-xl border flex flex-col justify-center items-center text-center space-y-1 transition-colors",
                    activeRecon?.isMatched ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20"
                  )}>
                    {activeRecon?.isMatched ? (
                      <>
                        <CheckCircle2 className="h-7 w-7 text-green-600" />
                        <p className="text-xs font-bold text-green-800">Balanced!</p>
                        <p className="text-[10px] text-green-700 font-medium">Matches statement balance.</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-7 w-7 text-destructive animate-bounce" />
                        <p className="text-xs font-bold text-destructive">Mismatch</p>
                        <p className="text-muted-foreground text-[10px] font-mono font-medium">Diff: {formatPrice(activeRecon?.diff || 0)}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Filters, Duplicates and Open Balance Posting Checkbox */}
                <div className="space-y-3 shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Date Filters Card */}
                    <div className="p-4 border rounded-xl bg-card space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date Range Filter
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-[8px] uppercase text-muted-foreground">Start Date</Label>
                          <Input 
                            type="date" 
                            value={activeState.filterStartDate} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setAccountStates(prev => ({
                                ...prev,
                                [activeAccountId]: {
                                  ...prev[activeAccountId],
                                  filterStartDate: val
                                }
                              }));
                            }} 
                            className="h-7 text-[10px] p-1.5" 
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-[8px] uppercase text-muted-foreground">End Date</Label>
                          <Input 
                            type="date" 
                            value={activeState.filterEndDate} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setAccountStates(prev => ({
                                ...prev,
                                [activeAccountId]: {
                                  ...prev[activeAccountId],
                                  filterEndDate: val
                                }
                              }));
                            }} 
                            className="h-7 text-[10px] p-1.5" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Opening Balance Posting Box */}
                    <div className="p-4 border rounded-xl bg-yellow-50/50 border-yellow-200 flex items-start gap-3">
                      <Checkbox 
                        id="create-open-check" 
                        checked={activeState.createOpeningBalance} 
                        onCheckedChange={(v) => {
                          setAccountStates(prev => ({
                            ...prev,
                            [activeAccountId]: {
                              ...prev[activeAccountId],
                              createOpeningBalance: !!v
                            }
                          }));
                        }} 
                        className="mt-1" 
                      />
                      <div className="space-y-1">
                        <Label htmlFor="create-open-check" className="text-xs font-bold text-yellow-800">Post Opening Balance?</Label>
                        <p className="text-[10px] text-yellow-700 leading-snug">
                          Create an opening transaction for <strong>{formatPrice(activeState.openingBalance)}</strong> dated <strong>{activeState.filterStartDate}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeDuplicatesCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExcludeDuplicates(activeAccountId)} 
                      className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 text-[10px] h-7 font-bold"
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Exclude {activeDuplicatesCount} Duplicate(s) in Database
                    </Button>
                  )}
                </div>

                {/* Transactions Preview Table */}
                <div className="border rounded-lg overflow-hidden flex-grow flex flex-col min-h-[300px]">
                  <div className="bg-muted/50 p-2 border-b flex justify-between items-center shrink-0">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground ml-2">
                      Transactions ({activeState.transactions.length} total)
                    </span>
                  </div>
                  <div className="overflow-y-auto flex-grow">
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="text-[10px] py-2 w-32">Date</TableHead>
                          <TableHead className="text-[10px] py-2">Description</TableHead>
                          <TableHead className="text-right text-[10px] py-2 w-36">Amount</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeState.transactions.map((tx, idx) => {
                          const isExcluded = activeState.excludedIndices.has(idx);
                          const isOutOfRange = (activeState.filterStartDate && tx.date < activeState.filterStartDate) || (activeState.filterEndDate && tx.date > activeState.filterEndDate);
                          const isDup = checkDuplicate(tx, idx, activeState.transactions, activeState.existingTransactions);

                          if (isOutOfRange) return null;

                          return (
                            <TableRow 
                              key={idx} 
                              className={cn(
                                isExcluded && "opacity-30 bg-muted/50 grayscale",
                                isDup && !isExcluded && "bg-destructive/5"
                              )}
                            >
                              <TableCell className="p-1">
                                <Input 
                                  type="date" 
                                  value={tx.date} 
                                  onChange={(e) => handleUpdateTransaction(activeAccountId, idx, 'date', e.target.value)}
                                  className={cn("h-7 text-[10px] border-none bg-transparent p-1.5", tx.isFee && "opacity-70")}
                                />
                              </TableCell>
                              <TableCell className="p-1">
                                <div className={cn("flex flex-col", tx.isFee && "pl-6")}>
                                  <div className="flex items-center gap-1 w-full">
                                    {tx.isFee && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                    <Input 
                                      value={tx.description} 
                                      onChange={(e) => handleUpdateTransaction(activeAccountId, idx, 'description', e.target.value)}
                                      className="h-7 text-[10px] border-none bg-transparent font-medium p-1.5"
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
                                  onChange={(e) => handleUpdateTransaction(activeAccountId, idx, 'amount', parseFloat(e.target.value) || 0)}
                                  className={cn(
                                    "h-7 text-[10px] border-none bg-transparent text-right font-mono p-1.5", 
                                    tx.amount < 0 ? "text-destructive" : "text-green-600"
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right py-1 pr-4">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleToggleExclude(activeAccountId, idx)}
                                >
                                  {isExcluded ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </main>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="border-t p-6 flex-shrink-0 bg-muted/20 flex justify-between items-center gap-4">
          <div>
            {step === 'preview' && (
              <Button variant="outline" onClick={() => setStep('upload')}>
                <RotateCcw className="mr-2 h-4 w-4" /> Back to Upload
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            
            {step === 'upload' && (
              <Button 
                onClick={handleProcessAndExtract} 
                disabled={isPreAnalyzing || detectedAccounts.length === 0}
                className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]"
              >
                <Sparkles className="mr-2 h-4 w-4" /> Extract & Process
              </Button>
            )}

            {step === 'preview' && (
              <Button 
                onClick={handleImport} 
                disabled={isImporting || Object.values(accountStates).every(s => s.transactions.length === 0)}
                className="font-bold min-w-[200px]"
              >
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import All Transactions
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
