import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { processPDFFromUrl, processPDFFromFile, getPDFText, clearAllPDFText } from '../services/pdfService';
import {
  notesRef,
  noteDoc,
  fetchQuery,
  createDoc,
  patchDoc,
  removeDoc,
  safeOnSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  timeAgo,
} from '../firebase/firestore';
import { uploadNotePdf } from '../firebase/storageService';

const NotesContext = createContext(undefined);

export function NotesProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [indexingStatus, setIndexingStatus] = useState({});
  const [loading, setLoading] = useState(true);

  // ─── REAL-TIME: Load user's notes from Firestore (limit 50 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(notesRef, where('userId', '==', uid), orderBy('lastEdited', 'desc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        lastEdited: d.data().lastEdited?.toDate?.()?.toISOString() || d.data().lastEdited,
      }));
      setNotes(items);
      setLoading(false);
    }, (err) => {
      console.error('Notes listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── Background PDF text indexing (kept in IndexedDB as cache) ───
  useEffect(() => {
    if (notes.length === 0) return;

    const indexPDFs = async () => {
      const version = localStorage.getItem('eduwrap_pdf_cache_version');
      if (version !== '5') {
        await clearAllPDFText();
        localStorage.setItem('eduwrap_pdf_cache_version', '5');
      }

      for (const note of notes) {
        if (note.type === 'pdf' && note.url) {
          try {
            setIndexingStatus(prev => ({ ...prev, [note.id]: 'indexing' }));
            await processPDFFromUrl(note.id, note.url);
            setIndexingStatus(prev => ({ ...prev, [note.id]: 'done' }));
          } catch (e) {
            console.error(`Failed to index ${note.title}:`, e);
            setIndexingStatus(prev => ({ ...prev, [note.id]: 'error' }));
          }
        }
      }
    };

    setTimeout(indexPDFs, 1500);
  }, [notes]);

  // ─── ADD NOTE ───
  const addNote = async () => {
    if (!uid) return;

    const id = await createDoc(notesRef, {
      userId: uid,
      type: 'text',
      title: '',
      content: '',
      tags: [],
      lastEdited: serverTimestamp(),
    });

    setActiveNoteId(id);
    return id;
  };

  // ─── UPDATE NOTE ───
  const updateNote = async (id, updates) => {
    try {
      await patchDoc(noteDoc(id), {
        ...updates,
        lastEdited: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  // ─── DELETE NOTE ───
  const deleteNote = async (id) => {
    try {
      await removeDoc(noteDoc(id));
      if (activeNoteId === id) setActiveNoteId(null);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // ─── IMPORT NOTE (text or PDF) ───
  const importNote = async (file) => {
    if (!uid) throw new Error('Must be logged in to import notes');

    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      // Generate a temp ID for PDF text extraction
      const tempId = crypto.randomUUID();

      // Extract text and cache in IndexedDB
      await processPDFFromFile(tempId, file);

      // Upload PDF to Firebase Storage
      let pdfUrl;
      try {
        const result = await uploadNotePdf(uid, tempId, file);
        pdfUrl = result.url;
      } catch (err) {
        // If storage upload fails, create a blob URL (non-persistent)
        console.warn('Firebase Storage upload failed, using blob URL:', err);
        pdfUrl = URL.createObjectURL(file);
      }

      // Create Firestore note document
      const noteId = await createDoc(notesRef, {
        userId: uid,
        type: 'pdf',
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: pdfUrl,
        tags: ['imported', 'pdf'],
        lastEdited: serverTimestamp(),
      });

      setActiveNoteId(noteId);
      return { id: noteId, title: file.name, type: 'pdf' };
    } else {
      // Text/Markdown file
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target.result;
          const title = file.name.replace(/\.[^/.]+$/, '');

          const noteId = await createDoc(notesRef, {
            userId: uid,
            type: 'text',
            title,
            content,
            tags: ['imported'],
            lastEdited: serverTimestamp(),
          });

          setActiveNoteId(noteId);
          resolve({ id: noteId, title, type: 'text' });
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  };

  // ─── EXPORT NOTE ───
  const exportNote = (id) => {
    const note = notes.find(n => n.id === id);
    if (!note || note.type === 'pdf') return;

    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Untitled Note'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        activeNoteId,
        setActiveNoteId,
        addNote,
        updateNote,
        deleteNote,
        importNote,
        exportNote,
        indexingStatus,
        getPDFText,
        loading,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
