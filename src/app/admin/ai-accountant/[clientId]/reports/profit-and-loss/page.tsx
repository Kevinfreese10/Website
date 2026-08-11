'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, onSnapshot, query, writeBatch, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { User, AllocatedTransaction, ImportedTransaction, ChartOfAccount } from '@/lib/types';
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
import { format, startOfDay, endOfDay } from 'date-fns';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import * as XLSX from 'xlsx-js-style';
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Calculator } from "lucide-react";

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    if (price === 0) return 'R 0.00';
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


function ProfitAndLossReport({ client, transactions, dateRange, onPostJournal }: { client: User, transactions: (ImportedTransaction | AllocatedTransaction)[], dateRange?: DateRange, onPostJournal: (taxAmount: number) => void }) {
    
    const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
    const [taxMode, setTaxMode] = useState<'standard' | 'sbc'>('standard');
    const [taxYear, setTaxYear] = useState<string>('2026');
    const [assessedLossBf, setAssessedLossBf] = useState<number>(0);
    
    const reportData = useMemo(() => {
        const balances = new Map<string, number>();
        let provisionalTaxAccountId = '';
        client.chartOfAccounts?.forEach(acc => {
            if (acc.section === 'Income Statement' || acc.accountNumber === '8000-003') {
                balances.set(acc.id, 0);
                if (acc.accountNumber === '8000-003') provisionalTaxAccountId = acc.id;
            }
        });

        const supplierControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '7000-000');
        const customerControlAccount = client.chartOfAccounts?.find(acc => acc.accountNumber === '8000-001');
        
        const reportStartDate = dateRange?.from ? startOfDay(dateRange.from) : getFinancialYearStart(new Date(), client.yearEnd);
        const reportEndDate = dateRange?.to ? endOfDay(dateRange.to) : new Date();

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate < reportStartDate || txDate > reportEndDate) {
                return;
            }

            const processEntry = (accountId: string, amount: number, type?: string) => {
                let targetId = accountId;
                if (type === 'supplier') targetId = supplierControlAccount?.id || '7000-000';
                else if (type === 'customer') targetId = customerControlAccount?.id || '8000-001';

                const account = client.chartOfAccounts?.find(a => a.id === targetId);
                if (account && (account.section === 'Income Statement' || account.accountNumber === '8000-003') && balances.has(targetId)) {
                    balances.set(targetId, (balances.get(targetId) || 0) + amount);
                }
            };
            
            if (tx.bankAccountId === 'JOURNAL') {
                if (tx.allocatedTo?.value) {
                    processEntry(tx.allocatedTo.value, tx.amount, tx.allocatedTo.type);
                }
            } else { // Bank Transactions
                const inclusiveAmount = tx.amount;
                const isStandardVat = client.isVatRegistered && (tx.vatType === 'standard_rated_purchases' || tx.vatType === 'standard_rated_sales' || tx.vatType === 'capital_goods_purchases');
                
                let exclusiveAmount = inclusiveAmount;
                if (isStandardVat) {
                    exclusiveAmount = inclusiveAmount / 1.15;
                }

                // Updated: Include 'reviewed' status to correctly map Smart Match Queue items
                const contraAccountId = ((tx.status as string) === 'allocated' || tx.status === 'reviewed') && tx.allocatedTo 
                    ? tx.allocatedTo.value 
                    : '9500-001'; // Suspense Account

                const contraType = ((tx.status as string) === 'allocated' || tx.status === 'reviewed') && tx.allocatedTo
                    ? tx.allocatedTo.type
                    : 'account';
                
                processEntry(contraAccountId, -exclusiveAmount, contraType);
            }
        });

        const incomeAccounts = client.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('1000-')).sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)) || [];
        const cosAccounts = client.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('2000-')).sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)) || [];
        const expenseAccounts = client.chartOfAccounts?.filter(acc => acc.accountNumber.startsWith('3000-') || acc.accountNumber.startsWith('4000-')).sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)) || [];

        const income = incomeAccounts.map(acc => ({ ...acc, balance: balances.get(acc.id) || 0 })).filter(a => a.balance !== 0);
        const costOfSales = cosAccounts.map(acc => ({ ...acc, balance: balances.get(acc.id) || 0 })).filter(a => a.balance !== 0);
        const expenses = expenseAccounts.map(acc => ({ ...acc, balance: balances.get(acc.id) || 0 })).filter(a => a.balance !== 0);

        const totalIncome = income.reduce((sum, acc) => sum - acc.balance, 0); // Income is credit, so balance is negative
        const totalCostOfSales = costOfSales.reduce((sum, acc) => sum + acc.balance, 0);
        const grossProfit = totalIncome - totalCostOfSales;
        const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
        const netProfit = grossProfit - totalExpenses;
        const provisionalTaxPaid = provisionalTaxAccountId ? (balances.get(provisionalTaxAccountId) || 0) : 0;

        return { income, costOfSales, expenses, totalIncome, totalCostOfSales, grossProfit, totalExpenses, netProfit, provisionalTaxPaid };

    }, [client, dateRange, transactions]);
    
    const taxCalculation = useMemo(() => {
        const baseTaxable = reportData.netProfit > 0 ? reportData.netProfit : 0;
        const taxableIncome = Math.max(0, baseTaxable - assessedLossBf);
        let taxAmount = 0;
        let taxRateLabel = '';
        let calculationBreakdown = '';
        
        const lossAppliedText = assessedLossBf > 0 
            ? `Net Profit: ${formatPrice(baseTaxable)}\nLess Assessed Loss B/Fwd: (${formatPrice(assessedLossBf)})\nTaxable Income: ${formatPrice(taxableIncome)}\n\n`
            : '';

        if (taxMode === 'standard') {
            const rate = taxYear === '2023' ? 0.28 : 0.27;
            taxAmount = taxableIncome * rate;
            taxRateLabel = `${(rate * 100).toFixed(0)}%`;
            calculationBreakdown = lossAppliedText + `${formatPrice(taxableIncome)} × ${(rate * 100).toFixed(0)}% = ${formatPrice(taxAmount)}`;
        } else {
            // SBC Brackets
            let bracket1 = 95750, bracket2 = 365000, bracket3 = 550000;
            let base3 = 18848, base4 = 57698;
            let rate2 = 0.07, rate3 = 0.21, rate4 = 0.27;

            if (taxYear === '2023') {
                bracket1 = 91250;
                base3 = 19163;
                base4 = 58013;
                rate4 = 0.28;
            }
            
            if (taxableIncome <= bracket1) {
                taxAmount = 0;
                taxRateLabel = '0% (SBC)';
                calculationBreakdown = lossAppliedText + `R0 – ${formatPrice(bracket1)} bracket (0%) = R 0.00`;
            } else if (taxableIncome <= bracket2) {
                taxAmount = (taxableIncome - bracket1) * rate2;
                taxRateLabel = `${(rate2 * 100).toFixed(0)}% (SBC)`;
                calculationBreakdown = lossAppliedText + `${formatPrice(taxableIncome)} - ${formatPrice(bracket1)} = ${formatPrice(taxableIncome - bracket1)}\n${formatPrice(taxableIncome - bracket1)} × ${(rate2 * 100).toFixed(0)}% = ${formatPrice(taxAmount)}`;
            } else if (taxableIncome <= bracket3) {
                taxAmount = base3 + (taxableIncome - bracket2) * rate3;
                taxRateLabel = 'SBC Brackets';
                calculationBreakdown = lossAppliedText + `Base: ${formatPrice(base3)}\nPlus: (${formatPrice(taxableIncome)} - ${formatPrice(bracket2)}) × ${(rate3 * 100).toFixed(0)}%\n= ${formatPrice(base3)} + ${formatPrice((taxableIncome - bracket2) * rate3)}\n= ${formatPrice(taxAmount)}`;
            } else {
                taxAmount = base4 + (taxableIncome - bracket3) * rate4;
                taxRateLabel = 'SBC Brackets';
                calculationBreakdown = lossAppliedText + `Base: ${formatPrice(base4)}\nPlus: (${formatPrice(taxableIncome)} - ${formatPrice(bracket3)}) × ${(rate4 * 100).toFixed(0)}%\n= ${formatPrice(base4)} + ${formatPrice((taxableIncome - bracket3) * rate4)}\n= ${formatPrice(taxAmount)}`;
            }
        }
        
        const amountPayable = taxAmount - reportData.provisionalTaxPaid;

        return {
            taxMode,
            taxRateLabel,
            taxableIncome,
            taxAmount,
            calculationBreakdown,
            provisionalTaxPaid: reportData.provisionalTaxPaid,
            amountPayable,
            netProfitAfterTax: reportData.netProfit - taxAmount,
        };
    }, [reportData.netProfit, reportData.provisionalTaxPaid, taxMode, taxYear, assessedLossBf]);

     const handleDownloadExcel = () => {
        let excelData: any[] = [
            { A: 'Income', B: '' },
            ...reportData.income.map((item: any) => ({ A: item.description, B: -item.balance })),
            { A: 'Total Income', B: reportData.totalIncome },
            {},
            { A: 'Cost of Sales', B: '' },
            ...reportData.costOfSales.map((item: any) => ({ A: item.description, B: item.balance })),
            { A: 'Total Cost of Sales', B: reportData.totalCostOfSales },
            {},
            { A: 'Gross Profit', B: reportData.grossProfit },
            {},
            { A: 'Expenses', B: '' },
            ...reportData.expenses.map((item: any) => ({ A: item.description, B: item.balance })),
            { A: 'Total Expenses', B: reportData.totalExpenses },
            {},
            { A: 'Net Profit / (Loss) Before Tax', B: reportData.netProfit },
             {},
            { A: `Income Tax Expense (${taxCalculation.taxMode === 'standard' ? '27%' : 'SBC'})`, B: -taxCalculation.taxAmount },
            { A: 'Net Profit / (Loss) After Tax', B: taxCalculation.netProfitAfterTax },
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(excelData, { skipHeader: true });
        worksheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
        
        Object.keys(worksheet).forEach(key => {
             if (key.startsWith('B')) {
                const cell = worksheet[key];
                if (cell.v !== null && typeof cell.v === 'number') {
                    cell.t = 'n';
                    cell.z = '"R" #,##0.00';
                }
            }
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Profit and Loss");
        const today = new Date().toISOString().split('T')[0];
        const fileName = `${client.companyName || client.name}-Profit-Loss-${today}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <>
            <div className="max-h-[70vh] overflow-y-auto space-y-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="font-bold bg-muted/50"><TableCell colSpan={2}>Income</TableCell></TableRow>
                        {reportData.income.map((item: any) => (
                            <TableRow key={item.id}><TableCell className="pl-8">{item.description}</TableCell><TableCell className="text-right font-mono">{formatPrice(-item.balance)}</TableCell></TableRow>
                        ))}
                        <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Income</TableCell><TableCell className="text-right font-mono">{formatPrice(reportData.totalIncome)}</TableCell></TableRow>
                        
                        <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>

                        <TableRow className="font-bold bg-muted/50"><TableCell colSpan={2}>Cost of Sales</TableCell></TableRow>
                        {reportData.costOfSales.map((item: any) => (
                             <TableRow key={item.id}><TableCell className="pl-8">{item.description}</TableCell><TableCell className="text-right font-mono">{formatPrice(item.balance)}</TableCell></TableRow>
                        ))}
                         <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Cost of Sales</TableCell><TableCell className="text-right font-mono">{formatPrice(reportData.totalCostOfSales)}</TableCell></TableRow>
                         
                        <TableRow className="font-bold text-lg bg-muted/50 border-t-2 border-b-2"><TableCell>Gross Profit</TableCell><TableCell className="text-right font-mono">{formatPrice(reportData.grossProfit)}</TableCell></TableRow>
                        
                        <TableRow><TableCell colSpan={2}>&nbsp;</TableCell></TableRow>
                        
                        <TableRow className="font-bold bg-muted/50"><TableCell colSpan={2}>Operating Expenses</TableCell></TableRow>
                        {reportData.expenses.map((item: any) => (
                            <TableRow key={item.id}><TableCell className="pl-8">{item.description}</TableCell><TableCell className="text-right font-mono">{formatPrice(item.balance)}</TableCell></TableRow>
                        ))}
                         <TableRow className="font-semibold border-t"><TableCell className="pl-8">Total Expenses</TableCell><TableCell className="text-right font-mono">{formatPrice(reportData.totalExpenses)}</TableCell></TableRow>

                    </TableBody>
                    <TableFooter>
                         <TableRow className="font-bold text-lg bg-muted/50 border-t-2"><TableCell>Net Profit / (Loss) Before Tax</TableCell><TableCell className="text-right font-mono">{formatPrice(reportData.netProfit)}</TableCell></TableRow>
                    </TableFooter>
                </Table>
            </div>
             <DialogFooter className="mt-4 flex justify-between">
                <Button variant="outline" onClick={handleDownloadExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                </Button>
                <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" disabled={reportData.netProfit <= 0}><Calculator className="mr-2 h-4 w-4"/>Calculate Tax & Post Journal</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Income Tax Calculation</DialogTitle>
                            <DialogDescription>Select the tax calculation scheme for provisioning purposes.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                <span className="text-sm font-semibold text-muted-foreground">Financial Year:</span>
                                <Select value={taxYear} onValueChange={setTaxYear}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2026">2026 (Ending 28 Feb 2026)</SelectItem>
                                        <SelectItem value="2025">2025 (Ending 28 Feb 2025)</SelectItem>
                                        <SelectItem value="2024">2024 (Ending 29 Feb 2024)</SelectItem>
                                        <SelectItem value="2023">2023 (Ending 28 Feb 2023)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                                <span className="text-sm font-semibold text-muted-foreground">Tax Scheme:</span>
                                <Select value={taxMode} onValueChange={(v: 'standard' | 'sbc') => setTaxMode(v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard Corporate</SelectItem>
                                        <SelectItem value="sbc">Small Business Corp (SBC)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Net Profit Before Tax:</span><span className="font-semibold">{formatPrice(reportData.netProfit)}</span></div>
                            
                            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                                <span className="text-sm font-semibold text-muted-foreground">Assessed Loss B/Fwd:</span>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={assessedLossBf === 0 ? '' : assessedLossBf}
                                        onChange={(e) => setAssessedLossBf(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="pl-7 h-10 text-xs font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Taxable Income:</span><span className="font-semibold">{formatPrice(taxCalculation.taxableIncome)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Effective Scheme:</span><span className="font-semibold">{taxCalculation.taxRateLabel}</span></div>
                            
                            <div className="bg-muted p-3 rounded-md text-xs font-mono whitespace-pre-line text-muted-foreground mt-2 border">
                                {taxCalculation.calculationBreakdown}
                            </div>
                            
                            <Separator />
                            <div className="flex justify-between items-center text-lg"><span className="font-bold">Estimated Tax Expense:</span><span className="font-bold text-destructive">{formatPrice(taxCalculation.taxAmount)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Less: Provisional Tax Paid:</span><span className="font-semibold text-green-600">({formatPrice(taxCalculation.provisionalTaxPaid)})</span></div>
                            <div className="flex justify-between items-center text-md font-semibold"><span className="">Amount {taxCalculation.amountPayable >= 0 ? 'Payable' : 'Refundable'}:</span><span className={taxCalculation.amountPayable >= 0 ? 'text-destructive' : 'text-green-600'}>{formatPrice(Math.abs(taxCalculation.amountPayable))}</span></div>
                            <Separator />
                            <div className="flex justify-between items-center"><span className="text-muted-foreground">Net Profit After Tax:</span><span className="font-semibold">{formatPrice(taxCalculation.netProfitAfterTax)}</span></div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsTaxDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => { onPostJournal(taxCalculation.taxAmount); setIsTaxDialogOpen(false); }}>Post Tax Journal</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogFooter>
        </>
    );
}

export default function ProfitAndLossPage() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const clientId = params.clientId as string;

    const isDashboard = pathname.startsWith('/dashboard');
    const basePath = isDashboard ? `/dashboard/ai-accountant/${clientId}` : `/admin/ai-accountant/${clientId}`;

    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const { toast } = useToast();
    
    useEffect(() => {
        const fetchClientData = async () => {
            if (!clientId) return;
            setIsLoading(true);
            try {
                const clientRef = doc(db, 'aiAccountantClients', clientId);
                const clientSnap = await getDoc(clientRef);
                if (clientSnap.exists()) {
                    setClient({ id: clientSnap.id, ...clientSnap.data() } as User);
                }
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClientData();
        
        const transUnsubscribe = onSnapshot(query(collection(db, 'aiAccountantClients', clientId, 'transactions')), snapshot => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (ImportedTransaction | AllocatedTransaction)));
            setTransactions(fetched);
            setIsLoading(false);
        });
        
        return () => transUnsubscribe();
    }, [clientId]);
    
    const handleGoToJournal = (taxAmount: number) => {
        if (!client || taxAmount <= 0) return;

        const taxExpenseAccount = client.chartOfAccounts?.find((acc: any) => acc.accountNumber === '3000-056');
        const taxPayableAccount = client.chartOfAccounts?.find((acc: any) => acc.accountNumber === '7000-015');

        if (!taxExpenseAccount || !taxPayableAccount) {
            toast({ title: 'Error', description: 'Tax accounts not found in Chart of Accounts.', variant: 'destructive'});
            return;
        }

        const journalDate = (dateRange?.to || new Date()).toISOString();
        const journalRef = `TAX-${format(dateRange?.to || new Date(), 'yyyy-MM-dd')}`;
        
        const params = new URLSearchParams({
            date: journalDate,
            reference: journalRef,
            line1_debit: taxAmount.toFixed(2),
            line1_desc: 'Income Tax Expense Provision',
            line1_acc: taxExpenseAccount.id,
            line2_credit: taxAmount.toFixed(2),
            line2_desc: 'Income Tax Provision',
            line2_acc: taxPayableAccount.id,
        });

        router.push(`${basePath}/general-journal?${params.toString()}`);
    };


    const getReportDateString = () => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return `for the current financial year`;
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
        return `for the current financial year`;
    }

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Profit & Loss Statement</CardTitle>
                    <CardDescription>
                        Generate an income statement for a specific period.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-6 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-4">
                            <p className="text-sm font-medium">Date Range</p>
                            <DateRangePicker onDateChange={setDateRange} financialYearEnd={client?.yearEnd} />
                        </div>
                        <div className="flex justify-start pt-4">
                             {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : client ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>View Report</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-3xl">
                                        <DialogHeader className="text-center mb-4">
                                            <DialogTitle className="text-lg">{client.companyName || client.name}</DialogTitle>
                                            <DialogDescription>
                                                Profit & Loss Statement {getReportDateString()}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <ProfitAndLossReport 
                                            client={client} 
                                            transactions={transactions} 
                                            dateRange={dateRange} 
                                            onPostJournal={handleGoToJournal}
                                        />
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <p>Client data could not be loaded.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
