'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Payslip, Employee, User, PayslipItem, PayslipPdfOptions } from '@/lib/types';
import jsPDF from 'jspdf';
import { generatePayslipPdfPage } from '@/lib/payslipPdf';

interface PayslipDownloadButtonProps {
  payslip: Payslip;
  employee: Employee;
  client: User;
  options?: PayslipPdfOptions;
  currentData?: {
      earnings: PayslipItem[];
      deductions: PayslipItem[];
      contributions: PayslipItem[];
      fringeBenefits: PayslipItem[];
      netPay: number;
      grossPay: number;
  };
  ytdTotals?: {
      gross: number;
      tax: number;
      contributions: number;
      fringe: number;
  };
}

export default function PayslipDownloadButton({ payslip, employee, client, options, currentData, ytdTotals }: PayslipDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const doc = new jsPDF();
      generatePayslipPdfPage(doc, payslip, employee, client, currentData, ytdTotals, options);
      doc.save(`Payslip-${employee.surname}-${(payslip.period || 'Current').replace(/\s/g, '-')}.pdf`);
      toast({ title: 'Download Successful' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Download Failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isLoading} className="font-bold border-primary/20 text-primary hover:bg-primary/5">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isLoading ? 'Generating...' : 'Download PDF'}
    </Button>
  );
}
