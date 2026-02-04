import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/Components/Layout';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { CategoryBadge } from '@/Components/CategoryBadge';
import { cn } from '@/lib/utils';

function flattenCategories(list, level = 0) {
  let out = [];
  for (const c of list) {
    out.push({ ...c, level });
    if (c.children?.length) out = out.concat(flattenCategories(c.children, level + 1));
  }
  return out;
}

function TodoRow({ item, onDeleteRequest, onToggleDone, toast }) {
  const [optimisticChecked, setOptimisticChecked] = useState(null);
  const isChecked = optimisticChecked !== null ? optimisticChecked : item.status === 'complete';

  const handleCheckedChange = async (checked) => {
    setOptimisticChecked(checked);
    try {
      await api.put(`/todos/${item.id}`, { status: checked ? 'complete' : 'under_process' });
      onToggleDone();
      if (toast) toast.success(checked ? 'Todo completed' : 'Todo marked incomplete');
    } catch {
      setOptimisticChecked(!checked);
      onToggleDone();
      if (toast) toast.error('Failed to update todo');
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-border bg-card min-w-0">
      <Checkbox
        checked={isChecked}
        onCheckedChange={handleCheckedChange}
        aria-label={isChecked ? 'Mark incomplete' : 'Mark complete'}
        className="shrink-0"
      />
      <span className={cn('flex-1 min-w-0 truncate text-sm', item.status === 'complete' && 'line-through text-muted-foreground')}>
        {item.title}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={() => onDeleteRequest(item)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();
  const forDate = new Date().toISOString().slice(0, 10);

  const load = () => {
    api.get('/categories').then(setCategories);
    api.get(`/todos?for_date=${forDate}`).then(setTodos);
  };

  useEffect(() => {
    load();
  }, []);

  const flatCats = flattenCategories(categories);
  const todosByCategory = React.useMemo(() => {
    const sorted = [...todos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const map = { null: [] };
    flatCats.forEach((c) => { map[c.id] = []; });
    sorted.forEach((t) => {
      const key = t.category_id ?? null;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [todos, flatCats]);

  const categoryColumns = React.useMemo(() => {
    const cols = flatCats.map((cat) => ({ ...cat, key: cat.id, items: todosByCategory[cat.id] ?? [] }));
    cols.push({ id: null, name: 'No category', key: 'none', items: todosByCategory.null ?? [] });
    return cols;
  }, [flatCats, todosByCategory]);

  const totalTodos = todos.length;

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/todos/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      load();
      toast.success('Todo deleted');
    } catch {
      setDeleteConfirm(null);
      toast.error('Failed to delete todo');
    }
  };

  return (
    <Layout>
      <div className="space-y-5 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/60">
              Todos by category
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Date: {forDate}</p>
          </div>
          <Link href="/completed-todos">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              Completed todos
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
          {categoryColumns.map((col) => (
            <section key={col.key} className="min-w-0 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2.5 border-b border-border/80 bg-muted/30 truncate flex items-center gap-2">
                {col.id != null ? <CategoryBadge category={{ name: col.name, color: col.color }} /> : col.name}
              </h2>
              <div className="p-2 space-y-1.5 overflow-auto min-h-0">
                {col.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 px-2">No todos</p>
                ) : (
                  col.items.map((item) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      onDeleteRequest={setDeleteConfirm}
                      onToggleDone={load}
                      toast={toast}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        {totalTodos === 0 && (
          <p className="text-muted-foreground text-center py-8">No todos for this date. Add some from the Dashboard.</p>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete todo"
        description="Are you sure you want to delete this todo?"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </Layout>
  );
}
