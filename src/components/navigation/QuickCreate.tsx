'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, ClipboardCheck, Plus, ShieldCheck } from 'lucide-react';

/**
 * Global "+ New" quick-create menu for staff: order, client, task.
 */
export function QuickCreate() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Quick create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/admin/orders/new')}>
          <ShieldCheck className="mr-2 h-4 w-4" /> Order
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/admin/clients?new=1')}>
          <Briefcase className="mr-2 h-4 w-4" /> Client
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/admin/tasks?new=1')}>
          <ClipboardCheck className="mr-2 h-4 w-4" /> Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
