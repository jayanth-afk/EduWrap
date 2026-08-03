/**
 * Firebase Configuration & Initialization
 * 
 * Project: EduWrap (eduwrap7)
 * Console: https://console.firebase.google.com/project/eduwrap7
 * 
 * Services enabled:
 *   - Authentication (Email/Password + Google)
 *   - Firestore Database
 *   - Storage
 *   - Analytics
 */

import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyD7c3mI3Z0lNbiOr_CyYh1kJ8b30jijlIk",
  authDomain: "eduwrap7.firebaseapp.com",
  projectId: "eduwrap7",
  storageBucket: "eduwrap7.firebasestorage.app",
  messagingSenderId: "448214726693",
  appId: "1:448214726693:web:4f9e25c80acb56c1a8a7cc",
  measurementId: "G-06Y0DEXHBK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with IndexedDB Multi-Tab Persistent Cache for zero-cost repeated reads
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Explicitly ensure persistence is set to browser local storage across tabs and popups
setPersistence(auth, browserLocalPersistence).catch((e) => {
  console.warn('Firebase persistence setup:', e);
});

export default app;
