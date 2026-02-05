import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';

/**
 * Reusable confirmation dialog (replaces window.confirm).
 * @param {boolean} open
 * @param {function} onOpenChange
 * @param {string} title
 * @param {string} description
 * @param {string} confirmLabel - e.g. "Delete" or "Remove"
 * @param {function} onConfirm - called when user confirms
 * @param {boolean} destructive - if true, confirm button uses destructive variant
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  destructive = true,
}) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    const result = onConfirm?.();
    if (result && typeof result.then === 'function') {
      setLoading(true);
      try {
        await result;
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={handleConfirm} disabled={loading}>
            {loading ? '…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
