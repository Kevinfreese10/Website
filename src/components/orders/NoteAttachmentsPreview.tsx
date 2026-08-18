'use client';

import React from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NoteAttachmentsPreviewProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
}

export function NoteAttachmentsPreview({
  files,
  onRemoveFile,
  onClearAll,
}: NoteAttachmentsPreviewProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-extrabold text-[11px] gap-1 px-2 py-0.5">
            <Paperclip className="h-3 w-3" />
            {files.length} {files.length === 1 ? 'Attachment' : 'Attachments'} Ready
          </Badge>
          <span className="text-[11px] text-muted-foreground font-normal">
            (ready to post with note)
          </span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] text-destructive hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" /> Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
        {files.map((file, idx) => {
          const isImage = file.type.startsWith('image/');
          const previewUrl = isImage ? URL.createObjectURL(file) : null;
          const formattedSize =
            file.size / 1024 < 1000
              ? `${(file.size / 1024).toFixed(0)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

          return (
            <div
              key={`${file.name}-${idx}`}
              className="group relative flex flex-col rounded-lg border bg-white shadow-2xs overflow-hidden text-xs transition-all hover:border-primary/50"
            >
              {isImage && previewUrl ? (
                <div className="relative h-24 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold backdrop-blur-xs">
                    {formattedSize}
                  </span>
                  <span className="absolute top-1 left-1 bg-primary/90 text-white text-[9px] px-1.5 py-0.2 rounded font-bold backdrop-blur-xs flex items-center gap-0.5">
                    <ImageIcon className="h-2.5 w-2.5" /> Screenshot
                  </span>
                </div>
              ) : (
                <div className="h-24 w-full bg-slate-50 flex flex-col items-center justify-center p-2 text-center text-slate-600">
                  <FileText className="h-8 w-8 text-primary/60 mb-1" />
                  <span className="text-[10px] font-mono text-muted-foreground">{formattedSize}</span>
                </div>
              )}

              <div className="p-1.5 flex items-center justify-between gap-1 bg-slate-50 border-t min-w-0">
                <p className="text-[11px] font-medium text-slate-700 truncate flex-1" title={file.name}>
                  {file.name}
                </p>
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="h-5 w-5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
