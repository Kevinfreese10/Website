'use client';

import * as React from "react"
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Save, Trash2, FolderOpen } from "lucide-react";
import { useParams, useRouter, usePathname } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, onSnapshot, query, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User, AllocatedTransaction, ImportedTransaction, ChartOfAccount, SavedReport } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx';
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from 'nanoid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    if (price === 0) return 'R 0.00';
    // Format credits as negative or brackets, standard ZAR currency formatting
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
};

function getFinancialYearStart(date: Date, endMonthName?: string) {
    const endMonth = endMonthName ? new Date(`${endMonthName} 1, 2000`).getMonth() : 1; // Default to Feb if not provided
    const currentMonth = date.getMonth();
    let year = date.getFullYear();

    if (currentMonth > endMonth) {
        return new Date(year, endMonth + 1, 1);
    } else {
        return new Date(year - 1, endMonth + 1, 1);
    }
}

function calculateBalanceSheetData(client: User, transactions: (ImportedTransaction | AllocatedTransaction)[], dateRange?: DateRange) {
    const balances = new Map<string, number>();
    client.chartOfAccounts?.forEach(acc => balances.set(acc.id, 0));

    const reportStartDate = dateRange?.from ? startOfDay(dateRange.from) : getFinancialYearStart(new Date(), client.yearEnd);
    const reportEndDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();
    
    const retainedIncomeAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '9000-004');
    const vatControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-008');
    const supplierControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-000');
    const customerControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001');
    
    let priorPeriodNetIncome = 0;
    let currentPeriodNetIncome = 0;

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const isPriorPeriod = txDate < reportStartDate;
        const isCurrentPeriod = txDate >= reportStartDate && txDate <= reportEndDate;

        const processEntry = (accountId: string, amount: number, type?: string) => {
            let targetId = accountId;
            if (type === 'supplier') targetId = supplierControlAccount?.id || '7000-000';
            else if (type === 'customer') targetId = customerControlAccount?.id || '8000-001';

            const account = client.chartOfAccounts?.find(a => a.id === targetId);
            if (!account) return;

            if (isPriorPeriod) {
                if (account.section === 'Income Statement') {
                    priorPeriodNetIncome -= amount; // Income is credit (negative), expenses are debit (positive)
                } else {
                    balances.set(targetId, (balances.get(targetId) || 0) + amount);
                }
            } else if (isCurrentPeriod) {
                if (account.section === 'Income Statement') {
                    currentPeriodNetIncome -= amount;
                } else {
                    balances.set(targetId, (balances.get(targetId) || 0) + amount);
                }
            }
        };
        
        if (tx.bankAccountId === 'JOURNAL') {
            if (tx.allocatedTo?.value) {
                processEntry(tx.allocatedTo.value, tx.amount, tx.allocatedTo.type);
            }
        } 
        else { // Bank Transactions
            const inclusiveAmount = tx.amount;
            const isStandardVat = client.isVatRegistered && (tx.vatType === 'standard_rated_purchases' || tx.vatType === 'standard_rated_sales' || tx.vatType === 'capital_goods_purchases');
            
            let vatAmount = 0;
            let exclusiveAmount = inclusiveAmount;
            
            if (isStandardVat) {
                vatAmount = (inclusiveAmount / 1.15) * 0.15;
                exclusiveAmount = inclusiveAmount - vatAmount;
            }

            processEntry(tx.bankAccountId, inclusiveAmount);

            let contraAccountId = '9500-001';
            let contraType = 'account';
            if (((tx.status as string) === 'allocated' || tx.status === 'reviewed') && tx.allocatedTo) {
                contraAccountId = tx.allocatedTo.value;
                contraType = tx.allocatedTo.type || 'account';
            }
            processEntry(contraAccountId, -exclusiveAmount, contraType);

            if (isStandardVat && vatControlAccount) {
                processEntry(vatControlAccount.id, -vatAmount);
            }
        }
    });
    
    if (retainedIncomeAccount) {
        balances.set(retainedIncomeAccount.id, (balances.get(retainedIncomeAccount.id) || 0) - priorPeriodNetIncome);
    }
    
    return { balances, currentPeriodNetIncome };
}

