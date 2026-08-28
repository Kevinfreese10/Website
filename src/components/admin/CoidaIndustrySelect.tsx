'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, X, Search, Check, ShieldCheck } from 'lucide-react';
import { ALL_COIDA_SUBCLASSES, getCoidaSubclassByCode } from '@/lib/coida-industries';
import CoidaMultiSelectDialog from './CoidaMultiSelectDialog';

interface CoidaIndustrySelectProps {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export default function CoidaIndustrySelect({
  value = [],
  onChange,
  disabled = false,
}: CoidaIndustrySelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedCodes = value || [];

  const handleRemove = (codeToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedCodes.filter(c => c !== codeToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            COIDA Classification of Industries
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Link this product to one or more official Department of Employment & Labour (COIDA) industry classes.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={disabled}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {selectedCodes.length > 0 ? `Manage Industries (${selectedCodes.length})` : 'Select COIDA Industries'}
        </Button>
      </div>

      {selectedCodes.length === 0 ? (
        <div
          onClick={() => !disabled && setDialogOpen(true)}
          className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <Building2 className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground opacity-50" />
          <p className="text-xs font-medium text-muted-foreground">No COIDA industries selected</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            Click here or press "Select COIDA Industries" to choose applicable industry classifications (e.g. 0500 Building, 1361 Garages, 2210 Professional Services).
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border rounded-lg">
          {selectedCodes.map(code => {
            const sub = getCoidaSubclassByCode(code);
            return (
              <Badge
                key={code}
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 bg-background border text-xs font-normal shadow-2xs hover:bg-muted/40 transition-colors"
              >
                <span className="font-bold text-primary font-mono text-[11px] bg-primary/10 px-1 py-0.2 rounded">
                  {code.replace('_', ' ')}
                </span>
                <span className="max-w-[280px] truncate font-medium text-foreground">
                  {sub ? sub.title.replace(/^[0-9]+(\s*\([0-9a-z]+\))?\s*/i, '') : code}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(code, e)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    title={`Remove ${code}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      <CoidaMultiSelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedCodes={selectedCodes}
        onChange={onChange}
      />
    </div>
  );
}
