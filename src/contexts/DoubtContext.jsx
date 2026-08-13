import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import {
  doubtsRef,
  doubtDoc,
  doubtAnswers,
  userVotes,
  usersRef,
  fetchDoc,
  fetchQuery,
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
  increment,
  serverTimestamp,
  timeAgo,
  getDoc,
  setDoc,
  deleteDoc,
} from '../firebase/firestore';

const DoubtContext = createContext(null);

export function DoubtProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [doubts, setDoubts] = useState([]);
  const [userVotesMap, setUserVotesMap] = useState({});
  const [savedDoubts, setSavedDoubts] = useState([]);
  const [topSolvers, setTopSolvers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── REAL-TIME: Load all doubts (bounded to 30 for zero-cost quota safety) ───
  useEffect(() => {
    if (!isLoggedIn) {
      setDoubts([]);
      setLoading(false);
      return;
    }

    const q = query(doubtsRef, orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setDoubts(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: timeAgo(d.data().createdAt),
        lastActivityAt: timeAgo(d.data().lastActivityAt || d.data().createdAt),
        // Answers will be loaded on demand
        answers: d.data().answers || [],
      })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // ─── LOAD USER VOTES ───
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = safeOnSnapshot(userVotes(uid), (snap) => {
      const votes = {};
      snap.docs.forEach(d => {
        votes[d.id] = d.data().direction;
      });
      setUserVotesMap(votes);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── LOAD SAVED DOUBTS ───
  useEffect(() => {
    if (!uid) return;
    try {
      const saved = localStorage.getItem(`ew_saved_doubts_${uid}`);
      if (saved) setSavedDoubts(JSON.parse(saved));
    } catch {}
  }, [uid]);

  useEffect(() => {
    if (uid) {
      localStorage.setItem(`ew_saved_doubts_${uid}`, JSON.stringify(savedDoubts));
    }
  }, [savedDoubts, uid]);

  // ─── TOP SOLVERS ───
  useEffect(() => {
    if (!isLoggedIn) return;

    const q = query(usersRef, orderBy('xp', 'desc'), limit(5));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setTopSolvers(snap.docs.map((d, i) => ({
        id: d.id,
        name: d.data().name || 'Anonymous',
        initials: (d.data().name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        xp: d.data().xp || 0,
        solvedCount: d.data().solvedCount || 0,
        rank: i === 0 ? 'Gold' : i === 1 ? 'Silver' : 'Bronze',
      })));
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // ─── ADD DOUBT ───
  const addDoubt = useCallback(async (doubtData) => {
    if (!uid) return null;

    const isAnon = doubtData.isAnonymous || false;
    const author = isAnon
      ? { id: uid, name: 'Anonymous', initials: '?', isAnonymous: true }
      : {
          id: uid,
          name: user.name || 'Anonymous',
          initials: (user.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          isAnonymous: false,
        };

    const id = await createDoc(doubtsRef, {
      ...doubtData,
      author,
      upvotes: 0,
      downvotes: 0,
      viewCount: 0,
      isResolved: false,
      bestAnswerId: null,
      answers: [],
      lastActivityAt: serverTimestamp(),
    });

    return id;
  }, [uid, user]);

  // ─── VOTE ON DOUBT ───
  const voteDoubt = useCallback(async (doubtId, direction) => {
    if (!uid) return;

    const voteRef = doc(userVotes(uid), doubtId);
    const currentVote = userVotesMap[doubtId];

    if (currentVote === direction) {
      // Toggle off — remove vote
      await deleteDoc(voteRef);
      await patchDoc(doubtDoc(doubtId), {
        [direction === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
      });
    } else {
      // Remove previous vote if exists
      if (currentVote) {
        await patchDoc(doubtDoc(doubtId), {
          [currentVote === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
        });
      }
      // Apply new vote
      await setDoc(voteRef, { direction, createdAt: serverTimestamp() });
      await patchDoc(doubtDoc(doubtId), {
        [direction === 'up' ? 'upvotes' : 'downvotes']: increment(1),
      });
    }
  }, [uid, userVotesMap]);

  // ─── VOTE ON ANSWER ───
  const voteAnswer = useCallback(async (doubtId, answerId, direction) => {
    if (!uid) return;

    const voteKey = `${doubtId}_${answerId}`;
    const voteRef = doc(userVotes(uid), voteKey);
    const currentVote = userVotesMap[voteKey];

    // Get current doubt to update answers array
    const doubt = doubts.find(d => d.id === doubtId);
    if (!doubt) return;

    const updatedAnswers = doubt.answers.map(a => {
      if (a.id !== answerId) return a;
      let { upvotes } = a;
      if (currentVote === 'up') upvotes--;
      if (currentVote === direction) {
        // Toggle off
        return { ...a, upvotes };
      } else {
        if (direction === 'up') upvotes++;
        return { ...a, upvotes };
      }
    });

    await patchDoc(doubtDoc(doubtId), { answers: updatedAnswers });

    if (currentVote === direction) {
      await deleteDoc(voteRef);
    } else {
      await setDoc(voteRef, { direction, createdAt: serverTimestamp() });
    }
  }, [uid, userVotesMap, doubts]);

  // ─── ADD ANSWER ───
  const addAnswer = useCallback(async (doubtId, answerData) => {
    if (!uid) return;

    const doubt = doubts.find(d => d.id === doubtId);
    if (!doubt) return;

    const isAnon = answerData.isAnonymous || false;
    const author = isAnon
      ? { id: uid, name: 'Anonymous', initials: '?', isAnonymous: true }
      : {
          id: uid,
          name: user.name || 'Anonymous',
          initials: (user.name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          isAnonymous: false,
        };

    const newAnswer = {
      id: `ans_${Date.now()}`,
      ...answerData,
      author,
      upvotes: 0,
      isBestAnswer: false,
      isVerified: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    await patchDoc(doubtDoc(doubtId), {
      answers: [...doubt.answers, newAnswer],
      lastActivityAt: serverTimestamp(),
    });
  }, [uid, user, doubts]);

  // ─── MARK BEST ANSWER ───
  const markBestAnswer = useCallback(async (doubtId, answerId) => {
    const doubt = doubts.find(d => d.id === doubtId);
    if (!doubt) return;

    const updatedAnswers = doubt.answers.map(a => ({
      ...a,
      isBestAnswer: a.id === answerId,
    }));

    await patchDoc(doubtDoc(doubtId), {
      isResolved: true,
      bestAnswerId: answerId,
      answers: updatedAnswers,
    });
  }, [doubts]);

  // ─── TOGGLE SAVE ───
  const toggleSave = useCallback((doubtId) => {
    setSavedDoubts(prev =>
      prev.includes(doubtId)
        ? prev.filter(id => id !== doubtId)
        : [...prev, doubtId]
    );
  }, []);

  // ─── INCREMENT VIEW ───
  const incrementView = useCallback(async (doubtId) => {
    await patchDoc(doubtDoc(doubtId), {
      viewCount: increment(1),
    });
  }, []);

  return (
    <DoubtContext.Provider value={{
      doubts,
      userVotes: userVotesMap,
      savedDoubts,
      topSolvers,
      loading,
      addDoubt,
      voteDoubt,
      voteAnswer,
      addAnswer,
      markBestAnswer,
      toggleSave,
      incrementView,
    }}>
      {children}
    </DoubtContext.Provider>
  );
}

export function useDoubts() {
  const ctx = useContext(DoubtContext);
  if (!ctx) throw new Error('useDoubts must be used inside DoubtProvider');
  return ctx;
}
