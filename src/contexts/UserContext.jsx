import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import {
  userDoc,
  fetchDoc,
  createDocWithId,
  patchDoc,
} from '../firebase/firestore';
import { isSuperAdmin, fetchCoAdmins } from '../services/adminService';

const UserContext = createContext(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

const twitterProvider = new TwitterAuthProvider();

const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export function UserProvider({ children }) {
  const [session, setSession] = useState({
    isLoggedIn: false,
    user: null,
    loading: true,  // true until auth state is resolved
    error: null,
  });

  // Admin role state
  const [coAdminEmails, setCoAdminEmails] = useState([]);

  // ─── FACEBOOK SDK LOGIN STATUS SYNC ───
  useEffect(() => {
    window.statusChangeCallback = async (response) => {
      if (response && response.status === 'connected' && response.authResponse?.accessToken) {
        if (!auth.currentUser) {
          try {
            const credential = FacebookAuthProvider.credential(response.authResponse.accessToken);
            await signInWithCredential(auth, credential);
          } catch (fbSyncErr) {
            console.warn('Facebook SDK auto sign-in notice:', fbSyncErr?.code, fbSyncErr?.message);
          }
        }
      }
    };

    window.checkLoginState = function() {
      if (window.FB && typeof window.FB.getLoginStatus === 'function') {
        window.FB.getLoginStatus((response) => {
          if (typeof window.statusChangeCallback === 'function') {
            window.statusChangeCallback(response);
          }
        });
      }
    };

    // If FB is already loaded on page before component mount
    if (window.FB && typeof window.FB.getLoginStatus === 'function') {
      window.checkLoginState();
    }
  }, []);

  // ─── HANDLE REDIRECT RESULT (runs once on mount after redirect) ───
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
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
          } catch (firestoreErr) {
            console.warn('Firestore redirect sync skipped:', firestoreErr);
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect check notice:', err?.code, err?.message);
      });
  }, []);

  // ─── AUTH STATE LISTENER ───
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

        // Commit authentication state immediately
        setSession(prev => ({
          ...prev,
          isLoggedIn: true,
          user: prev.user ? { ...baseUser, ...prev.user } : baseUser,
          loading: false,
          error: null,
        }));

        // Non-blocking background Firestore sync
        try {
          const profile = await fetchDoc(userDoc(firebaseUser.uid));
          if (profile) {
            setSession(prev => ({
              ...prev,
              user: { ...baseUser, ...profile },
            }));
          }
        } catch (err) {
          console.warn('Background Firestore profile load failed (using base profile):', err);
        }
      } else {
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

  // ─── EMAIL & PASSWORD SIGN IN ───
  const login = useCallback(async (email, password) => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
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

      // Set session immediately so UI updates without waiting
      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });

      // Background Firestore profile fetch
      try {
        const profile = await fetchDoc(userDoc(firebaseUser.uid));
        if (profile) {
          setSession(prev => ({
            ...prev,
            user: { ...baseUser, ...profile },
          }));
        }
      } catch (profileErr) {
        console.warn('Firestore profile load skipped:', profileErr);
      }

      return firebaseUser;
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setSession(prev => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  // ─── EMAIL & PASSWORD SIGN UP ───
  const signup = useCallback(async (email, password, name) => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        await updateProfile(firebaseUser, { displayName: name });
      } catch (profileUpdateErr) {
        console.warn('Firebase displayName update skipped:', profileUpdateErr);
      }

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

      try {
        await createDocWithId(userDoc(firebaseUser.uid), baseUser);
      } catch (docErr) {
        console.warn('Firestore doc creation skipped or failed:', docErr);
      }

      return firebaseUser;
    } catch (err) {
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

      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });

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

      setSession({
        isLoggedIn: true,
        user: baseUser,
        loading: false,
        error: null,
      });

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

  // ─── X (TWITTER) LOGIN (popup with redirect fallback) ───
  const loginWithTwitter = useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, twitterProvider);
      const firebaseUser = result.user;

      const baseUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Scholar'),
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
      console.error('Twitter/X login error:', err.code, err.message, err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, twitterProvider);
          return;
        } catch (redirectErr) {
          console.error('Twitter/X redirect fallback error:', redirectErr);
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

  // ─── FACEBOOK LOGIN (popup with redirect fallback) ───
  const loginWithFacebook = useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const firebaseUser = result.user;

      const baseUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Scholar'),
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
      console.error('Facebook login error:', err?.code, err?.message, err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, facebookProvider);
          return;
        } catch (redirectErr) {
          console.error('Facebook redirect fallback error:', redirectErr);
        }
      }
      if (err.code === 'auth/popup-closed-by-user') {
        setSession(prev => ({ ...prev, loading: false, error: null }));
        return;
      }
      const message = getAuthErrorMessage(err.code, err.message);
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

  // ─── GUEST / DEMO SIGN IN ───
  const loginAsGuest = useCallback(() => {
    const guestUser = {
      id: 'demo_scholar_user',
      name: 'EduWrap Scholar',
      email: 'scholar@eduwrap.app',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      xp: 2450,
      level: 4,
      streak: 7,
      subjects: ['Computer Science', 'Mathematics', 'Physics'],
      studyPreferences: { dailyGoalMinutes: 60, reminderEnabled: true },
      onboardingCompleted: true,
    };
    setSession({
      isLoggedIn: true,
      user: guestUser,
      loading: false,
      error: null,
    });
  }, []);

  // ─── LOGOUT ───
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Clear any localStorage remnants from old system
      localStorage.removeItem('ew_user_session');
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setSession({
      isLoggedIn: false,
      user: null,
      loading: false,
      error: null,
    });
  }, []);

  // ─── CLEAR ERROR ───
  const clearError = useCallback(() => {
    setSession(prev => ({ ...prev, error: null }));
  }, []);

  // ─── ADMIN ROLE COMPUTATION ───
  const userEmail = session.user?.email || '';
  const isAdmin = isSuperAdmin(userEmail);
  const isCoAdmin = !isAdmin && coAdminEmails.includes(userEmail.toLowerCase().trim());

  // Fetch co-admin list when user logs in
  useEffect(() => {
    if (session.isLoggedIn && session.user?.email) {
      fetchCoAdmins().then(list => setCoAdminEmails(list)).catch(() => {});
    }
  }, [session.isLoggedIn, session.user?.email]);

  return (
    <UserContext.Provider value={{
      ...session,
      login,
      signup,
      loginWithGoogle,
      loginWithGithub,
      loginWithTwitter,
      loginWithFacebook,
      loginAsGuest,
      updateUser,
      logout,
      clearError,
      isAdmin,
      isCoAdmin,
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
function getAuthErrorMessage(code, defaultMessage = '') {
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
    'auth/operation-not-allowed': 'Facebook sign-in is not enabled in your Firebase Authentication console. Please go to Firebase Console > Authentication > Sign-in method and enable Facebook.',
    'auth/unauthorized-domain': 'This domain is not authorized in your Firebase Authentication console. Add localhost to Authorized domains in Firebase.',
    'auth/account-exists-with-different-credential': 'An account with this email already exists under a different sign-in method (e.g. Google, GitHub, or Email/Password). Please sign in using your original method.',
    'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Sign-in process was interrupted.',
    'auth/configuration-not-found': 'Authentication provider configuration not found in Firebase.',
  };
  return messages[code] || defaultMessage || 'Authentication failed. Please try again.';
}