function BalanceSheetReport({ client, transactions, dateRange, comparativeDateRange }: { client: User, transactions: (ImportedTransaction | AllocatedTransaction)[], dateRange?: DateRange, comparativeDateRange?: DateRange }) {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/dashboard');
    const basePath = isDashboard ? `/dashboard/ai-accountant/${client.id}` : `/admin/ai-accountant/${client.id}`;
    
    const primaryRes = useMemo(() => calculateBalanceSheetData(client, transactions, dateRange), [client, transactions, dateRange]);
    const showComparison = !!comparativeDateRange;
    const comparativeRes = useMemo(() => {
        return showComparison ? calculateBalanceSheetData(client, transactions, comparativeDateRange) : { balances: new Map<string, number>(), currentPeriodNetIncome: 0 };
    }, [client, transactions, comparativeDateRange, showComparison]);

    const formatData = useMemo(() => {
        const getGroup = (acc: ChartOfAccount, primaryVal: number, compVal: number) => {
            const num = acc.accountNumber;
            let type: 'asset_noncurrent' | 'asset_current' | 'equity' | 'liability_noncurrent' | 'liability_current' | 'suspense' = 'suspense';
            
            if (num.startsWith('5000-')) type = 'asset_noncurrent';
            else if (num.startsWith('8000-') || num.startsWith('8400-')) type = 'asset_current';
            else if (num.startsWith('9000-')) type = 'equity';
            else if (num.startsWith('7500-')) type = 'liability_noncurrent';
            else if (num.startsWith('7000-') || num.startsWith('9500-')) type = 'liability_current';
            
            return {
                ...acc,
                balance: primaryVal,
                comparativeBalance: compVal,
                type
            };
        };

        const list = client.chartOfAccounts?.map(acc => {
            const pVal = primaryRes.balances.get(acc.id) || 0;
            const cVal = showComparison ? (comparativeRes.balances.get(acc.id) || 0) : 0;
            return getGroup(acc, pVal, cVal);
        }).filter(a => Math.abs(a.balance) >= 0.01 || (showComparison && Math.abs(a.comparativeBalance) >= 0.01)) || [];

        const assetNonCurrent = list.filter(a => a.type === 'asset_noncurrent');
        const assetCurrent = list.filter(a => a.type === 'asset_current');
        const equityList = list.filter(a => a.type === 'equity');
        const liabilityNonCurrent = list.filter(a => a.type === 'liability_noncurrent');
        const liabilityCurrent = list.filter(a => a.type === 'liability_current');

        // Sum Asset balances (positive asset balances are debit, negative are credit)
        const totalNonCurrentAssets = assetNonCurrent.reduce((sum, item) => sum + item.balance, 0);
        const totalCurrentAssets = assetCurrent.reduce((sum, item) => sum + item.balance, 0);
        const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

        const compTotalNonCurrentAssets = assetNonCurrent.reduce((sum, item) => sum + item.comparativeBalance, 0);
        const compTotalCurrentAssets = assetCurrent.reduce((sum, item) => sum + item.comparativeBalance, 0);
        const compTotalAssets = compTotalNonCurrentAssets + compTotalCurrentAssets;

        // Sum Equity and Liabilities (credits are negative in calculation, so invert sign for presentation)
        const totalCapitalEquity = -equityList.reduce((sum, item) => sum + item.balance, 0);
        const totalEquity = totalCapitalEquity + primaryRes.currentPeriodNetIncome;
        
        const compTotalCapitalEquity = -equityList.reduce((sum, item) => sum + item.comparativeBalance, 0);
        const compTotalEquity = compTotalCapitalEquity + comparativeRes.currentPeriodNetIncome;

        const totalNonCurrentLiabilities = -liabilityNonCurrent.reduce((sum, item) => sum + item.balance, 0);
        const totalCurrentLiabilities = -liabilityCurrent.reduce((sum, item) => sum + item.balance, 0);
        const totalLiabilities = totalNonCurrentLiabilities + totalCurrentLiabilities;

        const compTotalNonCurrentLiabilities = -liabilityNonCurrent.reduce((sum, item) => sum + item.comparativeBalance, 0);
        const compTotalCurrentLiabilities = -liabilityCurrent.reduce((sum, item) => sum + item.comparativeBalance, 0);
        const compTotalLiabilities = compTotalNonCurrentLiabilities + compTotalCurrentLiabilities;

        const totalEquityAndLiabilities = totalEquity + totalLiabilities;
        const compTotalEquityAndLiabilities = compTotalEquity + compTotalLiabilities;

        return {
            assetNonCurrent, assetCurrent, totalNonCurrentAssets, totalCurrentAssets, totalAssets,
            compTotalNonCurrentAssets, compTotalCurrentAssets, compTotalAssets,
            equityList, totalCapitalEquity, totalEquity,
            compTotalCapitalEquity, compTotalEquity,
            liabilityNonCurrent, liabilityCurrent, totalNonCurrentLiabilities, totalCurrentLiabilities, totalLiabilities,
            compTotalNonCurrentLiabilities, compTotalCurrentLiabilities, compTotalLiabilities,
            totalEquityAndLiabilities, compTotalEquityAndLiabilities
        };
    }, [client.chartOfAccounts, primaryRes, comparativeRes, showComparison]);

    const handleDownloadExcel = () => {
        const data: any[] = [];
        const addSection = (title: string, list: any[], total: number, compTotal: number, invert = false) => {
            data.push({ A: title, B: '', C: '' });
            list.forEach(item => {
                const val = invert ? -item.balance : item.balance;
                const cval = invert ? -item.comparativeBalance : item.comparativeBalance;
                const row: any = { A: `  ${item.description} (${item.accountNumber})`, B: val };
                if (showComparison) row.C = cval;
                data.push(row);
            });
            const totRow: any = { A: `Total ${title}`, B: total };
            if (showComparison) totRow.C = compTotal;
            data.push(totRow);
            data.push({});
        };

        addSection('Non-Current Assets', formatData.assetNonCurrent, formatData.totalNonCurrentAssets, formatData.compTotalNonCurrentAssets);
        addSection('Current Assets', formatData.assetCurrent, formatData.totalCurrentAssets, formatData.compTotalCurrentAssets);
        data.push({ A: 'TOTAL ASSETS', B: formatData.totalAssets, C: showComparison ? formatData.compTotalAssets : '' });
        data.push({});

        addSection('Equity Capital', formatData.equityList, formatData.totalCapitalEquity, formatData.compTotalCapitalEquity, true);
        data.push({ A: '  Current Year Net Profit', B: primaryRes.currentPeriodNetIncome, C: showComparison ? comparativeRes.currentPeriodNetIncome : '' });
        data.push({ A: 'Total Equity', B: formatData.totalEquity, C: showComparison ? formatData.compTotalEquity : '' });
        data.push({});

        addSection('Non-Current Liabilities', formatData.liabilityNonCurrent, formatData.totalNonCurrentLiabilities, formatData.compTotalNonCurrentLiabilities, true);
        addSection('Current Liabilities', formatData.liabilityCurrent, formatData.totalCurrentLiabilities, formatData.compTotalCurrentLiabilities, true);
        data.push({ A: 'TOTAL EQUITY & LIABILITIES', B: formatData.totalEquityAndLiabilities, C: showComparison ? formatData.compTotalEquityAndLiabilities : '' });

        const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
        worksheet['!cols'] = [{ wch: 45 }, { wch: 20 }, ...(showComparison ? [{ wch: 20 }] : [])];
        
        Object.keys(worksheet).forEach(key => {
             if (key.startsWith('B') || key.startsWith('C')) {
                const cell = worksheet[key];
                if (cell.v !== null && typeof cell.v === 'number') {
                    cell.t = 'n';
                    cell.z = 'R #,##0.00';
                }
            }
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Balance Sheet");
        XLSX.writeFile(workbook, `${client.companyName || client.name}-Balance-Sheet-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const renderRow = (desc: string, pVal: number, cVal: number, invert = false) => {
        const primary = invert ? -pVal : pVal;
        const comp = invert ? -cVal : cVal;
        return (
            <TableRow key={desc}>
                <TableCell className="pl-8">{desc}</TableCell>
                <TableCell className="text-right font-mono">{formatPrice(primary)}</TableCell>
                {showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(comp)}</TableCell>}
            </TableRow>
        );
    };

    return (
        <>
            <div className="max-h-[70vh] overflow-y-auto space-y-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[350px]">Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            {showComparison && <TableHead className="text-right">Comparative</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="font-bold bg-muted/50"><TableCell colSpan={showComparison ? 3 : 2}>Assets</TableCell></TableRow>
                        <TableRow className="font-semibold italic"><TableCell className="pl-4" colSpan={showComparison ? 3 : 2}>Non-Current Assets</TableCell></TableRow>
                        {formatData.assetNonCurrent.map(item => renderRow(item.description, item.balance, item.comparativeBalance))}
                        <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Non-Current Assets</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalNonCurrentAssets)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalNonCurrentAssets)}</TableCell>}</TableRow>

                        <TableRow className="font-semibold italic"><TableCell className="pl-4" colSpan={showComparison ? 3 : 2}>Current Assets</TableCell></TableRow>
                        {formatData.assetCurrent.map(item => renderRow(item.description, item.balance, item.comparativeBalance))}
                        <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Current Assets</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalCurrentAssets)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalCurrentAssets)}</TableCell>}</TableRow>

                        <TableRow className="font-bold text-lg bg-primary/5 border-t-2 border-b-2"><TableCell>Total Assets</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalAssets)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalAssets)}</TableCell>}</TableRow>

                        <TableRow><TableCell colSpan={showComparison ? 3 : 2}>&nbsp;</TableCell></TableRow>

                        <TableRow className="font-bold bg-muted/50"><TableCell colSpan={showComparison ? 3 : 2}>Equity & Liabilities</TableCell></TableRow>
                        <TableRow className="font-semibold italic"><TableCell className="pl-4" colSpan={showComparison ? 3 : 2}>Equity</TableCell></TableRow>
                        {formatData.equityList.map(item => renderRow(item.description, item.balance, item.comparativeBalance, true))}
                        <TableRow>
                            <TableCell className="pl-8">Current Year Net Profit</TableCell>
                            <TableCell className="text-right font-mono">{formatPrice(primaryRes.currentPeriodNetIncome)}</TableCell>
                            {showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(comparativeRes.currentPeriodNetIncome)}</TableCell>}
                        </TableRow>
                        <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Capital & Equity</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalEquity)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalEquity)}</TableCell>}</TableRow>

                        <TableRow className="font-semibold italic"><TableCell className="pl-4" colSpan={showComparison ? 3 : 2}>Non-Current Liabilities</TableCell></TableRow>
                        {formatData.liabilityNonCurrent.map(item => renderRow(item.description, item.balance, item.comparativeBalance, true))}
                        <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Non-Current Liabilities</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalNonCurrentLiabilities)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalNonCurrentLiabilities)}</TableCell>}</TableRow>

                        <TableRow className="font-semibold italic"><TableCell className="pl-4" colSpan={showComparison ? 3 : 2}>Current Liabilities</TableCell></TableRow>
                        {formatData.liabilityCurrent.map(item => renderRow(item.description, item.balance, item.comparativeBalance, true))}
                        <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Current Liabilities</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalCurrentLiabilities)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalCurrentLiabilities)}</TableCell>}</TableRow>

                        <TableRow className="font-bold text-lg bg-primary/5 border-t-2 border-b-2"><TableCell>Total Equity & Liabilities</TableCell><TableCell className="text-right font-mono">{formatPrice(formatData.totalEquityAndLiabilities)}</TableCell>{showComparison && <TableCell className="text-right font-mono bg-muted/50">{formatPrice(formatData.compTotalEquityAndLiabilities)}</TableCell>}</TableRow>
                    </TableBody>
                </Table>
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={handleDownloadExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                </Button>
            </DialogFooter>
        </>
    );
}

export default function BalanceSheetPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;

    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [comparativeDateRange, setComparativeDateRange] = React.useState<DateRange | undefined>(undefined);
    const [showComparison, setShowComparison] = useState(false);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!clientId) return;

        const fetchClientData = async () => {
             const docRef = doc(db, 'aiAccountantClients', clientId);
             const docSnap = await getDoc(docRef);
             if (docSnap.exists()) {
                setClient({ id: docSnap.id, ...docSnap.data() } as User);
             }
             setIsLoading(false);
        };
        fetchClientData();

        const unsubscribe = onSnapshot(query(collection(db, 'aiAccountantClients', clientId, 'transactions')), 
            (snapshot) => {
                const fetchedTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (ImportedTransaction | AllocatedTransaction)));
                setTransactions(fetchedTransactions);
                if (isLoading) setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching transactions:", error);
                if (isLoading) setIsLoading(false);
            }
        );
        
        return () => unsubscribe();
    }, [clientId, isLoading]);

    const getReportDateString = () => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return `as at ${format(new Date(), "dd MMMM yyyy")}`;
        }
        if (dateRange.from && dateRange.to) {
            return `for the period ${format(dateRange.from, "dd MMMM yyyy")} to ${format(dateRange.to, "dd MMMM yyyy")}`;
        }
        if (dateRange.from) {
            return `from ${format(dateRange.from, "dd MMMM yyyy")}`;
        }
        if (dateRange.to) {
            return `up to ${format(dateRange.to, "dd MMMM yyyy")}`;
        }
        return `as at ${format(new Date(), "dd MMMM yyyy")}`;
    }

    const getComparativeDateString = () => {
        if (!showComparison || !comparativeDateRange || (!comparativeDateRange.from && !comparativeDateRange.to)) {
            return `no comparison period`;
        }
        if (comparativeDateRange.from && comparativeDateRange.to) {
            return `vs ${format(comparativeDateRange.from, "dd MMM yy")} to ${format(comparativeDateRange.to, "dd MMM yy")}`;
        }
        return `vs selected period`;
    }

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Balance Sheet Report</CardTitle>
                    <CardDescription>
                        Generate a Statement of Financial Position for a specific period and compare it against another.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                          <div className="space-y-2">
                             <Label className="font-semibold">Primary Period</Label>
                             <DateRangePicker onDateChange={setDateRange} financialYearEnd={client?.yearEnd} />
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center space-x-2">
                                 <Switch id="show-comparison" checked={showComparison} onCheckedChange={setShowComparison}/>
                                 <Label htmlFor="show-comparison" className="font-semibold">Comparison Period</Label>
                             </div>
                             {showComparison && (
                                 <DateRangePicker onDateChange={setComparativeDateRange} financialYearEnd={client?.yearEnd} />
                             )}
                          </div>
                     </div>
                     <Separator />
                    <div className="flex flex-col sm:flex-row gap-2">
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : client ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>View Report</Button>
                                </DialogTrigger>
                                 <DialogContent className="sm:max-w-4xl">
                                    <DialogHeader className="text-center mb-4">
                                        <DialogTitle className="text-lg">{client.companyName || client.name}</DialogTitle>
                                        <DialogDescription>
                                            Balance Sheet {getReportDateString()} <br/> <span className="font-semibold">{getComparativeDateString()}</span>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <BalanceSheetReport 
                                        client={client} 
                                        transactions={transactions} 
                                        dateRange={dateRange} 
                                        comparativeDateRange={showComparison ? comparativeDateRange : undefined}
                                    />
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <p>Client data could not be loaded.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
