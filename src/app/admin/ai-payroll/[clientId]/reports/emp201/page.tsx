'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Payslip, Employee, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import * as XLSX from 'xlsx';
import { Loader2, Download, Users, Calculator, FileText } from 'lucide-react';
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

export default function Emp201ReportPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [client, setClient] = useState<User | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
    const [selectedBatchMonths, setSelectedBatchMonths] = useState<string[]>([]);

    // Fetch Initial Data
    useEffect(() => {
        if (!clientId) return;

        // 1. Fetch Client
        const unsubClient = onSnapshot(doc(db, 'aiPayrollClients', clientId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setClient({ ...data, id: snap.id } as User);
                // Default to active processing month if set, otherwise current month
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

        // 3. Fetch All Employees
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

    // Available EMP201 months (Standard Monthly Declaration)
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        
        // Add current active processing month if set
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

        // Add current and past 12 months as options
        const now = new Date();
        for (let i = 0; i < 13; i++) {
            months.add(format(subMonths(now, i), 'MMMM yyyy'));
        }
        
        // Also add any months that have historical payslips based on their period
        payslips.forEach(ps => {
            if (ps.period) {
                if (ps.period.includes('/')) {
                    const parsed = parse(ps.period.split(' - ').pop()?.trim() || '', 'dd/MM/yyyy', new Date());
                    if (isValid(parsed)) {
                        months.add(format(parsed, 'MMMM yyyy'));
                    }
                } else {
                    const base = ps.period.split(' - ')[0];
                    const parts = base.trim().split(' ');
                    if (parts.length >= 2) {
                        months.add(`${parts[0]} ${parts[1]}`);
                    }
                }
            }
        });

        function subMonths(date: Date, months: number) {
            const d = new Date(date);
            d.setMonth(d.getMonth() - months);
            return d;
        }

        return Array.from(months).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateB.getTime() - dateA.getTime();
        });
    }, [payslips, client]);

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

    const computeReportDataForMonth = (month: string) => {
        if (!month) return { breakdown: [], totals: { gross: 0, paye: 0, uif: 0, sdl: 0, payable: 0 } };

        const targetDate = parse(month, 'MMMM yyyy', new Date());
        const start = startOfMonth(targetDate);
        const end = endOfMonth(targetDate);

        const periodPayslips = payslips.filter(ps => {
            if (ps.status !== 'finalized') return false;
            const psPeriodDate = getPeriodDate(ps.period);
            return isWithinInterval(psPeriodDate, { start, end });
        });
        
        let totalPaye = 0;
        let totalUif = 0;
        let totalSdl = 0;
        let totalGross = 0;

        const employeeAggregates: Record<string, any> = {};

        periodPayslips.forEach(ps => {
            const deds = ps.deductions || [];
            const contribs = ps.contributions || [];
            const paye = deds.find(d => d.label.toLowerCase() === 'tax')?.amount || 0;
            const uifEmp = deds.find(d => d.label.toLowerCase().includes('unemployment'))?.amount || 0;
            const uifCo = contribs.find(c => c.label.toLowerCase().includes('unemployment'))?.amount || 0;
            const sdl = contribs.find(c => c.label.toLowerCase().includes('skills'))?.amount || 0;
            
            if (!employeeAggregates[ps.employeeId]) {
                employeeAggregates[ps.employeeId] = {
                    name: ps.employeeName,
                    gross: 0,
                    paye: 0,
                    uif: 0,
                    sdl: 0,
                    runs: 0
                };
            }

            employeeAggregates[ps.employeeId].gross += (ps.grossPay || 0);
            employeeAggregates[ps.employeeId].paye += paye;
            employeeAggregates[ps.employeeId].uif += (uifEmp + uifCo);
            employeeAggregates[ps.employeeId].sdl += sdl;
            employeeAggregates[ps.employeeId].runs += 1;

            totalPaye += paye;
            totalUif += (uifEmp + uifCo);
            totalSdl += sdl;
            totalGross += (ps.grossPay || 0);
        });

        return {
            breakdown: Object.values(employeeAggregates),
            totals: {
                gross: totalGross,
                paye: totalPaye,
                uif: totalUif,
                sdl: totalSdl,
                payable: totalPaye + totalUif + totalSdl
            }
        };
    };

    // Aggregation Logic: Find all payslips whose payroll period matches the selected month
    const reportData = useMemo(() => computeReportDataForMonth(selectedMonth), [payslips, selectedMonth]);

    const handleDownloadExcel = () => {
        if (!client || !reportData || !selectedMonth) return;

        const wb = XLSX.utils.book_new();
        const summary = [
            ["EMP201 MONTHLY DECLARATION (AGGREGATED)"],
            ["Company", client.companyName || client.name],
            ["PAYE Reference", client.payeReference || "N/A"],
            ["Declaration Month", selectedMonth],
            [""],
            ["Tax Code", "Description", "Amount"],
            ["4101", "PAYE (Employees Tax)", reportData.totals.paye],
            ["4141", "UIF (Unemployment Insurance Fund)", reportData.totals.uif],
            ["4142", "SDL (Skills Development Levy)", reportData.totals.sdl],
            ["", "TOTAL PAYABLE TO SARS", reportData.totals.payable]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summary);
        XLSX.utils.book_append_sheet(wb, wsSummary, "EMP201 Summary");

        const details = reportData.breakdown.map(b => ({
            "Employee Name": b.name,
            "Total Gross": b.gross,
            "Total PAYE": b.paye,
            "Total UIF": b.uif,
            "Total SDL": b.sdl,
            "No. of Payslips": b.runs
        }));
        const wsDetails = XLSX.utils.json_to_sheet(details);
        XLSX.utils.book_append_sheet(wb, wsDetails, "Aggregated Breakdown");

        XLSX.writeFile(wb, `EMP201_${client.name.replace(/\s/g, '_')}_${selectedMonth.replace(/\s/g, '_')}.xlsx`);
    };

    const generatePdf = (month: string, data: any) => {
        if (!client) return;

        const doc = new jsPDF();
        
        const formatCurr = (num: number) => {
            return num.toLocaleString('en-ZA', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        };

        // Title Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("EMP201 MONTHLY DECLARATION (AGGREGATED)", 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Company: ${client.companyName || client.name}`, 15, 28);
        doc.text(`PAYE Ref: ${client.payeReference || "N/A"}`, 15, 34);
        doc.text(`Declaration Month: ${month}`, 15, 40);

        // Summary Table
        autoTable(doc, {
            startY: 46,
            head: [['Tax Code', 'Description', 'Amount (ZAR)']],
            body: [
                ['4101', 'PAYE (Employees Tax)', formatCurr(data.totals.paye)],
                ['4141', 'UIF (Unemployment Insurance Fund)', formatCurr(data.totals.uif)],
                ['4142', 'SDL (Skills Development Levy)', formatCurr(data.totals.sdl)],
                ['', 'TOTAL PAYABLE TO SARS', formatCurr(data.totals.payable)]
            ],
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 100 },
                2: { cellWidth: 50, halign: 'right' }
            },
            didParseCell: (cellData) => {
                if (cellData.row.index === 3) {
                    cellData.cell.styles.fontStyle = 'bold';
                    if (cellData.column.index === 1) {
                        cellData.cell.styles.halign = 'right';
                    }
                }
            }
        });

        const summaryFinalY = (doc as any).lastAutoTable.finalY || 80;

        // Breakdown Table Title
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Aggregated Employee Totals", 15, summaryFinalY + 15);

        // Details Table
        autoTable(doc, {
            startY: summaryFinalY + 20,
            head: [['Staff Member', 'Runs', 'PAYE (ZAR)', 'UIF (ZAR)', 'SDL (ZAR)', 'Gross Total (ZAR)']],
            body: data.breakdown.map((b: any) => [
                b.name,
                String(b.runs),
                formatCurr(b.paye),
                formatCurr(b.uif),
                formatCurr(b.sdl),
                formatCurr(b.gross)
            ]),
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: 55 },
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 28, halign: 'right' },
                3: { cellWidth: 28, halign: 'right' },
                4: { cellWidth: 24, halign: 'right' },
                5: { cellWidth: 30, halign: 'right' }
            }
        });

        // Save
        const fileName = `EMP201_${(client.companyName || client.name).replace(/\s/g, '_')}_${month.replace(/\s/g, '_')}.pdf`;
        doc.save(fileName);
    };

    const handleDownloadPdf = () => {
        if (!client || !reportData || !selectedMonth) return;
        generatePdf(selectedMonth, reportData);
    };

    const handleBatchExportPdf = () => {
        if (selectedBatchMonths.length === 0) return;
        selectedBatchMonths.forEach(month => {
            const data = computeReportDataForMonth(month);
            generatePdf(month, data);
        });
        setIsBatchExportOpen(false);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">EMP201 Aggregated Return</h2>
                    <p className="text-sm text-muted-foreground font-medium">Declaration for SARS based on all finalized payments in the selected month.</p>
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
                    <Button variant="outline" onClick={() => {
                        setSelectedBatchMonths([]);
                        setIsBatchExportOpen(true);
                    }}>
                        <FileText className="mr-2 h-4 w-4" /> Batch Export
                    </Button>
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
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">PAYE (Tax)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(reportData.totals.paye)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">SARS Code: 4101</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">UIF (Total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(reportData.totals.uif)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">Employee + Employer</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">SDL</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(reportData.totals.sdl)}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1">SARS Code: 4142</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">Monthly Liability</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black tabular-nums">{formatCurrency(reportData.totals.payable)}</p>
                        <p className="text-[10px] font-bold mt-1 opacity-90">Due by the 7th of {format(addMonths(parse(selectedMonth, 'MMMM yyyy', new Date()), 1), 'MMMM')}</p>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isBatchExportOpen} onOpenChange={setIsBatchExportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batch Export EMP201s</DialogTitle>
                        <DialogDescription>Select the months you want to download as individual PDFs.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto p-4 border rounded-md">
                        {availableMonths.map(m => (
                            <div key={m} className="flex items-center space-x-3">
                                <Checkbox 
                                    id={`batch-${m}`} 
                                    checked={selectedBatchMonths.includes(m)}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedBatchMonths(prev => [...prev, m]);
                                        else setSelectedBatchMonths(prev => prev.filter(x => x !== m));
                                    }}
                                />
                                <Label htmlFor={`batch-${m}`} className="cursor-pointer text-sm font-medium">{m}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBatchExportOpen(false)}>Cancel</Button>
                        <Button onClick={handleBatchExportPdf} disabled={selectedBatchMonths.length === 0}>
                            Download {selectedBatchMonths.length} PDF(s)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="border-2 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Aggregated Employee Totals</CardTitle>
                            <CardDescription>Sum of all pay runs finalized in {selectedMonth}.</CardDescription>
                        </div>
                    </div>
                    {client?.payrollFrequency === 'Fortnightly' && (
                        <Badge variant="outline" className="bg-white border-primary/20 text-primary font-bold">Bi-Weekly Aggregation Active</Badge>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10">
                                <TableHead className="font-bold">Staff Member</TableHead>
                                <TableHead className="text-center font-bold">Runs</TableHead>
                                <TableHead className="text-right font-bold text-primary">PAYE</TableHead>
                                <TableHead className="text-right font-bold">UIF</TableHead>
                                <TableHead className="text-right font-bold">SDL</TableHead>
                                <TableHead className="text-right font-bold">Gross Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.breakdown.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                        No finalized payslips found with payment dates in this month.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reportData.breakdown.map((row, idx) => (
                                    <TableRow key={idx} className="hover:bg-slate-50/50">
                                        <TableCell className="font-bold text-slate-900">{row.name}</TableCell>
                                        <TableCell className="text-center"><Badge variant="secondary" className="h-5">{row.runs}</Badge></TableCell>
                                        <TableCell className="text-right font-mono text-xs font-bold text-primary">{formatCurrency(row.paye)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.uif)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs">{formatCurrency(row.sdl)}</TableCell>
                                        <TableCell className="text-right font-mono text-xs font-semibold">{formatCurrency(row.gross)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter className="bg-muted/20">
                            <TableRow>
                                <TableCell className="font-black text-slate-900 uppercase text-[10px]">Grand Totals</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right font-black text-primary">{formatCurrency(reportData.totals.paye)}</TableCell>
                                <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.uif)}</TableCell>
                                <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.sdl)}</TableCell>
                                <TableCell className="text-right font-black text-slate-900">{formatCurrency(reportData.totals.gross)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>

            <Alert className="bg-muted/30 border-dashed border-2">
                <Calculator className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase tracking-wider">SARS eFiling Aggregation</AlertTitle>
                <AlertDescription className="text-xs leading-relaxed mt-1">
                    When filing your <strong>EMP201</strong> for bi-weekly payrolls, you must sum all pay cycles paid during the calendar month. The totals provided above already combine all finalized runs detected for the selected period.
                </AlertDescription>
            </Alert>
        </div>
    );
}

function addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}
