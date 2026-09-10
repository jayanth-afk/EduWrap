import { useEffect, useState, useRef } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { useNotes } from '../../contexts/NotesContext';

export default function NotesEditor() {
  const { notes, activeNoteId, updateNote, deleteNote, exportNote } = useNotes();
  
  // Find the active note
  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Local state for immediate typing feedback
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const textareaRef = useRef(null);

  // Sync local state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    }
  }, [activeNoteId]);

  // Auto-expanding textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  if (!activeNote) return null;

  // Handle auto-save
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    updateNote(activeNote.id, { title: e.target.value });
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    updateNote(activeNote.id, { content: e.target.value });
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-(--bg-primary) overflow-hidden relative">
      {/* Top Action Bar */}
      <div className="h-14 border-b border-(--border-subtle) flex items-center justify-between px-6 shrink-0 bg-(--bg-primary)/80 backdrop-blur-md sticky top-0 z-10">
        <div className="text-xs text-(--text-tertiary) font-mono">
          Last edited: {(() => {
            const d = new Date(activeNote.lastEdited);
            return isNaN(d.getTime()) ? (activeNote.lastEdited || 'Recently') : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          })()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportNote(activeNote.id)}
            className="p-2 text-(--text-secondary) hover:text-(--accent) hover:bg-(--bg-hover) rounded-lg transition-colors cursor-pointer"
            title="Export as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteNote(activeNote.id)}
            className="p-2 text-(--text-secondary) hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-32 py-12 pb-32">
        <div className="max-w-3xl mx-auto w-full">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note Title"
            className="w-full text-4xl font-bold bg-transparent outline-none border-none text-(--text-primary) placeholder-(--text-tertiary) mb-8 font-sora"
          />
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="w-full text-lg leading-relaxed bg-transparent outline-none border-none text-(--text-secondary) placeholder-(--text-tertiary) resize-none overflow-hidden min-h-[50vh] font-inter"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 border-t border-(--border-subtle) bg-(--bg-elevated) absolute bottom-0 left-0 right-0 flex items-center px-4 justify-end text-xs text-(--text-tertiary)">
        <span>{words} words</span>
        <span className="mx-2">•</span>
        <span>{chars} characters</span>
      </div>
    </div>
  );
}
