'use client';

import { useState } from 'react';
import { Service, PrerequisiteItem } from '@/lib/types';
import PrerequisitesList from './PrerequisitesList';
import ServiceCheckoutForm from '../checkout/ServiceCheckoutForm';
import { Separator } from '../ui/separator';
import { Clock, BadgeCheck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ProductPageInteractiveContainerProps {
  service: Service;
  partnerId?: string;
  partnerSlug?: string;
  clientRequirements?: (string | PrerequisiteItem)[];
}

export default function ProductPageInteractiveContainer({
  service,
  partnerId,
  partnerSlug,
  clientRequirements,
}: ProductPageInteractiveContainerProps) {
  // Single Source of Truth for selected prerequisite IDs
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<Set<string>>(new Set());
  const [arePrereqsConfirmed, setArePrereqsConfirmed] = useState<boolean>(
    !clientRequirements || clientRequirements.length === 0
  );

  const handleTogglePrereq = (serviceId: string) => {
    setSelectedPrereqIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
      {/* LEFT COLUMN: Main Info & Prerequisites */}
      <div className="space-y-8 md:col-span-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-600 shrink-0" />
            Product Description
          </h2>
          <Separator className="my-3" />
          <p className="text-muted-foreground leading-relaxed">{service.longDescription}</p>
        </div>

        {service.whatsIncluded && service.whatsIncluded.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600 shrink-0" />
              What's Included
            </h2>
            <Separator className="my-3" />
            <ul className="space-y-3">
              {service.whatsIncluded.map((item, index) => (
                <li key={index} className="flex items-start">
                  <BadgeCheck className="h-5 w-5 text-emerald-400 mr-3 mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {clientRequirements && clientRequirements.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-600 shrink-0" />
              Prerequisites
            </h2>
            <Separator className="my-3" />
            <PrerequisitesList
              requirements={clientRequirements}
              selectedPrereqIds={selectedPrereqIds}
              onTogglePrereq={handleTogglePrereq}
              onConfirmationChange={setArePrereqsConfirmed}
            />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: STICKY CHECKOUT SIDEBAR */}
      <div className="md:col-span-1">
        <div className="sticky top-24 space-y-4">
          {/* Service summary recap */}
          <div className="relative overflow-hidden rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white p-5 shadow-sm space-y-3">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-100/80 text-blue-800 border border-blue-200/80">
                {service.category}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
              {service.title}
            </h3>

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                {service.turnaroundTime}
              </span>
              <span className="text-2xl font-black text-blue-700 tracking-tight">
                {service.isPriceTbc ? 'Quote' : formatPrice(service.price)}
              </span>
            </div>
          </div>

          <ServiceCheckoutForm
            service={service}
            partnerId={partnerId}
            partnerSlug={partnerSlug}
            selectedPrereqIds={selectedPrereqIds}
            onTogglePrereq={handleTogglePrereq}
            arePrereqsConfirmed={arePrereqsConfirmed}
          />
        </div>
      </div>
    </div>
  );
}
