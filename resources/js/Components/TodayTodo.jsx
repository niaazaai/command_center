import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CreateCategoryDialog } from './CreateCategoryDialog';
import { CategorySelectWithDelete } from './CategorySelectWithDelete';
import { CategoryBadge } from './CategoryBadge';
import { useToast } from '@/contexts/ToastContext';

const EXIT_ANIMATION_MS = 400;

const TodoRow = React.memo(function TodoRow({ item, completingId, onDelete, onReorder, onMarkComplete, onCompleteDone }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [showTick, setShowTick] = useState(false);
  const isCompleting = completingId === item.id;
  const exitDoneRef = useRef(false);

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { willChange: 'transform' } : {}),
  }), [transform, transition, isDragging]);

  const handleDelete = async () => {
    try {
      await api.delete(`/todos/${item.id}`);
      onReorder();
      onDelete?.('Deleted');
    } catch {
      onDelete?.(null);
    }
  };

  const handleCheckedChange = (checked) => {
    if (checked) {
      setShowTick(true);
      onMarkComplete(item.id);
    }
  };
  const isChecked = item.status === 'complete' || showTick || isCompleting;

  useEffect(() => {
    if (!isCompleting || exitDoneRef.current) return;
    const t = setTimeout(() => {
      exitDoneRef.current = true;
      api.put(`/todos/${item.id}`, { status: 'complete' })
        .then(() => {
          onCompleteDone?.(true);
          onReorder();
        })
        .catch(() => {
          setShowTick(false);
          onCompleteDone?.(false);
          onReorder();
        });
    }, EXIT_ANIMATION_MS);
    return () => clearTimeout(t);
  }, [isCompleting, item.id, onReorder, onCompleteDone]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border bg-background',
        !isDragging && 'transition-[transform,opacity,height] duration-300 ease-out',
        isDragging && 'opacity-0 pointer-events-none',
        isCompleting && 'opacity-0 scale-95 h-0 overflow-hidden py-0 px-3 border-0'
      )}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        aria-label={isChecked ? 'Mark incomplete' : 'Mark complete'}
        className="shrink-0 h-4 w-4 rounded border-2"
      />
      <button type="button" className="touch-none cursor-grab active:cursor-grabbing p-0.5 rounded" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className={cn('flex-1 min-w-0 text-sm flex items-center gap-2 flex-wrap', item.status === 'pending' && 'text-muted-foreground')}>
        {item.title}
        {item.category && <CategoryBadge category={item.category} />}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

function DragOverlayRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border bg-background shadow-lg cursor-grabbing ring-2 ring-primary/20">
      <div className="shrink-0 h-4 w-4 rounded border-2 border-muted" aria-hidden />
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      <span className={cn('flex-1 min-w-0 text-sm flex items-center gap-2 flex-wrap truncate', item.status === 'pending' && 'text-muted-foreground')}>
        {item.title}
        {item.category && <CategoryBadge category={item.category} />}
      </span>
      <div className="h-8 w-8 shrink-0" aria-hidden />
    </div>
  );
}

