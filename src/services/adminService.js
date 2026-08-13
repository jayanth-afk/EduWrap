/**
 * Admin Service — Role Engine & Moderation Helpers
 *
 * Super admin emails are hardcoded. Co-admins are stored in Firestore
 * at appConfig/admins document. Provides bulk fetch/delete for moderation.
 */

import {
  db,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from '../firebase/firestore';
import { recordReads, recordWrites, recordDeletes } from './quotaService';

// ─── HARDCODED SUPER ADMIN EMAILS ───
const SUPER_ADMIN_EMAILS = [
  'jayanth.k25205@nst.rishihood.edu.in',
  'jaykonada007@gmail.com',
];

/**
 * Check if the given email is a super admin (hardcoded, cannot be revoked).
 */
export function isSuperAdmin(email) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Check if the given email is either a super admin or a co-admin.
 * @param {string} email
 * @param {string[]} coAdminList - Pre-fetched co-admin list
 */
export function isAdminOrCoAdmin(email, coAdminList = []) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalized) || coAdminList.includes(normalized);
}

// ─── FIRESTORE CONFIG DOC REFERENCE ───
const adminConfigRef = () => doc(db, 'appConfig', 'admins');
const appSettingsRef = () => doc(db, 'appConfig', 'settings');

// ─── CO-ADMIN MANAGEMENT ───

/**
 * Fetch the current list of co-admin emails from Firestore.
 */
export async function fetchCoAdmins() {
  try {
    const snap = await getDoc(adminConfigRef());
    recordReads(1);
    if (snap.exists()) {
      return snap.data().coAdmins || [];
    }
    return [];
  } catch (err) {
    console.warn('[Admin] Failed to fetch co-admins:', err);
    return [];
  }
}

/**
 * Add a co-admin email. Only super admins should call this.
 */
export async function addCoAdmin(email) {
  if (!email) return;
  const normalized = email.toLowerCase().trim();
  const current = await fetchCoAdmins();
  if (current.includes(normalized)) return; // Already a co-admin

  const updated = [...current, normalized];
  await setDoc(adminConfigRef(), { coAdmins: updated, updatedAt: serverTimestamp() }, { merge: true });
  recordWrites(1);
  return updated;
}

/**
 * Remove a co-admin email. Only super admins should call this.
 */
export async function removeCoAdmin(email) {
  if (!email) return;
  const normalized = email.toLowerCase().trim();
  const current = await fetchCoAdmins();
  const updated = current.filter(e => e !== normalized);

  await setDoc(adminConfigRef(), { coAdmins: updated, updatedAt: serverTimestamp() }, { merge: true });
  recordWrites(1);
  return updated;
}

// ─── APP SETTINGS ───

/**
 * Fetch global app settings (maintenance mode, announcements, etc.)
 */
export async function fetchAppSettings() {
  try {
    const snap = await getDoc(appSettingsRef());
    recordReads(1);
    if (snap.exists()) return snap.data();
    return { maintenanceMode: false, globalAnnouncement: '', maxQuizQuestions: 20 };
  } catch (err) {
    console.warn('[Admin] Failed to fetch app settings:', err);
    return { maintenanceMode: false, globalAnnouncement: '', maxQuizQuestions: 20 };
  }
}

/**
 * Update global app settings.
 */
export async function updateAppSettings(settings) {
  await setDoc(appSettingsRef(), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
  recordWrites(1);
}

// ─── MODERATION: FETCH ALL ───

/**
 * Fetch all doubts across all users (limited to 100 for safety).
 */
export async function fetchAllDoubts() {
  try {
    const q = query(collection(db, 'doubts'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    recordReads(Math.max(1, snap.docs.length));
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));
  } catch (err) {
    console.warn('[Admin] Failed to fetch all doubts:', err);
    return [];
  }
}

/**
 * Admin-delete a doubt by ID. Also removes all its answers (subcollection not needed since answers are embedded).
 */
export async function deleteDoubtAdmin(doubtId) {
  try {
    await deleteDoc(doc(db, 'doubts', doubtId));
    recordDeletes(1);
    return true;
  } catch (err) {
    console.error('[Admin] Failed to delete doubt:', err);
    return false;
  }
}

/**
 * Fetch all notes/PDFs across all users (limited to 100 for safety).
 */
export async function fetchAllNotes() {
  try {
    const q = query(collection(db, 'notes'), orderBy('lastEdited', 'desc'), limit(100));
    const snap = await getDocs(q);
    recordReads(Math.max(1, snap.docs.length));
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      lastEdited: d.data().lastEdited?.toDate?.()?.toISOString() || d.data().lastEdited || '',
    }));
  } catch (err) {
    console.warn('[Admin] Failed to fetch all notes:', err);
    return [];
  }
}

/**
 * Admin-delete a note/PDF by ID.
 */
export async function deleteNoteAdmin(noteId) {
  try {
    await deleteDoc(doc(db, 'notes', noteId));
    recordDeletes(1);
    return true;
  } catch (err) {
    console.error('[Admin] Failed to delete note:', err);
    return false;
  }
}

/**
 * Fetch all files across all users (limited to 100 for safety).
 */
export async function fetchAllFiles() {
  try {
    const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    recordReads(Math.max(1, snap.docs.length));
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || '',
    }));
  } catch (err) {
    console.warn('[Admin] Failed to fetch all files:', err);
    return [];
  }
}

/**
 * Admin-delete a file by ID.
 */
export async function deleteFileAdmin(fileId) {
  try {
    await deleteDoc(doc(db, 'files', fileId));
    recordDeletes(1);
    return true;
  } catch (err) {
    console.error('[Admin] Failed to delete file:', err);
    return false;
  }
}
