import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2, Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { CategoryBadge } from '@/Components/CategoryBadge';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

/**
 * Category dropdown for todo form: select a category or add one.
 * Each category row has a delete button (with confirm).
 */
export function CategorySelectWithDelete({
  value,
  onChange,
  categoriesFlat,
  onCategoriesChange,
  onAddCategory,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const containerRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectedCategory = value
    ? categoriesFlat.find((c) => String(c.id) === String(value))
    : null;

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/categories/${deleteConfirm.id}`);
      if (String(value) === String(deleteConfirm.id)) onChange('');
      setDeleteConfirm(null);
      onCategoriesChange?.();
      toast.success('Category deleted');
    } catch {
      setDeleteConfirm(null);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div ref={containerRef} className={cn('relative isolate', className)}>
      <Button
        type="button"
        variant="outline"
        className="w-[140px] rounded-lg border-border justify-between gap-1"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate flex items-center gap-1.5 min-w-0">
          {selectedCategory ? <CategoryBadge category={selectedCategory} className="shrink-0" /> : 'Category'}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-[9999] min-w-[200px] rounded-lg border border-border bg-background shadow-lg py-1 max-h-64 overflow-auto">
          <button
            type="button"
            className={cn(
              'w-full px-3 py-2 text-left text-sm hover:bg-muted/80 flex items-center',
              !value && 'bg-muted/50'
            )}
            onClick={() => { onChange(''); setOpen(false); }}
          >
            No category
          </button>
          {categoriesFlat.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1 group px-1 py-0.5"
            >
              <button
                type="button"
                className={cn(
                  'flex-1 min-w-0 px-2 py-2 text-left text-sm truncate rounded hover:bg-muted/80',
                  String(value) === String(c.id) && 'bg-muted/50'
                )}
                onClick={() => { onChange(String(c.id)); setOpen(false); }}
              >
                {c.name}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-70 hover:opacity-100 text-muted-foreground hover:text-destructive"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); setDeleteConfirm(c); }}
                title="Delete category"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/80 flex items-center gap-1.5 mt-1 border-t border-border"
            onClick={() => { setOpen(false); onAddCategory?.(); }}
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete category"
        description="Are you sure? Todos in this category will become uncategorized."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
