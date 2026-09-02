'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AnnualFinancialStatementsData } from '@/lib/afs-types';

interface AnnualFinancialStatementsPdfDownloadButtonProps {
  data: AnnualFinancialStatementsData;
  className?: string;
  label?: string;
}

export default function AnnualFinancialStatementsPdfDownloadButton({
  data,
  className,
  label = 'Download Signed AFS PDF',
}: AnnualFinancialStatementsPdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/financial-statements/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate AFS PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(data.generalInfo.companyName || 'Company')
        .replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Statements_${(data.generalInfo.financialYearEndedDate || 'AFS').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'AFS PDF Downloaded',
        description: 'Statutory IFRS for SMEs Annual Financial Statements PDF generated.',
      });
    } catch (err: any) {
      console.error('AFS PDF generation error:', err);
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not generate financial statements PDF.',
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
      className={className || 'gap-2 font-bold text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white'}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <FileText className="h-4 w-4 text-white" />
      )}
      <span>{isGenerating ? 'Compiling 16-Page AFS...' : label}</span>
    </Button>
  );
}
