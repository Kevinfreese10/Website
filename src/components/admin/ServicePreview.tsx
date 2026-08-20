'use client';

import { useState } from 'react';
import { Service, AVAILABLE_DOCUMENT_TEMPLATES, DocumentTemplateOption } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Eye, ScrollText, Sparkles } from 'lucide-react';
import TemplatePreviewDialog from './TemplatePreviewDialog';

interface ServicePreviewProps {
  service: Partial<Service>;
}

export default function ServicePreview({ service }: ServicePreviewProps) {
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplateOption | null>(null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 border rounded-lg shadow-sm bg-background">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{service.category || 'Uncategorized'}</Badge>
          <span className="text-2xl font-bold text-primary">
            {service.isPriceTbc ? 'Price TBC' : `R${service.price?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{service.title || 'Untitled Service'}</h1>
        <p className="text-muted-foreground text-sm">{service.description || 'No description provided.'}</p>
      </div>

      {service.imageUrl && (
        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
          <Image
            src={service.imageUrl}
            alt={service.title || 'Service preview image'}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {service.longDescription && (
        <div>
          <h2 className="text-lg font-semibold">About This Service</h2>
          <Separator className="my-2" />
          <div className="prose dark:prose-invert text-sm max-w-none whitespace-pre-wrap">
            {service.longDescription}
          </div>
        </div>
      )}

      {service.whatsIncluded && service.whatsIncluded.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">What's Included</h2>
          <Separator className="my-2" />
          <ul className="list-disc list-inside space-y-1 text-sm">
            {service.whatsIncluded.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {service.fulfillmentChecklist && service.fulfillmentChecklist.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Fulfillment SOP Checklist (AI & Staff)</h2>
          <Separator className="my-2" />
          <div className="space-y-2.5">
            {service.fulfillmentChecklist.map((step, index) => (
              <div key={index} className="p-3 rounded-md border bg-primary/5 border-primary/20 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-bold text-foreground text-sm">{step.title}</span>
                  </div>
                  {step.type && (
                    <Badge variant="secondary" className="text-[10px]">
                      {step.type === 'document_drafting' ? '🤖 Document Drafting' : step.type}
                    </Badge>
                  )}
                </div>

                {step.description && (
                  <p className="text-muted-foreground text-xs pl-7 leading-relaxed">{step.description}</p>
                )}

                {step.aiInstructions && (
                  <div className="ml-7 p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-[11px] text-indigo-950 dark:text-indigo-200 font-mono leading-relaxed flex items-start gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-800 dark:text-indigo-300">AI Directive: </span>
                      {step.aiInstructions}
                    </div>
                  </div>
                )}

                {step.templateIds && step.templateIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-7 pt-1">
                    {step.templateIds.map(tId => {
                      const matchedTmpl = AVAILABLE_DOCUMENT_TEMPLATES.find(t => t.id === tId);
                      return (
                        <button
                          key={tId}
                          type="button"
                          onClick={() => matchedTmpl && setPreviewTemplate(matchedTmpl)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs cursor-pointer"
                          title={matchedTmpl ? `Click to preview ${matchedTmpl.title}` : undefined}
                        >
                          <Eye className="h-3 w-3 text-indigo-600" />
                          {matchedTmpl ? matchedTmpl.title : tId.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory Template Live Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      />
    </div>
  );
}
