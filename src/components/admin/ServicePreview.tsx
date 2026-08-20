
'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Service, AVAILABLE_DOCUMENT_TEMPLATES, DocumentTemplateOption } from '@/lib/types';
import { BadgeCheck, Clock, ClipboardCheck, Eye } from 'lucide-react';
import TemplatePreviewDialog from './TemplatePreviewDialog';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default function ServicePreview({ service }: { service: Service }) {
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplateOption | null>(null);

  if (!service) return null;

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
        <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">{service.category}</Badge>
            <p className="text-2xl font-bold text-primary">{formatPrice(service.price)}</p>
            <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">{service.turnaroundTime}</span>
            </div>
        </div>
        
        <div>
            <h2 className="text-lg font-semibold">Service Description</h2>
            <Separator className="my-2" />
            <p className="text-sm text-muted-foreground">{service.longDescription}</p>
        </div>

        {service.whatsIncluded && service.whatsIncluded.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold">What's Included</h2>
                <Separator className="my-2" />
                <ul className="space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
                    {service.whatsIncluded.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        )}

        {service.informationToProvide && service.informationToProvide.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold">Information & Documents Required from Client</h2>
                <Separator className="my-2" />
                <ul className="space-y-2">
                    {service.informationToProvide.map((info, index) => (
                        <li key={index} className="p-2 rounded-md border text-xs flex justify-between items-center bg-muted/40">
                            <div>
                                <span className="font-semibold">{info.label}</span>
                                {info.helpText && <p className="text-muted-foreground text-[10px] mt-0.5">{info.helpText}</p>}
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase">
                                {info.type || 'text'}
                            </Badge>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {service.fulfillmentChecklist && service.fulfillmentChecklist.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold">Fulfillment SOP Checklist (AI & Staff)</h2>
                <Separator className="my-2" />
                <div className="space-y-2">
                    {service.fulfillmentChecklist.map((step, index) => (
                        <div key={index} className="p-2.5 rounded-md border bg-primary/5 border-primary/20 text-xs flex items-start gap-2">
                            <span className="font-bold text-primary">{index + 1}.</span>
                            <div className="flex-grow space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">{step.title}</span>
                                    {step.type && (
                                        <Badge variant="secondary" className="text-[10px]">
                                            {step.type === 'document_drafting' ? '🤖 Document Drafting' : step.type}
                                        </Badge>
                                    )}
                                </div>
                                {step.description && (
                                    <p className="text-muted-foreground text-[11px] mt-0.5">{step.description}</p>
                                )}
                                {step.templateIds && step.templateIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {step.templateIds.map(tId => {
                                            const matchedTmpl = AVAILABLE_DOCUMENT_TEMPLATES.find(t => t.id === tId);
                                            return (
                                                <button
                                                    key={tId}
                                                    type="button"
                                                    onClick={() => matchedTmpl && setPreviewTemplate(matchedTmpl)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs cursor-pointer"
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
