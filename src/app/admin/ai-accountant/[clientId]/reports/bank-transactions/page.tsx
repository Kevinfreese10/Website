'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, AllocatedTransaction, ImportedTransaction, ChartOfAccount } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Download, Eye, Printer, Landmark, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useParams } from 'next/navigation';
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterComponent } from "@/components/ui/table";
import { format, startOfDay, endOfDay } from 'date-fns';
import * as XLSX from 'xlsx-js-style';
import { allVatTypes } from "@/lib/vat-types";

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    if (price === 0) return '0.00';
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
};

interface CustomerEntity {
    id: string;
    name: string;
}

interface SupplierEntity {
    id: string;
    name: string;
}

interface EnrichedTransaction {
    id: string;
    date: Date;
    formattedDate: string;
    description: string;
    reference: string;
    bankAccountId: string;
    bankAccountName: string;
    bankAccountNumber: string;
    isExpense: boolean;
    grossAmount: number;
    exclusiveAmount: number;
    vatAmount: number;
    vatType: string;
    vatLabel: string;
    isStandardRate: boolean;
    allocationType: 'Account' | 'Customer' | 'Supplier' | 'Unallocated';
    allocatedCode: string;
    allocatedName: string;
    isAllocated: boolean;
    status: string;
}

interface AccountGroup {
    accountId: string;
    accountNumber: string;
    accountName: string;
    transactions: EnrichedTransaction[];
    totalInflow: number;
    totalOutflow: number;
    netMovement: number;
    totalVatInput: number;
    totalVatOutput: number;
    totalVatNet: number;
}

