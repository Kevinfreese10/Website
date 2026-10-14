'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { User, ClientCustomer, Invoice, CreditNote } from '@/lib/types';
import { getFirestore, collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, Printer, Download, Calendar as CalendarIcon, Building2, User as UserIcon, Mail, Phone, FileText } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isBefore, differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx-js-style';

const db = getFirestore(firebaseApp);

interface CustomerStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: User | null;
  customer: ClientCustomer | null;
  clientId: string;
}

interface StatementLine {
  id: string;
  date: Date;
  reference: string;
  type: 'Invoice' | 'Payment' | 'Credit Note' | 'Journal';
  description: string;
  debit: number;   // Increases receivable
  credit: number;  // Decreases receivable
  runningBalance: number;
}

const formatCurrency = (val: number, currency = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export interface CustomerStatementViewProps {
  client: User | null;
  customer: ClientCustomer | null;
  clientId: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function CustomerStatementView({
  client,
  customer,
  clientId,
  onClose,
  showCloseButton = false,
}: CustomerStatementViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  // Default date range: Last 90 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return {
      from: subDays(today, 90),
      to: today,
    };
  });

  // Fetch all customer documents when dialog opens
  useEffect(() => {
    if (!open || !clientId || !customer?.id) return;
    setIsLoading(true);

    const loadCustomerData = async () => {
      try {
        // 1. Fetch Customer Invoices
        const invQ = query(
          collection(db, `aiAccountantClients/${clientId}/invoices`),
          where('customerId', '==', customer.id),
          where('status', 'in', ['final', 'partial', 'paid', 'overdue'])
        );
        const invSnap = await getDocs(invQ);
        const fetchedInvoices: Invoice[] = invSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ...d,
            invoiceDate: d.invoiceDate?.toDate ? d.invoiceDate.toDate() : new Date(d.invoiceDate),
            dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : new Date(d.dueDate),
          } as Invoice;
        });

        // 2. Fetch Customer Payments / Receipts / Journals
        // Transactions where customerId is set or allocatedTo.value == customer.id
        const txQ = query(
          collection(db, `aiAccountantClients/${clientId}/transactions`)
        );
        const txSnap = await getDocs(txQ);
        const customerControlAccountId = client?.chartOfAccounts?.find(
          (acc) => acc.accountNumber === '8000-001'
        )?.id;

        const fetchedPayments: any[] = [];
        txSnap.docs.forEach((d) => {
          const t = d.data();
          const tDate = t.date?.toDate ? t.date.toDate() : (t.date ? new Date(t.date) : new Date());
          
          // Check if transaction is associated with this customer
          const isDirectCustomer = t.customerId === customer.id;
          const isAllocatedCustomer = t.allocatedTo?.type === 'customer' && t.allocatedTo?.value === customer.id;
          const isCustomerControlJournal = 
            t.bankAccountId === 'JOURNAL' && 
            t.allocatedTo?.value === customerControlAccountId && 
            (t.description || '').toLowerCase().includes((customer.name || '').toLowerCase());

          if (isDirectCustomer || isAllocatedCustomer || isCustomerControlJournal) {
            fetchedPayments.push({
              id: d.id,
              ...t,
              parsedDate: tDate,
            });
          }
        });

        // 3. Fetch Credit Notes
        try {
          const cnQ = query(
            collection(db, `aiAccountantClients/${clientId}/creditNotes`),
            where('customerId', '==', customer.id)
          );
          const cnSnap = await getDocs(cnQ);
          const fetchedCreditNotes: CreditNote[] = cnSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            } as any;
          });
          setCreditNotes(fetchedCreditNotes);
        } catch (cnErr) {
          console.warn('No credit notes collection or error fetching credit notes:', cnErr);
          setCreditNotes([]);
        }

        setInvoices(fetchedInvoices);
        setPayments(fetchedPayments);
      } catch (err) {
        console.error('Failed to load customer statement data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, [open, clientId, customer?.id, client?.chartOfAccounts]);

  // Compute Opening Balance and Statement Lines
  const { openingBalance, statementLines, totalDebits, totalCredits, closingBalance, aging } = useMemo(() => {
    const fromDate = dateRange?.from ? new Date(dateRange.from.setHours(0, 0, 0, 0)) : null;
    const toDate = dateRange?.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : null;

    let opBal = 0;
    const rawLines: {
      id: string;
      date: Date;
      reference: string;
      type: 'Invoice' | 'Payment' | 'Credit Note' | 'Journal';
      description: string;
      debit: number;
      credit: number;
    }[] = [];

    // Process Invoices
    invoices.forEach((inv) => {
      const invDate = new Date(inv.invoiceDate);
      const total = inv.total || 0;

      if (fromDate && isBefore(invDate, fromDate)) {
        opBal += total;
      } else if (!toDate || !isBefore(toDate, invDate)) {
        rawLines.push({
          id: inv.id,
          date: invDate,
          reference: inv.reference ? `${inv.id} (${inv.reference})` : `INV-${inv.id}`,
          type: 'Invoice',
          description: inv.notes || `Tax Invoice #${inv.id}`,
          debit: total,
          credit: 0,
        });
      }
    });

    // Process Payments & Receipts
    payments.forEach((pmt) => {
      const pDate = new Date(pmt.parsedDate);
      // Receipts and credits reduce customer balance
      const rawAmt = pmt.amount || 0;
      const creditAmt = Math.abs(rawAmt);

      if (fromDate && isBefore(pDate, fromDate)) {
        opBal -= creditAmt;
      } else if (!toDate || !isBefore(toDate, pDate)) {
        rawLines.push({
          id: pmt.id,
          date: pDate,
          reference: pmt.reference || `RCPT-${pmt.id.slice(0, 8)}`,
          type: pmt.bankAccountId === 'JOURNAL' ? 'Journal' : 'Payment',
          description: pmt.description || 'Payment Received',
          debit: 0,
          credit: creditAmt,
        });
      }
    });

    // Process Credit Notes
    creditNotes.forEach((cn) => {
      const rawDate = cn.creditNoteDate || (cn as any).date || cn.createdAt;
      const cnDate = rawDate?.toDate ? rawDate.toDate() : (rawDate ? new Date(rawDate) : new Date());
      const cnTotal = cn.total || 0;

      if (fromDate && isBefore(cnDate, fromDate)) {
        opBal -= cnTotal;
      } else if (!toDate || !isBefore(toDate, cnDate)) {
        rawLines.push({
          id: cn.id,
          date: cnDate,
          reference: `CN-${cn.id}`,
          type: 'Credit Note',
          description: cn.notes || (cn as any).reason || `Credit Note #${cn.id}`,
          debit: 0,
          credit: cnTotal,
        });
      }
    });

    // Sort chronologically
    rawLines.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate Running Balance
    let running = opBal;
    let debitsSum = 0;
    let creditsSum = 0;

    const lines: StatementLine[] = rawLines.map((line) => {
      running += line.debit - line.credit;
      debitsSum += line.debit;
      creditsSum += line.credit;
      return {
        ...line,
        runningBalance: running,
      };
    });

    const closeBal = running;

    // Calculate Aging Analysis (as of toDate or today)
    const asOfDate = toDate || new Date();
    const agingBuckets = {
      current: 0, // 0 - 30 days
      days30: 0,  // 31 - 60 days
      days60: 0,  // 61 - 90 days
      days90: 0,  // 91 - 120 days
      days120Plus: 0, // 120+ days
      totalDue: 0,
    };

    invoices.forEach((inv) => {
      // Use invoice balanceDue if available, otherwise total
      const bal = inv.balanceDue !== undefined ? inv.balanceDue : (inv.status === 'paid' ? 0 : inv.total);
      if (bal <= 0) return;

      const baseDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
      const days = differenceInDays(asOfDate, baseDate);

      if (days <= 30) {
        agingBuckets.current += bal;
      } else if (days <= 60) {
        agingBuckets.days30 += bal;
      } else if (days <= 90) {
        agingBuckets.days60 += bal;
      } else if (days <= 120) {
        agingBuckets.days90 += bal;
      } else {
        agingBuckets.days120Plus += bal;
      }
      agingBuckets.totalDue += bal;
    });

    return {
      openingBalance: opBal,
      statementLines: lines,
      totalDebits: debitsSum,
      totalCredits: creditsSum,
      closingBalance: closeBal,
      aging: agingBuckets,
    };
  }, [invoices, payments, creditNotes, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!customer) return;

    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];

    // Header info
    wsData.push([client?.name || 'Company Statement', '']);
    wsData.push(['VAT Number:', client?.vatNumber || 'N/A']);
    wsData.push(['Company Reg:', client?.registrationNumber || 'N/A']);
    wsData.push([]);
    wsData.push(['CUSTOMER STATEMENT']);
    wsData.push(['Customer Name:', customer.name]);
    wsData.push(['Contact Person:', customer.contactPerson || 'N/A']);
    wsData.push(['Customer VAT:', customer.vatNumber || 'N/A']);
    wsData.push(['Statement Period:', `${dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'All'} to ${dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Present'}`]);
    wsData.push([]);

    // Table Header
    wsData.push(['Date', 'Reference', 'Type', 'Description', 'Debit (R)', 'Credit (R)', 'Balance (R)']);

    // Opening Balance
    wsData.push([
      dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '',
      'OPENING',
      'Opening Balance',
      'Balance Brought Forward',
      openingBalance > 0 ? openingBalance : 0,
      openingBalance < 0 ? Math.abs(openingBalance) : 0,
      openingBalance,
    ]);

    // Lines
    statementLines.forEach((l) => {
      wsData.push([
        format(l.date, 'dd/MM/yyyy'),
        l.reference,
        l.type,
        l.description,
        l.debit || 0,
        l.credit || 0,
        l.runningBalance,
      ]);
    });

    // Totals
    wsData.push([]);
    wsData.push(['Totals', '', '', '', totalDebits, totalCredits, closingBalance]);
    wsData.push([]);

    // Aging Table
    wsData.push(['AGING BREAKDOWN (ZAR)']);
    wsData.push(['Current (0-30 days)', '31 - 60 Days', '61 - 90 Days', '91 - 120 Days', '120+ Days', 'Total Balance Due']);
    wsData.push([
      aging.current,
      aging.days30,
      aging.days60,
      aging.days90,
      aging.days120Plus,
      aging.totalDue,
    ]);

    // Banking Details
    if (client?.bankingDetails) {
      wsData.push([]);
      wsData.push(['REMITTANCE BANKING DETAILS']);
      wsData.push(['Bank:', client.bankingDetails.bankName || '']);
      wsData.push(['Account Holder:', client.bankingDetails.accountHolder || client.name]);
      wsData.push(['Account Number:', client.bankingDetails.accountNumber || '']);
      wsData.push(['Branch Code:', client.bankingDetails.branchCode || '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Statement');
    XLSX.writeFile(wb, `${customer.name.replace(/[^a-z0-9]/gi, '_')}_Statement_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="w-full bg-white text-slate-900 rounded-lg overflow-hidden">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #statement-printable,
          #statement-printable * {
            visibility: visible;
          }
          #statement-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Control Bar (Hidden during print) */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background border-b no-print">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Statement: {customer?.name}
          </h2>
        </div>
          <div className="flex items-center gap-3">
            <div className="w-[300px]">
              <DateRangePicker
                value={dateRange}
                onDateChange={setDateRange}
                financialYearEnd={client?.yearEnd}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button size="sm" onClick={handlePrint} disabled={isLoading}>
              <Printer className="mr-2 h-4 w-4" />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Printable Statement Document */}
        <div id="statement-printable" ref={printRef} className="p-8 bg-white text-slate-900 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Loading customer statement records...</p>
            </div>
          ) : (
            <>
              {/* Header: Company & Statement Meta */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {client?.name || 'Company Name'}
                  </h1>
                  {client?.registrationNumber && (
                    <p className="text-xs text-slate-500">Reg No: {client.registrationNumber}</p>
                  )}
                  {client?.vatNumber && (
                    <p className="text-xs text-slate-500">VAT No: {client.vatNumber}</p>
                  )}
                  {client?.address && (
                    <p className="text-xs text-slate-500 mt-1">
                      {[client.address.street, client.address.suburb, client.address.city, client.address.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">{client?.email}</p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded font-bold text-lg mb-2">
                    STATEMENT OF ACCOUNT
                  </div>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Date:</span> {format(new Date(), 'dd MMMM yyyy')}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Period:</span>{' '}
                    {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Start'} –{' '}
                    {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Present'}
                  </p>
                </div>
              </div>

              {/* Statement Recipient (Customer Details) */}
              <div className="grid grid-cols-2 gap-8 py-2">
                <div className="rounded-lg border p-4 bg-slate-50">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Statement Recipient
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{customer?.name}</h2>
                  {customer?.contactPerson && (
                    <p className="text-xs text-slate-600">Attn: {customer.contactPerson}</p>
                  )}
                  {customer?.vatNumber && (
                    <p className="text-xs text-slate-600">VAT Reg: {customer.vatNumber}</p>
                  )}
                  {customer?.email && (
                    <p className="text-xs text-slate-600">Email: {customer.email}</p>
                  )}
                  {customer?.cellNumber && (
                    <p className="text-xs text-slate-600">Tel: {customer.cellNumber}</p>
                  )}
                  {(customer?.address || customer?.street || customer?.city) && (
                    <p className="text-xs text-slate-600 mt-1">
                      {customer.address || [customer.street, customer.suburb, customer.city, customer.zip].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                {/* Account Summary Banner */}
                <div className="rounded-lg border p-4 bg-slate-50 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Account Overview
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Opening Balance:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(openingBalance)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">New Invoiced:</span>
                      <span className="font-semibold text-emerald-700">+{formatCurrency(totalDebits)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Payments/Credits:</span>
                      <span className="font-semibold text-blue-700">-{formatCurrency(totalCredits)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Amount Overdue:</span>
                      <span className="font-semibold text-rose-700">
                        {formatCurrency(aging.days30 + aging.days60 + aging.days90 + aging.days120Plus)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">TOTAL DUE:</span>
                    <span className="text-xl font-bold text-primary font-mono">
                      {formatCurrency(closingBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="w-24 text-xs font-bold text-slate-700">Date</TableHead>
                      <TableHead className="w-36 text-xs font-bold text-slate-700">Reference</TableHead>
                      <TableHead className="w-28 text-xs font-bold text-slate-700">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-700">Description</TableHead>
                      <TableHead className="text-right w-28 text-xs font-bold text-slate-700">Debit (R)</TableHead>
                      <TableHead className="text-right w-28 text-xs font-bold text-slate-700">Credit (R)</TableHead>
                      <TableHead className="text-right w-32 text-xs font-bold text-slate-700">Balance (R)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {/* Opening Balance Line */}
                    <TableRow className="bg-slate-50/50 font-medium">
                      <TableCell>{dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="font-mono text-slate-500">OPENING</TableCell>
                      <TableCell>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-semibold">
                          BALANCE
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 italic">Balance Brought Forward</TableCell>
                      <TableCell className="text-right font-mono">
                        {openingBalance > 0 ? formatCurrency(openingBalance) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {openingBalance < 0 ? formatCurrency(Math.abs(openingBalance)) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(openingBalance)}
                      </TableCell>
                    </TableRow>

                    {statementLines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No transactions recorded in this statement period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      statementLines.map((line) => (
                        <TableRow key={line.id} className="hover:bg-slate-50">
                          <TableCell>{format(line.date, 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="font-mono font-medium">{line.reference}</TableCell>
                          <TableCell>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                line.type === 'Invoice'
                                  ? 'bg-blue-100 text-blue-800'
                                  : line.type === 'Payment'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {line.type.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate text-slate-600">
                            {line.description}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600">
                            {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(line.runningBalance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  <TableFooter className="bg-slate-100 text-xs font-bold">
                    <TableRow>
                      <TableCell colSpan={4}>Period Totals & Closing Balance</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalDebits)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalCredits)}</TableCell>
                      <TableCell className="text-right font-mono text-primary text-sm">
                        {formatCurrency(closingBalance)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              {/* Aging Analysis Table & Remittance Advice Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Aging Schedule */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Aging Analysis (Outstanding Balance)
                  </h3>
                  <div className="grid grid-cols-5 gap-1 text-center text-xs">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-500 block">Current</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatCurrency(aging.current)}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-500 block">30 Days</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatCurrency(aging.days30)}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-500 block">60 Days</span>
                      <span className="font-semibold text-amber-700 font-mono">
                        {formatCurrency(aging.days60)}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-500 block">90 Days</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        {formatCurrency(aging.days90)}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-[10px] text-slate-500 block">120+ Days</span>
                      <span className="font-semibold text-rose-800 font-mono">
                        {formatCurrency(aging.days120Plus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remittance Advice Banking Details */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Remittance Banking Details
                  </h3>
                  {client?.bankingDetails ? (
                    <div className="text-xs space-y-1 text-slate-700">
                      <p>
                        <span className="text-slate-500">Bank:</span>{' '}
                        <span className="font-semibold">{client.bankingDetails.bankName || 'FNB'}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Account Holder:</span>{' '}
                        <span className="font-semibold">{client.bankingDetails.accountHolder || client.name}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Account Number:</span>{' '}
                        <span className="font-mono font-semibold">{client.bankingDetails.accountNumber}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Branch Code:</span>{' '}
                        <span className="font-mono font-semibold">{client.bankingDetails.branchCode || '250655'}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Payment Reference:</span>{' '}
                        <span className="font-mono font-bold text-primary">{customer?.name || 'Customer Name'}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Please refer to individual invoice for payment instructions.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {showCloseButton && (
          <div className="p-4 border-t bg-slate-50 no-print flex justify-between items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Print preview formats automatically for A4 / Letter paper.
            </p>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        )}
    </div>
  );
}

export default function CustomerStatementDialog({
  open,
  onOpenChange,
  client,
  customer,
  clientId,
}: CustomerStatementDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <CustomerStatementView
          client={client}
          customer={customer}
          clientId={clientId}
          onClose={() => onOpenChange(false)}
          showCloseButton={true}
        />
      </DialogContent>
    </Dialog>
  );
}
