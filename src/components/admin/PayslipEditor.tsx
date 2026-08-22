'use client';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Payslip, PayslipItem, Employee, User } from "@/lib/types";
import { Plus, Trash2, Loader2, Save, Calculator, Landmark, ShieldCheck, User as UserIcon, Briefcase, RefreshCw, Clock, History } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { PayrollService } from '@/services/PayrollService';
import { useToast } from '@/hooks/use-toast';
import { updatePayslipAction } from '@/app/actions/payroll-core';
import { Badge } from "@/components/ui/badge";
import PayslipDownloadButton from '@/components/pdf/PayslipDownloadButton';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
};

const STANDARD_EARNINGS = ["Basic Salary", "Leave Paid", "Back Pay", "Annual Bonus / 13th Cheque", "Commission", "Travel Allowance", "Reimbursive Travel (Taxable)", "Reimbursive Travel (Non-Taxable)", "Subsistence Allowance (Non-Taxable)", "Cell Phone Allowance", "Work From Home Allowance"];
const STANDARD_DEDUCTIONS = ["Advance Repayment", "Loan Repayment", "Garnishee Order", "Union Fee", "Unpaid Leave"];
const STANDARD_FRINGE_BENEFITS = ["Company Car", "Medical Aid (Employer)", "Pension / Provident Fund"];

