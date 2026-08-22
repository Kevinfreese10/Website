'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentTemplateOption } from '@/lib/types';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

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
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  // The preview endpoint is staff-only, and an <iframe src> cannot send an Authorization header.
  // Fetch the PDF with the caller's ID token and render it from an object URL instead.
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      if (!open || !template) return;
      setIsLoading(true);
      setLoadError(null);
      setPreviewUrl('');
      try {
        const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
        if (!idToken) throw new Error('You must be signed in to preview templates.');

        const res = await fetch(`/api/templates/preview?id=${encodeURIComponent(template.id)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) {
          throw new Error(res.status === 403
            ? 'You do not have permission to preview statutory templates.'
            : `Could not load preview (${res.status}).`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (err: any) {
        if (!cancelled) setLoadError(err.message || 'Could not load preview.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, template?.id]);

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
            {loadError && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-destructive">{loadError}</p>
              </div>
            )}
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0 rounded-lg"
                title={template.title}
              />
            )}
          </div>

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between border-t pt-3 shrink-0">
            <p className="text-[11px] text-muted-foreground">
              Sample render powered by the My Accountant Statutory PDF Engine.
            </p>
            <div className="flex items-center gap-2">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 shadow-2xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-primary" /> Open in New Tab
                </a>
              )}
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
