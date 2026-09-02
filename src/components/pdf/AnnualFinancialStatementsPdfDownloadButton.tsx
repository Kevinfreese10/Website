'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AnnualFinancialStatementsData } from '@/lib/afs-types';
import { generateAfsPdf } from '@/lib/afs-pdf-generator';

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
      const doc = generateAfsPdf(data);
      const filename = `${(data.generalInfo.companyName || 'Company')
        .replace(/[^a-zA-Z0-9]/g, '_')}_Financial_Statements_${(data.generalInfo.financialYearEndedDate || 'AFS').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      doc.save(filename);

      toast({
        title: 'AFS PDF Downloaded',
        description: 'Statutory IFRS for SMEs Annual Financial Statements PDF generated successfully.',
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
