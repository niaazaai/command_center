import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Trash2, Search, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Layout } from '@/Components/Layout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { CategoryBadge } from '@/Components/CategoryBadge';
import { cn } from '@/lib/utils';

export default function CompletedTodos() {
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const load = () => api.get('/todos?completed=1').then(setTodos);

  useEffect(() => {
    load();
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return todos;
    return todos.filter((t) => t.title?.toLowerCase().includes(q) || t.category?.name?.toLowerCase().includes(q));
  }, [todos, search]);

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

  const completedAt = (item) => {
    if (item.updated_at) return new Date(item.updated_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Link href="/todos">
              <Button variant="ghost" size="icon" className="rounded-lg" title="Back to Todos">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed todos
            </h1>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-lg"
            aria-label="Search completed todos"
          />
        </div>

        <div className="space-y-1.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 py-2.5 px-3 rounded-lg border border-border bg-card text-sm'
              )}
            >
              <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden />
              <span className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="line-through text-muted-foreground">{item.title}</span>
                {item.category && <CategoryBadge category={item.category} />}
              </span>
              {completedAt(item) && (
                <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:inline">
                  {completedAt(item)}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setDeleteConfirm(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {search.trim() ? 'No completed todos match your search.' : 'No completed todos yet.'}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete todo"
        description="Are you sure you want to delete this completed todo?"
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
      />
    </Layout>
  );
}
