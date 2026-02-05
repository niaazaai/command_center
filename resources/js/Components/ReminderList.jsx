import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isTimeBoundInWindow(reminder) {
  if (!reminder.remind_at) return false;
  const at = new Date(reminder.remind_at).getTime();
  const now = Date.now();
  return at >= now - ONE_DAY_MS && at <= now + ONE_DAY_MS;
}

function PermanentReminderItem({ reminder, onDeleteRequest, showDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: reminder.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-lg border border-border bg-card text-sm',
        isDragging && 'opacity-50 shadow-md'
      )}
    >
      <button type="button" className="touch-none cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{reminder.title}</div>
      </div>
      {showDelete && (
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-lg" onClick={() => onDeleteRequest(reminder)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function TimeBoundReminderItem({ reminder, onDeleteRequest, showDelete }) {
  const at = reminder.remind_at
    ? new Date(reminder.remind_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : '';

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border bg-card text-sm">
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{reminder.title}</div>
        <div className="text-xs text-muted-foreground">{at}</div>
      </div>
      {showDelete && (
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 rounded-lg" onClick={() => onDeleteRequest(reminder)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function ReminderList({ reminders, onReorder, className, showDelete = true }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const { timeBoundInWindow, permanent, timeBoundIds } = useMemo(() => {
    const inWindow = reminders.filter(isTimeBoundInWindow);
    const perm = reminders.filter((r) => !r.remind_at);
    return {
      timeBoundInWindow: inWindow,
      permanent: perm,
      timeBoundIds: inWindow.map((r) => r.id),
    };
  }, [reminders]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = permanent.findIndex((r) => r.id === active.id);
    const newIndex = permanent.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newPermanentOrder = arrayMove(permanent, oldIndex, newIndex).map((r) => r.id);
    const order = [...timeBoundIds, ...newPermanentOrder];
    try {
      await api.put('/reminders/reorder', { order });
      onReorder();
      toast.success('Order updated');
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/reminders/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      onReorder();
      toast.success('Reminder deleted');
    } catch {
      setDeleteConfirm(null);
      toast.error('Failed to delete reminder');
    }
  };

  return (
    <>
      <div className={cn('flex flex-col gap-3 min-h-0', className)}>
        {timeBoundInWindow.length > 0 && (
          <section className="space-y-1.5 flex-shrink-0">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Upcoming
            </h3>
            <div className="space-y-1">
              {timeBoundInWindow.map((reminder) => (
                <TimeBoundReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  onDeleteRequest={setDeleteConfirm}
                  showDelete={showDelete}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-1.5 flex-1 min-h-0 flex flex-col">
          {permanent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No reminders. Tap + to add.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={permanent.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1 overflow-auto min-h-0">
                  {permanent.map((reminder) => (
                    <PermanentReminderItem
                      key={reminder.id}
                      reminder={reminder}
                      onDeleteRequest={setDeleteConfirm}
                      showDelete={showDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete reminder"
        description="Are you sure you want to delete this reminder?"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
