import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const toast = useToast();

  const load = () => api.get('/ideas').then(setIdeas);
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setModalOpen(true);
  };

  const openEdit = (idea) => {
    setEditing(idea);
    setTitle(idea.title);
    setContent(idea.content || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (editing) {
        await api.put(`/ideas/${editing.id}`, { title: title.trim(), content: content.trim() });
        toast.success('Idea updated');
      } else {
        await api.post('/ideas', { title: title.trim(), content: content.trim() });
        toast.success('Idea created');
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error('Failed to save idea');
    }
  };

  const handleDeleteClick = (id) => setDeleteConfirmId(id);
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/ideas/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      load();
      toast.success('Idea deleted');
    } catch {
      setDeleteConfirmId(null);
      toast.error('Failed to delete idea');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/60">
          <h1 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ideas
          </h1>
          <Button onClick={openCreate} className="rounded-lg shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            New idea
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <Card key={idea.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4 border-b border-border/80">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium truncate flex-1 text-sm">{idea.title}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(idea)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDeleteClick(idea.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {idea.content && (
                <CardContent className="pt-3 px-4 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {idea.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        {ideas.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No ideas yet. Add one to capture it.</p>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit idea' : 'New idea'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="idea-title">Title</Label>
                <Input
                  id="idea-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label htmlFor="idea-content">Content</Label>
                <textarea
                  id="idea-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteConfirmId !== null}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          title="Delete idea"
          description="Are you sure you want to delete this idea?"
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
        />
      </div>
    </Layout>
  );
}