function BankTransactionReportModalContent({ 
    client,
    transactions, 
    bankAccounts,
    customers,
    suppliers,
    dateRange,
    selectedAccountId,
}: { 
    client: User;
    transactions: (ImportedTransaction | AllocatedTransaction)[];
    bankAccounts: ChartOfAccount[];
    customers: CustomerEntity[];
    suppliers: SupplierEntity[];
    dateRange?: DateRange;
    selectedAccountId?: string;
}) {
    // 1. Resolve Account Name Helper
    const getBankAccountInfo = (accountId: string) => {
        const found = bankAccounts.find(ba => ba.id === accountId || ba.accountNumber === accountId);
        return {
            name: found?.description || (found as any)?.name || `Bank Account (${accountId})`,
            number: found?.accountNumber || accountId
        };
    };

    // 2. Resolve Allocation Helper
    const resolveAllocation = (tx: ImportedTransaction | AllocatedTransaction) => {
        const val = tx.allocatedTo?.value || (tx as any).accountId;
        const type = tx.allocatedTo?.type || (tx as any).accountType || 'account';

        if (type === 'customer' && val) {
            const c = customers.find(x => x.id === val);
            return {
                type: 'Customer' as const,
                code: '',
                name: c ? c.name : val,
                isAllocated: true
            };
        }
        if (type === 'supplier' && val) {
            const s = suppliers.find(x => x.id === val);
            return {
                type: 'Supplier' as const,
                code: '',
                name: s ? s.name : val,
                isAllocated: true
            };
        }
        if (val) {
            const acc = client?.chartOfAccounts?.find(a => a.id === val || a.accountNumber === val);
            return {
                type: 'Account' as const,
                code: acc?.accountNumber || val,
                name: acc?.description || (acc as any)?.name || val,
                isAllocated: true
            };
        }

        const isUnallocated = !tx.status || tx.status === 'new' || tx.status === 'ai_review' || tx.status === 'ai_processing';
        return {
            type: 'Unallocated' as const,
            code: '',
            name: tx.status === 'ai_review' ? 'Pending AI Review' : 'Unallocated',
            isAllocated: !isUnallocated
        };
    };

    // 3. Resolve VAT Helper
    const resolveVat = (tx: ImportedTransaction | AllocatedTransaction) => {
        const vatType = tx.vatType;
        const foundVat = allVatTypes.find(v => v.name === vatType);
        const vatLabel = foundVat?.label || (vatType ? vatType.replace(/_/g, ' ') : 'No VAT');
        const isStandardRate = vatType === 'standard_rated_purchases' || vatType === 'standard_rated_sales' || vatType === 'capital_goods_purchases';
        
        const gross = tx.amount;
        let exclusive = gross;
        let vatAmount = 0;

        if (isStandardRate) {
            exclusive = gross / 1.15;
            vatAmount = gross - exclusive;
        }

        return {
            vatType: vatType || 'no_vat',
            vatLabel,
            isStandardRate,
            gross,
            exclusive,
            vatAmount
        };
    };

    // 4. Enrich & Filter Transactions
    const enrichedTransactions = useMemo(() => {
        const reportStartDate = dateRange?.from ? startOfDay(dateRange.from) : null;
        const reportEndDate = dateRange?.to ? endOfDay(dateRange.to) : null;

        return transactions
            .filter(tx => {
                if (selectedAccountId && selectedAccountId !== 'all') {
                    if (tx.bankAccountId !== selectedAccountId) return false;
                }
                const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
                if (isNaN(txDate.getTime())) return false;
                if (reportStartDate && txDate < reportStartDate) return false;
                if (reportEndDate && txDate > reportEndDate) return false;
                return true;
            })
            .map(tx => {
                const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
                const bankInfo = getBankAccountInfo(tx.bankAccountId);
                const alloc = resolveAllocation(tx);
                const vat = resolveVat(tx);

                return {
                    id: tx.id,
                    date: txDate,
                    formattedDate: format(txDate, 'dd/MM/yyyy'),
                    description: tx.description || '',
                    reference: tx.reference || '',
                    bankAccountId: tx.bankAccountId,
                    bankAccountName: bankInfo.name,
                    bankAccountNumber: bankInfo.number,
                    isExpense: tx.amount < 0,
                    grossAmount: tx.amount,
                    exclusiveAmount: vat.exclusive,
                    vatAmount: vat.vatAmount,
                    vatType: vat.vatType,
                    vatLabel: vat.vatLabel,
                    isStandardRate: vat.isStandardRate,
                    allocationType: alloc.type,
                    allocatedCode: alloc.code,
                    allocatedName: alloc.name,
                    isAllocated: alloc.isAllocated,
                    status: tx.status || 'new',
                } as EnrichedTransaction;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [transactions, selectedAccountId, dateRange, client, bankAccounts, customers, suppliers]);

    // 5. Group by Bank Account
    const accountGroups: AccountGroup[] = useMemo(() => {
        const map = new Map<string, EnrichedTransaction[]>();

        enrichedTransactions.forEach(tx => {
            const key = tx.bankAccountId || 'unassigned';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(tx);
        });

        const groups: AccountGroup[] = [];
        map.forEach((txList, accountId) => {
            const bankInfo = getBankAccountInfo(accountId);
            let totalInflow = 0;
            let totalOutflow = 0;
            let totalVatInput = 0;
            let totalVatOutput = 0;

            txList.forEach(t => {
                if (t.grossAmount > 0) {
                    totalInflow += t.grossAmount;
                    if (t.vatAmount > 0) totalVatOutput += t.vatAmount;
                } else {
                    totalOutflow += Math.abs(t.grossAmount);
                    if (t.vatAmount < 0) totalVatInput += Math.abs(t.vatAmount);
                }
            });

            groups.push({
                accountId,
                accountNumber: bankInfo.number,
                accountName: bankInfo.name,
                transactions: txList,
                totalInflow,
                totalOutflow,
                netMovement: totalInflow - totalOutflow,
                totalVatInput,
                totalVatOutput,
                totalVatNet: totalVatOutput - totalVatInput
            });
        });

        return groups.sort((a, b) => a.accountName.localeCompare(b.accountName));
    }, [enrichedTransactions, bankAccounts]);

    // 6. Overall Totals
    const grandTotals = useMemo(() => {
        return accountGroups.reduce((acc, g) => {
            acc.inflow += g.totalInflow;
            acc.outflow += g.totalOutflow;
            acc.netMovement += g.netMovement;
            acc.vatInput += g.totalVatInput;
            acc.vatOutput += g.totalVatOutput;
            acc.txCount += g.transactions.length;
            return acc;
        }, { inflow: 0, outflow: 0, netMovement: 0, vatInput: 0, vatOutput: 0, txCount: 0 });
    }, [accountGroups]);

    // 7. Multi-Sheet Professional Excel Export
    const handleDownloadExcel = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Consolidated Summary Sheet
        const summaryRows: any[] = [
            ['BANK TRANSACTIONS SUMMARY REPORT'],
            ['Company:', client.companyName || client.name],
            ['Period:', dateRange?.from ? `${format(dateRange.from, 'dd/MM/yyyy')} to ${dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Current'}` : 'All Dates'],
            ['Generated:', format(new Date(), 'dd/MM/yyyy HH:mm')],
            [],
            ['Account Number', 'Bank Account Name', 'Transaction Count', 'Total Inflows (R)', 'Total Outflows (R)', 'Net Movement (R)', 'Input VAT (R)', 'Output VAT (R)']
        ];

        accountGroups.forEach(g => {
            summaryRows.push([
                g.accountNumber,
                g.accountName,
                g.transactions.length,
                g.totalInflow,
                g.totalOutflow,
                g.netMovement,
                g.totalVatInput,
                g.totalVatOutput
            ]);
        });

        summaryRows.push([
            'TOTALS',
            'All Accounts',
            grandTotals.txCount,
            grandTotals.inflow,
            grandTotals.outflow,
            grandTotals.netMovement,
            grandTotals.vatInput,
            grandTotals.vatOutput
        ]);

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
        summarySheet['!cols'] = [
            { wch: 18 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }
        ];

        // Format currency numbers on summary sheet
        Object.keys(summarySheet).forEach(key => {
            if (/[D-H]\d+/.test(key)) {
                const cell = summarySheet[key];
                if (cell && typeof cell.v === 'number') {
                    cell.t = 'n';
                    cell.z = '#,##0.00';
                }
            }
        });

        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // 2. Individual Sheet per Bank Account
        const usedSheetNames = new Set<string>(['Summary']);

        accountGroups.forEach((group) => {
            // Excel sheet names max 31 characters and no invalid chars
            let sheetName = `${group.accountNumber} ${group.accountName}`.replace(/[:\\\/\?\*\[\]]/g, '').trim().slice(0, 31);
            if (!sheetName || usedSheetNames.has(sheetName)) {
                sheetName = `${group.accountNumber}`.slice(0, 25);
            }
            if (usedSheetNames.has(sheetName)) {
                sheetName = `${sheetName.slice(0, 27)}_${Math.floor(Math.random() * 899 + 100)}`;
            }
            usedSheetNames.add(sheetName);

            const txRows: any[] = [
                [`${group.accountNumber} - ${group.accountName}`],
                ['Company:', client.companyName || client.name],
                ['Period:', dateRange?.from ? `${format(dateRange.from, 'dd/MM/yyyy')} to ${dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Current'}` : 'All Dates'],
                [],
                ['Date', 'Reference', 'Description', 'Allocation Type', 'Allocated Account / Entity', 'VAT Type', 'Net Excl (R)', 'VAT Amount (R)', 'Gross Bank (R)', 'Status']
            ];

            group.transactions.forEach(t => {
                const allocDisplay = t.allocatedCode ? `${t.allocatedCode} - ${t.allocatedName}` : t.allocatedName;
                txRows.push([
                    t.formattedDate,
                    t.reference,
                    t.description,
                    t.allocationType,
                    allocDisplay,
                    t.vatLabel,
                    t.exclusiveAmount,
                    t.vatAmount,
                    t.grossAmount,
                    t.status.toUpperCase()
                ]);
            });

            // Subtotals Row
            txRows.push([
                'TOTALS',
                '',
                `${group.transactions.length} Transactions`,
                '',
                '',
                '',
                group.transactions.reduce((s, t) => s + t.exclusiveAmount, 0),
                group.transactions.reduce((s, t) => s + t.vatAmount, 0),
                group.netMovement,
                ''
            ]);

            const txSheet = XLSX.utils.aoa_to_sheet(txRows);
            txSheet['!cols'] = [
                { wch: 12 }, { wch: 18 }, { wch: 38 }, { wch: 15 }, { wch: 35 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }
            ];

            Object.keys(txSheet).forEach(key => {
                if (/[G-I]\d+/.test(key)) {
                    const cell = txSheet[key];
                    if (cell && typeof cell.v === 'number') {
                        cell.t = 'n';
                        cell.z = '#,##0.00';
                    }
                }
            });

            XLSX.utils.book_append_sheet(workbook, txSheet, sheetName);
        });

        const fileSlug = (client.companyName || client.name).replace(/[^a-zA-Z0-9]/g, '_');
        XLSX.writeFile(workbook, `Bank_Transactions_${fileSlug}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Global Summary Statistics Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg border">
                    <p className="text-xs text-muted-foreground font-medium">Bank Accounts Active</p>
                    <p className="text-xl font-bold mt-1 text-primary">{accountGroups.length}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{grandTotals.txCount} total transactions</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Total Inflows (Deposits)
                    </div>
                    <p className="text-xl font-bold mt-1 text-emerald-800 font-mono">+R {formatPrice(grandTotals.inflow)}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">VAT Output: R {formatPrice(grandTotals.vatOutput)}</p>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                        <ArrowDownRight className="h-3.5 w-3.5" /> Total Outflows (Payments)
                    </div>
                    <p className="text-xl font-bold mt-1 text-rose-800 font-mono">-R {formatPrice(grandTotals.outflow)}</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">VAT Input: R {formatPrice(grandTotals.vatInput)}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs text-blue-700 font-semibold">Net Cash Movement</p>
                    <p className={`text-xl font-bold mt-1 font-mono ${grandTotals.netMovement >= 0 ? 'text-blue-800' : 'text-rose-700'}`}>
                        R {formatPrice(grandTotals.netMovement)}
                    </p>
                    <p className="text-[11px] text-blue-600 mt-0.5">VAT Net: R {formatPrice(grandTotals.vatOutput - grandTotals.vatInput)}</p>
                </div>
            </div>

            {/* Separated Bank Account Tables */}
            <div className="max-h-[62vh] overflow-y-auto space-y-6 pr-1 print:max-h-none print:overflow-visible">
                {accountGroups.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground space-y-2">
                        <Landmark className="h-10 w-10 mx-auto text-muted-foreground/50" />
                        <p className="font-medium text-base">No transactions found for the selected criteria.</p>
                        <p className="text-xs">Adjust your date range or bank account selection above.</p>
                    </div>
                ) : (
                    accountGroups.map((group) => (
                        <Card key={group.accountId} className="overflow-hidden border shadow-sm">
                            <CardHeader className="bg-muted/30 py-3.5 px-4 border-b">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-primary/10 rounded text-primary">
                                            <Landmark className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <span>{group.accountName}</span>
                                                <Badge variant="outline" className="font-mono text-[10px] font-normal">
                                                    {group.accountNumber}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="text-[11px]">
                                                {group.transactions.length} transactions in this period
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 font-mono text-xs">
                                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                            +{formatPrice(group.totalInflow)}
                                        </span>
                                        <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded border border-rose-200">
                                            -{formatPrice(group.totalOutflow)}
                                        </span>
                                        <span className={`font-bold px-2.5 py-1 rounded border ${group.netMovement >= 0 ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                                            Net: {group.netMovement < 0 ? '-' : ''}R {formatPrice(Math.abs(group.netMovement))}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/10">
                                            <TableRow>
                                                <TableHead className="w-[90px] text-xs">Date</TableHead>
                                                <TableHead className="w-[110px] text-xs">Reference</TableHead>
                                                <TableHead className="min-w-[180px] text-xs">Description</TableHead>
                                                <TableHead className="min-w-[200px] text-xs">Allocated Account / Entity</TableHead>
                                                <TableHead className="w-[85px] text-xs">Type</TableHead>
                                                <TableHead className="min-w-[140px] text-xs">VAT Category</TableHead>
                                                <TableHead className="text-right w-[100px] text-xs">Net (Excl)</TableHead>
                                                <TableHead className="text-right w-[95px] text-xs">VAT (15%)</TableHead>
                                                <TableHead className="text-right w-[110px] text-xs font-semibold">Gross (Bank)</TableHead>
                                                <TableHead className="w-[85px] text-center text-xs">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.transactions.map((tx) => (
                                                <TableRow key={tx.id} className="hover:bg-muted/30 text-xs">
                                                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                                                        {tx.formattedDate}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-[11px] truncate max-w-[110px]" title={tx.reference}>
                                                        {tx.reference || '-'}
                                                    </TableCell>
                                                    <TableCell className="font-medium max-w-[220px] truncate" title={tx.description}>
                                                        {tx.description}
                                                    </TableCell>
                                                    <TableCell className="max-w-[220px]">
                                                        {tx.isAllocated ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground truncate" title={tx.allocatedName}>
                                                                    {tx.allocatedName}
                                                                </span>
                                                                {tx.allocatedCode && (
                                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                                        {tx.allocatedCode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-medium flex items-center gap-1 w-fit">
                                                                <AlertCircle className="h-3 w-3 text-amber-600" />
                                                                {tx.allocatedName}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">
                                                            {tx.allocationType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground">
                                                        {tx.vatLabel}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-[11px]">
                                                        {formatPrice(tx.exclusiveAmount)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-[11px] ${tx.vatAmount !== 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                                        {tx.vatAmount !== 0 ? formatPrice(Math.abs(tx.vatAmount)) : '-'}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono font-semibold ${tx.grossAmount < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                        {tx.grossAmount < 0 ? '-' : '+'}R {formatPrice(Math.abs(tx.grossAmount))}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge 
                                                            variant={tx.status === 'reviewed' || tx.status === 'allocated' ? 'default' : 'outline'}
                                                            className={`text-[9px] uppercase px-1.5 py-0 font-medium ${tx.status === 'reviewed' || tx.status === 'allocated' ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'text-muted-foreground'}`}
                                                        >
                                                            {tx.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooterComponent className="bg-muted/20 font-mono text-xs">
                                            <TableRow>
                                                <TableCell colSpan={6} className="font-bold text-foreground">
                                                    Subtotal ({group.accountName})
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {formatPrice(group.transactions.reduce((s, t) => s + t.exclusiveAmount, 0))}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    {formatPrice(group.transactions.reduce((s, t) => s + Math.abs(t.vatAmount), 0))}
                                                </TableCell>
                                                <TableCell className={`text-right font-bold text-sm ${group.netMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {group.netMovement < 0 ? '-' : '+'}R {formatPrice(Math.abs(group.netMovement))}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableFooterComponent>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Footer Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t print:hidden">
                <div className="text-xs text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{grandTotals.txCount}</span> total transactions across <span className="font-bold text-foreground">{accountGroups.length}</span> bank account{accountGroups.length === 1 ? '' : 's'}.
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print / Save PDF
                    </Button>
                    <Button variant="default" size="sm" onClick={handleDownloadExcel} disabled={enrichedTransactions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Multi-Tab Excel
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function BankTransactionsReportPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const [client, setClient] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<(ImportedTransaction | AllocatedTransaction)[]>([]);
    const [customers, setCustomers] = useState<CustomerEntity[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>('all');
    const [isReportOpen, setIsReportOpen] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!clientId) return;
            setIsLoading(true);
            try {
                const clientRef = doc(db, 'aiAccountantClients', clientId);
                const clientSnap = await getDoc(clientRef);
                if (clientSnap.exists()) {
                    setClient(clientSnap.data() as User);
                }
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
        
        // Listen to transactions
        const transUnsubscribe = onSnapshot(query(collection(db, 'aiAccountantClients', clientId, 'transactions')), snapshot => {
            const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as (ImportedTransaction | AllocatedTransaction)));
            setTransactions(fetched);
        });

        // Listen to customers for allocation resolution
        const custUnsubscribe = onSnapshot(collection(db, 'aiAccountantClients', clientId, 'customers'), snapshot => {
            const fetched = snapshot.docs.map(d => ({ id: d.id, name: d.data().name || d.id }));
            setCustomers(fetched);
        });

        // Listen to suppliers for allocation resolution
        const suppUnsubscribe = onSnapshot(collection(db, 'aiAccountantClients', clientId, 'suppliers'), snapshot => {
            const fetched = snapshot.docs.map(d => ({ id: d.id, name: d.data().name || d.id }));
            setSuppliers(fetched);
        });
        
        return () => {
            transUnsubscribe();
            custUnsubscribe();
            suppUnsubscribe();
        };
    }, [clientId]);

    // Robust Bank Accounts Discovery
    const bankAccounts = useMemo(() => {
        const coa = client?.chartOfAccounts || [];
        const accountMap = new Map<string, ChartOfAccount>();

        // 1. Identify bank accounts in COA
        coa.forEach(acc => {
            const num = acc.accountNumber || '';
            const desc = (acc.description || (acc as any).name || '').toLowerCase();
            const isBank = 
                num.startsWith('8400-') || 
                num === '8000-004' ||
                num.startsWith('8000-') ||
                (acc.category === 'Current Assets' && acc.fsGroup === 'Cash and cash equivalents') ||
                acc.category === 'Bank' ||
                Boolean((acc as any).bankName) ||
                Boolean((acc as any).bankAccountNumber) ||
                desc.includes('bank') ||
                desc.includes('cheque') ||
                desc.includes('savings');
                
            if (isBank) {
                accountMap.set(acc.id || acc.accountNumber, acc);
            }
        });

        // 2. Discover any bankAccountId present in transactions
        transactions.forEach(tx => {
            if (tx.bankAccountId && !accountMap.has(tx.bankAccountId)) {
                const found = coa.find(a => a.id === tx.bankAccountId || a.accountNumber === tx.bankAccountId);
                if (found) {
                    accountMap.set(tx.bankAccountId, found);
                } else {
                    accountMap.set(tx.bankAccountId, {
                        id: tx.bankAccountId,
                        accountNumber: tx.bankAccountId,
                        description: `Bank Account (${tx.bankAccountId})`,
                        category: 'Current Assets',
                        section: 'Balance Sheet',
                        fsGroup: 'Cash and cash equivalents'
                    });
                }
            }
        });

        return Array.from(accountMap.values()).sort((a, b) => (a.accountNumber || '').localeCompare(b.accountNumber || ''));
    }, [client?.chartOfAccounts, transactions]);

    const getReportDateString = () => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return `for all dates`;
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
        return `for all dates`;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" />
                        Bank Transactions Report
                    </CardTitle>
                    <CardDescription>
                        Generate audit-ready reports separated by bank account with full general ledger allocations and South African VAT breakdowns.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-6 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-semibold">Date Range</Label>
                                <DateRangePicker onDateChange={setDateRange} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-semibold">Bank Account</Label>
                                <Select 
                                    value={selectedAccountId || 'all'} 
                                    onValueChange={(val) => setSelectedAccountId(val)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="All Bank Accounts (Separated)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <span className="font-semibold">All Bank Accounts (Separated)</span>
                                        </SelectItem>
                                        {bankAccounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">{acc.accountNumber}</span>
                                                    <span>{acc.description || (acc as any).name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Quick Stats Banner */}
                        <div className="bg-muted/30 p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span><strong className="text-foreground">{bankAccounts.length}</strong> bank account{bankAccounts.length === 1 ? '' : 's'} identified</span>
                            </div>
                            <div>
                                Total Ingested Transactions: <strong className="text-foreground">{transactions.length}</strong>
                            </div>
                        </div>

                        <div className="flex justify-start pt-2">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Loading client bank records...
                                </div>
                            ) : client ? (
                                <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="font-medium">
                                            <Eye className="mr-2 h-4 w-4"/>View Bank Report
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] flex flex-col p-6 overflow-hidden">
                                        <DialogHeader className="text-left pb-3 border-b">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                                        <span>{client.companyName || client.name}</span>
                                                        <Badge variant="outline" className="text-[11px] font-normal">
                                                            Bank Transactions Audit Report
                                                        </Badge>
                                                    </DialogTitle>
                                                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                                        {getReportDateString()} &bull; Separated by Bank Account &bull; SARS VAT Compliant
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        
                                        <div className="flex-1 overflow-y-auto pt-4 pr-1">
                                            <BankTransactionReportModalContent 
                                                client={client}
                                                transactions={transactions} 
                                                bankAccounts={bankAccounts}
                                                customers={customers}
                                                suppliers={suppliers}
                                                dateRange={dateRange}
                                                selectedAccountId={selectedAccountId}
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <p className="text-destructive text-sm">Client profile could not be loaded.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
