'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Loader2, RefreshCw, Eye } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

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
 * Slide-over document preview: view PDFs and images reliably without downloading
 * or leaving the workflow. Uses authenticated server-side blob streaming to bypass
 * cross-origin X-Frame-Options and Content-Disposition attachment blocks.
 */
export function DocumentPreviewDrawer({
  doc,
  onOpenChange,
}: {
  doc: PreviewDoc | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [useGoogleDocsFallback, setUseGoogleDocsFallback] = React.useState(false);

  const kind = doc ? kindOf(doc) : 'other';

  React.useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadDocument() {
      if (!doc || (kind !== 'pdf' && kind !== 'image')) {
        setIsLoading(false);
        setBlobUrl(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setUseGoogleDocsFallback(false);

      try {
        const auth = getAuth(firebaseApp);
        const idToken = await auth.currentUser?.getIdToken();

        // 1. Try fetching via our secure same-origin proxy to eliminate X-Frame-Options / Content-Disposition blocks
        const proxyUrl = `/api/documents/preview?url=${encodeURIComponent(doc.url)}&name=${encodeURIComponent(doc.name)}`;
        const headers: Record<string, string> = {};
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        let res = await fetch(proxyUrl, { headers });

        // If proxy unauthorized or failed, attempt direct fetch as fallback
        if (!res.ok) {
          try {
            res = await fetch(doc.url);
          } catch {
            // Keep original proxy response error
          }
        }

        if (!res.ok) {
          throw new Error(`Failed to load document preview (HTTP ${res.status}).`);
        }

        const blob = await res.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err: any) {
        if (!cancelled) {
          console.warn('Document preview blob load failed, falling back:', err);
          setError(err.message || 'Could not load preview.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [doc?.url, doc?.name, kind]);

  const googleDocsViewerUrl = doc
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`
    : '';

  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-3 p-4 sm:max-w-4xl h-full">
        <SheetHeader className="pr-8 shrink-0">
          <SheetTitle className="flex items-center gap-2 truncate text-base">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{doc?.name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 border-b pb-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold">
              <a href={doc?.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-primary" /> Open in new tab
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold">
              <a href={doc?.url} download={doc?.name || 'document'}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download
              </a>
            </Button>
          </div>

          {kind === 'pdf' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseGoogleDocsFallback((prev) => !prev)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {useGoogleDocsFallback ? 'Switch to Native Viewer' : 'Alternate Viewer'}
            </Button>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/30 flex flex-col">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs z-20 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading document preview...</p>
            </div>
          )}

          {error && !blobUrl && !useGoogleDocsFallback && (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Could not preview document directly</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {error} Your browser or network may restrict inline rendering for this file.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseGoogleDocsFallback(true)}
                  className="text-xs"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Try Alternate Viewer
                </Button>
                <Button variant="default" size="sm" asChild className="text-xs">
                  <a href={doc?.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open in New Tab
                  </a>
                </Button>
              </div>
            </div>
          )}

          {doc && kind === 'image' && (blobUrl || doc.url) && (
            <div className="h-full w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl || doc.url}
                alt={doc.name}
                className="max-h-full max-w-full rounded-lg object-contain shadow-md animate-fade-in"
              />
            </div>
          )}

          {doc && kind === 'pdf' && (
            <iframe
              src={useGoogleDocsFallback ? googleDocsViewerUrl : blobUrl || doc.url}
              title={doc.name}
              className="h-full w-full border-0 bg-white animate-fade-in"
            />
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
