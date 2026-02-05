import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Bell, Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Components/ui/dialog';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import { ReminderList } from './ReminderList';
import { DateTimePicker } from './DateTimePicker';
import { Logo } from './Logo';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function Sidebar({ open, onClose, minimized = false, onToggleMinimize, className }) {
  const [date, setDate] = useState(() => new Date());
  const [reminders, setReminders] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRemindAt, setNewRemindAt] = useState('');
  const [isTimeBound, setIsTimeBound] = useState(false);
  const toast = useToast();

  const loadReminders = () => api.get('/reminders').then(setReminders);

  useEffect(() => {
    if (!open) return;
    loadReminders();
  }, [open]);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (isTimeBound && !newRemindAt) {
      toast.error('Set date and time for scheduled reminder');
      return;
    }
    try {
      await api.post('/reminders', {
        title: newTitle.trim(),
        remind_at: isTimeBound ? newRemindAt : null,
      });
      setNewTitle('');
      setNewRemindAt('');
      setIsTimeBound(false);
      setAddOpen(false);
      loadReminders();
      toast.success('Reminder added');
    } catch {
      toast.error('Failed to add reminder');
    }
  };

  const closeAddDialog = () => {
    setAddOpen(false);
    setNewTitle('');
    setNewRemindAt('');
    setIsTimeBound(false);
  };

  const today = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const grid = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    grid.push({ day: prevMonthDays - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ day: d, current: true });
  }
  const rest = 42 - grid.length;
  for (let d = 1; d <= rest; d++) {
    grid.push({ day: d, current: false });
  }

  if (minimized) {
    return (
      <aside className={cn(className, 'md:flex md:flex-col md:items-center md:py-2')}>
        <Logo className="mb-2 [&>span]:hidden" />
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 w-9 h-9"
          title={`${MONTHS[month]} ${year}`}
        >
          <CalendarIcon className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center gap-1 flex-1 min-h-0">
          <Button variant="ghost" size="icon" className="w-9 h-9" title="Reminders">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-9 h-9" title="Add reminder" onClick={() => setAddOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <Dialog open={addOpen} onOpenChange={(open) => !open && closeAddDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <Label htmlFor="rem-title-min">Title</Label>
                <Input
                  id="rem-title-min"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Reminder title"
                  className="mt-1 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setIsTimeBound(false)}
                    className={cn(
                      'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                      !isTimeBound ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Permanent
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTimeBound(true)}
                    className={cn(
                      'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                      isTimeBound ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Scheduled
                  </button>
                </div>
              </div>
              {isTimeBound && (
                <div>
                  <Label htmlFor="rem-at-min">Date & time</Label>
                  <DateTimePicker
                    id="rem-at-min"
                    value={newRemindAt}
                    onChange={setNewRemindAt}
                    placeholder="Pick date and time"
                    className="mt-1"
                  />
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAddDialog}>
                  Cancel
                </Button>
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </aside>
    );
  }

  return (
    <aside className={cn(className, 'flex flex-col')}>
      <div className="flex-shrink-0 p-3 border-b border-border/80">
        <Logo className="[&>span]:inline" />
      </div>
      {/* Small calendar */}
      <Card className="m-2 rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="p-2 pb-1 flex flex-row items-center justify-between border-b border-border/80">
          <span className="text-sm font-medium">{MONTHS[month]} {year}</span>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
            >
              ‹
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
            >
              ›
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
            {DAYS.map((d) => (
              <div key={d} className="font-medium text-muted-foreground py-0.5">
                {d.slice(0, 1)}
              </div>
            ))}
            {grid.map(({ day, current }, i) => (
              <button
                key={i}
                type="button"
                className={cn(
                  'aspect-square rounded flex items-center justify-center text-xs',
                  !current && 'text-muted-foreground',
                  current && day === today && 'bg-primary text-primary-foreground'
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming (scheduled) + Reminders (permanent) */}
      <div className="mx-2 flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between py-2 flex-shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Reminders
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ReminderList reminders={reminders} onReorder={loadReminders} className="flex-1 min-h-0 overflow-auto" showDelete={false} />
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => !open && closeAddDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <Label htmlFor="rem-title">Title</Label>
              <Input
                id="rem-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Reminder title"
                className="mt-1 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setIsTimeBound(false)}
                  className={cn(
                    'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                    !isTimeBound ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Permanent
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimeBound(true)}
                  className={cn(
                    'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                    isTimeBound ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Scheduled
                </button>
              </div>
            </div>
            {isTimeBound && (
              <div>
                <Label htmlFor="rem-at">Date & time</Label>
                <DateTimePicker
                  id="rem-at"
                  value={newRemindAt}
                  onChange={setNewRemindAt}
                  placeholder="Pick date and time"
                  className="mt-1"
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAddDialog}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
