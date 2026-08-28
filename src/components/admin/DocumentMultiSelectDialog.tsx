'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, CheckCircle2, FileText, Layers, X, HelpCircle } from 'lucide-react';
import { STANDARD_DOCUMENT_REQUIREMENT_GROUPS, DocumentRequirementPreset } from '@/lib/service-presets';

interface DocumentMultiSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLabels: string[];
  previouslyUsed: DocumentRequirementPreset[];
  onAddSelected: (selectedPresets: DocumentRequirementPreset[]) => void;
}

export default function DocumentMultiSelectDialog({
  open,
  onOpenChange,
  existingLabels = [],
  previouslyUsed = [],
  onAddSelected,
}: DocumentMultiSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const existingNormalized = useMemo(() => {
    return new Set(existingLabels.map(l => l.trim().toLowerCase()));
  }, [existingLabels]);

  // Combine standard and previously used
  const allGroups = useMemo(() => {
    const groups = [...STANDARD_DOCUMENT_REQUIREMENT_GROUPS];
    if (previouslyUsed.length > 0) {
      groups.push({
        category: 'Previously Used in Store',
        items: previouslyUsed,
      });
    }
    return groups;
  }, [previouslyUsed]);

  // Filter items
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allGroups
      .map(group => {
        if (selectedCategory !== 'all' && group.category !== selectedCategory) {
          return null;
        }
        const matchingItems = group.items.filter(item => {
          if (!query) return true;
          return (
            item.label.toLowerCase().includes(query) || 
            item.helpText.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            group.category.toLowerCase().includes(query)
          );
        });
        if (matchingItems.length === 0) return null;
        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter(Boolean) as typeof allGroups;
  }, [allGroups, searchQuery, selectedCategory]);

  const allFilteredItems = useMemo(() => {
    return filteredGroups.flatMap(g => g.items);
  }, [filteredGroups]);

  const allItemsMap = useMemo(() => {
    const map = new Map<string, DocumentRequirementPreset>();
    allGroups.forEach(g => {
      g.items.forEach(item => {
        map.set(item.id, item);
      });
    });
    return map;
  }, [allGroups]);

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAllFiltered = () => {
    const nextMap = { ...selectedIds };
    allFilteredItems.forEach(item => {
      if (!existingNormalized.has(item.label.trim().toLowerCase())) {
        nextMap[item.id] = true;
      }
    });
    setSelectedIds(nextMap);
  };

  const handleClearSelection = () => {
    setSelectedIds({});
  };

  const handleConfirm = () => {
    const selectedList: DocumentRequirementPreset[] = [];
    Object.keys(selectedIds).forEach(id => {
      if (selectedIds[id]) {
        const item = allItemsMap.get(id);
        if (item) selectedList.push(item);
      }
    });

    if (selectedList.length > 0) {
      onAddSelected(selectedList);
    }
    setSelectedIds({});
    onOpenChange(false);
  };

  const formatBadgeVariant = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'excel': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'image': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'text': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'coida_industry': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Standard Client Documents Library</DialogTitle>
              <DialogDescription className="text-xs">
                Select multiple client document requirements and upload guidelines to add to this service in bulk.
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search document intake requirements (e.g. Bank statements, ID copy, IRP5, Invoices)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-9 text-xs"
                onClick={handleSelectAllFiltered}
              >
                Select All
              </Button>
              {selectedCount > 0 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleClearSelection}
                >
                  Clear ({selectedCount})
                </Button>
              )}
            </div>
          </div>

          {/* Category Tabs / Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Categories
            </button>
            {allGroups.map(g => (
              <button
                key={g.category}
                type="button"
                onClick={() => setSelectedCategory(g.category)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  selectedCategory === g.category
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {g.category}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No matching document requirements found for "{searchQuery}".
            </div>
          ) : (
            filteredGroups.map((group, grpIdx) => (
              <div key={`dlg_doc_grp_${grpIdx}_${group.category}`} className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> {group.category}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {group.items.length} {group.items.length === 1 ? 'requirement' : 'requirements'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {group.items.map((item, itemIdx) => {
                    const isAlreadyInProduct = existingNormalized.has(item.label.trim().toLowerCase());
                    const isChecked = !!selectedIds[item.id] || isAlreadyInProduct;

                    return (
                      <label
                        key={`dlg_doc_item_${grpIdx}_${item.id}_${itemIdx}`}
                        onClick={(e) => {
                          if (isAlreadyInProduct) {
                            e.preventDefault();
                            return;
                          }
                        }}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          isAlreadyInProduct
                            ? 'bg-muted/40 border-muted text-muted-foreground cursor-not-allowed opacity-75'
                            : isChecked
                            ? 'bg-primary/5 border-primary shadow-xs'
                            : 'bg-card hover:bg-muted/20 border-border'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={isAlreadyInProduct}
                          onCheckedChange={() => handleToggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-foreground truncate">
                                {item.label}
                              </span>
                              <Badge variant="outline" className={`text-[10px] font-bold uppercase px-1.5 py-0 h-4 border ${formatBadgeVariant(item.type)}`}>
                                {item.type}
                              </Badge>
                            </div>
                            {isAlreadyInProduct && (
                              <Badge variant="outline" className="text-[10px] bg-muted shrink-0 text-muted-foreground">
                                Already Added
                              </Badge>
                            )}
                          </div>
                          {item.helpText && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
                              <HelpCircle className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                              {item.helpText}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row items-center justify-between gap-2 sm:justify-between">
          <div className="text-xs text-muted-foreground font-medium">
            {selectedCount > 0 ? (
              <span className="text-primary font-bold">{selectedCount} requirement{selectedCount > 1 ? 's' : ''} selected</span>
            ) : (
              <span>Select document intake fields to add in bulk</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleConfirm} 
              disabled={selectedCount === 0}
              className="text-xs font-bold gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Add {selectedCount > 0 ? `${selectedCount} Requirements` : 'Selected'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
