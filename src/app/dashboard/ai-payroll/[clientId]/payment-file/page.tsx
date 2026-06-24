'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirestore, doc, collection, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Landmark, Users, CreditCard, CheckCircle2, AlertTriangle, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Employee, Payslip, User } from '@/lib/types';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const db = getFirestore(firebaseApp);

export default function PaymentExportPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'client') {
            router.replace(`/dashboard/ai-payroll/${clientId}/dashboard`);
        }
    }, [user, clientId, router]);

    const [client, setClient] = useState<User | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!clientId) return;

        // Fetch Client
        const unsubClient = onSnapshot(doc(db, 'aiPayrollClients', clientId), (snap) => {
            if (snap.exists()) setClient({ id: snap.id, ...snap.data() } as User);
        });

        // Fetch Employees
        const unsubEmployees = onSnapshot(collection(db, 'aiPayrollClients', clientId, 'employees'), (snap) => {
            setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
        });

        // Fetch Payslips
        const unsubPayslips = onSnapshot(collection(db, 'aiPayrollClients', clientId, 'payslips'), (snap) => {
            setPayslips(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payslip)));
            setIsLoading(false);
        });

        return () => {
            unsubClient();
            unsubEmployees();
            unsubPayslips();
        };
    }, [clientId]);

    const activePeriod = client?.firstProcessingMonth || '';

    // Filter for finalized payslips matching the active period
    const activeFinalizedPayslips = useMemo(() => {
        if (!activePeriod) return [];
        return payslips.filter(p => p.status === 'finalized' && p.period === activePeriod);
    }, [payslips, activePeriod]);

    // Map payslips to employee details
    const paymentRecords = useMemo(() => {
        return activeFinalizedPayslips.map(ps => {
            const emp = employees.find(e => e.id === ps.employeeId);
            return {
                payslip: ps,
                employee: emp || null
            };
        });
    }, [activeFinalizedPayslips, employees]);

    const totalDisbursement = useMemo(() => {
        return paymentRecords.reduce((sum, r) => sum + r.payslip.netPay, 0);
    }, [paymentRecords]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const handleDownloadCsv = () => {
        if (!client || paymentRecords.length === 0) return;

        const headers = [
            "Employee Code",
            "Employee Name",
            "Account Holder",
            "Bank Name",
            "Branch Code",
            "Account Number",
            "Account Type",
            "Amount (ZAR)",
            "Payment Reference"
        ];

        const rows = paymentRecords.map(r => {
            const empCode = r.employee?.employeeCode || 'N/A';
            const fullName = r.employee ? `${r.employee.name} ${r.employee.surname}` : r.payslip.employeeName;
            const holder = r.employee?.bankingDetails?.accountHolder || fullName;
            const bank = r.employee?.bankingDetails?.bankName || 'N/A';
            const branch = r.employee?.bankingDetails?.branchCode || 'N/A';
            const account = r.employee?.bankingDetails?.accountNumber || 'N/A';
            const type = r.employee?.bankingDetails?.accountType || 'Savings';
            const amount = r.payslip.netPay.toFixed(2);
            const ref = `Salary ${activePeriod}`;

            return [
                empCode,
                `"${fullName.replace(/"/g, '""')}"`,
                `"${holder.replace(/"/g, '""')}"`,
                `"${bank.replace(/"/g, '""')}"`,
                `"${branch.replace(/"/g, '""')}"`,
                `"${account.replace(/"/g, '""')}"`,
                type,
                amount,
                `"${ref.replace(/"/g, '""')}"`
            ];
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const filename = `ACB_EFT_Payment_File_${(client.companyName || client.name).replace(/\s/g, '_')}_${activePeriod.replace(/\s/g, '_')}.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">EFT Payment Files</h2>
                    <p className="text-sm text-muted-foreground font-medium">Download aggregated bank transfer instructions for the finalized period.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/ai-payroll/${clientId}/payslips`}>
                            Back to Payslips <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button 
                        onClick={handleDownloadCsv} 
                        disabled={paymentRecords.length === 0} 
                        className="font-black gap-2 shadow-md bg-primary text-white"
                    >
                        <Download className="h-4 w-4" /> Download Bank EFT (CSV)
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {/* Statistics cards */}
                <Card className="border-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Active Period</CardTitle>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold uppercase text-[9px] tracking-wide px-2 py-0.5">
                            {activePeriod || 'Not Set'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{activePeriod || 'No period set'}</div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1">Current processing cycle</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Total Payees</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">{paymentRecords.length} Employees</div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1">Finalized salary payouts</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-primary/5 border-primary/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Total EFT Value</CardTitle>
                        <Landmark className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-primary font-mono">{formatCurrency(totalDisbursement)}</div>
                        <p className="text-[10px] font-bold text-primary/70 uppercase mt-1">Net disbursements total</p>
                    </CardContent>
                </Card>
            </div>

            {/* Instruction Card */}
            <Card className="bg-slate-50 border-2 border-slate-200/50">
                <CardHeader className="pb-3 flex flex-row items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                        <CardTitle className="text-sm font-bold">Standard South African Bank Upload Instructions</CardTitle>
                        <CardDescription className="text-xs">How to upload this payment file to your corporate banking portal.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-xs leading-relaxed space-y-2 text-slate-600 font-medium">
                    <p>
                        The downloadable file is formatted as a standard South African CSV payment instructions template. Most SA banking platforms (FNB Online Banking Enterprise, Standard Bank Business Online, Nedbank NetBank Business, and ABSA Integrator) support loading CSV files directly to avoid manual input errors:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 mt-2 text-slate-700">
                        <li>Download the CSV payment file using the button above.</li>
                        <li>Log in to your corporate bank portal and navigate to the <strong>Payments / EFT / Batch Payments</strong> section.</li>
                        <li>Select **Import/Upload Batch** and choose the downloaded CSV file.</li>
                        <li>Map the columns if requested by your bank (most portals recognize standard comma-separated fields automatically).</li>
                        <li>Review the aggregate amount matching the <span className="font-bold text-slate-900">{formatCurrency(totalDisbursement)}</span> total, authorize, and release the payments.</li>
                    </ol>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" /> Net Disbursement Listing
                    </CardTitle>
                    <CardDescription>Finalized staff payouts scheduled for the active cycle.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {paymentRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center p-6 border-t">
                            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3 opacity-80" />
                            <p className="font-bold text-slate-900 text-sm">No finalized records found for this period.</p>
                            <p className="text-xs mt-1 max-w-md">You need to review and finalize payslips in the active month ({activePeriod}) on the <Link href={`/dashboard/ai-payroll/${clientId}/payslips`} className="text-primary font-bold hover:underline">Payslips Page</Link> before generating a payment instruction file.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10">
                                    <TableHead className="font-bold">Staff Member</TableHead>
                                    <TableHead className="font-bold">Bank Name</TableHead>
                                    <TableHead className="font-bold">Branch Code</TableHead>
                                    <TableHead className="font-bold">Account Number</TableHead>
                                    <TableHead className="font-bold">Account Type</TableHead>
                                    <TableHead className="text-right font-bold text-slate-900">Net Pay</TableHead>
                                    <TableHead className="text-right font-bold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paymentRecords.map((rec) => {
                                    const name = rec.employee ? `${rec.employee.name} ${rec.employee.surname}` : rec.payslip.employeeName;
                                    const code = rec.employee?.employeeCode || 'N/A';
                                    const bank = rec.employee?.bankingDetails?.bankName || 'N/A';
                                    const branch = rec.employee?.bankingDetails?.branchCode || 'N/A';
                                    const account = rec.employee?.bankingDetails?.accountNumber || 'N/A';
                                    const type = rec.employee?.bankingDetails?.accountType || 'Savings';

                                    return (
                                        <TableRow key={rec.payslip.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-bold text-slate-900">
                                                <div className="flex flex-col">
                                                    <span>{name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-700">{bank}</TableCell>
                                            <TableCell className="text-xs font-mono font-medium">{branch}</TableCell>
                                            <TableCell className="text-xs font-mono font-medium">{account}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-[9px] uppercase font-bold bg-muted/40">{type}</Badge></TableCell>
                                            <TableCell className="text-right font-black text-primary font-mono">{formatCurrency(rec.payslip.netPay)}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="success" className="text-[9px] uppercase font-bold gap-1 px-2 py-0.5 border-none shadow-sm">
                                                    <CheckCircle2 className="h-2.5 w-2.5" /> Finalized
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            <TableFooter className="bg-muted/20">
                                <TableRow>
                                    <TableCell className="font-black text-slate-900 uppercase text-[10px]">Grand Totals</TableCell>
                                    <TableCell colSpan={4}></TableCell>
                                    <TableCell className="text-right font-black text-primary font-mono">{formatCurrency(totalDisbursement)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
