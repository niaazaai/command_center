import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export function CreateCategoryDialog({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const toast = useToast();

  const activeColor = color === 'custom' ? customColor : color;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await api.post('/categories', {
        name: name.trim(),
        parent_id: null,
        color: activeColor || null,
      });
      setName('');
      setColor(PRESET_COLORS[0]);
      setCustomColor('#3b82f6');
      onOpenChange(false);
      onCreated?.(created);
      toast.success('Category created');
    } catch {
      toast.error('Failed to create category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="mt-1 rounded-lg"
            />
          </div>
          <div>
            <Label className="block mb-2">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shrink-0',
                    color === c ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground/30' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Pick color ${c}`}
                />
              ))}
              <button
                type="button"
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shrink-0 flex items-center justify-center',
                  color === 'custom' ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground/30' : 'border-transparent'
                )}
                style={{ backgroundColor: customColor }}
                onClick={() => setColor('custom')}
                aria-label="Custom color"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Label htmlFor="cat-custom-color" className="text-xs text-muted-foreground shrink-0">
                Custom color
              </Label>
              <input
                id="cat-custom-color"
                type="color"
                value={customColor}
                onChange={(e) => { setCustomColor(e.target.value); setColor('custom'); }}
                className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
              />
              <span className="text-xs text-muted-foreground font-mono">{activeColor}</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
