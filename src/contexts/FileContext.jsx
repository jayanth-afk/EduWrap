import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import {
  filesRef,
  fileDoc,
  userFolders,
  createDoc,
  createDocWithId,
  patchDoc,
  removeDoc,
  safeOnSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  serverTimestamp,
  increment,
  timeAgo,
} from '../firebase/firestore';
import { uploadUserFile, deleteFile as deleteStorageFile } from '../firebase/storageService';

const DEFAULT_FILES = [
  {
    id: 'file-dsa-pdf',
    name: 'Advanced Data Structures & Algorithms Guide.pdf',
    type: 'pdf',
    size: '7.8 MB',
    sizeBytes: 8178892,
    category: 'Engineering',
    folder: 'f-cs',
    storageUrl: '/pdfs/0edabb6c92634ccb85df21c7bc9598f7.pdf',
    isStarred: true,
    isPinned: true,
    downloadCount: 142,
    source: { type: 'upload', action: 'Public Resources' },
    related: { doubts: [], flashcards: [], rooms: ['room-eng'] },
    owner: { id: 'sys', name: 'EduWrap Curators', initials: 'EC' },
    createdAt: '1 day ago',
    lastAccessedAt: '10 mins ago',
  },
  {
    id: 'file-sys-pdf',
    name: 'Computer Systems Architecture & OS Principles.pdf',
    type: 'pdf',
    size: '3.7 MB',
    sizeBytes: 3879731,
    category: 'Engineering',
    folder: 'f-cs',
    storageUrl: '/pdfs/1a82d02e9818480b80f497dc977edf0e.pdf',
    isStarred: false,
    isPinned: true,
    downloadCount: 88,
    source: { type: 'upload', action: 'Public Resources' },
    related: { doubts: [], flashcards: [], rooms: ['room-eng'] },
    owner: { id: 'sys', name: 'EduWrap Curators', initials: 'EC' },
    createdAt: '2 days ago',
    lastAccessedAt: '1 hour ago',
  },
  {
    id: 'file-dbms-pdf',
    name: 'Database Management Systems & SQL Fundamentals.pdf',
    type: 'pdf',
    size: '3.5 MB',
    sizeBytes: 3670016,
    category: 'Engineering',
    folder: 'f-cs',
    storageUrl: '/pdfs/3d6b43f1871b4f159b93d33462cb93f4.pdf',
    isStarred: true,
    isPinned: false,
    downloadCount: 95,
    source: { type: 'upload', action: 'Public Resources' },
    related: { doubts: [], flashcards: [], rooms: ['room-eng'] },
    owner: { id: 'sys', name: 'EduWrap Curators', initials: 'EC' },
    createdAt: '3 days ago',
    lastAccessedAt: '3 hours ago',
  },
  {
    id: 'file-ml-pdf',
    name: 'Machine Learning & Neural Networks Handbook.pdf',
    type: 'pdf',
    size: '12.2 MB',
    sizeBytes: 12792627,
    category: 'Engineering',
    folder: 'f-ai',
    storageUrl: '/pdfs/81257b03aa5f4197835d18e4a529bc94.pdf',
    isStarred: true,
    isPinned: true,
    downloadCount: 230,
    source: { type: 'upload', action: 'Public Resources' },
    related: { doubts: [], flashcards: [], rooms: ['room-ai'] },
    owner: { id: 'sys', name: 'EduWrap Curators', initials: 'EC' },
    createdAt: '4 days ago',
    lastAccessedAt: 'Yesterday',
  },
  {
    id: 'file-math-pdf',
    name: 'Discrete Mathematics & Graph Theory.pdf',
    type: 'pdf',
    size: '3.6 MB',
    sizeBytes: 3774873,
    category: 'Mathematics',
    folder: 'f-cs',
    storageUrl: '/pdfs/cdbb23eea3764074be2ca12901a1a053.pdf',
    isStarred: false,
    isPinned: false,
    downloadCount: 64,
    source: { type: 'upload', action: 'Public Resources' },
    related: { doubts: [], flashcards: [], rooms: ['room-eng'] },
    owner: { id: 'sys', name: 'EduWrap Curators', initials: 'EC' },
    createdAt: '5 days ago',
    lastAccessedAt: '2 days ago',
  },
  {
    id: 'file-web-pdf',
    name: 'Web Architecture & Cloud Distributed Systems.pdf',
    type: 'pdf',
    size: '5.9 MB',
    sizeBytes: 6186598,
    category: 'Engineering',
    folder: 'f-notes',
    storageUrl: '/pdfs/ea7dc9ff429d45b381b5e22577a51fa4.pdf',
    isStarred: false,
    isPinned: false,
    downloadCount: 112,
    source: { type: 'upload', action: 'Public Resources' },
    related: { doubts: [], flashcards: [], rooms: ['room-eng'] },
    owner: { id: 'sys', name: 'EduWrap Curators', initials: 'EC' },
    createdAt: '6 days ago',
    lastAccessedAt: '3 days ago',
  }
];

