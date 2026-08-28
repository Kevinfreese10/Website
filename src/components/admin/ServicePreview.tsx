'use client';

import { Service } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface ServicePreviewProps {
  service: Partial<Service>;
}

export default function ServicePreview({ service }: ServicePreviewProps) {
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
          <div className="prose text-sm max-w-none whitespace-pre-wrap">
            {service.longDescription}
          </div>
        </div>
      )}

      {service.coidaIndustries && service.coidaIndustries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>COIDA Industry Classification</span>
            <Badge variant="secondary" className="text-xs">{service.coidaIndustries.length}</Badge>
          </h2>
          <Separator className="my-2" />
          <div className="flex flex-wrap gap-2">
            {service.coidaIndustries.map(code => (
              <Badge key={code} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs py-1 px-2.5">
                {code.replace('_', ' ')}
              </Badge>
            ))}
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
    </div>
  );
}
