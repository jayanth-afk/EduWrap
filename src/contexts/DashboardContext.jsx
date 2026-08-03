import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import {
  userDoc,
  userTasks,
  userNotifications,
  roomsRef,
  usersRef,
  fetchDoc,
  fetchQuery,
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
  timeAgo,
} from '../firebase/firestore';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dailyGoal, setDailyGoal] = useState({ target: 4, current: 0, streak: 0, xpToday: 0 });

  // ─── REAL-TIME: USER TASKS (limit 50 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) return;

    const q = query(userTasks(uid), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: timeAgo(d.data().createdAt),
      }));
      setTasks(items);
    }, (err) => {
      console.error('Tasks listener error:', err);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── REAL-TIME: NOTIFICATIONS ───
  useEffect(() => {
    if (!uid) return;

    const q = query(userNotifications(uid), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        time: timeAgo(d.data().createdAt),
      })));
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── LEADERBOARD: Top users by XP ───
  useEffect(() => {
    if (!isLoggedIn) return;

    const q = query(usersRef, orderBy('xp', 'desc'), limit(10));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setLeaderboard(snap.docs.map((d, i) => ({
        id: d.id,
        name: d.data().name || 'Anonymous',
        xp: d.data().xp || 0,
        rank: i + 1,
        avatar: d.data().avatar,
      })));
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // ─── USER'S ACTIVE ROOMS ───
  useEffect(() => {
    if (!uid) return;

    const q = query(roomsRef, where('memberIds', 'array-contains', uid), limit(5));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setActiveRooms(snap.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        participants: d.data().memberCount || 0,
        category: d.data().category,
      })));
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── DAILY GOAL derived from user data ───
  useEffect(() => {
    if (!user) return;
    setDailyGoal({
      target: 4,
      current: Math.min(user.xp ? (user.xp % 500) / 125 : 0, 4),
      streak: user.streak || 0,
      xpToday: user.xp ? user.xp % 500 : 0,
    });
  }, [user]);

  // ─── TASK CRUD ───
  const toggleTask = useCallback(async (taskId) => {
    if (!uid) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await patchDoc(doc(userTasks(uid), taskId), { completed: !task.completed });
  }, [uid, tasks]);

  const addTask = useCallback(async (title, priority = 'medium') => {
    if (!uid || !title.trim()) return;
    await createDoc(userTasks(uid), { title, completed: false, priority });
  }, [uid]);

  const deleteTask = useCallback(async (taskId) => {
    if (!uid) return;
    await removeDoc(doc(userTasks(uid), taskId));
  }, [uid]);

  // ─── NOTIFICATION MANAGEMENT ───
  const markNotificationRead = useCallback(async (notifId) => {
    if (!uid) return;
    await patchDoc(doc(userNotifications(uid), notifId), { read: true });
  }, [uid]);

  const clearNotifications = useCallback(async () => {
    if (!uid) return;
    for (const n of notifications) {
      await removeDoc(doc(userNotifications(uid), n.id));
    }
  }, [uid, notifications]);

  return (
    <DashboardContext.Provider value={{
      tasks,
      toggleTask,
      addTask,
      deleteTask,
      activeRooms,
      upcomingSessions,
      recentActivity,
      leaderboard,
      notifications,
      markNotificationRead,
      clearNotifications,
      dailyGoal,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