const DEFAULT_FOLDERS = [
  { id: 'f-cs', name: 'Computer Science Core', color: '#6366f1', fileCount: 4 },
  { id: 'f-ai', name: 'Machine Learning & AI', color: '#ec4899', fileCount: 1 },
  { id: 'f-notes', name: 'Lecture Notes & Slides', color: '#10b981', fileCount: 1 }
];

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [files, setFiles] = useState(DEFAULT_FILES);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── REAL-TIME: Load user's files (limit 50 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) return;

    const q = query(filesRef, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        const firestoreFiles = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: timeAgo(d.data().createdAt),
          lastAccessedAt: timeAgo(d.data().lastAccessedAt || d.data().createdAt),
        }));

        setFiles(prev => {
          const fsIds = new Set(firestoreFiles.map(f => f.id));
          const unmergedDefaults = DEFAULT_FILES.filter(f => !fsIds.has(f.id));
          return [...firestoreFiles, ...unmergedDefaults];
        });
      }
    }, (err) => {
      console.warn('Files Firestore listener warning:', err);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── REAL-TIME: Load user's folders ───
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = safeOnSnapshot(userFolders(uid), (snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        const firestoreFolders = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        setFolders(prev => {
          const fsIds = new Set(firestoreFolders.map(f => f.id));
          const unmergedDefaults = DEFAULT_FOLDERS.filter(f => !fsIds.has(f.id));
          return [...firestoreFolders, ...unmergedDefaults];
        });
      }
    }, (err) => {
      console.warn('Folders Firestore listener warning:', err);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── ADD FILE (with optional Storage upload) ───
  const addFile = useCallback(async (fileData, actualFile = null) => {
    const effectiveUid = uid || 'user_' + Date.now();
    const fileId = `file-${Date.now()}`;

    let storageUrl = fileData.storageUrl || null;
    let storagePath = null;

    // If an actual File object is provided, create a blob URL immediately
    if (actualFile) {
      storageUrl = URL.createObjectURL(actualFile);
    }

    const newFile = {
      id: fileId,
      userId: effectiveUid,
      name: fileData.name || actualFile?.name || 'Document',
      type: fileData.type || (actualFile?.name?.endsWith('.pdf') ? 'pdf' : 'doc'),
      size: fileData.size || (actualFile ? `${(actualFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.0 MB'),
      sizeBytes: fileData.sizeBytes || actualFile?.size || 0,
      category: fileData.category || 'General',
      folder: fileData.folder || null,
      storageUrl,
      storagePath,
      isStarred: false,
      isPinned: false,
      downloadCount: 0,
      source: fileData.source || { type: 'upload', action: 'Manually uploaded' },
      related: fileData.related || { doubts: [], flashcards: [], rooms: [] },
      owner: {
        id: effectiveUid,
        name: user?.name || 'You',
        initials: (user?.name || 'Y').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      },
      createdAt: 'Just now',
      lastAccessedAt: 'Just now',
    };

    // 1. Optimistically display in file list
    setFiles(prev => [newFile, ...prev.filter(f => f.id !== fileId)]);

    // 2. Storage upload in background if user is authenticated
    (async () => {
      if (actualFile && uid) {
        try {
          const result = await uploadUserFile(uid, actualFile);
          if (result?.url) {
            storageUrl = result.url;
            storagePath = result.storagePath;
            setFiles(prev => prev.map(f => f.id === fileId ? { ...f, storageUrl, storagePath } : f));
          }
        } catch (err) {
          console.warn('Storage upload fallback to local blob:', err);
        }
      }

      // 3. Firestore doc creation
      try {
        await createDocWithId(fileDoc(fileId), {
          userId: effectiveUid,
          name: newFile.name,
          type: newFile.type,
          size: newFile.size,
          sizeBytes: newFile.sizeBytes,
          category: newFile.category,
          folder: newFile.folder,
          storageUrl,
          storagePath,
          isStarred: false,
          isPinned: false,
          downloadCount: 0,
          source: newFile.source,
          related: newFile.related,
          owner: newFile.owner,
          createdAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.warn('File record saved locally:', dbErr);
      }
    })();

    return fileId;
  }, [uid, user]);

  // ─── TOGGLE STAR ───
  const toggleStar = useCallback(async (fileId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isStarred: !f.isStarred } : f));
    try {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await patchDoc(fileDoc(fileId), { isStarred: !file.isStarred });
      }
    } catch {}
  }, [files]);

  // ─── TOGGLE PIN ───
  const togglePin = useCallback(async (fileId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isPinned: !f.isPinned } : f));
    try {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await patchDoc(fileDoc(fileId), { isPinned: !file.isPinned });
      }
    } catch {}
  }, [files]);

  // ─── MOVE TO FOLDER ───
  const moveToFolder = useCallback(async (fileId, folderId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, folder: folderId } : f));
    try {
      await patchDoc(fileDoc(fileId), { folder: folderId });
    } catch {}
  }, []);

  // ─── DELETE FILE ───
  const deleteFile = useCallback(async (fileId) => {
    const file = files.find(f => f.id === fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));

    try {
      if (file?.storagePath) {
        await deleteStorageFile(file.storagePath).catch(() => {});
      }
      await removeDoc(fileDoc(fileId)).catch(() => {});
    } catch {}
  }, [files]);

  // ─── RECORD DOWNLOAD ───
  const recordDownload = useCallback(async (fileId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, downloadCount: (f.downloadCount || 0) + 1 } : f));
    try {
      await patchDoc(fileDoc(fileId), {
        downloadCount: increment(1),
        lastAccessedAt: serverTimestamp(),
      });
    } catch {}
  }, []);

  // ─── CREATE FOLDER ───
  const createFolder = useCallback(async (folderData) => {
    const effectiveUid = uid || 'user_' + Date.now();
    const folderId = `f-${Date.now()}`;
    const newFolder = {
      id: folderId,
      name: folderData.name,
      color: folderData.color || '#6366f1',
      fileCount: 0,
    };

    setFolders(prev => [...prev, newFolder]);

    try {
      await createDocWithId(doc(userFolders(effectiveUid), folderId), {
        name: folderData.name,
        color: folderData.color || '#6366f1',
        createdAt: serverTimestamp(),
      });
    } catch {}

    return folderId;
  }, [uid]);

  // ─── DELETE FOLDER ───
  const deleteFolder = useCallback(async (folderId) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setFiles(prev => prev.map(f => f.folder === folderId ? { ...f, folder: null } : f));

    try {
      if (uid) {
        await removeDoc(doc(userFolders(uid), folderId));
      }
    } catch {}
  }, [uid]);

  return (
    <FileContext.Provider value={{
      files,
      folders,
      activity,
      loading,
      addFile,
      toggleStar,
      togglePin,
      moveToFolder,
      deleteFile,
      recordDownload,
      createFolder,
      deleteFolder,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFiles must be used inside FileProvider');
  return ctx;
}
