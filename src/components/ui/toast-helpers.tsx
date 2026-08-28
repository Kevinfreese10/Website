"use client";

import * as React from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { CheckCircle2, AlertTriangle } from "lucide-react";

/** Success toast with icon. */
export function toastSuccess(title: string, description?: string) {
  return toast({
    variant: "success",
    title,
    description,
  });
}

/** Warning toast with icon. */
export function toastWarning(title: string, description?: string) {
  return toast({
    variant: "warning",
    title,
    description,
  });
}

export interface UndoToastOptions {
  title: string;
  description?: string;
  /** Called if the user clicks Undo before the toast closes. */
  onUndo: () => void | Promise<void>;
  /** Called when the toast closes without Undo (safe point to finalise a delete). */
  onCommit?: () => void | Promise<void>;
  undoLabel?: string;
}

/**
 * Toast with an Undo action — the standard pattern for archive / delete /
 * status changes. Perform the action optimistically first, then call this;
 * use onUndo to revert and (optionally) onCommit to finalise.
 */
export function toastUndo({
  title,
  description,
  onUndo,
  onCommit,
  undoLabel = "Undo",
}: UndoToastOptions) {
  let undone = false;
  return toast({
    title,
    description,
    action: (
      <ToastAction
        altText={undoLabel}
        onClick={() => {
          undone = true;
          void onUndo();
        }}
      >
        {undoLabel}
      </ToastAction>
    ),
    onOpenChange: (open: boolean) => {
      if (!open && !undone && onCommit) void onCommit();
    },
  });
}

export { CheckCircle2 as ToastSuccessIcon, AlertTriangle as ToastWarningIcon };
