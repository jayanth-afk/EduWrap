import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err.code, err.message);
        if (err.code !== 'auth/popup-closed-by-user') {
          setSession(prev => ({ ...prev, error: getAuthErrorMessage(err.code) }));
        }
      });
  }, []);

  // ─── AUTH STATE LISTENER ───
  // Fires once on mount and whenever the user signs in/out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in — fetch their Firestore profile
        try {
          const profile = await fetchDoc(userDoc(firebaseUser.uid));
          setSession({
            isLoggedIn: true,
            user: profile || {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || null,
              xp: 0,
              level: 1,
              streak: 0,
              subjects: [],
              studyPreferences: {},
            },
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setSession({
            isLoggedIn: true,
            user: {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || null,
              xp: 0,
              level: 1,
              streak: 0,
              subjects: [],
              studyPreferences: {},
            },
            loading: false,
            error: null,
          });
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
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── EMAIL/PASSWORD SIGNUP ───
  const signup = useCallback(async (email, password, name) => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name on Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create Firestore user document
      await createDocWithId(userDoc(firebaseUser.uid), {
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
      });

      // onAuthStateChanged will handle session update
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── GOOGLE LOGIN (redirect-based) ───
  const loginWithGoogle = useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithRedirect(auth, googleProvider);
      // Page will redirect — auth state is handled by getRedirectResult on return
    } catch (err) {
      console.error('Google login error:', err.code, err.message, err);
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  // ─── GITHUB LOGIN (redirect-based) ───
  const loginWithGithub = useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithRedirect(auth, githubProvider);
      // Page will redirect — auth state is handled by getRedirectResult on return
    } catch (err) {
      console.error('GitHub login error:', err.code, err.message, err);
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
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
