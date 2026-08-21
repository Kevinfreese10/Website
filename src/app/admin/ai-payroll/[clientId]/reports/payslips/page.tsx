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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText, Users, Mail } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parse, isValid } from 'date-fns';
import jsPDF from 'jspdf';
import { generatePayslipPdfPage } from '@/lib/payslipPdf';
import { emailBatchPayslips } from '@/app/actions/emailBatchPayslips';

const db = getFirestore(firebaseApp);

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

export default function PayslipsBatchDownloadPage() {
    const params = useParams();
    const clientId = params.clientId as string;
    const { toast } = useToast();
    
    const [client, setClient] = useState<User | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedPayslipIds, setSelectedPayslipIds] = useState<string[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isEmailing, setIsEmailing] = useState(false);
    const [hideRatePerHour, setHideRatePerHour] = useState<boolean>(false);
    const [hidePayDate, setHidePayDate] = useState<boolean>(false);

    // Fetch Initial Data
    useEffect(() => {
        if (!clientId) return;

        // 1. Fetch Client
        const unsubClient = onSnapshot(doc(db, 'aiPayrollClients', clientId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setClient({ ...data, id: snap.id } as User);
                if (data.hideRatePerHour !== undefined) setHideRatePerHour(!!data.hideRatePerHour);
                if (data.hidePayDate !== undefined) setHidePayDate(!!data.hidePayDate);
                if (!selectedMonth) {
                    const isFortnightly = data.payrollFrequency === 'Fortnightly';
                    let defaultMonth = data.firstProcessingMonth || format(new Date(), 'MMMM yyyy');
                    if (!isFortnightly && defaultMonth.includes('/')) {
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

    // Available Months
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        const isFortnightly = client?.payrollFrequency === 'Fortnightly';
        
        if (isFortnightly) {
            if (client?.firstProcessingMonth) {
                months.add(client.firstProcessingMonth);
            }
            payslips.forEach(ps => {
                if (ps.period) {
                    months.add(ps.period);
                }
            });
            return Array.from(months).sort((a, b) => {
                try {
                    const dateA = parse(a, 'dd/MM/yyyy', new Date());
                    const dateB = parse(b, 'dd/MM/yyyy', new Date());
                    return dateB.getTime() - dateA.getTime();
                } catch (e) {
                    return 0;
                }
            });
        } else {
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
        }
    }, [payslips, client]);

    // Period finalized payslips
    const periodPayslips = useMemo(() => {
        if (!selectedMonth) return [];

        const isFortnightly = client?.payrollFrequency === 'Fortnightly';
        let periodPayslips: Payslip[] = [];

        if (isFortnightly) {
            periodPayslips = payslips.filter(ps => {
                return ps.status === 'finalized' && ps.period === selectedMonth;
            });
        } else {
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

            periodPayslips = payslips.filter(ps => {
                if (ps.status !== 'finalized') return false;
                const psPeriodDate = getPeriodDate(ps.period);
                return isWithinInterval(psPeriodDate, { start, end });
            });
        }

        return periodPayslips;
    }, [payslips, client, selectedMonth]);

    // Total metrics for display
    const metrics = useMemo(() => {
        let totalNet = 0;
        let totalGross = 0;
        periodPayslips.forEach(ps => {
            totalNet += ps.netPay || 0;
            totalGross += ps.grossPay || 0;
        });
        return { totalNet, totalGross, count: periodPayslips.length };
    }, [periodPayslips]);

    // Update selected ids when period payslips change
    useEffect(() => {
        setSelectedPayslipIds(periodPayslips.map(p => p.id!));
    }, [periodPayslips]);

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedPayslipIds(periodPayslips.map(p => p.id!));
        } else {
            setSelectedPayslipIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedPayslipIds(prev => [...prev, id]);
        } else {
            setSelectedPayslipIds(prev => prev.filter(item => item !== id));
        }
    };

    const handleDownloadIndividual = (ps: Payslip, employee: Employee) => {
        if (!client) return;
        try {
            const doc = new jsPDF();
            generatePayslipPdfPage(doc, ps, employee, client, undefined, undefined, { hideRatePerHour, hidePayDate });
            doc.save(`Payslip-${employee.surname}-${(ps.period || 'Current').replace(/\s/g, '-')}.pdf`);
            toast({ title: 'Download Successful' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Download Failed', variant: 'destructive' });
        }
    };

    const handleDownloadBatch = async () => {
        const selected = periodPayslips.filter(ps => selectedPayslipIds.includes(ps.id!));
        if (selected.length === 0) {
            toast({ title: 'No payslips selected', description: 'Please select at least one payslip to download.', variant: 'destructive' });
            return;
        }

        setIsDownloading(true);
        try {
            const doc = new jsPDF();
            let addedPages = 0;

            selected.forEach((ps) => {
                const emp = employees.find(e => e.id === ps.employeeId);
                if (!emp || !client) return;

                if (addedPages > 0) {
                    doc.addPage();
                }
                generatePayslipPdfPage(doc, ps, emp, client, undefined, undefined, { hideRatePerHour, hidePayDate });
                addedPages++;
            });

            if (addedPages > 0) {
                doc.save(`Payslips-Batch-${selectedMonth.replace(/\s/g, '-')}.pdf`);
                toast({ title: 'Batch Download Successful', description: `Downloaded ${addedPages} payslips.` });
            } else {
                toast({ title: 'Batch Download Failed', description: 'No valid employee matches found.', variant: 'destructive' });
            }
        } catch (err) {
            console.error(err);
            toast({ title: 'Batch Download Failed', description: 'An error occurred during PDF generation.', variant: 'destructive' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleEmailBatch = async () => {
        const selected = periodPayslips.filter(ps => selectedPayslipIds.includes(ps.id!));
        if (selected.length === 0) {
            toast({ title: 'No payslips selected', description: 'Please select at least one payslip to email.', variant: 'destructive' });
            return;
        }

        setIsEmailing(true);
        try {
            const res = await emailBatchPayslips(clientId, selectedMonth, selectedPayslipIds, { hideRatePerHour, hidePayDate });
            
            if (!res.success) {
                toast({ title: 'Emailing Failed', description: res.error || 'Unknown error occurred.', variant: 'destructive' });
            } else {
                let desc = `Successfully sent ${res.sentCount} emails.`;
                if (res.skippedCount && res.skippedCount > 0) {
                    desc += ` Skipped ${res.skippedCount} (missing email/password).`;
                }
                if (res.errorCount && res.errorCount > 0) {
                    desc += ` Failed ${res.errorCount}.`;
                }
                
                toast({ 
                    title: 'Batch Email Complete', 
                    description: desc,
                    variant: res.errorCount && res.errorCount > 0 ? 'destructive' : 'default'
                });
            }
        } catch (err) {
            console.error(err);
            toast({ title: 'Emailing Failed', description: 'An error occurred while communicating with the server.', variant: 'destructive' });
        } finally {
            setIsEmailing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const allChecked = periodPayslips.length > 0 && selectedPayslipIds.length === periodPayslips.length;
    const someChecked = selectedPayslipIds.length > 0 && selectedPayslipIds.length < periodPayslips.length;

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-primary/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                        Payslip Batch Download
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Download all finalized employee payslips for a specific pay period in a single combined PDF.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Select Period:</span>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[220px] bg-background border-primary/20">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMonths.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Finalized Payslips</CardTitle>
                        <FileText className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.count}</div>
                        <p className="text-xs text-muted-foreground mt-1">For period {selectedMonth}</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Gross Cost</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalGross)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Gross cost to company</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
                        <Users className="h-4 w-4 text-primary text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalNet)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Net amount paid to employees</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payslips Table */}
            <Card className="border-primary/15 shadow-md">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-primary/10 pb-4">
                    <div>
                        <CardTitle>Employee Payslips</CardTitle>
                        <CardDescription>Select employees to include in the batch download.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-lg border border-primary/10 text-xs">
                            <span className="font-bold text-muted-foreground mr-0.5">Template Options:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-foreground">
                                <Checkbox 
                                    checked={hideRatePerHour} 
                                    onCheckedChange={(c) => setHideRatePerHour(!!c)} 
                                />
                                <span>Hide Rate Per Hour</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-foreground">
                                <Checkbox 
                                    checked={hidePayDate} 
                                    onCheckedChange={(c) => setHidePayDate(!!c)} 
                                />
                                <span>Hide Pay Date</span>
                            </label>
                        </div>
                        <Button 
                            onClick={handleEmailBatch} 
                            disabled={isEmailing || isDownloading || selectedPayslipIds.length === 0}
                            variant="outline"
                            className="shadow-sm"
                        >
                            {isEmailing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Emailing...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email Selected ({selectedPayslipIds.length})
                                </>
                            )}
                        </Button>
                        <Button 
                            onClick={handleDownloadBatch} 
                            disabled={isDownloading || isEmailing || selectedPayslipIds.length === 0}
                            className="font-bold shadow-sm"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Selected ({selectedPayslipIds.length})
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {periodPayslips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <h3 className="font-semibold text-lg text-muted-foreground">No Finalized Payslips</h3>
                            <p className="text-sm text-muted-foreground max-w-sm px-4">
                                There are no finalized payslips for the selected period ({selectedMonth}). Make sure payslips are finalized in the Payroll Processing module.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-primary/5">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[50px] text-center">
                                            <Checkbox 
                                                checked={allChecked ? true : (someChecked ? 'indeterminate' : false)} 
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Gross Pay</TableHead>
                                        <TableHead className="text-right">Net Pay</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {periodPayslips.map((ps) => {
                                        const emp = employees.find(e => e.id === ps.employeeId);
                                        const isSelected = selectedPayslipIds.includes(ps.id!);
                                        if (!emp) return null;

                                        return (
                                            <TableRow key={ps.id} className={isSelected ? 'bg-primary/5' : ''}>
                                                <TableCell className="text-center">
                                                    <Checkbox 
                                                        checked={isSelected} 
                                                        onCheckedChange={(checked) => handleSelectRow(ps.id!, checked)}
                                                        aria-label={`Select ${emp.name} ${emp.surname}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-mono font-medium">{emp.employeeCode}</TableCell>
                                                <TableCell className="font-semibold">{emp.name} {emp.surname}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{ps.period}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(ps.grossPay)}</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">{formatCurrency(ps.netPay)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        Finalized
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleDownloadIndividual(ps, emp)}
                                                        className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                                                    >
                                                        <Download className="h-4 w-4 mr-1" />
                                                        PDF
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
