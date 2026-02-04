import React, { useState, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { Layout } from '@/Components/Layout';
import { ReminderList } from '@/Components/ReminderList';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/Components/ui/button';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isInWindow(reminder) {
  if (!reminder.remind_at) return false;
  const at = new Date(reminder.remind_at).getTime();
  const now = Date.now();
  return at >= now - ONE_DAY_MS && at <= now + ONE_DAY_MS;
}

function ScheduledRow({ reminder, onDeleteRequest }) {
  const at = reminder.remind_at
    ? new Date(reminder.remind_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : '';

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border bg-card text-sm hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{reminder.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{at}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0 rounded-lg"
        onClick={() => onDeleteRequest(reminder)}
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const loadReminders = () => api.get('/reminders').then(setReminders);

  useEffect(() => {
    loadReminders();
  }, []);

  const scheduledLater = useMemo(
    () =>
      reminders
        .filter((r) => r.remind_at && !isInWindow(r))
        .sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)),
    [reminders]
  );

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/reminders/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      loadReminders();
      toast.success('Reminder deleted');
    } catch {
      setDeleteConfirm(null);
      toast.error('Failed to delete reminder');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Permanent reminders stay in your list. Scheduled reminders appear when their date is near.
          </p>
        </header>

        <div className={cn('grid gap-6', 'grid-cols-1', 'lg:grid-cols-2')}>
          <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permanent &amp; Upcoming
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reorder permanent items; upcoming scheduled reminders show here.
              </p>
            </div>
            <div className="p-3 min-h-[200px]">
              <ReminderList reminders={reminders} onReorder={loadReminders} className="flex flex-col gap-2" />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scheduled
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reminders with a date outside the upcoming window.
              </p>
            </div>
            <div className="p-3 min-h-[200px] space-y-1">
              {scheduledLater.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No other scheduled reminders.
                </p>
              ) : (
                scheduledLater.map((reminder) => (
                  <ScheduledRow
                    key={reminder.id}
                    reminder={reminder}
                    onDeleteRequest={setDeleteConfirm}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete reminder"
        description="Are you sure you want to delete this reminder?"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </Layout>
  );
}
