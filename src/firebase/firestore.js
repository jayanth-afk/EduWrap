/**
 * Firestore Helper Utilities
 * 
 * Centralized collection references, CRUD helpers, and timestamp utilities
 * used across all contexts.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
export { db };

// ─── COLLECTION REFERENCES ───

export const usersRef = collection(db, 'users');
export const roomsRef = collection(db, 'rooms');
export const notesRef = collection(db, 'notes');
export const flashcardDecksRef = collection(db, 'flashcardDecks');
export const quizzesRef = collection(db, 'quizzes');
export const doubtsRef = collection(db, 'doubts');
export const filesRef = collection(db, 'files');

// ─── SUBCOLLECTION HELPERS ───

/** Get a subcollection reference inside a room */
export const roomClassrooms = (roomId) => collection(db, 'rooms', roomId, 'classrooms');
export const roomMembers = (roomId) => collection(db, 'rooms', roomId, 'members');
export const roomMessages = (roomId) => collection(db, 'rooms', roomId, 'messages');
export const roomTasks = (roomId) => collection(db, 'rooms', roomId, 'tasks');

/** Get a subcollection reference inside a doubt */
export const doubtAnswers = (doubtId) => collection(db, 'doubts', doubtId, 'answers');

/** Get user subcollections */
export const userTasks = (uid) => collection(db, 'users', uid, 'tasks');
export const userNotifications = (uid) => collection(db, 'users', uid, 'notifications');
export const userVotes = (uid) => collection(db, 'users', uid, 'votes');
export const userFolders = (uid) => collection(db, 'users', uid, 'folders');

// ─── DOCUMENT HELPERS ───

/** Get a single document reference */
export const userDoc = (uid) => doc(db, 'users', uid);
export const roomDoc = (roomId) => doc(db, 'rooms', roomId);
export const noteDoc = (noteId) => doc(db, 'notes', noteId);
export const flashcardDeckDoc = (deckId) => doc(db, 'flashcardDecks', deckId);
export const quizDoc = (quizId) => doc(db, 'quizzes', quizId);
export const doubtDoc = (doubtId) => doc(db, 'doubts', doubtId);
export const fileDoc = (fileId) => doc(db, 'files', fileId);

// ─── TIMESTAMP HELPERS ───

/** Get a Firestore server timestamp */
export const now = () => serverTimestamp();

/** Convert a Firestore Timestamp to a relative time string */
export function timeAgo(timestamp) {
  if (!timestamp) return 'just now';
  
  const date = timestamp instanceof Timestamp 
    ? timestamp.toDate() 
    : new Date(timestamp);
  
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return date.toLocaleDateString();
}

/** Convert Firestore Timestamp to ISO string */
export function toISO(timestamp) {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) return timestamp.toDate().toISOString();
  return new Date(timestamp).toISOString();
}

import { 
  recordReads, 
  recordWrites, 
  recordDeletes 
} from '../services/quotaService';

// ─── CRUD WRAPPERS (With Quota Telemetry & Safety Guards) ───

/** Fetch a single document and return its data with id */
export async function fetchDoc(docRef) {
  const snap = await getDoc(docRef);
  // Record 1 read in quota tracker if document was fetched/checked
  recordReads(1);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Fetch all documents in a query and return as array */
export async function fetchQuery(q) {
  const snap = await getDocs(q);
  // Record reads matching number of returned documents (minimum 1 read even if empty)
  recordReads(Math.max(1, snap.docs.length));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Create a document with auto-generated ID */
export async function createDoc(collectionRef, data) {
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  recordWrites(1);
  return docRef.id;
}

/** Create a document with a specific ID */
export async function createDocWithId(docRef, data) {
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  recordWrites(1);
}

/** Update fields on an existing document */
export async function patchDoc(docRef, updates) {
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
  recordWrites(1);
}

/** Delete a document */
export async function removeDoc(docRef) {
  await deleteDoc(docRef);
  recordDeletes(1);
}

/** Batch write helper — execute multiple writes atomically */
export async function batchWrite(operations) {
  const batch = writeBatch(db);
  let writeCount = 0;
  let deleteCount = 0;

  for (const op of operations) {
    if (op.type === 'set') { batch.set(op.ref, op.data); writeCount++; }
    if (op.type === 'update') { batch.update(op.ref, op.data); writeCount++; }
    if (op.type === 'delete') { batch.delete(op.ref); deleteCount++; }
  }
  await batch.commit();
  if (writeCount > 0) recordWrites(writeCount);
  if (deleteCount > 0) recordDeletes(deleteCount);
}

/**
 * Safe onSnapshot wrapper that tracks document read changes
 */
export function safeOnSnapshot(targetQuery, onNext, onError) {
  let isFirst = true;
  return onSnapshot(
    targetQuery,
    (snapshot) => {
      if (isFirst) {
        // Record initial query document count
        recordReads(Math.max(1, snapshot.docs?.length || 1));
        isFirst = false;
      } else if (snapshot.docChanges) {
        // Record only changed documents for subsequent updates
        const changes = snapshot.docChanges();
        if (changes.length > 0) {
          recordReads(changes.length);
        }
      }
      if (onNext) onNext(snapshot);
    },
    onError
  );
}

// Re-export commonly used Firestore functions for convenience
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
  arrayUnion,
  arrayRemove,
};
