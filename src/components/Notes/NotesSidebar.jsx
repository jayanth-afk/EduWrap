import { useState, useRef } from 'react';
import { Search, Plus, Import, FileText, FileBox, Loader2, CheckCircle2 } from 'lucide-react';
import { useNotes } from '../../contexts/NotesContext';

export default function NotesSidebar() {
  const { notes, activeNoteId, setActiveNoteId, addNote, importNote, indexingStatus } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const filteredNotes = notes.filter((note) => {
    const search = searchQuery.toLowerCase();
    const titleMatch = note.title.toLowerCase().includes(search);
    const contentMatch = note.type === 'text' && note.content?.toLowerCase().includes(search);
    return titleMatch || contentMatch;
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsImporting(true);
        await importNote(file);
      } catch (err) {
        console.error("Failed to import note", err);
      } finally {
        setIsImporting(false);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-80 h-full border-r border-(--border-subtle) bg-(--bg-elevated) flex flex-col shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-(--border-subtle) shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg font-sora">Notes</h2>
          <div className="flex gap-2">
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="p-1.5 text-(--text-secondary) hover:bg-(--bg-hover) rounded-md transition-colors tooltip-trigger cursor-pointer disabled:opacity-50"
              title="Import Note or PDF"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />}
            </button>
            <button
              onClick={addNote}
              className="p-1.5 bg-(--accent) text-white rounded-md hover:opacity-90 transition-opacity tooltip-trigger cursor-pointer"
              title="New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,application/pdf"
              className="hidden"
            />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-(--bg-primary) border border-(--border-subtle) rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-(--accent) transition-colors"
          />
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-(--text-tertiary) text-sm mt-8">
            No notes found.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isPdf = note.type === 'pdf';
            const status = indexingStatus[note.id];
            const dateDisplay = note.lastEdited && !isNaN(Date.parse(note.lastEdited))
              ? new Date(note.lastEdited).toLocaleDateString()
              : (note.lastEdited || 'Recently');
            
            return (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1 cursor-pointer
                  ${
                    activeNoteId === note.id
                      ? 'bg-(--accent)/10 border-(--accent)/20 text-(--accent)'
                      : 'hover:bg-(--bg-hover) text-(--text-primary)'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {isPdf ? (
                    <FileBox className={`w-4 h-4 shrink-0 ${activeNoteId === note.id ? 'text-(--accent)' : 'text-(--text-tertiary)'}`} />
                  ) : (
                    <FileText className={`w-4 h-4 shrink-0 ${activeNoteId === note.id ? 'text-(--accent)' : 'text-(--text-tertiary)'}`} />
                  )}
                  <span className="font-medium truncate flex-1">{note.title || 'Untitled Note'}</span>
                  
                  {isPdf && status === 'indexing' && (
                    <Loader2 className="w-3 h-3 text-(--accent) animate-spin shrink-0" title="Extracting text..." />
                  )}
                  {isPdf && status === 'done' && (
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" title="Text extracted" />
                  )}
                </div>
                {!isPdf && (
                  <div className={`text-xs truncate pl-6 ${activeNoteId === note.id ? 'text-(--accent)/70' : 'text-(--text-tertiary)'}`}>
                    {note.content || 'No content...'}
                  </div>
                )}
                {isPdf && (
                  <div className={`text-xs truncate pl-6 ${activeNoteId === note.id ? 'text-(--accent)/70' : 'text-(--text-tertiary)'}`}>
                    PDF Document
                  </div>
                )}
                <div className={`text-[10px] pl-6 mt-1 font-mono ${activeNoteId === note.id ? 'text-(--accent)/50' : 'text-(--text-tertiary)/50'}`}>
                  {dateDisplay}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
