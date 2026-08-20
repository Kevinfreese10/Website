
'use client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Service } from '@/lib/types';
import { BadgeCheck, Clock, ClipboardCheck } from 'lucide-react';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default function ServicePreview({ service }: { service: Service }) {
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
                <ul className="space-y-2 text-sm">
                    {service.whatsIncluded.map((item, index) => (
                    <li key={index} className="flex items-start">
                        <BadgeCheck className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                    </li>
                    ))}
                </ul>
            </div>
        )}

        {service.informationToProvide && service.informationToProvide.length > 0 && (
            <div>
                <h2 className="text-lg font-semibold">Information & Documents Needed</h2>
                <Separator className="my-2" />
                <ul className="space-y-2 text-sm">
                    {service.informationToProvide.map((info, index) => (
                        <li key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                            <span className="font-semibold text-foreground">{info.label}</span>
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
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground">{step.title}</span>
                                    {step.type && (
                                        <Badge variant="secondary" className="text-[10px]">
                                            {step.type}
                                        </Badge>
                                    )}
                                </div>
                                {step.description && (
                                    <p className="text-muted-foreground text-[11px] mt-0.5">{step.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}
