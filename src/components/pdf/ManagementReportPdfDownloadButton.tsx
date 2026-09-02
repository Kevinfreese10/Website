'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ManagementReportData, ManagementReportAnalysisOutput } from '@/lib/management-report-types';
import { generateManagementReportPdf } from '@/lib/management-report-pdf-generator';

interface ManagementReportPdfDownloadButtonProps {
  data: ManagementReportData;
  analysis?: ManagementReportAnalysisOutput | null;
  customNotes?: string;
  className?: string;
}

export default function ManagementReportPdfDownloadButton({
  data,
  analysis,
  customNotes,
  className,
}: ManagementReportPdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = generateManagementReportPdf({ data, analysis, customNotes });
      const filename = `Management_Report_${(data.client.companyName || 'Company')
        .replace(/[^a-zA-Z0-9]/g, '_')}_${(data.period.label || 'Period').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(filename);

      toast({
        title: 'PDF Downloaded',
        description: 'Executive Management Report PDF successfully generated.',
      });
    } catch (err: any) {
      console.error('Management Report PDF generation error:', err);
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not generate management report PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleDownload}
      disabled={isGenerating}
      className={className || 'gap-2 font-bold text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white'}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <FileText className="h-4 w-4 text-white" />
      )}
      <span>{isGenerating ? 'Compiling PDF Report...' : 'Download Executive PDF'}</span>
    </Button>
  );
}
