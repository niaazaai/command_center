import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';

export function RichTextEditor({ value = '', onChange, placeholder = 'Write something…', className, minHeight = '120px' }) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rich-text-editor-inner min-h-[80px] p-2 text-sm focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value ?? '';
    if (next !== current) editor.commands.setContent(next, false);
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
      style={{ minHeight }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
