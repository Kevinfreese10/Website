'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentTemplateOption } from '@/lib/types';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';

interface TemplatePreviewDialogProps {
  template: DocumentTemplateOption | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && template) {
      setIsLoading(true);
    }
  }, [open, template?.id]);

  const previewUrl = template ? `/api/templates/preview?id=${template.id}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {template && (
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6 gap-3">
          <DialogHeader className="border-b pb-3 space-y-1 shrink-0">
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  {template.title}
                </DialogTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {template.category}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {template.description} — <em>Pre-filled with sample corporate & director details.</em>
            </DialogDescription>
          </DialogHeader>

          {/* Embedded PDF Viewer */}
          <div className="relative flex-grow w-full rounded-lg border bg-muted/20 overflow-hidden min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs z-10 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-xs text-muted-foreground font-medium">Generating PDF Template Preview...</p>
              </div>
            )}
            <iframe
              src={previewUrl}
              className="w-full h-full border-0 rounded-lg"
              title={template.title}
              onLoad={() => setIsLoading(false)}
            />
          </div>

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between border-t pt-3 shrink-0">
            <p className="text-[11px] text-muted-foreground">
              Sample render powered by the My Accountant Statutory PDF Engine.
            </p>
            <div className="flex items-center gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 shadow-2xs"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-primary" /> Open in New Tab
              </a>
              <Button size="sm" variant="default" onClick={() => onOpenChange(false)} className="h-8 text-xs font-semibold">
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
