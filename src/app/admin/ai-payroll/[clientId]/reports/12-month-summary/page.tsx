'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Payslip, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
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

    // Available Months (same logic as summary, but we take up to 12)
    const twelveMonths = useMemo(() => {
        const months = new Set<string>();
        const isFortnightly = client?.payrollFrequency === 'Fortnightly';
        
        if (isFortnightly) {
            payslips.forEach(ps => {
                if (ps.period && ps.status === 'finalized') {
                    months.add(ps.period);
                }
            });
            const sorted = Array.from(months).sort((a, b) => {
                try {
                    const dateA = parse(a, 'dd/MM/yyyy', new Date());
                    const dateB = parse(b, 'dd/MM/yyyy', new Date());
                    return dateB.getTime() - dateA.getTime();
                } catch (e) {
                    return 0;
                }
            });
            return sorted.slice(0, 12).reverse();
        } else {
            payslips.forEach(ps => {
                if (ps.status === 'finalized') {
                    const d = ps.date?.toDate ? ps.date.toDate() : new Date(ps.date || Date.now());
                    months.add(format(d, 'MMMM yyyy'));
                }
            });
            const sorted = Array.from(months).sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateB.getTime() - dateA.getTime();
            });
            return sorted.slice(0, 12).reverse();
        }
    }, [payslips, client]);

    // Aggregation
    const reportData = useMemo(() => {
        if (!twelveMonths.length) return [];

        const isFortnightly = client?.payrollFrequency === 'Fortnightly';
        
        return twelveMonths.map(month => {
            let periodPayslips: Payslip[] = [];

            if (isFortnightly) {
                periodPayslips = payslips.filter(ps => ps.status === 'finalized' && ps.period === month);
            } else {
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

                periodPayslips = payslips.filter(ps => {
                    if (ps.status !== 'finalized') return false;
                    const psPeriodDate = getPeriodDate(ps.period);
                    return isWithinInterval(psPeriodDate, { start, end });
                });
            }

            let gross = 0;
            let paye = 0;
            let uifEe = 0;
            let uifEr = 0;
            let sdl = 0;
            let net = 0;

            periodPayslips.forEach(ps => {
                gross += ps.earnings.reduce((s, i) => s + i.amount, 0);
                paye += ps.deductions.find(d => d.label.toLowerCase() === 'tax')?.amount || 0;
                uifEe += ps.deductions.find(d => d.label.toLowerCase().includes('unemployment'))?.amount || 0;
                uifEr += ps.contributions.find(c => c.label.toLowerCase().includes('unemployment'))?.amount || 0;
                sdl += ps.contributions.find(c => c.label.toLowerCase().includes('skills'))?.amount || 0;
            });

            // Extra Deductions
            let totalDed = 0;
            periodPayslips.forEach(ps => {
                totalDed += ps.deductions.reduce((s, i) => s + i.amount, 0);
            });
            net = gross - totalDed;

            return {
                month,
                gross,
                paye,
                uifEe,
                net,
                uifEr,
                sdl,
                totalCost: gross + uifEr + sdl
            };
        });
    }, [payslips, client, twelveMonths]);

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
                <Button variant="outline" onClick={handleExportExcel} disabled={reportData.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
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
                                {categories.map(cat => {
                                    let rowTotal = 0;
                                    return (
                                        <TableRow key={cat.key} className="hover:bg-slate-50">
                                            <TableCell className="font-medium text-slate-700 border-r">{cat.label}</TableCell>
                                            {twelveMonths.map((month, idx) => {
                                                const val = reportData[idx]?.[cat.key as keyof typeof reportData[0]] as number || 0;
                                                rowTotal += val;
                                                return (
                                                    <TableCell key={month} className="text-right text-slate-600">
                                                        {formatCurrency(val)}
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="text-right font-bold bg-slate-50 text-slate-900">
                                                {formatCurrency(rowTotal)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
