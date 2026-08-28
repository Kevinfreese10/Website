'use client';

import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileDropZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Called with the accepted files after validation. */
  onFiles: (files: File[]) => void;
  /** Per-file size cap in MB (default 25). */
  maxSizeMB?: number;
  /** Optional accept check, e.g. (f) => f.type.startsWith('image/'). */
  accept?: (file: File) => boolean;
  onRejected?: (message: string) => void;
  disabled?: boolean;
}

/**
 * Wrap any area to accept drag-and-drop files with validation and a
 * highlight overlay. Children render as usual (form, list, textarea…).
 */
export function FileDropZone({
  onFiles,
  maxSizeMB = 25,
  accept,
  onRejected,
  disabled = false,
  className,
  children,
  ...props
}: FileDropZoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const depth = React.useRef(0);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const ok: File[] = [];
    const rejected: string[] = [];
    Array.from(list).forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        rejected.push(`${file.name} is larger than ${maxSizeMB}MB`);
      } else if (accept && !accept(file)) {
        rejected.push(`${file.name} is not an accepted file type`);
      } else {
        ok.push(file);
      }
    });
    if (ok.length > 0) onFiles(ok);
    if (rejected.length > 0) onRejected?.(rejected.join('; '));
  };

  if (disabled) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      {...props}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/5 backdrop-blur-[1px] animate-fade-in">
          <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-primary shadow-raised">
            <UploadCloud className="h-4 w-4" /> Drop files to attach
          </div>
        </div>
      )}
    </div>
  );
}
