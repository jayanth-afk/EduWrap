/**
 * Firebase Storage Service
 * 
 * Handles file uploads (PDFs, images, avatars), downloads, 
 * and deletions with progress tracking.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './firebaseConfig';

// ─── STORAGE PATH HELPERS ───

/** Get a storage reference for a user's file */
export const userFilePath = (uid, fileName) => ref(storage, `users/${uid}/files/${fileName}`);

/** Get a storage reference for a user's avatar */
export const avatarPath = (uid) => ref(storage, `users/${uid}/avatar`);

/** Get a storage reference for a room's file */
export const roomFilePath = (roomId, fileName) => ref(storage, `rooms/${roomId}/files/${fileName}`);

/** Get a storage reference for a note's attached PDF */
export const notePdfPath = (uid, noteId, fileName) => ref(storage, `users/${uid}/notes/${noteId}/${fileName}`);

import { validateFileSize, recordStorageUpload } from '../services/quotaService';

// ─── UPLOAD ───

/**
 * Upload a file to Firebase Storage with progress tracking.
 * 
 * @param {StorageReference} storageRef - The storage path reference
 * @param {File|Blob|ArrayBuffer} file - The file to upload
 * @param {Object} [metadata] - Optional metadata (contentType, etc.)
 * @param {Function} [onProgress] - Callback with progress percentage (0-100)
 * @returns {Promise<string>} The download URL of the uploaded file
 */
export function uploadFile(storageRef, file, metadata = {}, onProgress = null) {
  return new Promise((resolve, reject) => {
    // 🛡️ Free-Tier Safety Guard: Verify file size does not exceed safety cap
    const validation = validateFileSize(file);
    if (!validation.valid) {
      console.error('Storage Guard Rejection:', validation.error);
      return reject(new Error(validation.error));
    }

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Record successful upload operation and size in quota tracker
          recordStorageUpload(file.size || 0);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Upload a user file and return the download URL.
 * Convenience wrapper around uploadFile.
 */
export async function uploadUserFile(uid, file, onProgress = null) {
  const uniqueName = `${Date.now()}_${file.name}`;
  const storageRef = userFilePath(uid, uniqueName);
  const metadata = { contentType: file.type };
  const url = await uploadFile(storageRef, file, metadata, onProgress);
  return { url, storagePath: storageRef.fullPath, fileName: uniqueName };
}

/**
 * Upload a user avatar image.
 */
export async function uploadAvatar(uid, file, onProgress = null) {
  const storageRef = avatarPath(uid);
  const metadata = { contentType: file.type };
  return await uploadFile(storageRef, file, metadata, onProgress);
}

/**
 * Upload a PDF for a note.
 */
export async function uploadNotePdf(uid, noteId, file, onProgress = null) {
  const storageRef = notePdfPath(uid, noteId, file.name);
  const metadata = { contentType: 'application/pdf' };
  const url = await uploadFile(storageRef, file, metadata, onProgress);
  return { url, storagePath: storageRef.fullPath };
}

// ─── DOWNLOAD ───

/**
 * Get the download URL for a storage path.
 */
export async function getFileUrl(path) {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
}

// ─── DELETE ───

/**
 * Delete a file from Firebase Storage by its path.
 */
export async function deleteFile(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore 'object-not-found' errors (file already deleted)
    if (error.code !== 'storage/object-not-found') {
      console.error('Delete error:', error);
      throw error;
    }
  }
}

/**
 * Delete all files in a directory (e.g., when deleting a room or user).
 */
export async function deleteDirectory(path) {
  try {
    const dirRef = ref(storage, path);
    const result = await listAll(dirRef);
    
    const deletePromises = result.items.map(item => deleteObject(item));
    // Recursively delete subdirectories
    const subdirPromises = result.prefixes.map(prefix => deleteDirectory(prefix.fullPath));
    
    await Promise.all([...deletePromises, ...subdirPromises]);
  } catch (error) {
    if (error.code !== 'storage/object-not-found') {
      console.error('Delete directory error:', error);
    }
  }
}

// ─── UTILS ───

/**
 * Format bytes to human-readable size string.
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