const ItemRow = ({ 
    item, 
    index, 
    type,
    onUpdate,
    onRemove
}: { 
    item: PayslipItem, 
    index: number, 
    type: 'earning' | 'deduction' | 'contribution' | 'fringe',
    onUpdate: (index: number, field: 'label' | 'amount' | 'taxCategory' | 'durationMonths', value: any, type: 'earning' | 'deduction' | 'contribution' | 'fringe') => void,
    onRemove: (index: number, type: 'earning' | 'deduction' | 'contribution' | 'fringe') => void
}) => {
    const isCalculatedItem = type === 'earning' && (
        item.label.toLowerCase().includes('normal hours') ||
        item.label.toLowerCase().includes('hourly rate') ||
        item.label.toLowerCase().includes('overtime')
    );

    const isStandardLabel = type === 'earning' ? STANDARD_EARNINGS.includes(item.label) : type === 'deduction' ? STANDARD_DEDUCTIONS.includes(item.label) : type === 'fringe' ? STANDARD_FRINGE_BENEFITS.includes(item.label) : false;
    const [isCustom, setIsCustom] = React.useState(!isStandardLabel && item.label !== 'New item');

    return (
        <div className="flex flex-col gap-1 py-2 px-2 border-b border-gray-100 last:border-0 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-2 group">
                {(!isCalculatedItem && !item.isStatutory && (type === 'earning' || type === 'deduction' || type === 'fringe')) ? (
                    <div className="flex-grow flex gap-2">
                        {!isCustom ? (
                            <Select 
                                value={item.label === 'New item' ? '' : item.label} 
                                onValueChange={(val) => {
                                    if (val === 'Other') {
                                        setIsCustom(true);
                                        onUpdate(index, 'label', '', type);
                                    } else {
                                        onUpdate(index, 'label', val, type);
                                        if (val === 'Annual Bonus / 13th Cheque' && type === 'earning') {
                                            onUpdate(index, 'taxCategory', 'bonus', type);
                                        } else if (val === 'Travel Allowance' || val === 'Company Car') {
                                            onUpdate(index, 'taxCategory', '80-percent-taxable', type);
                                        } else if (val === 'Reimbursive Travel (Non-Taxable)' || val === 'Subsistence Allowance (Non-Taxable)') {
                                            onUpdate(index, 'taxCategory', 'non-taxable', type);
                                        } else {
                                            onUpdate(index, 'taxCategory', 'regular', type);
                                        }
                                    }
                                }}
                            >
                                <SelectTrigger className="h-7 text-[11px] bg-transparent border-none shadow-none font-medium flex-grow p-0 focus:ring-0">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(type === 'earning' ? STANDARD_EARNINGS : type === 'deduction' ? STANDARD_DEDUCTIONS : STANDARD_FRINGE_BENEFITS).map(opt => (
                                        <SelectItem key={opt} value={opt} className="text-[11px]">{opt}</SelectItem>
                                    ))}
                                    <SelectItem value="Other" className="text-[11px] italic">Custom Option...</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input 
                                value={item.label} 
                                onChange={(e) => onUpdate(index, 'label', e.target.value, type)}
                                placeholder="Enter custom label..."
                                className="h-7 text-[11px] border-none bg-transparent shadow-none focus-visible:ring-0 p-0 flex-grow font-medium"
                                autoFocus
                            />
                        )}
                    </div>
                ) : (
                    <Input 
                        value={item.label} 
                        onChange={(e) => onUpdate(index, 'label', e.target.value, type)}
                        disabled={item.isStatutory || isCalculatedItem}
                        className="h-7 text-[11px] border-none bg-transparent shadow-none focus-visible:ring-0 p-0 flex-grow font-medium"
                    />
                )}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">R</span>
                    <Input 
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => onUpdate(index, 'amount', e.target.value, type)}
                        disabled={item.isStatutory || isCalculatedItem}
                        className="h-7 w-24 text-right text-[11px] border-none bg-transparent shadow-none focus-visible:ring-0 p-0 font-mono font-bold"
                    />
                    {!item.isStatutory && !isCalculatedItem && (
                        <Button aria-label="Delete" variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => onRemove(index, type)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
            {(!isCalculatedItem && !item.isStatutory && (type === 'earning' || type === 'deduction')) && (
                <div className="flex justify-between items-center pl-1 pr-7">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Duration:</span>
                    <Select 
                        value={item.durationMonths?.toString() || '1'} 
                        onValueChange={(val) => onUpdate(index, 'durationMonths', val === 'indefinite' ? 'indefinite' : parseInt(val), type)}
                    >
                        <SelectTrigger className="h-5 w-28 text-[9px] bg-transparent border-none shadow-none p-0 focus:ring-0 text-muted-foreground hover:text-foreground">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1" className="text-[10px]">This Period Only</SelectItem>
                            <SelectItem value="2" className="text-[10px]">2 Months</SelectItem>
                            <SelectItem value="3" className="text-[10px]">3 Months</SelectItem>
                            <SelectItem value="6" className="text-[10px]">6 Months</SelectItem>
                            <SelectItem value="12" className="text-[10px]">12 Months</SelectItem>
                            <SelectItem value="indefinite" className="text-[10px]">Indefinitely</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
};

export default function PayslipEditor({ 
    payslip, 
    employee, 
    client,
    allPayslips = [],
    onSave 
}: { 
    payslip: Payslip, 
    employee: Employee, 
    client: User,
    allPayslips?: Payslip[],
    onSave: () => void 
}) {
    const { toast } = useToast();
    const [earnings, setEarnings] = useState<PayslipItem[]>(payslip.earnings || []);
    const [deductions, setDeductions] = useState<PayslipItem[]>(() => {
        const list = [...(payslip.deductions || [])];
        if (!list.some(d => d.label === 'Tax' && d.isStatutory)) {
            list.push({ label: 'Tax', amount: 0, isStatutory: true });
        }
        if (!list.some(d => d.label === 'Unemployment insurance fund' && d.isStatutory)) {
            list.push({ label: 'Unemployment insurance fund', amount: 0, isStatutory: true });
        }
        return list;
    });
    const [contributions, setContributions] = useState<PayslipItem[]>(() => {
        const list = [...(payslip.contributions || [])];
        if (!list.some(c => c.label === 'Unemployment insurance fund' && c.isStatutory)) {
            list.push({ label: 'Unemployment insurance fund', amount: 0, isStatutory: true });
        }
        if (!client.excludeSdl && !list.some(c => c.label === 'Skills development levy' && c.isStatutory)) {
            list.push({ label: 'Skills development levy', amount: 0, isStatutory: true });
        }
        return list;
    });
    const [fringeBenefits, setFringeBenefits] = useState<PayslipItem[]>(payslip.fringeBenefits || []);
    const [hoursWorked, setHoursWorked] = useState<number>(payslip.hoursWorked || 0);
    const [overtime10, setOvertime10] = useState<number>(() => {
        const item = payslip.earnings?.find(e => e.label.toLowerCase().includes('overtime (1.0x)') || e.label.toLowerCase().includes('overtime @ 1.0') || e.label.toLowerCase().includes('overtime @ 1 '));
        if (item) {
            const match = item.label.match(/\((\d+(?:\.\d+)?)\s*h\)/i);
            return match ? parseFloat(match[1]) : 0;
        }
        return 0;
    });
    const [overtime15, setOvertime15] = useState<number>(() => {
        const item = payslip.earnings?.find(e => e.label.toLowerCase().includes('overtime (1.5x)') || e.label.toLowerCase().includes('overtime @ 1.5'));
        if (item) {
            const match = item.label.match(/\((\d+(?:\.\d+)?)\s*h\)/i);
            return match ? parseFloat(match[1]) : 0;
        }
        return 0;
    });
    const [overtime20, setOvertime20] = useState<number>(() => {
        const item = payslip.earnings?.find(e => e.label.toLowerCase().includes('overtime (2x)') || e.label.toLowerCase().includes('overtime @ 2') || e.label.toLowerCase().includes('overtime (2.0x)'));
        if (item) {
            const match = item.label.match(/\((\d+(?:\.\d+)?)\s*h\)/i);
            return match ? parseFloat(match[1]) : 0;
        }
        return 0;
    });
    const [isSaving, setIsSaving] = useState(false);

    const frequency = PayrollService.getFrequencyMultiplier(payslip.frequency);

    // Sync Hourly Normal & Overtime Earnings
    useEffect(() => {
        const hourlyRate = employee.hourlyRate || (employee.payType === 'Salary' ? (employee.basicSalary || 0) / 160 : 0);
        
        setEarnings(prev => {
            let updated = [...prev];

            // 1. Normal Hours (only for Hourly employees)
            if (employee.payType === 'Hourly') {
                const basicIdx = updated.findIndex(item => 
                    item.label.toLowerCase().includes('normal hours') ||
                    item.label.toLowerCase().includes('hourly rate')
                );
                
                if (hoursWorked > 0) {
                    const amount = parseFloat((hourlyRate * hoursWorked).toFixed(2));
                    const label = `Normal Hours pay (${hoursWorked}h)`;
                    if (basicIdx > -1) {
                        updated[basicIdx] = { ...updated[basicIdx], label, amount };
                    } else {
                        updated.push({ label, amount, isStatutory: false });
                    }
                } else if (basicIdx > -1) {
                    updated = updated.filter((_, i) => i !== basicIdx);
                }
            }

            // Helper to update or push overtime items
            const updateOvertimeItem = (
                keyRegex: RegExp,
                hoursVal: number,
                rateMultiplier: number,
                labelTemplate: (h: number) => string
            ) => {
                let idx = updated.findIndex(item => keyRegex.test(item.label));
                if (hoursVal > 0) {
                    const amount = parseFloat((hourlyRate * rateMultiplier * hoursVal).toFixed(2));
                    const label = labelTemplate(hoursVal);
                    if (idx > -1) {
                        updated[idx] = { ...updated[idx], label, amount };
                    } else {
                        updated.push({ label, amount });
                    }
                } else if (idx > -1) {
                    updated = updated.filter((_, i) => i !== idx);
                }
            };

            // 2. Overtime @ 1.0
            updateOvertimeItem(
                /overtime\s*\(1\.0x\)/i,
                overtime10,
                1.0,
                (h) => `Overtime (1.0x) (${h}h)`
            );

            // 3. Overtime @ 1.5
            updateOvertimeItem(
                /overtime\s*\(1\.5x\)/i,
                overtime15,
                1.5,
                (h) => `Overtime (1.5x) (${h}h)`
            );

            // 4. Overtime @ 2.0
            updateOvertimeItem(
                /overtime\s*\(2\.0x\)|overtime\s*\(2x\)/i,
                overtime20,
                2.0,
                (h) => `Overtime (2.0x) (${h}h)`
            );

            return updated;
        });
    }, [hoursWorked, overtime10, overtime15, overtime20, employee.payType, employee.hourlyRate, employee.basicSalary]);

    const handleSyncFromProfile = () => {
        const basePeriod = client.firstProcessingMonth || 'Current Period';
        const baseValue = employee.payType === 'Hourly' ? (employee.hourlyRate || 0) : (employee.basicSalary || 0);
        
        const freshEarnings = PayrollService.calculateEarningsList(employee, baseValue, basePeriod, frequency, { normal: hoursWorked });
        setEarnings(freshEarnings);
        
        const gross = freshEarnings.reduce((s, i) => s + i.amount, 0);
        setDeductions(PayrollService.getInitialDeductions(
            gross, 
            basePeriod, 
            frequency, 
            employee.joinDate,
            employee.idNumber,
            employee.medicalAidMembers || 0,
            employee.medicalAidDependents || 0
        ));
        setContributions(PayrollService.getInitialContributions(gross, basePeriod, frequency, !!client.excludeSdl));
        
        toast({ title: "Synced with Profile", description: "Basic salary and statutory items refreshed." });
    };

    // Dynamic Recalculation logic
    const totals = useMemo(() => {
        const gross = earnings.reduce((sum, item) => sum + item.amount, 0);
        const regularGross = earnings.reduce((sum, e) => sum + (e.taxCategory === 'bonus' ? 0 : PayrollService.calculateTaxableAmount(e)), 0) + 
                             fringeBenefits.reduce((sum, f) => sum + PayrollService.calculateTaxableAmount(f), 0);
        const bonusGross = earnings.reduce((sum, e) => sum + (e.taxCategory === 'bonus' ? PayrollService.calculateTaxableAmount(e) : 0), 0) +
                           fringeBenefits.reduce((sum, f) => sum + (f.taxCategory === 'bonus' ? PayrollService.calculateTaxableAmount(f) : 0), 0);
        const period = client.firstProcessingMonth;
        
        const updatedDeductions = [...deductions];
        const updatedContributions = [...contributions];

        const payeIdx = updatedDeductions.findIndex(d => d.label === 'Tax' && d.isStatutory);
        const uifIdx = updatedDeductions.findIndex(d => d.label === 'Unemployment insurance fund' && d.isStatutory);
        const uifContribIdx = updatedContributions.findIndex(c => c.label === 'Unemployment insurance fund' && c.isStatutory);
        const sdlIdx = updatedContributions.findIndex(c => c.label === 'Skills development levy' && c.isStatutory);

        if (payeIdx > -1) {
            updatedDeductions[payeIdx].amount = PayrollService.calculatePaye(
                regularGross, 
                period, 
                frequency, 
                employee.joinDate,
                employee.idNumber,
                employee.medicalAidMembers || 0,
                employee.medicalAidDependents || 0,
                bonusGross
            );
        }
        if (uifIdx > -1) updatedDeductions[uifIdx].amount = PayrollService.calculateUif(gross, period, frequency);
        if (uifContribIdx > -1) updatedContributions[uifContribIdx].amount = PayrollService.calculateUif(gross, period, frequency);
        if (sdlIdx > -1) updatedContributions[sdlIdx].amount = parseFloat((gross * 0.01).toFixed(2));

        const totalDeductions = updatedDeductions.reduce((sum, item) => sum + item.amount, 0);
        const totalContrib = updatedContributions.reduce((sum, item) => sum + item.amount, 0);
        const totalFringe = fringeBenefits.reduce((sum, item) => sum + item.amount, 0);

        // Tax details calculation.
        // getTaxConfig throws when SARS tables for this period's tax year aren't configured
        // (rather than silently reverting to stale brackets). This runs inside a useMemo — i.e.
        // during render — so an uncaught throw would blank the editor. Surface it as an explicit
        // "tax tables missing" state instead.
        const age = employee.idNumber ? PayrollService.getAgeFromIdNumber(employee.idNumber, PayrollService.getPeriodDate(period)) : 0;

        let config: ReturnType<typeof PayrollService.getTaxConfig> | null = null;
        let taxConfigError: string | null = null;
        try {
            config = PayrollService.getTaxConfig(period);
        } catch (err: any) {
            taxConfigError = err?.message || `SARS tax tables are not configured for the period "${period}".`;
        }

        let rebateApplied = config ? config.rebate : 0;
        let rebateDetails = 'Primary Rebate';
        if (config && age >= 65) {
            rebateApplied += config.rebateSecondary;
            rebateDetails += ' + Secondary (65+)';
        }
        if (config && age >= 75) {
            rebateApplied += config.rebateTertiary;
            rebateDetails += ' + Tertiary (75+)';
        }

        let medicalCredit = 0;
        if (config && (employee.medicalAidMembers || 0) > 0) {
            const mCredit = config.medCreditMember;
            const d1Credit = config.medCreditFirstDependent;
            const addCredit = config.medCreditAdditionalDependent;

            medicalCredit = mCredit;
            const deps = employee.medicalAidDependents || 0;
            if (deps > 0) {
                medicalCredit += d1Credit;
                if (deps > 1) {
                    medicalCredit += (deps - 1) * addCredit;
                }
            }
        }

        return {
            gross,
            totalDeductions,
            totalContrib,
            totalFringe,
            netPay: gross - totalDeductions,
            updatedDeductions,
            updatedContributions,
            age,
            rebateApplied,
            rebateDetails,
            medicalCredit,
            taxConfigError,
        };
    }, [earnings, deductions, contributions, fringeBenefits, client.firstProcessingMonth, frequency]);

    // Calculate YTD Totals for PDF
    const ytdTotals = useMemo(() => {
        const currentPeriodDate = PayrollService.getPeriodDate(payslip.period);
        // SA Tax Year starts in March.
        const taxYearStartMonth = 2; // March is index 2
        let taxYearStartYear = currentPeriodDate.getFullYear();
        if (currentPeriodDate.getMonth() < taxYearStartMonth) {
            taxYearStartYear -= 1;
        }
        const taxYearStart = new Date(taxYearStartYear, taxYearStartMonth, 1);

        const relevantHistory = allPayslips.filter(p => {
            if (p.employeeId !== employee.id || p.status !== 'finalized') return false;
            const pDate = PayrollService.getPeriodDate(p.period);
            return pDate >= taxYearStart && pDate <= currentPeriodDate;
        });

        // Initialize with current editor totals
        let gross = totals.gross;
        let tax = totals.updatedDeductions.find(d => d.label === 'Tax')?.amount || 0;
        let contrib = totals.totalContrib;
        let fringe = totals.totalFringe;

        relevantHistory.forEach(p => {
            // Avoid double counting current payslip if it exists in history
            if (p.id === payslip.id) return;
            
            gross += p.grossPay;
            tax += p.deductions.find(d => d.label === 'Tax')?.amount || 0;
            contrib += p.contributions.reduce((s, i) => s + i.amount, 0);
            fringe += p.fringeBenefits.reduce((s, i) => s + i.amount, 0);
        });

        return { gross, tax, contributions: contrib, fringe };
    }, [allPayslips, employee.id, payslip.period, totals, payslip.id]);

    const handleAddItem = (type: 'earning' | 'deduction' | 'contribution' | 'fringe') => {
        const newItem = { label: 'New item', amount: 0 };
        if (type === 'earning') setEarnings([...earnings, newItem]);
        else if (type === 'deduction') setDeductions([...deductions, newItem]);
        else if (type === 'contribution') setContributions([...contributions, newItem]);
        else setFringeBenefits([...fringeBenefits, newItem]);
    };

    const handleRemoveItem = (index: number, type: 'earning' | 'deduction' | 'contribution' | 'fringe') => {
        if (type === 'earning') setEarnings(earnings.filter((_, i) => i !== index));
        else if (type === 'deduction') setDeductions(deductions.filter((_, i) => i !== index));
        else if (type === 'contribution') setContributions(contributions.filter((_, i) => i !== index));
        else setFringeBenefits(fringeBenefits.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, field: 'label' | 'amount' | 'taxCategory' | 'durationMonths', value: any, type: 'earning' | 'deduction' | 'contribution' | 'fringe') => {
        const setter = type === 'earning' ? setEarnings : type === 'deduction' ? setDeductions : type === 'contribution' ? setContributions : setFringeBenefits;
        setter(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: field === 'amount' ? (parseFloat(value) || 0) : value };
            return updated;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalPeriod = payslip.period || client.firstProcessingMonth || format(new Date(), 'MMMM yyyy');
            const finalFrequency = (client.payrollFrequency as any) || payslip.frequency || 'Monthly';

            const finalData: Partial<Payslip> = {
                employeeId: employee.id,
                employeeName: `${employee.name} ${employee.surname}`,
                period: finalPeriod,
                date: new Date().toISOString() as any,
                frequency: finalFrequency,
                earnings: earnings.map(e => ({
                    label: e.label || '',
                    amount: typeof e.amount === 'number' && !isNaN(e.amount) ? e.amount : 0,
                    taxCategory: e.taxCategory || 'regular',
                    isStatutory: !!e.isStatutory,
                    durationMonths: e.durationMonths,
                })),
                deductions: totals.updatedDeductions.map(d => ({
                    label: d.label || '',
                    amount: typeof d.amount === 'number' && !isNaN(d.amount) ? d.amount : 0,
                    taxCategory: d.taxCategory || 'regular',
                    isStatutory: !!d.isStatutory,
                    durationMonths: d.durationMonths,
                })),
                contributions: totals.updatedContributions.map(c => ({
                    label: c.label || '',
                    amount: typeof c.amount === 'number' && !isNaN(c.amount) ? c.amount : 0,
                    taxCategory: c.taxCategory || 'regular',
                    isStatutory: !!c.isStatutory,
                })),
                fringeBenefits: fringeBenefits.map(f => ({
                    label: f.label || '',
                    amount: typeof f.amount === 'number' && !isNaN(f.amount) ? f.amount : 0,
                    taxCategory: f.taxCategory || 'regular',
                    isStatutory: !!f.isStatutory,
                })),
                grossPay: typeof totals.gross === 'number' && !isNaN(totals.gross) ? totals.gross : 0,
                totalDeductions: typeof totals.totalDeductions === 'number' && !isNaN(totals.totalDeductions) ? totals.totalDeductions : 0,
                netPay: typeof totals.netPay === 'number' && !isNaN(totals.netPay) ? totals.netPay : 0,
                hoursWorked: typeof hoursWorked === 'number' && !isNaN(hoursWorked) ? hoursWorked : 0
            };

            const newRecurringItems = [...(employee.recurringItems || [])];
            
            const processRecurring = (list: PayslipItem[], type: 'earning' | 'deduction') => {
                list.forEach(item => {
                    if (item.durationMonths === 'indefinite' || (typeof item.durationMonths === 'number' && item.durationMonths > 1)) {
                        const existingIdx = newRecurringItems.findIndex(r => r.label === item.label && r.type === type);
                        const rItem = {
                            id: Date.now().toString() + Math.random().toString(),
                            label: item.label || '',
                            amount: typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0,
                            type,
                            remainingMonths: item.durationMonths,
                            taxCategory: item.taxCategory || 'regular',
                            isStatutory: !!item.isStatutory
                        };
                        if (existingIdx > -1) {
                            newRecurringItems[existingIdx] = { ...newRecurringItems[existingIdx], ...rItem, id: newRecurringItems[existingIdx].id };
                        } else {
                            newRecurringItems.push(rItem);
                        }
                    }
                });
            };

            processRecurring(earnings, 'earning');
            processRecurring(totals.updatedDeductions, 'deduction');

            const res = await updatePayslipAction({
                idToken: await getAuth(firebaseApp).currentUser?.getIdToken(),
                clientId: client.id,
                payslipId: payslip.id,
                data: finalData,
                employeeId: employee.id,
                recurringItems: newRecurringItems
            });

            if (res.success) {
                toast({ title: "Payslip Finalized", description: `Updated record for ${employee.name} ${employee.surname}. Reports updated.` });
                onSave();
            } else {
                toast({ title: "Save Failed", description: res.error || "Could not save payslip.", variant: "destructive" });
            }
        } catch (e: any) {
            console.error("Error saving payslip:", e);
            const isStaleAction = e?.message?.includes('Server Action') || e?.message?.includes('was not found');
            if (isStaleAction) {
                toast({ 
                    title: "New Version Deployed", 
                    description: "Please refresh your browser (Ctrl+F5 or reload) to sync with the latest server update.", 
                    variant: "destructive" 
                });
            } else {
                toast({ title: "Error", description: e?.message || "Could not save payslip.", variant: "destructive" });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const ColumnHeader = ({ title, onAdd }: { title: string, onAdd: () => void }) => (
        <div className="bg-[#EFEFEF] p-2 flex justify-between items-center border-b border-[#CCCCCC]">
            <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wide">{title}</span>
            <Button aria-label="Add" variant="ghost" size="icon" className="h-5 w-5 text-[#999999] hover:text-primary" onClick={onAdd}>
                <Plus className="h-3 w-3" />
            </Button>
        </div>
    );



    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {employee.name.charAt(0)}{employee.surname.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{employee.name} {employee.surname}</h2>
                        <div className="flex gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {employee.jobTitle}</span>
                            <span className="flex items-center gap-1"><Landmark className="h-3 w-3" /> {employee.department}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="p-2 px-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-4">
                        {employee.payType === 'Hourly' && (
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Normal Hours</Label>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <Input 
                                        type="number" 
                                        value={hoursWorked} 
                                        onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                                        className="h-8 w-16 font-bold text-sm bg-white text-center"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">OT @ 1.0x</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    value={overtime10} 
                                    onChange={(e) => setOvertime10(parseFloat(e.target.value) || 0)}
                                    className="h-8 w-16 font-bold text-sm bg-white text-center"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">OT @ 1.5x</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    value={overtime15} 
                                    onChange={(e) => setOvertime15(parseFloat(e.target.value) || 0)}
                                    className="h-8 w-16 font-bold text-sm bg-white text-center"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">OT @ 2.0x</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    value={overtime20} 
                                    onChange={(e) => setOvertime20(parseFloat(e.target.value) || 0)}
                                    className="h-8 w-16 font-bold text-sm bg-white text-center"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge variant="outline" className="mb-1 font-bold uppercase tracking-widest text-[9px]">{payslip.period}</Badge>
                        <p className="text-sm font-black text-slate-900">
                            Rate: {formatCurrency(employee.payType === 'Hourly' ? (employee.hourlyRate || 0) : (employee.basicSalary || 0))}
                            {employee.payType === 'Hourly' ? '/hr' : '/mo'}
                        </p>
                        {employee.payType === 'Salary' && (
                            <span className="text-[10px] text-muted-foreground block font-medium mt-0.5">
                                OT Rate: R {formatCurrency(employee.hourlyRate || (employee.basicSalary || 0) / 160)}/hr
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <Card className="border shadow-lg rounded-none overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-[#CCCCCC]">
                    <div className="flex flex-col min-h-[350px]">
                        <ColumnHeader title="Earnings" onAdd={() => handleAddItem('earning')} />
                        <div className="flex-grow bg-white">
                            {earnings.map((item, i) => <ItemRow key={i} item={item} index={i} type="earning" onUpdate={handleUpdateItem} onRemove={handleRemoveItem} />)}
                        </div>
                        <div className="bg-[#F9F9F9] p-2 flex justify-between items-center border-t border-[#E5E5E5] text-[11px]">
                            <span className="font-bold text-[#666666]">Total</span>
                            <span className="font-bold font-mono">R {formatCurrency(totals.gross)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col min-h-[350px]">
                        <ColumnHeader title="Deductions" onAdd={() => handleAddItem('deduction')} />
                        <div className="flex-grow bg-white">
                            {totals.updatedDeductions.map((item, i) => <ItemRow key={i} item={item} index={i} type="deduction" onUpdate={handleUpdateItem} onRemove={handleRemoveItem} />)}
                        </div>
                        <div className="bg-[#F9F9F9] p-2 flex justify-between items-center border-t border-[#E5E5E5] text-[11px]">
                            <span className="font-bold text-[#666666]">Total</span>
                            <span className="font-bold font-mono">R {formatCurrency(totals.totalDeductions)}</span>
                        </div>
                    </div>

                    <div className="flex flex-col min-h-[350px]">
                        <ColumnHeader title="Company Contributions" onAdd={() => handleAddItem('contribution')} />
                        <div className="bg-white">
                            {totals.updatedContributions.map((item, i) => <ItemRow key={i} item={item} index={i} type="contribution" onUpdate={handleUpdateItem} onRemove={handleRemoveItem} />)}
                        </div>
                        <div className="bg-[#F9F9F9] p-2 flex justify-between items-center border-b border-[#E5E5E5] text-[11px]">
                            <span className="font-bold text-[#666666]">Total</span>
                            <span className="font-bold font-mono">R {formatCurrency(totals.totalContrib)}</span>
                        </div>

                        <ColumnHeader title="Fringe Benefits" onAdd={() => handleAddItem('fringe')} />
                        <div className="flex-grow bg-white">
                            {fringeBenefits.map((item, i) => <ItemRow key={i} item={item} index={i} type="fringe" onUpdate={handleUpdateItem} onRemove={handleRemoveItem} />)}
                        </div>
                        <div className="bg-[#F9F9F9] p-2 flex justify-between items-center border-t border-[#E5E5E5] text-[11px]">
                            <span className="font-bold text-[#666666]">Total</span>
                            <span className="font-bold font-mono">R {formatCurrency(totals.totalFringe)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 border-t border-[#CCCCCC] p-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">SARS Age Rebates Applied</span>
                        <span className="font-bold text-slate-800">{totals.rebateDetails} (R {formatCurrency(totals.rebateApplied)} / yr)</span>
                        {totals.age > 0 && <span className="text-[10px] text-muted-foreground block">Employee Age: {totals.age} years</span>}
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">Medical Scheme Credit (Sec 6B)</span>
                        <span className="font-bold text-slate-800">R {formatCurrency(totals.medicalCredit)} / mo</span>
                        {employee.medicalAidMembers ? (
                            <span className="text-[10px] text-muted-foreground block">
                                {employee.medicalAidMembers} Member(s) & {employee.medicalAidDependents || 0} Dependent(s)
                            </span>
                        ) : (
                            <span className="text-[10px] text-muted-foreground block">No active medical scheme registered</span>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-0.5">Statutory Deductions (PAYE + UIF)</span>
                        <span className="font-bold text-destructive font-mono">
                            R {formatCurrency(totals.updatedDeductions.filter(d => d.isStatutory).reduce((s, d) => s + d.amount, 0))}
                        </span>
                    </div>
                </div>

                <div className="bg-[#EFEFEF] border-t border-[#CCCCCC] p-3 flex justify-between items-center">
                    <span className="text-sm font-black text-[#333333] uppercase italic tracking-tighter">Nett pay</span>
                    <span className="text-2xl font-black text-slate-900 tabular-nums font-mono">
                        R {formatCurrency(totals.netPay)}
                    </span>
                </div>
            </Card>

            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSyncFromProfile} className="font-bold text-xs gap-2">
                        <RefreshCw className="h-3 w-3" /> Sync with Profile
                    </Button>
                    <PayslipDownloadButton 
                        client={client}
                        employee={employee}
                        payslip={payslip}
                        currentData={{
                            earnings,
                            deductions: totals.updatedDeductions,
                            contributions: totals.updatedContributions,
                            fringeBenefits,
                            netPay: totals.netPay,
                            grossPay: totals.gross
                        }}
                        ytdTotals={ytdTotals}
                    />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="font-bold" onClick={onSave}>Discard Changes</Button>
                    <Button className="font-black px-8 gap-2 shadow-lg" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save & Finalize Payslip
                    </Button>
                </div>
            </div>

            {allPayslips.filter(p => p.employeeId === employee.id && p.status === 'finalized').length > 0 && (
                <Card className="bg-muted/30 border-dashed border-2 mt-8">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Tax Year Progress (YTD)
                            </CardTitle>
                            <CardDescription className="text-[10px]">Cumulative totals since March.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="text-[9px] uppercase font-black text-muted-foreground bg-white">
                                <TableRow>
                                    <TableHead>YTD Taxable Earnings</TableHead>
                                    <TableHead className="text-right">YTD Tax (PAYE)</TableHead>
                                    <TableHead className="text-right">YTD Contributions</TableHead>
                                    <TableHead className="text-right">YTD Fringe Benefits</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="text-[11px] font-bold text-slate-900 bg-white/50">
                                    <TableCell>{formatCurrency(ytdTotals.gross)}</TableCell>
                                    <TableCell className="text-right text-destructive">{formatCurrency(ytdTotals.tax)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(ytdTotals.contributions)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(ytdTotals.fringe)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
