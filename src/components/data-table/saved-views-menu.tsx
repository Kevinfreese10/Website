'use client';

import * as React from 'react';
import { Bookmark, BookmarkPlus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { SavedView } from './use-saved-views';

/**
 * Saved-views selector: apply, save-current-as, and delete views.
 * `currentState` is captured at save time; `onApply` restores a view's state.
 */
export function SavedViewsMenu<S>({
  views,
  activeView,
  currentState,
  onApply,
  onSave,
  onDelete,
}: {
  views: SavedView<S>[];
  activeView?: string | null;
  currentState: S;
  onApply: (view: SavedView<S>) => void;
  onSave: (name: string, state: S) => void;
  onDelete: (name: string) => void;
}) {
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [name, setName] = React.useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, currentState);
    setName('');
    setSaveOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{activeView || 'Views'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {views.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              No saved views yet — set up filters, then save them as a view.
            </p>
          )}
          {views.map((view) => (
            <DropdownMenuItem
              key={view.name}
              className="group flex items-center justify-between"
              onClick={() => onApply(view)}
            >
              <span className="flex items-center gap-2 truncate">
                {activeView === view.name && <Check className="h-3.5 w-3.5 text-primary" />}
                {view.name}
              </span>
              <button
                type="button"
                aria-label={`Delete view ${view.name}`}
                className="ml-2 hidden rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(view.name);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open={saveOpen} onOpenChange={setSaveOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Save current view">
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-2 p-3">
          <p className="text-sm font-medium">Save current view</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "My overdue orders"'
            className="h-8"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button size="sm" className="w-full" onClick={handleSave} disabled={!name.trim()}>
            Save view
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
