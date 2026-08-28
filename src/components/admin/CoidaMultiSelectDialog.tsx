'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, ShieldAlert, CheckCircle2, Layers, X, Briefcase, Factory, Wrench } from 'lucide-react';
import { COIDA_CLASSES, ALL_COIDA_SUBCLASSES, CoidaSubclass } from '@/lib/coida-industries';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CoidaMultiSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCodes: string[];
  onChange: (selectedCodes: string[]) => void;
}

export default function CoidaMultiSelectDialog({
  open,
  onOpenChange,
  selectedCodes = [],
  onChange,
}: CoidaMultiSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  // Sync internal selection with prop on open
  React.useEffect(() => {
    if (open) {
      const map: Record<string, boolean> = {};
      selectedCodes.forEach(code => {
        map[code] = true;
      });
      setSelectedMap(map);
    }
  }, [open, selectedCodes]);

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return COIDA_CLASSES
      .map(c => {
        if (selectedClassId !== 'all' && c.id !== selectedClassId) {
          return null;
        }
        const matchingSubclasses = c.subclasses.filter(sub => {
          if (!query) return true;
          return (
            sub.code.toLowerCase().includes(query) ||
            sub.title.toLowerCase().includes(query) ||
            sub.description.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query) ||
            c.classNumber.toLowerCase().includes(query)
          );
        });
        if (matchingSubclasses.length === 0) return null;
        return {
          ...c,
          subclasses: matchingSubclasses,
        };
      })
      .filter(Boolean) as typeof COIDA_CLASSES;
  }, [searchQuery, selectedClassId]);

  const allFilteredSubclasses = useMemo(() => {
    return filteredClasses.flatMap(c => c.subclasses);
  }, [filteredClasses]);

  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  const handleToggleSubclass = (code: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleSelectAllFiltered = () => {
    const nextMap = { ...selectedMap };
    allFilteredSubclasses.forEach(sub => {
      nextMap[sub.code] = true;
    });
    setSelectedMap(nextMap);
  };

  const handleClearSelection = () => {
    setSelectedMap({});
  };

  const handleConfirm = () => {
    const toSave = Object.keys(selectedMap).filter(key => selectedMap[key]);
    onChange(toSave);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <DialogTitle className="text-xl">COIDA Classification of Industries</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Official Department of Employment & Labour (Compensation Fund) Classification of Industries (W.Cl.150T). Select one or multiple applicable industry classes.
          </DialogDescription>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code (e.g. 0500, 1361, 2210), industry title, or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-background h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="h-9 px-3 py-1 bg-background border border-input rounded-md text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All 23 Classes ({ALL_COIDA_SUBCLASSES.length} Industries)</option>
                {COIDA_CLASSES.map(c => (
                  <option key={c.id} value={c.id}>
                    Class {c.classNumber} — {c.name} ({c.subclasses.length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DialogHeader>

        {/* Selected pill summary */}
        {selectedCount > 0 && (
          <div className="px-6 py-2 bg-primary/5 border-b flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 flex-wrap max-h-16 overflow-y-auto">
              <span className="font-semibold text-primary">{selectedCount} selected:</span>
              {Object.keys(selectedMap)
                .filter(k => selectedMap[k])
                .map(code => {
                  const sub = ALL_COIDA_SUBCLASSES.find(s => s.code === code);
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="gap-1 py-0.5 px-2 bg-background border text-[11px] font-normal"
                    >
                      <span className="font-semibold text-primary">{code.replace('_', ' ')}</span>
                      <span className="truncate max-w-[150px]">{sub ? sub.title.replace(/^[0-9]+(\s*\([0-9a-z]+\))?\s*/i, '') : code}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSubclass(code);
                        }}
                        className="hover:text-destructive ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-7 text-xs text-muted-foreground hover:text-destructive shrink-0"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Content list */}
        <ScrollArea className="flex-1 p-6 overflow-y-auto max-h-[55vh]">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-sm">No COIDA industries found</p>
              <p className="text-xs mt-1">Try refining your search terms or selecting 'All Classes'</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredClasses.map(c => {
                const isAllInClassSelected = c.subclasses.every(s => selectedMap[s.code]);
                const someInClassSelected = c.subclasses.some(s => selectedMap[s.code]);

                const handleToggleAllInClass = () => {
                  const nextState = !isAllInClassSelected;
                  const nextMap = { ...selectedMap };
                  c.subclasses.forEach(s => {
                    nextMap[s.code] = nextState;
                  });
                  setSelectedMap(nextMap);
                };

                return (
                  <div key={c.id} className="border rounded-lg p-4 bg-card/60 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold bg-primary/10 text-primary border-primary/20">
                          Class {c.classNumber}
                        </Badge>
                        <h4 className="font-semibold text-sm text-foreground">{c.name}</h4>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {c.category} Industry
                        </Badge>
                      </div>
                      <button
                        onClick={handleToggleAllInClass}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                      >
                        {isAllInClassSelected ? 'Deselect Class' : 'Select All in Class'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {c.subclasses.map(sub => {
                        const isSelected = !!selectedMap[sub.code];
                        return (
                          <div
                            key={sub.code}
                            onClick={() => handleToggleSubclass(sub.code)}
                            className={`flex items-start gap-3 p-3 rounded-md border text-left transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'border-primary/60 bg-primary/5 shadow-xs'
                                : 'border-border/60 hover:border-border hover:bg-muted/30'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSubclass(sub.code)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-foreground">
                                  {sub.title}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                {sub.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{allFilteredSubclasses.length}</span> industry subclasses
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              disabled={allFilteredSubclasses.length === 0}
            >
              Select All Filtered
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply {selectedCount > 0 ? `(${selectedCount})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
