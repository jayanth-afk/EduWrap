import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import {
  userDoc,
  fetchDoc,
  createDocWithId,
  patchDoc,
  serverTimestamp,
} from '../firebase/firestore';

const UserContext = createContext(null);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export function UserProvider({ children }) {
  const [session, setSession] = useState({
    isLoggedIn: false,
    user: null,
    loading: true,  // true until auth state is resolved
    error: null,
  });

  // ─── HANDLE REDIRECT RESULT (runs once on mount after redirect) ───
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const firebaseUser = result.user;
          try {
            const existing = await fetchDoc(userDoc(firebaseUser.uid));
            if (!existing) {
              await createDocWithId(userDoc(firebaseUser.uid), {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                avatar: firebaseUser.photoURL || null,
                xp: 0,
                level: 1,
                streak: 0,
                subjects: [],
                studyPreferences: {},
                onboardingCompleted: false,
              });
            }
          } catch (firestoreErr) {
            console.warn('Firestore redirect sync skipped:', firestoreErr);
          }
        }
      })
      .catch((err) => {
        // Silently ignore redirect checks when no redirect occurred or harmless popup cancellations
        console.warn('Redirect check notice:', err?.code, err?.message);
      });
  }, []);

  // ─── AUTH STATE LISTENER ───
  // Fires once on mount and whenever the user signs in/out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const baseUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Scholar',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || null,
          xp: 0,
          level: 1,
          streak: 0,
          subjects: [],
          studyPreferences: {},
        };

        // Immediately unlock session state
        setSession(prev => ({
          isLoggedIn: true,
          user: prev.user && prev.user.id === firebaseUser.uid ? { ...baseUser, ...prev.user } : baseUser,
          loading: false,
          error: null,
        }));

        // Fetch or create Firestore user profile in background
        try {
          const profile = await fetchDoc(userDoc(firebaseUser.uid));
          if (profile) {
            setSession(prev => ({
              ...prev,
              user: { ...baseUser, ...profile },
            }));
          } else {
            await createDocWithId(userDoc(firebaseUser.uid), {
              ...baseUser,
              onboardingCompleted: false,
            });
          }
        } catch (err) {
          console.warn('Firestore profile sync notice:', err);
        }
      } else {
        // No user signed in
        setSession({
          isLoggedIn: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ─── EMAIL/PASSWORD LOGIN ───
  const login = useCallback(async (email, password) => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;
      const baseUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Scholar',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || null,
        xp: 0,
        level: 1,
        streak: 0,
        subjects: [],
        studyPreferences: {},
      };
      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });
      return firebaseUser;
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── EMAIL/PASSWORD SIGNUP (with auto-login if account exists) ───
  const signup = useCallback(async (email, password, name) => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name on Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      const baseUser = {
        id: firebaseUser.uid,
        name,
        email: firebaseUser.email,
        avatar: null,
        xp: 0,
        level: 1,
        streak: 0,
        subjects: [],
        studyPreferences: {},
        onboardingCompleted: false,
      };

      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });

      // Create Firestore user document safely
      try {
        await createDocWithId(userDoc(firebaseUser.uid), baseUser);
      } catch (docErr) {
        console.warn('Firestore doc creation skipped or failed:', docErr);
      }

      return firebaseUser;
    } catch (err) {
      // If account already exists with this email, automatically log them in!
      if (err.code === 'auth/email-already-in-use') {
        try {
          const { user: existingUser } = await signInWithEmailAndPassword(auth, email, password);
          const baseUser = {
            id: existingUser.uid,
            name: existingUser.displayName || existingUser.email?.split('@')[0] || name || 'Scholar',
            email: existingUser.email || '',
            avatar: existingUser.photoURL || null,
            xp: 0,
            level: 1,
            streak: 0,
            subjects: [],
            studyPreferences: {},
          };
          setSession({
            isLoggedIn: true,
            user: baseUser,
            loading: false,
            error: null,
          });
          return existingUser;
        } catch (loginErr) {
          const message = (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential')
            ? 'An account with this email already exists. Please enter your existing password or sign in with Google/GitHub.'
            : getAuthErrorMessage(loginErr.code);
          setSession(prev => ({ ...prev, loading: false, error: message }));
          throw new Error(message);
        }
      }

      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── GOOGLE LOGIN (popup with redirect fallback) ───
  const loginWithGoogle = useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const baseUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || null,
        xp: 0,
        level: 1,
        streak: 0,
        subjects: [],
        studyPreferences: {},
      };

      // Immediately unlock session state
      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });

      // Background Firestore profile sync
      try {
        const existing = await fetchDoc(userDoc(firebaseUser.uid));
        if (!existing) {
          await createDocWithId(userDoc(firebaseUser.uid), {
            ...baseUser,
            onboardingCompleted: false,
          });
        } else {
          setSession(prev => ({
            ...prev,
            user: { ...baseUser, ...existing },
          }));
        }
      } catch (docErr) {
        console.warn('Firestore profile sync skipped or failed:', docErr);
      }

      return firebaseUser;
    } catch (err) {
      console.error('Google login error:', err.code, err.message, err);
      // If popup blocked, fall back to redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('Google redirect fallback error:', redirectErr);
        }
      }
      if (err.code === 'auth/popup-closed-by-user') {
        setSession(prev => ({ ...prev, loading: false, error: null }));
        return;
      }
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── GITHUB LOGIN (popup with redirect fallback) ───
  const loginWithGithub = useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const firebaseUser = result.user;

      const baseUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || null,
        xp: 0,
        level: 1,
        streak: 0,
        subjects: [],
        studyPreferences: {},
      };

      // Immediately unlock session state
      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });

      // Background Firestore profile sync
      try {
        const existing = await fetchDoc(userDoc(firebaseUser.uid));
        if (!existing) {
          await createDocWithId(userDoc(firebaseUser.uid), {
            ...baseUser,
            onboardingCompleted: false,
          });
        } else {
          setSession(prev => ({
            ...prev,
            user: { ...baseUser, ...existing },
          }));
        }
      } catch (docErr) {
        console.warn('Firestore profile sync skipped or failed:', docErr);
      }

      return firebaseUser;
    } catch (err) {
      console.error('GitHub login error:', err.code, err.message, err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, githubProvider);
          return;
        } catch (redirectErr) {
          console.error('GitHub redirect fallback error:', redirectErr);
        }
      }
      if (err.code === 'auth/popup-closed-by-user') {
        setSession(prev => ({ ...prev, loading: false, error: null }));
        return;
      }
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── UPDATE USER PROFILE ───
  const updateUser = useCallback(async (updates) => {
    if (!session.user?.id) return;
    try {
      await patchDoc(userDoc(session.user.id), updates);
      setSession(prev => ({
        ...prev,
        user: { ...prev.user, ...updates },
      }));
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  }, [session.user?.id]);

  // ─── LOGOUT ───
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Clear any localStorage remnants from old system
      localStorage.removeItem('ew_user_session');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  // ─── CLEAR ERROR ───
  const clearError = useCallback(() => {
    setSession(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <UserContext.Provider value={{
      ...session,
      login,
      signup,
      loginWithGoogle,
      loginWithGithub,
      updateUser,
      logout,
      clearError,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}

// ─── ERROR MESSAGE MAPPING ───
function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
  };
  return messages[code] || 'Something went wrong. Please try again.';
}
