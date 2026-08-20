'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Search, Eye, Sparkles, Loader2, CheckCircle2, X } from 'lucide-react';
import { AVAILABLE_DOCUMENT_TEMPLATES, DocumentTemplateOption } from '@/lib/types';
import TemplatePreviewDialog from './TemplatePreviewDialog';
import { cn } from '@/lib/utils';

interface OrderTemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateTemplates: (selectedTemplateIds: string[]) => Promise<void>;
  isGenerating?: boolean;
  defaultSelectedIds?: string[];
}

export default function OrderTemplateSelectorDialog({
  open,
  onOpenChange,
  onGenerateTemplates,
  isGenerating = false,
  defaultSelectedIds = [],
}: OrderTemplateSelectorDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplateOption | null>(null);

  // Sync default selection when dialog opens
  React.useEffect(() => {
    if (open) {
      if (defaultSelectedIds.length > 0) {
        setSelectedIds(defaultSelectedIds);
      }
    }
  }, [open, defaultSelectedIds]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(AVAILABLE_DOCUMENT_TEMPLATES.map(t => t.category)));
    return ['all', ...cats];
  }, []);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return AVAILABLE_DOCUMENT_TEMPLATES.filter(tmpl => {
      if (selectedCategory !== 'all' && tmpl.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      return (
        tmpl.title.toLowerCase().includes(query) ||
        tmpl.description.toLowerCase().includes(query) ||
        tmpl.category.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, selectedCategory]);

  const toggleTemplate = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredTemplates.map(t => t.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAll = () => {
    const visibleIds = new Set(filteredTemplates.map(t => t.id));
    setSelectedIds(prev => prev.filter(id => !visibleIds.has(id)));
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    await onGenerateTemplates(selectedIds);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b bg-gradient-to-r from-indigo-50/80 to-blue-50/60 dark:from-indigo-950/40 dark:to-blue-950/30">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Select Statutory Document Templates to Generate
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Pick any official South African statutory templates to pre-fill with client intake data and Kevin Freese CBA (SA) credentials.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-indigo-300 text-indigo-950 dark:text-indigo-200">
                {selectedIds.length} Selected
              </Badge>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates (e.g. Form 2, Share Certificate, Accounting Officer, POA)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors",
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-background/80 hover:bg-muted border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat === 'all' ? 'All Templates' : cat}
                  </button>
                ))}
              </div>
            </div>
          </DialogHeader>

          {/* Quick Selection Toolbar */}
          <div className="flex items-center justify-between px-5 py-2 border-b bg-muted/20 text-xs shrink-0">
            <span className="text-[11px] text-muted-foreground">
              Showing {filteredTemplates.length} of {AVAILABLE_DOCUMENT_TEMPLATES.length} templates
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Select Visible
              </button>
              <span className="text-muted-foreground">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[11px] text-muted-foreground hover:text-foreground font-semibold"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Templates Grid List */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-grow max-h-[55vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredTemplates.map(tmpl => {
                const isSelected = selectedIds.includes(tmpl.id);
                return (
                  <div
                    key={tmpl.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleTemplate(tmpl.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-2.5 select-none",
                      isSelected
                        ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-2xs"
                        : "bg-card hover:bg-muted/40 border-border"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-grow">
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        className="pointer-events-none mt-0.5"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground leading-tight">
                            {tmpl.title}
                          </span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                            {tmpl.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-6 text-[10px] px-2 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50 shrink-0 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setPreviewTemplate(tmpl);
                      }}
                      title={`Preview ${tmpl.title}`}
                    >
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Action Bar */}
          <DialogFooter className="flex flex-row items-center justify-between p-4 border-t bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
              <span className="text-muted-foreground text-[11px]">
                {selectedIds.length === 0 ? 'Select at least 1 template to generate' : `${selectedIds.length} statutory template(s) ready to generate`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                disabled={selectedIds.length === 0 || isGenerating}
                className="text-xs font-bold h-8 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate ({selectedIds.length}) Drafts
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live PDF Preview Sub-Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(isOpen) => !isOpen && setPreviewTemplate(null)}
      />
    </>
  );
}
