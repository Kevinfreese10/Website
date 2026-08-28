'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText } from 'lucide-react';

export interface PreviewDoc {
  name: string;
  url: string;
}

function kindOf(doc: PreviewDoc): 'image' | 'pdf' | 'other' {
  const clean = (doc.url.split('?')[0] || '').toLowerCase();
  const name = doc.name.toLowerCase();
  const probe = clean + ' ' + name;
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)(\s|$)/.test(probe)) return 'image';
  if (/\.pdf(\s|$)/.test(probe)) return 'pdf';
  return 'other';
}

/**
 * Slide-over document preview: view PDFs and images without downloading
 * or leaving the workflow. Falls back to open/download for other types.
 */
export function DocumentPreviewDrawer({
  doc,
  onOpenChange,
}: {
  doc: PreviewDoc | null;
  onOpenChange: (open: boolean) => void;
}) {
  const kind = doc ? kindOf(doc) : 'other';
  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-3 p-4 sm:max-w-3xl">
        <SheetHeader className="pr-8">
          <SheetTitle className="flex items-center gap-2 truncate text-base">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{doc?.name}</span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={doc?.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open in new tab
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={doc?.url} download>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
            </a>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/30">
          {doc && kind === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.url} alt={doc.name} className="mx-auto max-w-full animate-fade-in" />
          )}
          {doc && kind === 'pdf' && (
            <iframe src={doc.url} title={doc.name} className="h-full min-h-[70vh] w-full animate-fade-in" />
          )}
          {doc && kind === 'other' && (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">No inline preview for this file type</p>
              <p className="text-xs text-muted-foreground">Use “Open in new tab” or “Download” above.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
