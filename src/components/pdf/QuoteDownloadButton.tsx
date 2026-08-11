'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Quote, User, ClientCustomer } from '@/lib/types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteDownloadButtonProps {
  quote: Quote;
  client: User | null;
  customer: ClientCustomer | undefined;
}

export default function QuoteDownloadButton({ quote, client, customer }: QuoteDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!client || !customer) {
      toast({ title: 'Error', description: 'Client or customer data is missing.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [33, 67, 146]; // #214392 in RGB

      // Map currency code to symbol
      const currencySymbolMap: Record<string, string> = {
          'ZAR': 'R',
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'AUD': '$'
      };
      const symbol = currencySymbolMap[quote.currency || 'ZAR'] || 'R';

      // Helper for clean currency formatting using en-GB to ensure dot decimals
      const formatCurrency = (val: number) => {
          return `${symbol} ${val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      // 1. Branding / Title
      doc.setTextColor(33, 67, 146);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(client.companyName || client.name || 'Company', 20, 25);

      // 2. Company Details (Left)
      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      let leftY = 32;
      if (client.registrationNumber) {
          doc.text(`Reg No: ${client.registrationNumber}`, 20, leftY);
          leftY += 5;
      }

      const renderAddress = (address: any, startY: number, x: number = 20) => {
          let currY = startY;
          if (typeof address === 'string') {
              const lines = address.split(',').map(part => part.trim()).filter(Boolean);
              lines.forEach((line: string) => {
                  doc.text(line, x, currY);
                  currY += 5;
              });
          } else if (typeof address === 'object' && address !== null) {
              const unitComplex = (address.unit && address.complex) 
                  ? `${address.unit}, ${address.complex}` 
                  : (address.unit ? `Unit ${address.unit}` : address.complex);
              const lines = [unitComplex, address.street, address.suburb, address.city, address.province, address.zip]
                  .filter(Boolean);
              lines.forEach(line => {
                  doc.text(String(line), x, currY);
                  currY += 5;
              });
          }
          return currY;
      };

      leftY = renderAddress(client.address, leftY, 20);
      if (client.isVatRegistered && client.vatNumber) {
          doc.text(`VAT Reg: ${client.vatNumber}`, 20, leftY);
          leftY += 5;
      }

      // 3. Quote Header Details (Right)
      doc.setTextColor(200);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('QUOTE', 190, 25, { align: 'right' });

      doc.setTextColor(100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const quoteDateObj = quote.quoteDate instanceof Date ? quote.quoteDate : (quote.quoteDate?.toDate ? quote.quoteDate.toDate() : new Date(quote.quoteDate));
      const expiryDateObj = quote.expiryDate instanceof Date ? quote.expiryDate : (quote.expiryDate?.toDate ? quote.expiryDate.toDate() : new Date(quote.expiryDate));

      doc.text(`Quote Number: ${quote.id}`, 190, 32, { align: 'right' });
      let qY = 37;
      if (quote.reference) {
        doc.text(`Reference: ${quote.reference}`, 190, qY, { align: 'right' });
        qY += 5;
      }
      doc.text(`Date: ${format(quoteDateObj, 'dd/MM/yyyy')}`, 190, qY, { align: 'right' });
      qY += 5;
      doc.text(`Expiry Date: ${format(expiryDateObj, 'dd/MM/yyyy')}`, 190, qY, { align: 'right' });

      // 4. Client / Bill To Info
      const startInfoY = Math.max(leftY, 50);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50);
      doc.text('Quote To:', 20, startInfoY);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(customer.name, 20, startInfoY + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      let customerY = startInfoY + 12;
      customerY = renderAddress(customer.address, customerY, 20);
      if (customer.vatNumber) {
          doc.text(`VAT Reg: ${customer.vatNumber}`, 20, customerY);
          customerY += 6;
      } else {
          customerY += 6;
      }

      if (quote.description) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(50);
          doc.text(`Subject: ${quote.description}`, 20, customerY + 4);
          customerY += 10;
      }

      // 5. Line Items Table
      const tableStartY = Math.max(customerY + 10, startInfoY + 40);
      
      const tableHeaders = [['Description', 'Qty', 'Rate (Excl)', 'VAT (15%)', 'Total (Incl)']];
      const tableBody = quote.lineItems.map(item => {
          const isStandard = item.vatType === 'standard_rated_sales';
          const lineVat = isStandard ? (item.rate * item.quantity) * 0.15 : 0;
          const lineTotal = (item.rate * item.quantity) + lineVat;
          
          return [
              item.description,
              item.quantity,
              formatCurrency(item.rate),
              formatCurrency(lineVat),
              formatCurrency(lineTotal)
          ];
      });

      autoTable(doc, {
          startY: tableStartY,
          head: tableHeaders,
          body: tableBody,
          theme: 'striped',
          headStyles: {
              fillColor: primaryColor,
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold'
          },
          bodyStyles: {
              fontSize: 9
          },
          columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 15, halign: 'center' },
              2: { cellWidth: 30, halign: 'right' },
              3: { cellWidth: 30, halign: 'right' },
              4: { cellWidth: 35, halign: 'right' }
          },
          margin: { left: 20, right: 20 }
      });

      // 6. Totals section
      const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 20;
      doc.setTextColor(100);
      doc.setFontSize(9);

      doc.text('Subtotal (Excl):', 140, finalY + 10, { align: 'right' });
      doc.text(formatCurrency(quote.subtotal), 190, finalY + 10, { align: 'right' });

      doc.text('Total VAT (15%):', 140, finalY + 16, { align: 'right' });
      doc.text(formatCurrency(quote.vat), 190, finalY + 16, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(50);
      doc.text('Grand Total:', 140, finalY + 24, { align: 'right' });
      doc.text(formatCurrency(quote.total), 190, finalY + 24, { align: 'right' });

      // 7. Terms / Notes
      if (quote.notes) {
          const notesY = finalY + 40;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(50);
          doc.text('Quote Notes / Terms:', 20, notesY);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100);
          const splitNotes = doc.splitTextToSize(quote.notes, 170);
          doc.text(splitNotes, 20, notesY + 6);
      }

      // 8. Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Generated by My Accountant AI Engine. Thank you for your business!', 105, 285, { align: 'center' });

      // Save PDF
      doc.save(`Quote-${quote.id}.pdf`);
      toast({ title: 'Download Started', description: `Quote ${quote.id} PDF download initiated.` });

    } catch (e: any) {
        console.error(e);
        toast({ title: 'Download Failed', description: 'Could not generate PDF.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Download PDF
    </Button>
  );
}
