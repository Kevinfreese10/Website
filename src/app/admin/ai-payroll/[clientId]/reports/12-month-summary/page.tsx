'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Payslip, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loader2, Download, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parse, isValid } from 'date-fns';

const db = getFirestore(firebaseApp);

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

export default function TwelveMonthSummaryReportPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [client, setClient] = useState<User | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTotalsOnly, setShowTotalsOnly] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        if (!clientId) return;

        // 1. Fetch Client
        const unsubClient = onSnapshot(doc(db, 'aiPayrollClients', clientId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setClient({ ...data, id: snap.id } as User);
            }
        });

        // 2. Fetch All Payslips
        const payslipsRef = collection(db, 'aiPayrollClients', clientId, 'payslips');
        const q = query(payslipsRef, orderBy('date', 'desc'));

        const unsubPayslips = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payslip));
            setPayslips(fetched);
            setIsLoading(false);
        });

        return () => {
            unsubClient();
            unsubPayslips();
        };
    }, [clientId]);

    // Available Months (12 continuous months ending at the Active Period)
    const twelveMonths = useMemo(() => {
        const months: string[] = [];
        
        let endMonthStr = format(new Date(), 'MMMM yyyy');
        if (client?.firstProcessingMonth) {
            let mStr = client.firstProcessingMonth;
            if (mStr.includes('/')) {
                const parsed = parse(mStr.split(' - ').pop()?.trim() || '', 'dd/MM/yyyy', new Date());
                if (isValid(parsed)) {
                    endMonthStr = format(parsed, 'MMMM yyyy');
                }
            } else {
                endMonthStr = mStr;
            }
        }

        const endDate = parse(endMonthStr, 'MMMM yyyy', new Date());
        if (isValid(endDate)) {
            for (let i = 0; i < 12; i++) {
                const d = new Date(endDate);
                d.setMonth(d.getMonth() - i);
                months.push(format(d, 'MMMM yyyy'));
            }
        }
        return months.reverse(); // Chronological order
    }, [client]);

    // Aggregation
    const reportData = useMemo(() => {
        if (!twelveMonths.length) return [];
        
        return twelveMonths.map(month => {
            const targetDate = parse(month, 'MMMM yyyy', new Date());
            const start = startOfMonth(targetDate);
            const end = endOfMonth(targetDate);

            const getPeriodDate = (periodStr?: string): Date => {
                if (!periodStr) return new Date();
                if (periodStr.includes('/')) {
                    const parts = periodStr.split(' - ');
                    const datePart = parts[parts.length - 1].trim();
                    const parsed = parse(datePart, 'dd/MM/yyyy', new Date());
                    return isValid(parsed) ? parsed : new Date();
                }
                const base = periodStr.split(' - ')[0];
                const parts = base.trim().split(' ');
                if (parts.length < 2) return new Date();
                const monthName = parts[0];
                const year = parseInt(parts[1]);
                const mlist = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                const monthIdx = mlist.indexOf(monthName);
                return new Date(year, monthIdx !== -1 ? monthIdx : 0, 1);
            };

            const periodPayslips = payslips.filter(ps => {
                if (ps.status !== 'finalized') return false;
                const psPeriodDate = getPeriodDate(ps.period);
                return isWithinInterval(psPeriodDate, { start, end });
            });

            let gross = 0;
            let paye = 0;
            let uifEe = 0;
            let uifEr = 0;
            let sdl = 0;
            let net = 0;
            
            const employees: Record<string, any> = {};

            periodPayslips.forEach(ps => {
                const deds = ps.deductions || [];
                const contribs = ps.contributions || [];
                
                const pGross = (ps.earnings || []).reduce((s, i) => s + i.amount, 0);
                const pPaye = deds.find(d => d.label.toLowerCase() === 'tax')?.amount || 0;
                const pUifEe = deds.find(d => d.label.toLowerCase().includes('unemployment'))?.amount || 0;
                const pUifEr = contribs.find(c => c.label.toLowerCase().includes('unemployment'))?.amount || 0;
                const pSdl = contribs.find(c => c.label.toLowerCase().includes('skills'))?.amount || 0;
                const pTotalDed = deds.reduce((s, i) => s + i.amount, 0);
                const pNet = pGross - pTotalDed;

                employees[ps.employeeId] = {
                    id: ps.employeeId,
                    name: ps.employeeName,
                    gross: pGross,
                    paye: pPaye,
                    uifEe: pUifEe,
                    net: pNet,
                    uifEr: pUifEr,
                    sdl: pSdl,
                    totalCost: pGross + pUifEr + pSdl
                };

                gross += pGross;
                paye += pPaye;
                uifEe += pUifEe;
                uifEr += pUifEr;
                sdl += pSdl;
            });

            net = gross - periodPayslips.reduce((s, ps) => s + (ps.deductions || []).reduce((a, i) => a + i.amount, 0), 0);

            return {
                month,
                gross,
                paye,
                uifEe,
                net,
                uifEr,
                sdl,
                totalCost: gross + uifEr + sdl,
                employees
            };
        });
    }, [payslips, client, twelveMonths]);

    const allEmployeeIds = useMemo(() => {
        const ids = new Set<string>();
        const map = new Map<string, string>();
        reportData.forEach(rd => {
            Object.values(rd.employees).forEach((emp: any) => {
                ids.add(emp.id);
                map.set(emp.id, emp.name);
            });
        });
        return Array.from(ids).map(id => ({ id, name: map.get(id)! })).sort((a, b) => a.name.localeCompare(b.name));
    }, [reportData]);

    const handleExportExcel = () => {
        if (!reportData.length) {
            toast({ title: "No Data", description: "No finalized payslips available to export.", variant: "destructive" });
            return;
        }

        const wb = XLSX.utils.book_new();
        
        // Transform data into rows
        const categories = [
            { key: 'gross', label: 'Gross Earnings' },
            { key: 'paye', label: 'PAYE (Tax)' },
            { key: 'uifEe', label: 'UIF (Employee)' },
            { key: 'net', label: 'Net Pay' },
            { key: 'uifEr', label: 'UIF (Employer)' },
            { key: 'sdl', label: 'SDL' },
            { key: 'totalCost', label: 'Total Company Cost' }
        ];

        const wsData: any[] = [];
        
        // Header Row
        const headerRow = ['Category', ...twelveMonths, 'Total'];
        wsData.push(headerRow);

        // Data Rows
        categories.forEach(cat => {
            const row: any[] = [cat.label];
            let rowTotal = 0;
            twelveMonths.forEach((month, idx) => {
                const val = reportData[idx]?.[cat.key as keyof typeof reportData[0]] as number || 0;
                row.push(val);
                rowTotal += val;
            });
            row.push(rowTotal);
            wsData.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "12-Month Summary");
        
        XLSX.writeFile(wb, `${client?.name || 'Client'}_12MonthSummary.xlsx`);
    };

    const handleExportPdf = () => {
        if (!reportData.length) {
            toast({ title: "No Data", description: "No finalized payslips available to export.", variant: "destructive" });
            return;
        }

        const doc = new jsPDF('landscape');
        
        doc.setFontSize(16);
        doc.text(`12-Month Payroll Summary - ${client?.name || 'Company'}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy')}`, 14, 22);

        const tableBody: any[][] = [];
        
        const catDefs = [
            { key: 'gross', label: 'Gross Earnings' },
            { key: 'paye', label: 'PAYE (Tax)' },
            { key: 'uifEe', label: 'UIF (Employee)' },
            { key: 'net', label: 'Net Pay' },
            { key: 'uifEr', label: 'UIF (Employer)' },
            { key: 'sdl', label: 'SDL' },
            { key: 'totalCost', label: 'Total Company Cost' }
        ];

        if (!showTotalsOnly) {
            allEmployeeIds.forEach(emp => {
                tableBody.push([{ content: emp.name, colSpan: 14, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
                catDefs.forEach((cat) => {
                    const row: any[] = [cat.label];
                    let rowTotal = 0;
                    twelveMonths.forEach((month, idx) => {
                        const val = reportData[idx]?.employees[emp.id]?.[cat.key as keyof typeof reportData[0]] as number || 0;
                        row.push(formatCurrency(val));
                        rowTotal += val;
                    });
                    if (rowTotal === 0 && cat.key !== 'gross' && cat.key !== 'net') return;
                    row.push(formatCurrency(rowTotal));
                    tableBody.push(row);
                });
            });
            tableBody.push([{ content: 'Company Totals', colSpan: 14, styles: { fontStyle: 'bold', fillColor: [220, 230, 240] } }]);
        }

        catDefs.forEach((cat) => {
            const row: any[] = [cat.label + (showTotalsOnly ? '' : ' (Total)')];
            let rowTotal = 0;
            twelveMonths.forEach((month, idx) => {
                const val = reportData[idx]?.[cat.key as keyof typeof reportData[0]] as number || 0;
                row.push(formatCurrency(val));
                rowTotal += val;
            });
            row.push(formatCurrency(rowTotal));
            tableBody.push(row);
        });

        autoTable(doc, {
            head: [['Category', ...twelveMonths, 'Total']],
            body: tableBody,
            startY: 28,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [60, 60, 60] },
            theme: 'grid'
        });

        doc.save(`${client?.name || 'Client'}_12MonthSummary.pdf`);
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    const categories = [
        { key: 'gross', label: 'Gross Earnings' },
        { key: 'paye', label: 'PAYE (Tax)' },
        { key: 'uifEe', label: 'UIF (Employee)' },
        { key: 'net', label: 'Net Pay' },
        { key: 'uifEr', label: 'UIF (Employer)' },
        { key: 'sdl', label: 'SDL' },
        { key: 'totalCost', label: 'Total Company Cost' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">12-Month Payroll Summary</h2>
                    <p className="text-muted-foreground text-sm">Long-term overview of payroll totals over the last 12 active periods.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 bg-white px-3 py-2 border rounded-md shadow-sm">
                        <Switch id="totals-mode" checked={showTotalsOnly} onCheckedChange={setShowTotalsOnly} />
                        <Label htmlFor="totals-mode" className="font-semibold text-sm text-slate-700 cursor-pointer">Only show totals</Label>
                    </div>
                    <Button variant="outline" onClick={handleExportPdf} disabled={reportData.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export to PDF
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} disabled={reportData.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                            <CalendarDays className="h-5 w-5" />
                            <CardTitle className="text-lg">Historical Totals</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-100/50 hover:bg-slate-100/50">
                                    <TableHead className="font-bold text-slate-700 min-w-[200px] border-r">Category</TableHead>
                                    {twelveMonths.map(m => (
                                        <TableHead key={m} className="font-bold text-slate-700 text-right min-w-[120px]">{m}</TableHead>
                                    ))}
                                    <TableHead className="font-black text-slate-900 text-right bg-slate-100 min-w-[120px]">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!showTotalsOnly && allEmployeeIds.map(emp => (
                                    <React.Fragment key={emp.id}>
                                        <TableRow className="bg-slate-200/50">
                                            <TableCell colSpan={14} className="font-bold text-slate-900 border-y py-3 text-sm">
                                                {emp.name}
                                            </TableCell>
                                        </TableRow>
                                        {categories.map((cat, idx) => {
                                            const total = twelveMonths.reduce((sum, _, mIdx) => sum + (reportData[mIdx]?.employees[emp.id]?.[cat.key as keyof typeof reportData[0]] as number || 0), 0);
                                            // Optional: Hide categories with 0 total for this employee to reduce clutter
                                            if (total === 0 && cat.key !== 'gross' && cat.key !== 'net') return null;
                                            
                                            return (
                                                <TableRow key={`${emp.id}-${cat.key}`} className={idx % 2 === 0 ? "bg-white text-xs" : "bg-slate-50/30 text-xs"}>
                                                    <TableCell className="pl-6 font-medium text-slate-700 border-r">{cat.label}</TableCell>
                                                    {twelveMonths.map((m, mIdx) => (
                                                        <TableCell key={mIdx} className="text-right whitespace-nowrap">
                                                            {formatCurrency(reportData[mIdx]?.employees[emp.id]?.[cat.key as keyof typeof reportData[0]] as number || 0)}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="text-right font-semibold whitespace-nowrap bg-slate-50/50 border-l">
                                                        {formatCurrency(total)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}

                                {!showTotalsOnly && (
                                    <TableRow className="bg-primary/5">
                                        <TableCell colSpan={14} className="font-black text-primary border-y py-4 text-sm uppercase tracking-widest">
                                            Company Totals
                                        </TableCell>
                                    </TableRow>
                                )}

                                {categories.map((cat, idx) => (
                                    <TableRow key={`total-${cat.key}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                                        <TableCell className="font-semibold text-slate-900 border-r">{cat.label}</TableCell>
                                        {twelveMonths.map((m, mIdx) => (
                                            <TableCell key={mIdx} className="text-right whitespace-nowrap">
                                                {formatCurrency(reportData[mIdx]?.[cat.key as keyof typeof reportData[0]] as number || 0)}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right font-black whitespace-nowrap bg-slate-50/50 border-l">
                                            {formatCurrency(twelveMonths.reduce((sum, _, mIdx) => sum + (reportData[mIdx]?.[cat.key as keyof typeof reportData[0]] as number || 0), 0))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {reportData.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
                            <CalendarDays className="h-10 w-10 text-slate-300" />
                            <p>No finalized payslips available to generate a 12-month summary.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
