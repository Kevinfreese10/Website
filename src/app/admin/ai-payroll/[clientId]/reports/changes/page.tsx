'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Payslip, Employee, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { Loader2, Download, FileText, UserPlus, UserMinus, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parse, isValid, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const db = getFirestore(firebaseApp);

const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(absVal);
    return isNegative ? `-${formatted}` : formatted;
};

export default function PayrollChangesReportPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [client, setClient] = useState<User | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
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
                    let defaultMonth = data.firstProcessingMonth || format(new Date(), 'MMMM yyyy');
                    if (defaultMonth.includes('/')) {
                        const parsed = parse(defaultMonth.split(' - ').pop()?.trim() || '', 'dd/MM/yyyy', new Date());
                        if (isValid(parsed)) {
                            defaultMonth = format(parsed, 'MMMM yyyy');
                        }
                    }
                    setSelectedMonth(defaultMonth);
                }
            }
        });

        // 2. Fetch All Payslips
        const payslipsRef = collection(db, 'aiPayrollClients', clientId, 'payslips');
        const q = query(payslipsRef, orderBy('date', 'desc'));
        const unsubPayslips = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payslip));
            setPayslips(fetched);
        });

        // 3. Fetch All Employees (for joinDate/terminationDate reference)
        const employeesRef = collection(db, 'aiPayrollClients', clientId, 'employees');
        const unsubEmployees = onSnapshot(employeesRef, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            setEmployees(fetched);
            setIsLoading(false);
        });

        return () => {
            unsubClient();
            unsubPayslips();
            unsubEmployees();
        };
    }, [clientId]);

    // Available Months
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        if (client?.firstProcessingMonth) {
            let mStr = client.firstProcessingMonth;
            if (mStr.includes('/')) {
                const parsed = parse(mStr.split(' - ').pop()?.trim() || '', 'dd/MM/yyyy', new Date());
                if (isValid(parsed)) {
                    mStr = format(parsed, 'MMMM yyyy');
                }
            }
            months.add(mStr);
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

    // Comparison Logic
    const reportData = useMemo(() => {
        if (!selectedMonth) return { starters: [], leavers: [], changes: [], prevMonthName: '' };

        // 1. Current Month boundaries
        const currentTargetDate = parse(selectedMonth, 'MMMM yyyy', new Date());
        const currentStart = startOfMonth(currentTargetDate);
        const currentEnd = endOfMonth(currentTargetDate);

        // 2. Previous Month boundaries
        const prevTargetDate = subMonths(currentTargetDate, 1);
        const prevStart = startOfMonth(prevTargetDate);
        const prevEnd = endOfMonth(prevTargetDate);
        const prevMonthName = format(prevTargetDate, 'MMMM yyyy');

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

        // Filter Payslips
        const currentPayslips = payslips.filter(ps => {
            if (ps.status !== 'finalized') return false;
            const psPeriodDate = getPeriodDate(ps.period);
            return isWithinInterval(psPeriodDate, { start: currentStart, end: currentEnd });
        });

        const prevPayslips = payslips.filter(ps => {
            if (ps.status !== 'finalized') return false;
            const psPeriodDate = getPeriodDate(ps.period);
            return isWithinInterval(psPeriodDate, { start: prevStart, end: prevEnd });
        });

        // Map employee stubs
        const currentMap = new Map(currentPayslips.map(ps => [ps.employeeId, ps]));
        const prevMap = new Map(prevPayslips.map(ps => [ps.employeeId, ps]));

        // Calculate Starters
        const starters: any[] = [];
        currentPayslips.forEach(ps => {
            if (!prevMap.has(ps.employeeId)) {
                const emp = employees.find(e => e.id === ps.employeeId);
                const joinStr = emp?.joinDate?.toDate ? format(emp.joinDate.toDate(), 'yyyy/MM/dd') : (emp?.joinDate ? format(new Date(emp.joinDate), 'yyyy/MM/dd') : 'N/A');
                starters.push({
                    name: ps.employeeName,
                    gross: ps.grossPay,
                    joinDate: joinStr
                });
            }
        });

        // Calculate Leavers
        const leavers: any[] = [];
        prevPayslips.forEach(ps => {
            if (!currentMap.has(ps.employeeId)) {
                const emp = employees.find(e => e.id === ps.employeeId);
                const termStr = emp?.terminationDate?.toDate ? format(emp.terminationDate.toDate(), 'yyyy/MM/dd') : (emp?.terminationDate ? format(new Date(emp.terminationDate), 'yyyy/MM/dd') : 'N/A');
                leavers.push({
                    name: ps.employeeName,
                    lastGross: ps.grossPay,
                    terminationDate: termStr
                });
            }
        });

        // Calculate Variance / Changes (Salary revisions)
        const changes: any[] = [];
        currentPayslips.forEach(ps => {
            const prevPs = prevMap.get(ps.employeeId);
            if (prevPs) {
                const diff = (ps.grossPay || 0) - (prevPs.grossPay || 0);
                if (Math.abs(diff) > 0.01) {
                    const pct = prevPs.grossPay > 0 ? (diff / prevPs.grossPay) * 100 : 100;
                    changes.push({
                        name: ps.employeeName,
                        prevGross: prevPs.grossPay,
                        currentGross: ps.grossPay,
                        variance: diff,
                        percentage: pct
                    });
                }
            }
        });

        return {
            starters,
            leavers,
            changes,
            prevMonthName
        };
    }, [payslips, employees, selectedMonth]);

    const handleDownloadExcel = () => {
        if (!client || !reportData || !selectedMonth) return;

        const wb = XLSX.utils.book_new();

        // 1. Starters Sheet
        const startersData: any[][] = [
            ["NEW STARTERS IN MONTH"],
            ["Company", client.companyName || client.name],
            ["Period", selectedMonth],
            [""],
            ["Employee Name", "Current Month Gross Pay", "Join Date"]
        ];
        reportData.starters.forEach(s => startersData.push([s.name, s.gross, s.joinDate]));
        const wsStarters = XLSX.utils.aoa_to_sheet(startersData);
        XLSX.utils.book_append_sheet(wb, wsStarters, "New Starters");

        // 2. Leavers Sheet
        const leaversData: any[][] = [
            ["LEAVERS IN MONTH"],
            ["Company", client.companyName || client.name],
            ["Period", selectedMonth],
            [""],
            ["Employee Name", "Last Month Gross Pay", "Termination Date"]
        ];
        reportData.leavers.forEach(l => leaversData.push([l.name, l.lastGross, l.terminationDate]));
        const wsLeavers = XLSX.utils.aoa_to_sheet(leaversData);
        XLSX.utils.book_append_sheet(wb, wsLeavers, "Leavers");

        // 3. Changes Sheet
        const changesData: any[][] = [
            ["PAYROLL VALUE CHANGES (MONTH-ON-MONTH)"],
            ["Company", client.companyName || client.name],
            ["Comparison", `${reportData.prevMonthName} vs ${selectedMonth}`],
            [""],
            ["Employee Name", `${reportData.prevMonthName} Gross`, `${selectedMonth} Gross`, "Variance", "% Change"]
        ];
        reportData.changes.forEach(c => changesData.push([c.name, c.prevGross, c.currentGross, c.variance, `${c.percentage.toFixed(2)}%`]));
        const wsChanges = XLSX.utils.aoa_to_sheet(changesData);
        XLSX.utils.book_append_sheet(wb, wsChanges, "Payroll Changes");

        XLSX.writeFile(wb, `Payroll_Changes_${client.name.replace(/\s/g, '_')}_${selectedMonth.replace(/\s/g, '_')}.xlsx`);
    };

    const handleDownloadPdf = () => {
        if (!client || !reportData || !selectedMonth) return;

        const doc = new jsPDF();
        const formatCurr = (num: number) => {
            return num.toLocaleString('en-ZA', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        };

        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("PAYROLL CHANGES REPORT", 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Company: ${client.companyName || client.name}`, 15, 28);
        doc.text(`Comparison: ${reportData.prevMonthName} vs ${selectedMonth}`, 15, 34);

        let currentY = 40;

        // Starters Table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`New Starters in ${selectedMonth} (Count: ${reportData.starters.length})`, 15, currentY);
        currentY += 5;

        autoTable(doc, {
            startY: currentY,
            head: [['Employee Name', 'Current Gross (ZAR)', 'Join Date']],
            body: reportData.starters.length === 0 ? [['No new starters detected', '-', '-']] : reportData.starters.map(s => [
                s.name,
                formatCurr(s.gross),
                s.joinDate
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110] }, // Teal header
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 40, halign: 'right' },
                2: { cellWidth: 40, halign: 'center' }
            }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;

        // Leavers Table
        doc.setFont('helvetica', 'bold');
        doc.text(`Leavers in ${selectedMonth} (Count: ${reportData.leavers.length})`, 15, currentY);
        currentY += 5;

        autoTable(doc, {
            startY: currentY,
            head: [['Employee Name', 'Last Gross (ZAR)', 'Termination Date']],
            body: reportData.leavers.length === 0 ? [['No leavers detected', '-', '-']] : reportData.leavers.map(l => [
                l.name,
                formatCurr(l.lastGross),
                l.terminationDate
            ]),
            theme: 'grid',
            headStyles: { fillColor: [185, 28, 28] }, // Red header
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 40, halign: 'right' },
                2: { cellWidth: 40, halign: 'center' }
            }
        });
        currentY = (doc as any).lastAutoTable.finalY + 12;

        // Revisions Table
        doc.setFont('helvetica', 'bold');
        doc.text(`Payroll Value Revisions / Variances`, 15, currentY);
        currentY += 5;

        autoTable(doc, {
            startY: currentY,
            head: [['Employee Name', `${reportData.prevMonthName} (ZAR)`, `${selectedMonth} (ZAR)`, 'Variance (ZAR)', '% Change']],
            body: reportData.changes.length === 0 ? [['No salary changes detected', '-', '-', '-', '-']] : reportData.changes.map(c => [
                c.name,
                formatCurr(c.prevGross),
                formatCurr(c.currentGross),
                formatCurr(c.variance),
                `${c.variance > 0 ? '+' : ''}${c.percentage.toFixed(2)}%`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] }, // Dark Slate header
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 32, halign: 'right' },
                2: { cellWidth: 32, halign: 'right' },
                3: { cellWidth: 32, halign: 'right' },
                4: { cellWidth: 24, halign: 'center' }
            }
        });

        // Save
        const fileName = `Payroll_Changes_${(client.companyName || client.name).replace(/\s/g, '_')}_${selectedMonth.replace(/\s/g, '_')}.pdf`;
        doc.save(fileName);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payroll Changes Report</h2>
                    <p className="text-sm text-muted-foreground font-medium">Month-on-month comparison of new hires, exits, and compensation variances.</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-teal-500/10 shadow-sm bg-teal-50/10">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase text-teal-800 tracking-widest">New Starters</CardTitle>
                        <UserPlus className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-teal-900">{reportData.starters.length}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Joined in {selectedMonth}</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-red-500/10 shadow-sm bg-red-50/10">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase text-red-800 tracking-widest">Leavers / Exits</CardTitle>
                        <UserMinus className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-red-900">{reportData.leavers.length}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Left before {selectedMonth}</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-slate-500/10 shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-800">Salary Revisions</CardTitle>
                        <RefreshCw className="h-4 w-4 text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-slate-900">{reportData.changes.length}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Variance vs {reportData.prevMonthName}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Starters Card */}
                <Card className="border-2">
                    <CardHeader className="bg-teal-500/5 border-b">
                        <CardTitle className="text-sm font-bold text-teal-950">New Hires / Starters ({selectedMonth})</CardTitle>
                        <CardDescription className="text-xs">Staff members present in the current payroll but not the previous.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">Staff Member</TableHead>
                                    <TableHead className="text-right font-bold">Gross Salary</TableHead>
                                    <TableHead className="text-center font-bold">Join Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.starters.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic text-xs">
                                            No new starters found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.starters.map((s, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-bold text-slate-900">{s.name}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(s.gross)}</TableCell>
                                            <TableCell className="text-center text-xs text-muted-foreground font-semibold">{s.joinDate}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Leavers Card */}
                <Card className="border-2">
                    <CardHeader className="bg-red-500/5 border-b">
                        <CardTitle className="text-sm font-bold text-red-950">Exits / Leavers ({selectedMonth})</CardTitle>
                        <CardDescription className="text-xs">Staff members present in the previous payroll but not the current.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-bold">Staff Member</TableHead>
                                    <TableHead className="text-right font-bold">Last Month Gross</TableHead>
                                    <TableHead className="text-center font-bold">Termination Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.leavers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground italic text-xs">
                                            No leavers detected.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.leavers.map((l, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-bold text-slate-900">{l.name}</TableCell>
                                            <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(l.lastGross)}</TableCell>
                                            <TableCell className="text-center text-xs text-muted-foreground font-semibold">{l.terminationDate}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Compensation Variances Card */}
            <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-sm font-bold">Gross Compensation Revisions</CardTitle>
                    <CardDescription className="text-xs">Employees with differences in gross payout between {reportData.prevMonthName} and {selectedMonth}.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10">
                                <TableHead className="font-bold">Staff Member</TableHead>
                                <TableHead className="text-right font-bold">{reportData.prevMonthName} Gross</TableHead>
                                <TableHead className="text-right font-bold">{selectedMonth} Gross</TableHead>
                                <TableHead className="text-right font-bold text-slate-800">Variance</TableHead>
                                <TableHead className="text-center font-bold">% Change</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.changes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic text-xs">
                                        No pay revisions or fluctuations detected.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reportData.changes.map((c, idx) => {
                                    const isUp = c.variance > 0;
                                    return (
                                        <TableRow key={idx} className="hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{formatCurrency(c.prevGross)}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{formatCurrency(c.currentGross)}</TableCell>
                                            <TableCell className={`text-right font-mono text-xs font-bold ${isUp ? 'text-green-700' : 'text-red-700'}`}>
                                                {formatCurrency(c.variance)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`font-bold border-none shadow-sm ${isUp ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}`}>
                                                    <span className="flex items-center gap-1">
                                                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {isUp ? '+' : ''}{c.percentage.toFixed(1)}%
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
