import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Components/ui/dialog';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Current week Monday–Sunday with date numbers and today flag. First = Monday, last = Sunday. */
function getWeekDays() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
  const toMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + toMonday);
  return DAY_KEYS.map((key, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key,
      label: DAY_LABELS[i],
      dateNum: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
    };
  });
}

/** Format week range for subtitle, e.g. "2 – 8 Feb 2026" */
function getWeekRangeLabel() {
  const days = getWeekDays();
  const first = days[0];
  const last = days[days.length - 1];
  const monday = new Date();
  const dayOfWeek = monday.getDay();
  const toMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + toMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${monday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString(undefined, opts)}`;
}

export function RepeatedTodoPanel() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toggling, setToggling] = useState(null); // { id, day } while request in flight
  const [optimistic, setOptimistic] = useState({}); // { "id-day": true|false }
  const toast = useToast();
  const weekDays = getWeekDays();
  const weekRangeLabel = getWeekRangeLabel();

  const load = useCallback(() => api.get('/repeated-todos').then(setItems), []);

  useEffect(() => {
    load();
  }, [load]);

  const getChecked = useCallback(
    (item, dayKey) => {
      const optKey = `${item.id}-${dayKey}`;
      if (Object.hasOwn(optimistic, optKey)) return optimistic[optKey];
      return !!item.week?.[dayKey];
    },
    [optimistic]
  );

  const handleToggle = async (item, dayKey) => {
    const optKey = `${item.id}-${dayKey}`;
    const nextChecked = !getChecked(item, dayKey);
    setOptimistic((prev) => ({ ...prev, [optKey]: nextChecked }));
    setToggling({ id: item.id, day: dayKey });
    try {
      await api.put(`/repeated-todos/${item.id}/toggle`, { day: dayKey });
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[optKey];
        return next;
      });
      load();
      toast.success(nextChecked ? 'Marked done' : 'Unmarked');
    } catch {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[optKey];
        return next;
      });
      toast.error('Failed to update');
    } finally {
      setToggling(null);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.post('/repeated-todos', { title: newTitle.trim() });
      setNewTitle('');
      setModalOpen(false);
      load();
      toast.success('Repeated todo added');
    } catch {
      toast.error('Failed to add repeated todo');
    }
  };

  const handleDeleteClick = (id) => setDeleteConfirmId(id);
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/repeated-todos/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      load();
      toast.success('Repeated todo removed');
    } catch {
      setDeleteConfirmId(null);
      toast.error('Failed to remove');
    }
  };

  return (
    <>
      <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="space-y-1 pb-3 pt-4 px-4 border-b border-border/80">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">This week</h3>
            </div>
            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8" onClick={() => setModalOpen(true)} aria-label="Add repeated todo">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{weekRangeLabel}</p>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-sm text-muted-foreground">No repeated tasks yet.</p>
              <Button variant="outline" size="sm" className="mt-2 rounded-lg" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add one
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30">
                    <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground w-[140px] rounded-tl-xl">
                      Task
                    </th>
                    {weekDays.map(({ key, label, dateNum, isToday }) => (
                      <th
                        key={key}
                        className={cn(
                          'py-2 px-1 text-center text-xs font-medium w-11',
                          isToday ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                        )}
                        title={isToday ? 'Today' : undefined}
                      >
                        <span className="block truncate" title={`${label} ${dateNum}`}>
                          {label}
                        </span>
                        <span className={cn('block text-[10px] mt-0.5', isToday ? 'text-primary font-medium' : 'text-muted-foreground/80')}>
                          {dateNum}
                        </span>
                      </th>
                    ))}
                    <th className="w-10 rounded-tr-xl" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/60 hover:bg-muted/20 transition-colors last:border-b-0"
                    >
                      <td className="py-2 px-3">
                        <span className="text-sm font-medium text-foreground truncate block" title={item.title}>
                          {item.title}
                        </span>
                      </td>
                      {weekDays.map(({ key, isToday }) => {
                        const checked = getChecked(item, key);
                        const busy = toggling?.id === item.id && toggling?.day === key;
                        return (
                          <td key={key} className="py-1 px-0.5 align-middle">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => !busy && handleToggle(item, key)}
                              onKeyDown={(e) => {
                                if (busy) return;
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleToggle(item, key);
                                }
                              }}
                              className={cn(
                                'w-full flex items-center justify-center min-h-[36px] rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                isToday && 'bg-primary/5',
                                checked && 'bg-primary/10',
                                !checked && 'hover:bg-muted/50',
                                busy && 'pointer-events-none opacity-60'
                              )}
                              aria-label={`${key}: ${checked ? 'Done' : 'Not done'}. Toggle.`}
                              aria-busy={busy}
                            >
                              <Checkbox
                                checked={checked}
                                className="pointer-events-none h-4 w-4 rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                aria-hidden
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-1 px-1 align-middle">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(item.id)}
                          aria-label="Remove repeated todo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add repeated todo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="rt-title">Title</Label>
              <Input
                id="rt-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Prayer, Gym"
                className="mt-1 rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Remove repeated todo"
        description="Are you sure you want to remove this repeated todo?"
        confirmLabel="Remove"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
