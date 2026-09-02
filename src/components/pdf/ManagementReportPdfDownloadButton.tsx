'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ManagementReportData, ManagementReportAnalysisOutput } from '@/lib/management-report-types';

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
      const res = await fetch('/api/management-report/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          analysis,
          customNotes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Management_Report_${(data.client.companyName || 'Company')
        .replace(/[^a-zA-Z0-9]/g, '_')}_${(data.period.label || 'Period').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded',
        description: 'Executive Management Report PDF successfully generated.',
      });
    } catch (err: any) {
      console.error('PDF generation error:', err);
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
      variant="outline"
      onClick={handleDownload}
      disabled={isGenerating}
      className={className || 'gap-2 font-bold text-xs h-9'}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <FileText className="h-4 w-4 text-primary" />
      )}
      <span>{isGenerating ? 'Generating Board Pack...' : 'Export Executive PDF'}</span>
    </Button>
  );
}
