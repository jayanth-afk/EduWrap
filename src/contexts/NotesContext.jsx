import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const DEFAULT_NOTES = [
  {
    id: 'pdf-note-dsa',
    userId: 'system',
    type: 'pdf',
    title: 'Advanced Data Structures & Algorithms Guide',
    url: '/pdfs/0edabb6c92634ccb85df21c7bc9598f7.pdf',
    tags: ['DSA', 'Algorithms', 'PDF'],
    lastEdited: '1 hour ago',
  },
  {
    id: 'pdf-note-sys',
    userId: 'system',
    type: 'pdf',
    title: 'Computer Systems Architecture & OS Principles',
    url: '/pdfs/1a82d02e9818480b80f497dc977edf0e.pdf',
    tags: ['Architecture', 'OS', 'PDF'],
    lastEdited: '3 hours ago',
  },
  {
    id: 'pdf-note-dbms',
    userId: 'system',
    type: 'pdf',
    title: 'Database Management Systems & SQL Fundamentals',
    url: '/pdfs/3d6b43f1871b4f159b93d33462cb93f4.pdf',
    tags: ['DBMS', 'SQL', 'PDF'],
    lastEdited: '5 hours ago',
  },
  {
    id: 'pdf-note-ml',
    userId: 'system',
    type: 'pdf',
    title: 'Machine Learning & Neural Networks Handbook',
    url: '/pdfs/81257b03aa5f4197835d18e4a529bc94.pdf',
    tags: ['AI/ML', 'Deep Learning', 'PDF'],
    lastEdited: '1 day ago',
  },
  {
    id: 'pdf-note-math',
    userId: 'system',
    type: 'pdf',
    title: 'Discrete Mathematics & Graph Theory',
    url: '/pdfs/cdbb23eea3764074be2ca12901a1a053.pdf',
    tags: ['Maths', 'Discrete', 'PDF'],
    lastEdited: '2 days ago',
  },
  {
    id: 'pdf-note-web',
    userId: 'system',
    type: 'pdf',
    title: 'Web Architecture & Cloud Distributed Systems',
    url: '/pdfs/ea7dc9ff429d45b381b5e22577a51fa4.pdf',
    tags: ['Web', 'Cloud', 'PDF'],
    lastEdited: '3 days ago',
  },
  {
    id: 'note-welcome',
    userId: 'system',
    type: 'text',
    title: 'Welcome to EduWrap Smart Notes',
    content: `# Welcome to EduWrap Smart Notes 🚀\n\nEduWrap allows you to write markdown notes, upload PDFs from your device, and read them with our smart PDF reader.\n\n### Key Features:\n- 📄 **PDF Viewing & Text Extraction**: Import any PDF note and search its content.\n- ✍️ **Markdown Editing**: Rich markdown notes with auto-save.\n- 🤝 **Live Study Collaboration**: Link notes to Study Rooms and Classrooms.`,
    tags: ['Welcome', 'Guide'],
    lastEdited: 'Just now',
  }
];

const NotesContext = createContext(undefined);