export function TodayTodo() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pendingStartIndex, setPendingStartIndex] = useState(0);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const toast = useToast();

  const forDate = new Date().toISOString().slice(0, 10);

  const load = useCallback(() => {
    api.get('/categories').then(setCategories);
    api.get(`/todos?for_date=${forDate}`).then((list) => {
      setTodos(list);
      const idx = list.findIndex((t) => t.status === 'pending');
      setPendingStartIndex(idx === -1 ? list.length : idx);
      setCompletingId(null);
    });
  }, [forDate]);

  useEffect(() => {
    load();
  }, [load]);

  const todayTodos = todos.filter((t) => t.status !== 'pending');
  const pendingTodos = todos.filter((t) => t.status === 'pending');
  const allOrdered = useMemo(() => [...todayTodos, ...pendingTodos], [todayTodos, pendingTodos]);
  const sortableIds = useMemo(() => allOrdered.map((t) => t.id), [allOrdered]);
  const currentPendingStart = todayTodos.length;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const catId = categoryId && categoryId !== 'add-cat' && !Number.isNaN(Number(categoryId)) ? Number(categoryId) : null;
    try {
      await api.post('/todos', {
        title: title.trim(),
        category_id: catId,
        for_date: forDate,
      });
      setTitle('');
      setCategoryId('');
      load();
      toast.success('Todo added');
    } catch {
      toast.error('Failed to add todo');
    }
  };

  const handleDeleteResult = useCallback((msg) => {
    if (msg) toast.success(msg);
    else toast.error('Failed to delete');
  }, [toast]);

  const handleMarkComplete = useCallback((id) => {
    setCompletingId(id);
  }, []);

  const handleCompleteDone = useCallback((success) => {
    if (success) toast.success('Todo completed');
    else toast.error('Failed to complete');
  }, [toast]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = allOrdered.findIndex((t) => t.id === active.id);
    const newIndex = allOrdered.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const movedItem = allOrdered[oldIndex];
    const wasToday = movedItem.status !== 'pending';
    const newOrder = arrayMove(allOrdered, oldIndex, newIndex);
    let newPendingStart = currentPendingStart;
    if (newIndex > oldIndex && wasToday) newPendingStart = currentPendingStart - 1;
    else if (newIndex < oldIndex && !wasToday) newPendingStart = currentPendingStart + 1;
    newPendingStart = Math.max(0, Math.min(newOrder.length, newPendingStart));
    try {
      await api.put('/todos/reorder', {
        order: newOrder.map((t) => t.id),
        pending_start_index: newPendingStart,
      });
      load();
      toast.success('Order updated');
    } catch {
      load();
      toast.error('Failed to update order');
    }
  }, [allOrdered, currentPendingStart, load, toast]);

  const flattenCategories = (list, level = 0) => {
    let out = [];
    for (const c of list) {
      out.push({ ...c, level, name: (level ? '  '.repeat(level) : '') + c.name });
      if (c.children?.length) out = out.concat(flattenCategories(c.children, level + 1));
    }
    return out;
  };
  const flatCats = flattenCategories(categories);

  return (
    <Card className="rounded-xl border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b border-border/80">
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Add a todo..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-[160px] rounded-lg bg-muted/50 border-border focus:bg-background transition-colors"
          />
          <CategorySelectWithDelete
            value={categoryId}
            onChange={setCategoryId}
            categoriesFlat={flatCats}
            onCategoriesChange={load}
            onAddCategory={() => setCategoryDialogOpen(true)}
          />
          <Button type="submit" size="icon" className="rounded-lg shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <CreateCategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          onCreated={(created) => { load(); setCategoryId(String(created.id)); toast.success('Category created'); }}
        />
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/60">
            Today — {forDate}
          </h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {todayTodos.map((item) => (
                  <TodoRow
                    key={item.id}
                    item={item}
                    completingId={completingId}
                    onReorder={load}
                    onDelete={handleDeleteResult}
                    onMarkComplete={handleMarkComplete}
                    onCompleteDone={handleCompleteDone}
                  />
                ))}
              </div>

              <section className="space-y-2 pt-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/60 w-full">
                  Pending Todo
                </h2>
                <div className="space-y-1.5">
                  {pendingTodos.map((item) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      completingId={completingId}
                      onReorder={load}
                      onDelete={handleDeleteResult}
                      onMarkComplete={handleMarkComplete}
                      onCompleteDone={handleCompleteDone}
                    />
                  ))}
                </div>
              </section>
            </SortableContext>
            <DragOverlay>
              {activeId ? (() => {
                const item = allOrdered.find((t) => t.id === activeId);
                return item ? <DragOverlayRow item={item} /> : null;
              })() : null}
            </DragOverlay>
          </DndContext>
        </section>
      </CardContent>
    </Card>
  );
}
