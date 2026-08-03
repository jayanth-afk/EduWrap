import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, CheckSquare, Sparkles, Share2, Plus, Check, Loader2 } from 'lucide-react';
import { useRoom } from '../../../contexts/RoomContext';
import { useNotes } from '../../../contexts/NotesContext';
import { Avatar } from '../../../components/ui/Avatar';

export default function NotesWorkspace() {
  const { activeRoom, activeClassroom } = useRoom();
  const { notes, addNote, updateNote, activeNoteId, setActiveNoteId } = useNotes();
  
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved
  const textareaRef = useRef(null);

  // Initialize or match with active room notes
  useEffect(() => {
    if (notes && notes.length > 0) {
      // Find a note associated with this room or classroom, or use the first available note
      const roomNote = notes.find(n => n.roomId === activeRoom?.id || n.classroomId === activeClassroom?.id) || notes[0];
      if (roomNote) {
        setCurrentNoteId(roomNote.id);
        setTitle(roomNote.title || 'Collaborative Notes');
        setContent(roomNote.content || '');
      }
    } else {
      setTitle(`${activeClassroom?.name || 'Classroom'} Notes`);
      setContent('');
    }
  }, [activeRoom?.id, activeClassroom?.id, notes]);

  // Handle creating a brand new note
  const handleCreateNewNote = async () => {
    try {
      const newNote = {
        title: `${activeRoom?.name || 'Room'} - New Note`,
        content: `### ${activeClassroom?.name || 'Classroom'} Meeting Notes\n\n- Key Concepts:\n- Questions:\n- Action Items:`,
        roomId: activeRoom?.id || null,
        classroomId: activeClassroom?.id || null,
        tags: [activeRoom?.category || 'General'],
      };
      const noteId = await addNote(newNote);
      if (noteId) {
        setCurrentNoteId(noteId);
        setTitle(newNote.title);
        setContent(newNote.content);
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // Debounced save
  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('saving');
    
    if (currentNoteId) {
      updateNote(currentNoteId, { content: val });
    }
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 800);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (currentNoteId) {
      updateNote(currentNoteId, { title: val });
    }
  };

  // Insert markdown helpers
  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    if (currentNoteId) {
      updateNote(currentNoteId, { content: newContent });
    }
  };

  // Share note link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // AI Summarize
  const handleAiSummarize = () => {
    if (!content.trim()) return;
    setIsSummarizing(true);
    setTimeout(() => {
      const summaryAppend = `\n\n---\n**✨ AI Key Takeaways:**\n• Summary of current notes in ${activeClassroom?.name || 'Classroom'}\n• Core topics discussed and action points recorded.`;
      const updated = content + summaryAppend;
      setContent(updated);
      if (currentNoteId) {
        updateNote(currentNoteId, { content: updated });
      }
      setIsSummarizing(false);
    }, 1200);
  };

  if (!activeClassroom) return null;

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)">
      {/* Topbar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-(--border-default) flex flex-wrap items-center justify-between gap-3 shrink-0 bg-(--bg-elevated)/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg">{activeClassroom.name}</h2>
          <div className="h-4 w-px bg-(--border-default)"></div>
          <div className="flex -space-x-2">
            <Avatar initials="S" size="sm" className="border-2 border-(--bg-primary)" />
            <Avatar initials="A" size="sm" className="border-2 border-(--bg-primary)" />
          </div>
          <span className="text-xs text-(--text-muted) whitespace-nowrap">{activeClassroom.activeCursors || 2} editing</span>
          {saveStatus === 'saving' && <span className="text-xs text-(--text-muted) flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving...</span>}
          {saveStatus === 'saved' && <span className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> Saved</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCreateNewNote} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--bg-glass) border border-(--border-subtle) text-xs font-bold hover:bg-(--bg-elevated) transition-colors cursor-pointer"
          >
            <Plus size={14} /> New Note
          </button>
          <button 
            onClick={handleAiSummarize}
            disabled={isSummarizing || !content.trim()}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-bold hover:bg-purple-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={14} className={isSummarizing ? "animate-spin" : ""} /> 
            {isSummarizing ? 'Summarizing...' : 'AI Summarize'}
          </button>
          <button 
            onClick={handleShare}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] text-xs font-bold hover:bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)] transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />} 
            {copied ? 'Copied Link' : 'Share'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-2 border-b border-(--border-subtle) flex items-center gap-1 shrink-0 bg-(--bg-glass)">
        <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded hover:bg-(--bg-elevated) text-(--text-secondary) cursor-pointer" title="Bold"><Bold size={16} /></button>
        <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded hover:bg-(--bg-elevated) text-(--text-secondary) cursor-pointer" title="Italic"><Italic size={16} /></button>
        <div className="w-px h-4 bg-(--border-default) mx-2"></div>
        <button onClick={() => insertMarkdown('\n- ')} className="p-1.5 rounded hover:bg-(--bg-elevated) text-(--text-secondary) cursor-pointer" title="Bullet List"><List size={16} /></button>
        <button onClick={() => insertMarkdown('\n- [ ] ')} className="p-1.5 rounded hover:bg-(--bg-elevated) text-(--text-secondary) cursor-pointer" title="Task Item"><CheckSquare size={16} /></button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 lg:px-24">
        <div className="max-w-3xl mx-auto w-full relative">
          
          {/* Simulated Collaborative Cursors */}
          <div className="absolute top-10 left-1/4 z-10 flex flex-col items-start pointer-events-none animate-pulse">
            <svg width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.999955 0.380482C0.68369 0.0526978 0.155823 0.288277 0.165215 0.748366L0.596001 21.849C0.605393 22.3091 1.18957 22.4578 1.45892 22.0683L5.35242 16.4357C5.46747 16.2693 5.65683 16.166 5.8596 16.1593L11.5173 15.9698C11.9961 15.9538 12.1643 15.3409 11.7831 15.0506L0.999955 0.380482Z" fill="#F59E0B"/>
            </svg>
            <div className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm mt-1 font-medium">Sarah</div>
          </div>

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note Title"
            className="w-full text-3xl sm:text-4xl font-bold mb-6 text-(--text-primary) outline-none bg-transparent"
          />

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing collaborative notes here..."
            className="w-full text-base sm:text-lg text-(--text-secondary) leading-relaxed outline-none min-h-[450px] bg-transparent resize-none font-sans"
          />
        </div>
      </div>
    </div>
  );
}