import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, StickyNote, ChevronDown } from 'lucide-react';
import { Layout } from '@/Components/Layout';
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
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { CategorySelectWithDelete } from '@/Components/CategorySelectWithDelete';
import { CreateCategoryDialog } from '@/Components/CreateCategoryDialog';
import { CategoryBadge } from '@/Components/CategoryBadge';
import { RichTextEditor } from '@/Components/RichTextEditor';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

function flattenCategories(list, level = 0) {
  let out = [];
  for (const c of list) {
    out.push({ ...c, level });
    if (c.children?.length) out = out.concat(flattenCategories(c.children, level + 1));
  }
  return out;
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const toast = useToast();

  const flatCats = useMemo(() => flattenCategories(categories), [categories]);

  const loadCategories = () => api.get('/categories').then(setCategories);
  const loadNotes = () => {
    const params = categoryFilter ? { category_id: categoryFilter } : {};
    return api.get('/notes', { params }).then(setNotes);
  };
  const load = () => {
    loadCategories();
    loadNotes();
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadNotes();
  }, [categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setCategoryId('');
    setModalOpen(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content || '');
    setCategoryId(note.category_id ? String(note.category_id) : '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      content: content || '',
      category_id: categoryId === '' ? null : categoryId || null,
    };
    try {
      if (editing) {
        await api.put(`/notes/${editing.id}`, payload);
        toast.success('Note updated');
      } else {
        await api.post('/notes', payload);
        toast.success('Note created');
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteClick = (id) => setDeleteConfirmId(id);
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/notes/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      load();
      toast.success('Note deleted');
    } catch {
      setDeleteConfirmId(null);
      toast.error('Failed to delete note');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <StickyNote className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Notes</h1>
              <p className="text-sm text-muted-foreground">Create and organize notes by category</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Label htmlFor="note-filter" className="sr-only">Filter by category</Label>
              <select
                id="note-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background pl-4 pr-10 py-2 text-sm font-medium text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="">All categories</option>
                {flatCats.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
            </div>
            <Button onClick={openCreate} className="rounded-xl h-10 px-4 gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              New note
            </Button>
          </div>
        </div>

        {/* Notes grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{note.title}</h3>
                    {note.category && (
                      <CategoryBadge category={note.category} className="mt-2" />
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => openEdit(note)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(note.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {note.content && (
                <CardContent className="pt-4 px-5 pb-5">
                  {/<[^>]+>/.test(note.content) ? (
                    <div
                      className="text-sm text-muted-foreground line-clamp-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul,_ol]:pl-4 [&_p]:mb-1 [&_p:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <StickyNote className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No notes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a note to get started.</p>
            <Button onClick={openCreate} className="mt-4 rounded-xl" variant="secondary">
              <Plus className="h-4 w-4 mr-2" />
              New note
            </Button>
          </div>
        )}

        {/* Create / Edit note modal — ~30% larger, title + category in one row, editor below */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60 shrink-0">
              <DialogTitle className="text-lg">{editing ? 'Edit note' : 'New note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 flex overflow-hidden">
              <div className="px-6 py-4 space-y-4 shrink-0">
                {/* Title + Category in one row */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Title</Label>
                    <Input
                      id="note-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note title"
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <CategorySelectWithDelete
                      value={categoryId}
                      onChange={setCategoryId}
                      categoriesFlat={flatCats}
                      onCategoriesChange={loadCategories}
                      onAddCategory={() => { setModalOpen(false); setCreateCategoryOpen(true); }}
                      deleteConfirmDescription="Are you sure? Notes in this category will become uncategorized."
                      className="w-full sm:w-[200px]"
                    />
                  </div>
                </div>
                {/* Content editor below */}
                <div className="space-y-2">
                  <Label htmlFor="note-content">Content</Label>
                  <div className="min-h-[200px]">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      className="min-h-[200px]"
                      minHeight="200px"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-border/60 shrink-0">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <CreateCategoryDialog
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          onCreated={() => { loadCategories(); setModalOpen(true); }}
        />

        <ConfirmDialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          title="Delete note"
          description="Are you sure you want to delete this note? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
        />
      </div>
    </Layout>
  );
}