export function NotesProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [activeNoteId, setActiveNoteId] = useState('pdf-note-dsa');
  const [indexingStatus, setIndexingStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // ─── REAL-TIME: Load user's notes from Firestore (limit 50 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) return;

    const q = query(notesRef, where('userId', '==', uid), orderBy('lastEdited', 'desc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        const firestoreNotes = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          lastEdited: d.data().lastEdited?.toDate?.()?.toISOString() || d.data().lastEdited || 'Just now',
        }));

        setNotes(prev => {
          const fsIds = new Set(firestoreNotes.map(n => n.id));
          const unmergedDefaults = DEFAULT_NOTES.filter(n => !fsIds.has(n.id));
          return [...firestoreNotes, ...unmergedDefaults];
        });
      }
    }, (err) => {
      console.warn('Notes Firestore listener warning:', err);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── On-demand PDF text indexing (only for active note, cached in IndexedDB) ───
  useEffect(() => {
    if (!activeNoteId) return;
    const currentNote = notes.find(n => n.id === activeNoteId);
    if (!currentNote || currentNote.type !== 'pdf' || !currentNote.url) return;
    if (indexingStatus[activeNoteId] === 'done' || indexingStatus[activeNoteId] === 'indexing') return;

    let isCancelled = false;
    const scheduleIndex = () => {
      if (isCancelled) return;
      setIndexingStatus(prev => ({ ...prev, [activeNoteId]: 'indexing' }));
      processPDFFromUrl(activeNoteId, currentNote.url)
        .then(() => {
          if (!isCancelled) {
            setIndexingStatus(prev => ({ ...prev, [activeNoteId]: 'done' }));
          }
        })
        .catch((e) => {
          console.warn(`PDF indexing deferred for ${currentNote.title}:`, e);
          if (!isCancelled) {
            setIndexingStatus(prev => ({ ...prev, [activeNoteId]: 'done' }));
          }
        });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(scheduleIndex, { timeout: 3000 });
      return () => {
        isCancelled = true;
        window.cancelIdleCallback(idleId);
      };
    } else {
      const timer = setTimeout(scheduleIndex, 1000);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [activeNoteId, notes, indexingStatus]);

  // ─── ADD NOTE (Text/Markdown) ───
  const addNote = useCallback(async (initialData = {}) => {
    const effectiveUid = uid || 'user_' + Date.now();
    const noteId = `note-${Date.now()}`;

    const newNote = {
      id: noteId,
      userId: effectiveUid,
      type: 'text',
      title: initialData.title || 'Untitled Note',
      content: initialData.content || '',
      tags: initialData.tags || [],
      roomId: initialData.roomId || null,
      classroomId: initialData.classroomId || null,
      lastEdited: 'Just now',
    };

    // 1. Optimistic instant UI update
    setNotes(prev => [newNote, ...prev.filter(n => n.id !== noteId)]);
    setActiveNoteId(noteId);

    // 2. Persist to Firestore in background
    try {
      await createDoc(notesRef, {
        userId: effectiveUid,
        type: 'text',
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
        roomId: newNote.roomId,
        classroomId: newNote.classroomId,
        lastEdited: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Note creation saved locally:', err);
    }

    return noteId;
  }, [uid]);

  // ─── UPDATE NOTE ───
  const updateNote = useCallback(async (id, updates) => {
    // 1. Instant local update
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        return {
          ...n,
          ...updates,
          lastEdited: 'Just now',
        };
      }
      return n;
    }));

    // 2. Async Firestore update
    try {
      await patchDoc(noteDoc(id), {
        ...updates,
        lastEdited: serverTimestamp(),
      });
    } catch (err) {
      // Quietly ignore for local/default notes
    }
  }, []);

  // ─── DELETE NOTE ───
  const deleteNote = useCallback(async (id) => {
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(remaining[0]?.id || null);
      }
      return remaining;
    });

    try {
      await removeDoc(noteDoc(id));
    } catch (err) {
      // Quietly ignore for local/default notes
    }
  }, [activeNoteId]);

  // ─── IMPORT NOTE (PDF, Text, or Markdown) ───
  const importNote = useCallback(async (file) => {
    if (!file) return null;

    const effectiveUid = uid || 'user_' + Date.now();
    const noteId = `pdf-note-${Date.now()}`;
    const fileName = file.name || 'Imported Document';
    const isPdf = fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      // Create local object URL immediately for instantaneous zero-latency viewing
      const localBlobUrl = URL.createObjectURL(file);

      const newPdfNote = {
        id: noteId,
        userId: effectiveUid,
        type: 'pdf',
        title: fileName.replace(/\.[^/.]+$/, ''),
        url: localBlobUrl,
        tags: ['imported', 'pdf'],
        lastEdited: 'Just now',
      };

      // 1. Optimistically display in sidebar & open in PDF viewer immediately
      setNotes(prev => [newPdfNote, ...prev.filter(n => n.id !== noteId)]);
      setActiveNoteId(noteId);

      // 2. Background PDF text indexing
      processPDFFromFile(noteId, file).then(() => {
        setIndexingStatus(prev => ({ ...prev, [noteId]: 'done' }));
      }).catch(err => {
        console.warn('PDF text extraction error:', err);
      });

      // 3. Storage & Firestore sync in background
      (async () => {
        let finalUrl = localBlobUrl;
        if (uid) {
          try {
            const uploadResult = await uploadNotePdf(uid, noteId, file);
            if (uploadResult?.url) {
              finalUrl = uploadResult.url;
              // Update note with persistent URL
              setNotes(prev => prev.map(n => n.id === noteId ? { ...n, url: finalUrl } : n));
            }
          } catch (storageErr) {
            console.warn('Storage upload fallback to local blob:', storageErr);
          }
        }

        try {
          await createDoc(notesRef, {
            userId: effectiveUid,
            type: 'pdf',
            title: newPdfNote.title,
            url: finalUrl,
            tags: ['imported', 'pdf'],
            lastEdited: serverTimestamp(),
          });
        } catch (dbErr) {
          console.warn('Firestore PDF note saved locally:', dbErr);
        }
      })();

      return newPdfNote;
    } else {
      // Text / Markdown File
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target.result || '';
          const title = fileName.replace(/\.[^/.]+$/, '');

          const newTextNote = {
            id: noteId,
            userId: effectiveUid,
            type: 'text',
            title,
            content,
            tags: ['imported'],
            lastEdited: 'Just now',
          };

          // Optimistically update
          setNotes(prev => [newTextNote, ...prev.filter(n => n.id !== noteId)]);
          setActiveNoteId(noteId);

          // Sync to Firestore
          try {
            await createDoc(notesRef, {
              userId: effectiveUid,
              type: 'text',
              title,
              content,
              tags: ['imported'],
              lastEdited: serverTimestamp(),
            });
          } catch (err) {
            console.warn('Imported note saved locally:', err);
          }

          resolve(newTextNote);
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  }, [uid]);

  // ─── EXPORT NOTE ───
  const exportNote = useCallback((id) => {
    const note = notes.find(n => n.id === id);
    if (!note || note.type === 'pdf') return;

    const blob = new Blob([note.content || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Untitled Note'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notes]);

  return (
    <NotesContext.Provider value={{
      notes,
      activeNoteId,
      setActiveNoteId,
      addNote,
      updateNote,
      deleteNote,
      importNote,
      exportNote,
      indexingStatus,
      loading,
    }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider');
  return ctx;
}
