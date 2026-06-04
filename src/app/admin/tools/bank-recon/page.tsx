'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, Sparkles, FileText, Upload, AlertTriangle, 
    CheckCircle2, Info, FileSpreadsheet, RotateCcw, Trash2, 
    X, Download, Banknote, HelpCircle, Eye, ArrowRight, ShieldCheck, Check
} from 'lucide-react';
import { getFirestore, collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { 
    extractStatementMetadataAction, 
    extractStatementTransactionsAction, 
    getClientsListAction 
} from './actions';

const db = getFirestore(firebaseApp);

interface ExtractedStatement {
    id: string;
    fileName: string;
    fileBase64: string;
    status: 'idle' | 'extracting_meta' | 'extracting_txs' | 'complete' | 'error';
    error?: string;
    progress: number;
    // Metadata
    bankName?: string;
    accountNumber?: string;
    holderName?: string;
    startDate?: string;
    endDate?: string;
    openingBalance?: number;
    closingBalance?: number;
    currency?: string;
    // Transactions
    transactions: {
        date: string;
        description: string;
        amount: number;
        excluded?: boolean;
    }[];
}

interface ClientData {
    id: string;
    name: string;
    chartOfAccounts: {
        id: string;
        accountNumber: string;
        description: string;
    }[];
}

export default function BankReconPage() {
    const [statements, setStatements] = useState<ExtractedStatement[]>([]);
    const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
    const [clients, setClients] = useState<ClientData[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('none');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('none');
    const [isPosting, setIsPosting] = useState(false);
    const { toast } = useToast();

    // Load clients on mount
    useEffect(() => {
        const loadClients = async () => {
            const res = await getClientsListAction();
            if (res.success && res.clients) {
                setClients(res.clients as any);
            }
        };
        loadClients();
    }, []);

    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId) || null;
    }, [clients, selectedClientId]);

    const cashbookAccounts = useMemo(() => {
        if (!selectedClient) return [];
        return selectedClient.chartOfAccounts.filter(acc => acc.accountNumber.startsWith('8400-'));
    }, [selectedClient]);

    // Handle statement uploads
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newStatements: ExtractedStatement[] = [];

        Array.from(files).forEach((file) => {
            const id = Math.random().toString(36).substring(2, 9);
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                // Keep base64 for processing chunk by chunk
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const fileBase64 = `data:application/pdf;base64,${base64}`;

                setStatements(prev => [
                    ...prev,
                    {
                        id,
                        fileName: file.name,
                        fileBase64,
                        status: 'idle',
                        progress: 0,
                        transactions: []
                    }
                ]);
            };
        });
    };

    // Run batch analysis of all idle statements
    const runAnalysis = async () => {
        const statementsToProcess = statements.filter(s => s.status === 'idle');
        if (statementsToProcess.length === 0) {
            toast({ title: "No statements to process", description: "Upload files or reset existing ones." });
            return;
        }

        for (const stmt of statementsToProcess) {
            await processStatement(stmt.id);
        }
    };

    const processStatement = async (id: string) => {
        updateStatement(id, { status: 'extracting_meta', progress: 10 });
        const stmt = statements.find(s => s.id === id);
        if (!stmt) return;

        try {
            // Load PDF
            const arrayBuffer = await dataURIToArrayBuffer(stmt.fileBase64);
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pageCount = pdfDoc.getPageCount();

            // Extract Metadata from first 3 pages (or less if document is smaller)
            const metaPageCount = Math.min(pageCount, 3);
            const firstPagesDoc = await PDFDocument.create();
            const pageIndices = Array.from({ length: metaPageCount }, (_, idx) => idx);
            const copiedPages = await firstPagesDoc.copyPages(pdfDoc, pageIndices);
            copiedPages.forEach(p => firstPagesDoc.addPage(p));
            const firstPagesBase64 = `data:application/pdf;base64,${await firstPagesDoc.saveAsBase64()}`;

            updateStatement(id, { progress: 20 });
            const metaRes = await extractStatementMetadataAction({ fileBase64: firstPagesBase64 });
            
            if (!metaRes.success || !metaRes.metadata) {
                throw new Error(metaRes.error || "Failed to extract metadata");
            }

            const meta = metaRes.metadata;
            updateStatement(id, {
                status: 'extracting_txs',
                progress: 40,
                bankName: meta.bankName || 'Unknown Bank',
                accountNumber: meta.accountNumber || 'UNIDENTIFIED-ACCOUNT',
                holderName: meta.holderName || 'Unknown Holder',
                startDate: meta.startDate || '',
                endDate: meta.endDate || '',
                openingBalance: meta.openingBalance || 0,
                closingBalance: meta.closingBalance || 0,
                currency: meta.currency || 'ZAR'
            });

            // Extract transactions in chunks of 5 pages
            const chunkSize = 5;
            let allTxs: any[] = [];

            for (let i = 0; i < pageCount; i += chunkSize) {
                const start = i;
                const end = Math.min(i + chunkSize, pageCount);
                const currentProgress = Math.round(40 + ((start / pageCount) * 50));
                updateStatement(id, { progress: currentProgress });

                const chunkDoc = await PDFDocument.create();
                const pagesToCopy = Array.from({ length: end - start }, (_, idx) => start + idx);
                const copiedPages = await chunkDoc.copyPages(pdfDoc, pagesToCopy);
                copiedPages.forEach(p => chunkDoc.addPage(p));

                const chunkBase64 = `data:application/pdf;base64,${await chunkDoc.saveAsBase64()}`;
                const chunkRes = await extractStatementTransactionsAction({ fileBase64: chunkBase64 });

                if (chunkRes.success && chunkRes.transactions) {
                    allTxs = [...allTxs, ...chunkRes.transactions];
                }
            }

            // Fallback calculation for startDate / endDate if missing or invalid
            let finalStartDate = meta.startDate || '';
            let finalEndDate = meta.endDate || '';

            if (allTxs.length > 0) {
                const validTxs = allTxs.filter(t => t.date && !isNaN(new Date(t.date).getTime()));
                if (validTxs.length > 0) {
                    const sortedTxs = [...validTxs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    if (!finalStartDate || isNaN(new Date(finalStartDate).getTime())) {
                        finalStartDate = sortedTxs[0].date;
                    }
                    if (!finalEndDate || isNaN(new Date(finalEndDate).getTime())) {
                        finalEndDate = sortedTxs[sortedTxs.length - 1].date;
                    }
                }
            }

            updateStatement(id, {
                status: 'complete',
                progress: 100,
                startDate: finalStartDate,
                endDate: finalEndDate,
                transactions: allTxs.map(t => ({ ...t, excluded: false }))
            });

            toast({ title: `Processed ${stmt.fileName}`, description: `Extracted ${allTxs.length} transactions.` });
        } catch (e: any) {
            console.error(e);
            updateStatement(id, {
                status: 'error',
                error: e.message || "Unknown error occurred"
            });
            toast({ title: `Error processing ${stmt.fileName}`, description: e.message || "Check log for details", variant: "destructive" });
        }
    };

    const updateStatement = (id: string, updates: Partial<ExtractedStatement>) => {
        setStatements(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStatement = (id: string) => {
        setStatements(prev => prev.filter(s => s.id !== id));
        if (selectedStatementId === id) setSelectedStatementId(null);
    };

    const resetStatements = () => {
        setStatements([]);
        setSelectedStatementId(null);
    };

    // Helper to convert base64 data URI to ArrayBuffer
    const dataURIToArrayBuffer = async (dataURI: string): Promise<ArrayBuffer> => {
        const base64 = dataURI.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const getStatementStartDate = (s: ExtractedStatement) => {
        if (s.startDate && !isNaN(new Date(s.startDate).getTime())) {
            return new Date(s.startDate).getTime();
        }
        if (s.transactions && s.transactions.length > 0) {
            const times = s.transactions
                .map(t => new Date(t.date).getTime())
                .filter(t => !isNaN(t));
            if (times.length > 0) return Math.min(...times);
        }
        return 0;
    };

    const getStatementEndDate = (s: ExtractedStatement) => {
        if (s.endDate && !isNaN(new Date(s.endDate).getTime())) {
            return new Date(s.endDate).getTime();
        }
        if (s.transactions && s.transactions.length > 0) {
            const times = s.transactions
                .map(t => new Date(t.date).getTime())
                .filter(t => !isNaN(t));
            if (times.length > 0) return Math.max(...times);
        }
        return 0;
    };

    // Grouping & Recon validation logic
    const groupedAccounts = useMemo(() => {
        const groups: Record<string, ExtractedStatement[]> = {};
        statements.forEach(s => {
            if (s.status === 'complete') {
                const cleanAccNum = (s.accountNumber || "UNIDENTIFIED-ACCOUNT").replace(/\s+/g, '').toUpperCase();
                if (!groups[cleanAccNum]) groups[cleanAccNum] = [];
                groups[cleanAccNum].push(s);
            }
        });

        const resultList = Object.entries(groups).map(([accNum, list]) => {
            // Sort statements chronologically
            const sortedList = [...list].sort((a, b) => {
                return getStatementStartDate(a) - getStatementStartDate(b);
            });

            // Audit flow
            const audits: {
                statementId: string;
                balanceFlowOk: boolean;
                gapWarning?: string;
                overlapWarning?: boolean;
            }[] = [];

            for (let i = 0; i < sortedList.length; i++) {
                const curr = sortedList[i];
                let balanceFlowOk = true;
                let gapWarning: string | undefined;
                let overlapWarning = false;

                if (i > 0) {
                    const prev = sortedList[i - 1];
                    // Balance Check
                    if (prev.closingBalance !== undefined && curr.openingBalance !== undefined) {
                        balanceFlowOk = Math.abs(prev.closingBalance - curr.openingBalance) < 0.02;
                    }

                    // Gap Check (e.g. days between prev end date and curr start date)
                    const prevEnd = getStatementEndDate(prev);
                    const currStart = getStatementStartDate(curr);

                    if (prevEnd > 0 && currStart > 0) {
                        const diffTime = currStart - prevEnd;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 2) {
                            const formattedPrevEnd = format(new Date(prevEnd), 'yyyy-MM-dd');
                            const formattedCurrStart = format(new Date(currStart), 'yyyy-MM-dd');
                            gapWarning = `Missing gap: ${diffDays - 1} days (from ${formattedPrevEnd} to ${formattedCurrStart})`;
                        } else if (diffDays < 0) {
                            overlapWarning = true;
                        }
                    }
                }

                audits.push({
                    statementId: curr.id,
                    balanceFlowOk,
                    gapWarning,
                    overlapWarning
                });
            }

            return {
                accountNumber: accNum,
                bankName: sortedList[0].bankName || "Unknown Bank",
                holderName: sortedList[0].holderName || "Unknown Holder",
                currency: sortedList[0].currency || "ZAR",
                statements: sortedList,
                audits
            };
        });

        return resultList;
    }, [statements]);

    // Active statement for side-by-side verification
    const activeStatement = useMemo(() => {
        return statements.find(s => s.id === selectedStatementId) || null;
    }, [statements, selectedStatementId]);

    const activeAudit = useMemo(() => {
        if (!activeStatement) return null;
        const group = groupedAccounts.find(g => g.statements.some(s => s.id === activeStatement.id));
        if (!group) return null;
        return group.audits.find(a => a.statementId === activeStatement.id) || null;
    }, [groupedAccounts, activeStatement]);

    // Format ZAR pricing
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
        }).format(price);
    };

    // Calculate totals of current viewing list
    const activeStatementCalculations = useMemo(() => {
        if (!activeStatement) return null;
        const txs = activeStatement.transactions.filter(t => !t.excluded);
        const totalDebits = txs.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
        const totalCredits = txs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const netChange = totalDebits + totalCredits;
        const startingBal = activeStatement.openingBalance || 0;
        const calculatedClosing = startingBal + netChange;
        const expectedClosing = activeStatement.closingBalance || 0;
        const diff = Math.abs(calculatedClosing - expectedClosing);
        const isMatched = diff < 0.02;

        return {
            totalDebits,
            totalCredits,
            netChange,
            calculatedClosing,
            diff,
            isMatched
        };
    }, [activeStatement]);

    // Export current transactions to Excel
    const exportStatementExcel = (stmt: ExtractedStatement) => {
        const cleanTxs = stmt.transactions
            .filter(t => !t.excluded)
            .map(t => ({
                Date: t.date,
                Description: t.description,
                Amount: t.amount
            }));

        const ws = XLSX.utils.json_to_sheet(cleanTxs);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, `${stmt.bankName || 'Bank'}_${stmt.accountNumber || 'Acc'}_Statement_${stmt.startDate || ''}.xlsx`);
        toast({ title: "Excel exported successfully" });
    };

    // Export entire Account Group to Excel
    const exportGroupExcel = (group: any) => {
        let allTxs: any[] = [];
        group.statements.forEach((stmt: ExtractedStatement) => {
            stmt.transactions.forEach(t => {
                if (!t.excluded) {
                    allTxs.push({
                        Date: t.date,
                        Description: t.description,
                        Amount: t.amount,
                        StatementPeriod: `${stmt.startDate} - ${stmt.endDate}`
                    });
                }
            });
        });

        const ws = XLSX.utils.json_to_sheet(allTxs);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Group Transactions");
        XLSX.writeFile(wb, `Merged_Recon_${group.bankName}_${group.accountNumber}.xlsx`);
        toast({ title: "Merged Excel exported successfully" });
    };

    // Post clean transactions into client cashbook in Firestore
    const handlePostToCashbook = async (group: any) => {
        if (selectedClientId === 'none' || selectedBankAccountId === 'none') {
            toast({ title: "Incomplete selection", description: "Select a Client and Cashbook Account first.", variant: "destructive" });
            return;
        }

        setIsPosting(true);
        try {
            const batch = writeBatch(db);
            let postCount = 0;

            group.statements.forEach((stmt: ExtractedStatement) => {
                stmt.transactions.forEach(t => {
                    if (!t.excluded) {
                        const isExpense = t.amount < 0;
                        const docRef = doc(collection(db, 'aiAccountantClients', selectedClientId, 'transactions'));
                        
                        batch.set(docRef, {
                            clientId: selectedClientId,
                            date: new Date(t.date).toISOString(),
                            reference: `AI-RECON-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            description: t.description.toUpperCase(),
                            amount: t.amount,
                            isExpense: isExpense,
                            bankAccountId: selectedBankAccountId,
                            status: 'new'
                        });
                        postCount++;
                    }
                });
            });

            if (postCount > 0) {
                await batch.commit();
                toast({ title: "Posting Successful!", description: `Imported ${postCount} transactions into Client cashbook.` });
                // Reset posting selection
                setSelectedClientId('none');
                setSelectedBankAccountId('none');
            } else {
                toast({ title: "No transactions to post", description: "All transactions are excluded." });
            }

        } catch (e: any) {
            console.error(e);
            toast({ title: "Posting Failed", description: e.message || "Failed to save to Firestore.", variant: "destructive" });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                        Bank Recon & Statement Extractor
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Batch process PDF statements, auto-detect bank accounts, verify range continuity, and reconcile balances.
                    </p>
                </div>
                {statements.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetStatements} className="gap-2 font-bold border-destructive/20 hover:bg-destructive/5 text-destructive">
                            <RotateCcw className="h-4 w-4" /> Reset Batch
                        </Button>
                        <Button size="sm" onClick={runAnalysis} className="gap-2 font-black shadow-md bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700" disabled={statements.every(s => s.status !== 'idle')}>
                            <Sparkles className="h-4 w-4" /> Run Batch Extraction
                        </Button>
                    </div>
                )}
            </div>

            {/* Dropzone Upload Section */}
            {statements.length === 0 && (
                <div className="border-2 border-dashed border-primary/20 rounded-2xl bg-muted/5 hover:bg-muted/10 transition-colors p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                        <Upload className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-black">Upload PDF Statement Batch</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Drag and drop bank statement PDFs or images here. We support batches containing statements from multiple accounts and banks.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Label htmlFor="statement-upload" className="cursor-pointer">
                            <div className="h-10 px-6 font-bold bg-primary hover:bg-primary/95 text-white inline-flex items-center justify-center rounded-lg shadow-sm">
                                Select Statements
                            </div>
                        </Label>
                        <Input 
                            id="statement-upload" 
                            type="file" 
                            accept="application/pdf,image/*" 
                            multiple 
                            onChange={handleFileUpload} 
                            className="hidden" 
                        />
                    </div>
                </div>
            )}

            {/* Uploaded Files Tracker */}
            {statements.length > 0 && statements.some(s => s.status !== 'complete') && (
                <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="bg-muted/30 py-3">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground">Upload Batch Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 divide-y divide-muted/50">
                        {statements.map(stmt => (
                            <div key={stmt.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold truncate max-w-md">{stmt.fileName}</p>
                                        {stmt.status === 'error' && <p className="text-xs text-destructive">{stmt.error}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    {stmt.status === 'idle' && <Badge variant="secondary" className="font-bold">Pending</Badge>}
                                    {stmt.status === 'extracting_meta' && <Badge className="bg-yellow-500 text-white font-bold">Reading header...</Badge>}
                                    {stmt.status === 'extracting_txs' && <Badge className="bg-blue-500 text-white font-bold">Reading lines...</Badge>}
                                    {stmt.status === 'complete' && <Badge className="bg-green-600 text-white font-bold">Success</Badge>}
                                    {stmt.status === 'error' && <Badge variant="destructive" className="font-bold">Error</Badge>}

                                    {stmt.status !== 'idle' && stmt.status !== 'complete' && stmt.status !== 'error' && (
                                        <Progress value={stmt.progress} className="h-1.5 w-24 shrink-0" />
                                    )}

                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive shrink-0" onClick={() => removeStatement(stmt.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Audit / Timeline Analysis for Grouped Bank Accounts */}
            {groupedAccounts.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Account Recon timelines
                    </h2>
                    
                    {groupedAccounts.map(group => (
                        <Card key={group.accountNumber} className={cn("border-primary/10 overflow-hidden shadow-md", group.accountNumber === "UNIDENTIFIED-ACCOUNT" && "border-destructive/30 shadow-destructive/5")}>
                            <CardHeader className={cn("bg-primary/5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 px-6", group.accountNumber === "UNIDENTIFIED-ACCOUNT" && "bg-destructive/5")}>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={cn("font-black bg-primary text-white", group.accountNumber === "UNIDENTIFIED-ACCOUNT" && "bg-destructive")}>{group.bankName}</Badge>
                                        <span className="text-sm font-bold text-muted-foreground font-mono">{group.accountNumber}</span>
                                        {group.accountNumber === "UNIDENTIFIED-ACCOUNT" && (
                                            <Badge variant="destructive" className="font-black animate-pulse flex items-center gap-1 text-[10px]">
                                                <AlertTriangle className="h-3.5 w-3.5" /> Unidentified Account (Please click statements below to manually correct account number)
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Holder: {group.holderName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => exportGroupExcel(group)} className="h-8 text-xs font-bold gap-1.5">
                                        <FileSpreadsheet className="h-3.5 w-3.5" /> Export Merged Excel
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Flow Timeline */}
                                <div className="relative">
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted/60 -translate-y-1/2 z-0 hidden md:block"></div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                        {group.statements.map((stmt, idx) => {
                                            const audit = group.audits[idx];
                                            const isSelected = selectedStatementId === stmt.id;
                                            
                                            return (
                                                <div 
                                                    key={stmt.id} 
                                                    onClick={() => setSelectedStatementId(stmt.id)}
                                                    className={cn(
                                                        "bg-white border rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all space-y-3 relative",
                                                        isSelected ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-muted"
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Statement {idx + 1}</span>
                                                        <div className="flex gap-1.5">
                                                            {audit.balanceFlowOk ? (
                                                                <Badge className="bg-green-100 text-green-800 text-[9px] hover:bg-green-100 border-none font-bold">Flow Balanced</Badge>
                                                            ) : (
                                                                <Badge className="bg-destructive/10 text-destructive text-[9px] hover:bg-destructive/10 border-none font-bold">Bal. Mismatch</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold font-mono">Period: {stmt.startDate} to {stmt.endDate}</p>
                                                        <p className="text-[10px] text-muted-foreground">Opening: {formatPrice(stmt.openingBalance || 0)} | Closing: {formatPrice(stmt.closingBalance || 0)}</p>
                                                    </div>

                                                    {/* Audit Warnings */}
                                                    {audit.gapWarning && (
                                                        <div className="bg-yellow-50 border border-yellow-200 text-[9.5px] font-bold text-yellow-800 p-2 rounded flex items-center gap-1.5 animate-pulse">
                                                            <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0" />
                                                            <span>{audit.gapWarning}</span>
                                                        </div>
                                                    )}
                                                    {audit.overlapWarning && (
                                                        <div className="bg-destructive/5 border border-destructive/20 text-[9.5px] font-bold text-destructive p-2 rounded flex items-center gap-1.5">
                                                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                                                            <span>Warning: Overlapping Period</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Post to Cashbook Integration Box */}
                                <div className="bg-muted/20 border rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                                <Banknote className="h-4.5 w-4.5 text-primary" /> Post directly to Client Cashbook
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground">Import the processed transactions into a client's Firestore ledger.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select Client Profile</Label>
                                            <Select value={selectedClientId} onValueChange={(val) => { setSelectedClientId(val); setSelectedBankAccountId('none'); }}>
                                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select Client..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">-- Select Client --</SelectItem>
                                                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Select Cashbook Account</Label>
                                            <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId} disabled={selectedClientId === 'none'}>
                                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select Account..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">-- Select Account --</SelectItem>
                                                    {cashbookAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.description} ({acc.accountNumber})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button 
                                            onClick={() => handlePostToCashbook(group)} 
                                            disabled={isPosting || selectedClientId === 'none' || selectedBankAccountId === 'none'} 
                                            className="font-black bg-gradient-to-r from-primary to-violet-600 hover:from-primary/95 hover:to-violet-750 text-white w-full"
                                        >
                                            {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Post Group Transactions
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Split-screen Verification Workspace (PDF vs Table) */}
            {activeStatement && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t pt-8">
                    {/* Left: Statement View */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black uppercase text-muted-foreground flex items-center gap-1.5">
                                <Eye className="h-4.5 w-4.5 text-primary" /> Statement Viewer
                            </h3>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{activeStatement.fileName}</span>
                        </div>
                        <div className="border rounded-2xl overflow-hidden bg-muted/10 h-[500px] shadow-inner relative flex items-center justify-center">
                            {activeStatement.fileBase64 ? (
                                <iframe 
                                    src={activeStatement.fileBase64} 
                                    className="w-full h-full border-none"
                                    title="Statement PDF"
                                />
                            ) : (
                                <p className="text-xs text-muted-foreground">Unable to load document preview</p>
                            )}
                        </div>

                        {/* Statement Header Details Card (Editable) */}
                        <Card className="border border-muted shadow-sm">
                            <CardHeader className="py-2.5 px-4 bg-muted/20">
                                <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3.5 w-3.5 text-primary" /> Correct Detected Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Bank Name</Label>
                                        <Input 
                                            value={activeStatement.bankName || ''} 
                                            onChange={(e) => updateStatement(activeStatement.id, { bankName: e.target.value })}
                                            className="h-8 text-xs bg-white" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className={cn("text-[9px] uppercase font-bold text-muted-foreground", activeStatement.accountNumber === "UNIDENTIFIED-ACCOUNT" && "text-destructive")}>Account Number</Label>
                                        <Input 
                                            value={activeStatement.accountNumber || ''} 
                                            onChange={(e) => updateStatement(activeStatement.id, { accountNumber: e.target.value })}
                                            className={cn("h-8 text-xs font-mono bg-white", activeStatement.accountNumber === "UNIDENTIFIED-ACCOUNT" && "border-destructive focus-visible:ring-destructive")} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Account Holder Name</Label>
                                    <Input 
                                        value={activeStatement.holderName || ''} 
                                        onChange={(e) => updateStatement(activeStatement.id, { holderName: e.target.value })}
                                        className="h-8 text-xs bg-white" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Start Date</Label>
                                        <Input 
                                            type="date"
                                            value={activeStatement.startDate || ''} 
                                            onChange={(e) => updateStatement(activeStatement.id, { startDate: e.target.value })}
                                            className="h-8 text-xs bg-white" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">End Date</Label>
                                        <Input 
                                            type="date"
                                            value={activeStatement.endDate || ''} 
                                            onChange={(e) => updateStatement(activeStatement.id, { endDate: e.target.value })}
                                            className="h-8 text-xs bg-white" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Opening Balance</Label>
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            value={activeStatement.openingBalance || 0} 
                                            onChange={(e) => updateStatement(activeStatement.id, { openingBalance: parseFloat(e.target.value) || 0 })}
                                            className="h-8 text-xs font-mono bg-white" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Closing Balance</Label>
                                        <Input 
                                            type="number"
                                            step="0.01"
                                            value={activeStatement.closingBalance || 0} 
                                            onChange={(e) => updateStatement(activeStatement.id, { closingBalance: parseFloat(e.target.value) || 0 })}
                                            className="h-8 text-xs font-mono bg-white" 
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Editable Transaction Grid */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-sm font-black uppercase text-muted-foreground flex items-center gap-1.5">
                                    <FileSpreadsheet className="h-4.5 w-4.5 text-primary" /> Extracted Transactions
                                </h3>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Editable grid. Changes only affect current export/session.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => exportStatementExcel(activeStatement)} className="h-8 text-xs font-bold gap-1.5">
                                    <Download className="h-3.5 w-3.5" /> Export Excel
                                </Button>
                            </div>
                        </div>

                        {/* Statement Metrics / Reconciliation Status */}
                        {activeStatementCalculations && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 border p-4 rounded-xl">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Opening Bal</span>
                                    <p className="text-xs font-mono font-bold">{formatPrice(activeStatement.openingBalance || 0)}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Net Extract Flow</span>
                                    <p className={cn("text-xs font-mono font-bold", activeStatementCalculations.netChange < 0 ? "text-destructive" : "text-green-600")}>
                                        {formatPrice(activeStatementCalculations.netChange)}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Projected Closing</span>
                                    <p className="text-xs font-mono font-bold">{formatPrice(activeStatementCalculations.calculatedClosing)}</p>
                                </div>
                                <div className={cn("flex flex-col justify-center items-center rounded-lg p-2 transition-colors", activeStatementCalculations.isMatched ? "bg-green-500/10 border border-green-500/20 text-green-800" : "bg-destructive/5 border border-destructive/20 text-destructive")}>
                                    {activeStatementCalculations.isMatched ? (
                                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Balanced</span>
                                    ) : (
                                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Mismatch</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Transactions Table */}
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <div className="max-h-[380px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-12 text-[10px] uppercase font-bold py-2">Incl</TableHead>
                                            <TableHead className="w-[120px] text-[10px] uppercase font-bold py-2">Date</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold py-2">Description</TableHead>
                                            <TableHead className="w-[110px] text-right text-[10px] uppercase font-bold py-2">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeStatement.transactions.map((tx, idx) => (
                                            <TableRow key={idx} className={cn(tx.excluded && "opacity-35 bg-muted/20")}>
                                                <TableCell className="p-2 text-center">
                                                    <Checkbox 
                                                        checked={!tx.excluded} 
                                                        onCheckedChange={(checked) => {
                                                            const updated = [...activeStatement.transactions];
                                                            updated[idx] = { ...updated[idx], excluded: !checked };
                                                            updateStatement(activeStatement.id, { transactions: updated });
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1">
                                                    <Input 
                                                        type="date"
                                                        value={tx.date}
                                                        onChange={(e) => {
                                                            const updated = [...activeStatement.transactions];
                                                            updated[idx] = { ...updated[idx], date: e.target.value };
                                                            updateStatement(activeStatement.id, { transactions: updated });
                                                        }}
                                                        className="h-7 text-[10.5px] border-none bg-transparent py-0"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1">
                                                    <Input 
                                                        value={tx.description}
                                                        onChange={(e) => {
                                                            const updated = [...activeStatement.transactions];
                                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                                            updateStatement(activeStatement.id, { transactions: updated });
                                                        }}
                                                        className="h-7 text-[10.5px] border-none bg-transparent py-0 font-medium font-sans truncate"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-1">
                                                    <Input 
                                                        type="number"
                                                        step="0.01"
                                                        value={tx.amount}
                                                        onChange={(e) => {
                                                            const updated = [...activeStatement.transactions];
                                                            updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value) || 0 };
                                                            updateStatement(activeStatement.id, { transactions: updated });
                                                        }}
                                                        className={cn("h-7 text-[10.5px] text-right border-none bg-transparent font-mono py-0", tx.amount < 0 ? "text-destructive" : "text-green-600")}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
