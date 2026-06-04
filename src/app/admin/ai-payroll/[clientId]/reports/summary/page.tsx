'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Payslip, Employee, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { Loader2, Download, Users, FileText, Landmark } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parse, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const db = getFirestore(firebaseApp);

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

export default function PayrollSummaryReportPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [client, setClient] = useState<User | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    // Fetch Initial Data
    useEffect(() => {
        if (!clientId) return;

        // 1. Fetch Client
        const unsubClient = onSnapshot(doc(db, 'aiPayrollClients', clientId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setClient({ ...data, id: snap.id } as User);
                if (!selectedMonth) {
                    setSelectedMonth(data.firstProcessingMonth || format(new Date(), 'MMMM yyyy'));
                }
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

    // Available Months
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        if (client?.firstProcessingMonth) {
            months.add(client.firstProcessingMonth);
        }
        const now = new Date();
        for (let i = 0; i < 13; i++) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            months.add(format(d, 'MMMM yyyy'));
        }
        payslips.forEach(ps => {
            const d = ps.date?.toDate ? ps.date.toDate() : new Date(ps.date || Date.now());
            months.add(format(d, 'MMMM yyyy'));
        });

        return Array.from(months).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB.getTime() - dateA.getTime();
        });
    }, [payslips, client]);

    // Aggregation
    const reportData = useMemo(() => {
        if (!selectedMonth) return { breakdown: [], totals: { gross: 0, paye: 0, uifEe: 0, uifEr: 0, sdl: 0, net: 0, totalCost: 0 } };

        const targetDate = parse(selectedMonth, 'MMMM yyyy', new Date());
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
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const monthIdx = months.indexOf(monthName);
            return new Date(year, monthIdx !== -1 ? monthIdx : 0, 1);
        };

        const periodPayslips = payslips.filter(ps => {
            if (ps.status !== 'finalized') return false;
            const psPeriodDate = getPeriodDate(ps.period);
            return isWithinInterval(psPeriodDate, { start, end });
        });

        let totalGross = 0;
        let totalPaye = 0;
        let totalUifEe = 0;
        let totalUifEr = 0;
        let totalSdl = 0;
        let totalNet = 0;

        const empMap: Record<string, any> = {};

        periodPayslips.forEach(ps => {
            const paye = ps.deductions.find(d => d.label.toLowerCase() === 'tax')?.amount || 0;
            const uifEe = ps.deductions.find(d => d.label.toLowerCase().includes('unemployment'))?.amount || 0;
            const uifEr = ps.contributions.find(c => c.label.toLowerCase().includes('unemployment'))?.amount || 0;
            const sdl = ps.contributions.find(c => c.label.toLowerCase().includes('skills'))?.amount || 0;

            if (!empMap[ps.employeeId]) {
                empMap[ps.employeeId] = {
                    name: ps.employeeName,
                    gross: 0,
                    paye: 0,
                    uifEe: 0,
                    uifEr: 0,
                    sdl: 0,
                    net: 0,
                };
            }

            empMap[ps.employeeId].gross += (ps.grossPay || 0);
            empMap[ps.employeeId].paye += paye;
            empMap[ps.employeeId].uifEe += uifEe;
            empMap[ps.employeeId].uifEr += uifEr;
            empMap[ps.employeeId].sdl += sdl;
            empMap[ps.employeeId].net += (ps.netPay || 0);

            totalGross += (ps.grossPay || 0);
            totalPaye += paye;
            totalUifEe += uifEe;
            totalUifEr += uifEr;
            totalSdl += sdl;
            totalNet += (ps.netPay || 0);
        });

        return {
            breakdown: Object.values(empMap),
            totals: {
                gross: totalGross,
                paye: totalPaye,
                uifEe: totalUifEe,
                uifEr: totalUifEr,
                sdl: totalSdl,
                net: totalNet,
                totalCost: totalGross + totalUifEr + totalSdl
            }
        };
    }, [payslips, selectedMonth]);

    const handleDownloadExcel = () => {
        if (!client || !reportData || !selectedMonth) return;

        const wb = XLSX.utils.book_new();
        const summary: any[][] = [
            ["PAYROLL SUMMARY REPORT"],
            ["Company", client.companyName || client.name],
            ["Active Period", selectedMonth],
            [""],
            ["Staff Member", "Gross Earnings", "PAYE (Tax)", "UIF (Employee)", "UIF (Employer)", "SDL (Employer)", "Net Pay", "Total Cost to Employer"]
        ];

        reportData.breakdown.forEach(b => {
            summary.push([
                b.name,
                b.gross,
                b.paye,
                b.uifEe,
                b.uifEr,
                b.sdl,
                b.net,
                b.gross + b.uifEr + b.sdl
            ]);
        });

        // Add Grand Totals
        summary.push([
            "GRAND TOTALS",
            reportData.totals.gross,
            reportData.totals.paye,
            reportData.totals.uifEe,
            reportData.totals.uifEr,
            reportData.totals.sdl,
            reportData.totals.net,
            reportData.totals.totalCost
        ]);

        const ws = XLSX.utils.aoa_to_sheet(summary);
        XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
        XLSX.writeFile(wb, `Payroll_Summary_${client.name.replace(/\s/g, '_')}_${selectedMonth.replace(/\s/g, '_')}.xlsx`);
    };

    const handleDownloadPdf = () => {
        if (!client || !reportData || !selectedMonth) return;

        const doc = new jsPDF('landscape');
        
        const formatCurr = (num: number) => {
            return num.toLocaleString('en-ZA', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        };

        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("PAYROLL SUMMARY REPORT", 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Company: ${client.companyName || client.name}`, 15, 28);
        doc.text(`Period: ${selectedMonth}`, 15, 34);

        // Details Table
        autoTable(doc, {
            startY: 40,
            head: [['Staff Member', 'Gross ZAR', 'PAYE ZAR', 'UIF EE ZAR', 'UIF ER ZAR', 'SDL ZAR', 'Net Pay ZAR', 'Total Cost ZAR']],
            body: [
                ...reportData.breakdown.map(b => [
                    b.name,
                    formatCurr(b.gross),
                    formatCurr(b.paye),
                    formatCurr(b.uifEe),
                    formatCurr(b.uifEr),
                    formatCurr(b.sdl),
                    formatCurr(b.net),
                    formatCurr(b.gross + b.uifEr + b.sdl)
                ]),
                [
                    'GRAND TOTALS',
                    formatCurr(reportData.totals.gross),
                    formatCurr(reportData.totals.paye),
                    formatCurr(reportData.totals.uifEe),
                    formatCurr(reportData.totals.uifEr),
                    formatCurr(reportData.totals.sdl),
                    formatCurr(reportData.totals.net),
                    formatCurr(reportData.totals.totalCost)
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { cellWidth: 28, halign: 'right' },
                2: { cellWidth: 28, halign: 'right' },
                3: { cellWidth: 28, halign: 'right' },
                4: { cellWidth: 28, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' },
                6: { cellWidth: 28, halign: 'right' },
                7: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                if (data.row.index === reportData.breakdown.length) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            }
        });

        // Save
        const fileName = `Payroll_Summary_${(client.companyName || client.name).replace(/\s/g, '_')}_${selectedMonth.replace(/\s/g, '_')}.pdf`;
        doc.save(fileName);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payroll Summary Report</h2>
                    <p className="text-sm text-muted-foreground font-medium">Consolidated view of earnings, deductions, contributions, and net pay.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[220px] h-10 font-bold bg-white border-primary/20 shadow-sm">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonths.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-10 gap-2 font-bold" onClick={handleDownloadExcel}>
                        <Download className="h-4 w-4" /> Export Excel
                    </Button>
                    <Button variant="outline" className="h-10 gap-2 font-bold text-red-600 border-red-200 hover:bg-red-50" onClick={handleDownloadPdf}>
                        <FileText className="h-4 w-4" /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gross Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(reportData.totals.gross)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Total base + allowances</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total PAYE (Tax)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(reportData.totals.paye)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">SARS tax deduction</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Net Disbursements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(reportData.totals.net)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Net EFT transfer totals</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Employer Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black tabular-nums">{formatCurrency(reportData.totals.totalCost)}</p>
                        <p className="text-[10px] font-bold mt-1 opacity-90">Gross + Employer UIF + SDL</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Payroll Details</CardTitle>
                            <CardDescription>Breakdown by staff member for {selectedMonth}.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10">
                                    <TableHead className="font-bold">Staff Member</TableHead>
                                    <TableHead className="text-right font-bold text-slate-800">Gross Earnings</TableHead>
                                    <TableHead className="text-right font-bold text-primary">PAYE</TableHead>
                                    <TableHead className="text-right font-bold">UIF (EE)</TableHead>
                                    <TableHead className="text-right font-bold">UIF (ER)</TableHead>
                                    <TableHead className="text-right font-bold">SDL</TableHead>
                                    <TableHead className="text-right font-bold text-green-700">Net Pay</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">Total Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.breakdown.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground italic">
                                            No finalized payslips found in this month.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.breakdown.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-900">{row.name}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(row.gross)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-bold text-primary">{formatCurrency(row.paye)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{formatCurrency(row.uifEe)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{formatCurrency(row.uifEr)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{formatCurrency(row.sdl)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-bold text-green-700">{formatCurrency(row.net)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-bold text-slate-900">{formatCurrency(row.gross + row.uifEr + row.sdl)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter className="bg-muted/20">
                                <TableRow>
                                    <TableCell className="font-black text-slate-900 uppercase text-[10px]">Grand Totals</TableCell>
                                    <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.gross)}</TableCell>
                                    <TableCell className="text-right font-black text-primary">{formatCurrency(reportData.totals.paye)}</TableCell>
                                    <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.uifEe)}</TableCell>
                                    <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.uifEr)}</TableCell>
                                    <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.sdl)}</TableCell>
                                    <TableCell className="text-right font-black text-green-700">{formatCurrency(reportData.totals.net)}</TableCell>
                                    <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.totalCost)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
