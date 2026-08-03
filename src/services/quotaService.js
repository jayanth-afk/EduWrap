/**
 * Firebase Free Tier Quota & Usage Guardian
 * 
 * Provides client-side tracking, query telemetry, upload guards,
 * and cost-protection caps to ensure EduWrap stays 100% within
 * Firebase's Pay-As-You-Go (Blaze) Spark free-tier allowances.
 */

// ─── OFFICIAL RAW FIREBASE LIMITS (REFERENCE) ───
export const OFFICIAL_FIREBASE_LIMITS = {
  firestoreReadsDaily: 50000,
  firestoreWritesDaily: 20000,
  firestoreDeletesDaily: 20000,
  firestoreStorageGiB: 1.0,
  firestoreEgressMonthlyGiB: 10.0,
  storageTotalBytes: 5 * 1024 * 1024 * 1024, // 5 GB
  storageDownloadEgressDaily: 1 * 1024 * 1024 * 1024, // 1 GB / day
  storageUploadOpsDaily: 20000,
  storageDownloadOpsDaily: 50000,
  maxSingleFileSize: 20 * 1024 * 1024, // 20 MB
  authMonthlyActiveUsers: 50000,
  hostingStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  hostingTransferDailyBytes: 360 * 1024 * 1024, // 360 MB / day
};

// ─── SAFE 2% REDUCED LIMITS (98% THRESHOLD SAFEGUARD) ───
// All limits are deliberately set 2% lower than Google Cloud's actual allowances
// to guarantee zero accidental overflow or micro-billing on the Blaze plan.
export const FIREBASE_FREE_LIMITS = {
  // Cloud Firestore (Daily Quotas with 2% safety buffer: 50k -> 49k, 20k -> 19.6k)
  firestoreReadsDaily: 49000, // 50,000 * 0.98 (-2%)
  firestoreWritesDaily: 19600, // 20,000 * 0.98 (-2%)
  firestoreDeletesDaily: 19600, // 20,000 * 0.98 (-2%)
  firestoreStorageGiB: 0.98, // 1.0 GiB * 0.98 (-2%)
  firestoreEgressMonthlyGiB: 9.8, // 10.0 GiB * 0.98 (-2%)

  // Cloud Storage (5 GB -> 4.90 GB, 1 GB/day -> 0.98 GB/day)
  storageTotalBytes: Math.floor(4.90 * 1024 * 1024 * 1024), // 4.90 GB Total (-2%)
  storageDownloadEgressDaily: Math.floor(0.98 * 1024 * 1024 * 1024), // 980 MB / day (-2%)
  storageUploadOpsDaily: 19600, // 20,000 * 0.98 (-2%)
  storageDownloadOpsDaily: 49000, // 50,000 * 0.98 (-2%)
  maxSingleFileSize: Math.floor(19.6 * 1024 * 1024), // 19.6 MB max file safety limit (-2%)

  // Firebase Auth
  authMonthlyActiveUsers: 49000, // 50,000 * 0.98 (-2%)

  // Firebase Hosting
  hostingStorageBytes: Math.floor(9.8 * 1024 * 1024 * 1024), // 9.8 GB (-2%)
  hostingTransferDailyBytes: Math.floor(352.8 * 1024 * 1024), // 352.8 MB / day (-2%)
};

const STORAGE_KEY_PREFIX = 'ew_quota_usage_';
const SETTINGS_KEY = 'ew_quota_settings';

/** Get current UTC date key YYYY-MM-DD */
function getTodayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

/** Get raw stored usage object for today */
export function getDailyUsage() {
  const dateKey = getTodayKey();
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${dateKey}`);
  if (!raw) {
    return {
      date: dateKey,
      reads: 0,
      writes: 0,
      deletes: 0,
      storageUploadOps: 0,
      storageUploadBytes: 0,
      storageEgressBytes: 0,
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      date: dateKey,
      reads: 0,
      writes: 0,
      deletes: 0,
      storageUploadOps: 0,
      storageUploadBytes: 0,
      storageEgressBytes: 0,
    };
  }
}

/** Save updated usage and dispatch custom event for live UI reactivity */
function saveDailyUsage(usage) {
  const dateKey = getTodayKey();
  usage.date = dateKey;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${dateKey}`, JSON.stringify(usage));
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ew:quota-updated', { detail: usage }));
  }
}

/** Record Firestore Document Reads */
export function recordReads(count = 1) {
  if (count <= 0) return;
  const usage = getDailyUsage();
  usage.reads = (usage.reads || 0) + count;
  saveDailyUsage(usage);
}

/** Record Firestore Document Writes (Create/Update/Set) */
export function recordWrites(count = 1) {
  if (count <= 0) return;
  const usage = getDailyUsage();
  usage.writes = (usage.writes || 0) + count;
  saveDailyUsage(usage);
}

/** Record Firestore Document Deletes */
export function recordDeletes(count = 1) {
  if (count <= 0) return;
  const usage = getDailyUsage();
  usage.deletes = (usage.deletes || 0) + count;
  saveDailyUsage(usage);
}

/** Record Cloud Storage Upload Operations & Bytes */
export function recordStorageUpload(bytes = 0) {
  const usage = getDailyUsage();
  usage.storageUploadOps = (usage.storageUploadOps || 0) + 1;
  usage.storageUploadBytes = (usage.storageUploadBytes || 0) + bytes;
  saveDailyUsage(usage);
}

/** Check if a file size exceeds the safety maximum */
export function validateFileSize(file) {
  if (!file) return { valid: false, error: 'No file provided' };
  if (file.size > FIREBASE_FREE_LIMITS.maxSingleFileSize) {
    const maxMb = Math.round(FIREBASE_FREE_LIMITS.maxSingleFileSize / (1024 * 1024));
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileMb} MB) exceeds the free-tier safety limit of ${maxMb} MB. Please upload a smaller file.`,
    };
  }
  return { valid: true };
}

/** Get Settings (such as Safety-Lock enabled) */
export function getQuotaSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { safetyLock: true, showWarnings: true };
  } catch {
    return { safetyLock: true, showWarnings: true };
  }
}

/** Update Quota Settings */
export function updateQuotaSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ew:quota-settings-updated', { detail: settings }));
  }
}

/** Reset Usage Counter for testing */
export function resetUsageToday() {
  const dateKey = getTodayKey();
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${dateKey}`);
  saveDailyUsage({
    date: dateKey,
    reads: 0,
    writes: 0,
    deletes: 0,
    storageUploadOps: 0,
    storageUploadBytes: 0,
    storageEgressBytes: 0,
  });
}

/** Calculate time remaining until Midnight UTC daily reset */
export function getTimeUntilDailyReset() {
  const now = new Date();
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = nextReset - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
