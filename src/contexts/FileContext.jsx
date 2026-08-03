import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import {
  filesRef,
  fileDoc,
  userFolders,
  createDoc,
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

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── REAL-TIME: Load user's files (limit 50 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) {
      setFiles([]);
      setLoading(false);
      return;
    }

    // Load files the user owns or that are shared globally
    const q = query(filesRef, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setFiles(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: timeAgo(d.data().createdAt),
        lastAccessedAt: timeAgo(d.data().lastAccessedAt || d.data().createdAt),
      })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── REAL-TIME: Load user's folders ───
  useEffect(() => {
    if (!uid) {
      setFolders([]);
      return;
    }

    const unsubscribe = safeOnSnapshot(userFolders(uid), (snap) => {
      setFolders(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── ADD FILE (with optional Storage upload) ───
  const addFile = useCallback(async (fileData, actualFile = null) => {
    if (!uid) return null;

    let storageUrl = null;
    let storagePath = null;

    // If an actual File object is provided, upload to Firebase Storage
    if (actualFile) {
      try {
        const result = await uploadUserFile(uid, actualFile);
        storageUrl = result.url;
        storagePath = result.storagePath;
      } catch (err) {
        console.warn('Storage upload failed:', err);
      }
    }

    const fileId = await createDoc(filesRef, {
      userId: uid,
      name: fileData.name,
      type: fileData.type || 'doc',
      size: fileData.size || '0 KB',
      sizeBytes: fileData.sizeBytes || 0,
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
        id: uid,
        name: user.name || 'You',
        initials: (user.name || 'Y').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      },
      lastAccessedAt: serverTimestamp(),
    });

    return fileId;
  }, [uid, user]);

  // ─── TOGGLE STAR ───
  const toggleStar = useCallback(async (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    await patchDoc(fileDoc(fileId), { isStarred: !file.isStarred });
  }, [files]);

  // ─── TOGGLE PIN ───
  const togglePin = useCallback(async (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    await patchDoc(fileDoc(fileId), { isPinned: !file.isPinned });
  }, [files]);

  // ─── MOVE TO FOLDER ───
  const moveToFolder = useCallback(async (fileId, folderId) => {
    await patchDoc(fileDoc(fileId), { folder: folderId });
  }, []);

  // ─── DELETE FILE ───
  const deleteFile = useCallback(async (fileId) => {
    const file = files.find(f => f.id === fileId);

    // Delete from Firebase Storage if applicable
    if (file?.storagePath) {
      try {
        await deleteStorageFile(file.storagePath);
      } catch (err) {
        console.warn('Failed to delete from storage:', err);
      }
    }

    // Delete Firestore document
    await removeDoc(fileDoc(fileId));
  }, [files]);

  // ─── ADD FOLDER ───
  const addFolder = useCallback(async (folderData) => {
    if (!uid) return null;

    const folderRef = doc(userFolders(uid));
    const folderId = folderRef.id;

    await patchDoc(folderRef, {
      ...folderData,
      createdAt: serverTimestamp(),
    }).catch(async () => {
      // If doc doesn't exist yet, create it
      const { setDoc } = await import('../firebase/firestore');
      await setDoc(folderRef, { ...folderData, createdAt: serverTimestamp() });
    });

    return folderId;
  }, [uid]);

  // ─── INCREMENT DOWNLOAD COUNT ───
  const incrementDownload = useCallback(async (fileId) => {
    await patchDoc(fileDoc(fileId), {
      downloadCount: increment(1),
      lastAccessedAt: serverTimestamp(),
    });
  }, []);

  // ─── DERIVED STATS ───
  const totalSize = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);
  const storageUsed = totalSize > 1073741824
    ? `${(totalSize / 1073741824).toFixed(1)} GB`
    : `${(totalSize / 1048576).toFixed(0)} MB`;

  const filesByType = files.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {});

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
      addFolder,
      incrementDownload,
      storageUsed,
      storageTotal: '5 GB',
      filesByType,
      totalFiles: files.length,
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
