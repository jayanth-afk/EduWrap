import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import {
  roomsRef,
  roomDoc,
  roomClassrooms,
  roomMembers,
  roomMessages,
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
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  timeAgo,
} from '../firebase/firestore';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomIdState] = useState(null);
  const [activeClassroomId, setActiveClassroomIdState] = useState(null);
  const [activeRoomMembers, setActiveRoomMembers] = useState([]);
  const [activeRoomClassrooms, setActiveRoomClassrooms] = useState([]);
  const [lastVisited, setLastVisited] = useState({});

  // ─── LOAD ALL ROOMS (real-time, bounded to 25 for zero-cost quota safety) ───
  useEffect(() => {
    if (!isLoggedIn) return;

    const q = query(roomsRef, orderBy('createdAt', 'desc'), limit(25));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      const roomList = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: timeAgo(d.data().createdAt),
      }));
      setRooms(roomList);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // ─── LOAD CLASSROOMS for active room (real-time) ───
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoomClassrooms([]);
      return;
    }

    const q = query(roomClassrooms(activeRoomId), orderBy('createdAt', 'asc'));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setActiveRoomClassrooms(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });

    return () => unsubscribe();
  }, [activeRoomId]);

  // ─── LOAD MEMBERS for active room (real-time) ───
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoomMembers([]);
      return;
    }

    const unsubscribe = safeOnSnapshot(roomMembers(activeRoomId), (snap) => {
      setActiveRoomMembers(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));
    });

    return () => unsubscribe();
  }, [activeRoomId]);

  // ─── RESTORE LAST VISITED from localStorage ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ew_last_visited');
      if (saved) setLastVisited(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('ew_last_visited', JSON.stringify(lastVisited));
  }, [lastVisited]);

  // ─── SET ACTIVE ROOM ───
  const setActiveRoom = useCallback((roomId) => {
    setActiveRoomIdState(roomId);
    // Restore last visited classroom, or default to first
    const lastClassroom = lastVisited[roomId] || null;
    setActiveClassroomIdState(lastClassroom);

    // Update member status if user is logged in
    if (uid && roomId) {
      const memberRef = doc(roomMembers(roomId), uid);
      patchDoc(memberRef, { status: 'online', lastActive: serverTimestamp() }).catch(() => {});
    }
  }, [uid, lastVisited]);

  // ─── SET ACTIVE CLASSROOM ───
  const setActiveClassroom = useCallback((classroomId) => {
    setActiveClassroomIdState(classroomId);
    if (activeRoomId) {
      setLastVisited(prev => ({ ...prev, [activeRoomId]: classroomId }));
    }
  }, [activeRoomId]);

  // ─── LEAVE ROOM ───
  const leaveRoom = useCallback(() => {
    // Update member status before leaving
    if (uid && activeRoomId) {
      const memberRef = doc(roomMembers(activeRoomId), uid);
      patchDoc(memberRef, { status: 'offline', currentClassroom: null }).catch(() => {});
    }
    setActiveRoomIdState(null);
    setActiveClassroomIdState(null);
  }, [uid, activeRoomId]);

  // ─── CREATE ROOM ───
  const addRoom = useCallback(async (newRoomData) => {
    if (!uid) return null;

    const roomId = `room-${Date.now()}`;
    
    // Create the room document
    await createDocWithId(roomDoc(roomId), {
      name: newRoomData.name,
      category: newRoomData.category || 'General',
      icon: newRoomData.icon || '📚',
      tags: newRoomData.tags || [],
      description: newRoomData.description || '',
      memberCount: 1,
      memberIds: [uid],
      privacy: newRoomData.privacy || 'public',
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdBy: uid,
      isPersonal: true,
    });

    // Create default classrooms as subcollection
    const defaultClassrooms = [
      { name: 'General Chat', type: 'discussion', unread: 0, typing: [] },
      { name: 'Shared Notes', type: 'notes', activeCursors: 0 },
      { name: 'Live Session', type: 'live', activeParticipants: 0 },
    ];

    for (const cr of defaultClassrooms) {
      await addDoc(roomClassrooms(roomId), { ...cr, createdAt: serverTimestamp() });
    }

    // Add creator as admin member
    await createDocWithId(doc(roomMembers(roomId), uid), {
      userId: uid,
      name: user.name || 'You',
      avatar: user.avatar || user.name?.[0] || 'Y',
      role: 'admin',
      status: 'online',
      currentClassroom: null,
      joinedAt: serverTimestamp(),
    });

    return roomId;
  }, [uid, user]);

  // ─── JOIN ROOM ───
  const joinRoom = useCallback(async (roomId) => {
    if (!uid) return;

    // Add user to room members
    await createDocWithId(doc(roomMembers(roomId), uid), {
      userId: uid,
      name: user.name || 'Anonymous',
      avatar: user.avatar || user.name?.[0] || '?',
      role: 'member',
      status: 'online',
      currentClassroom: null,
      joinedAt: serverTimestamp(),
    });

    // Increment member count & add userId to memberIds array
    await patchDoc(roomDoc(roomId), {
      memberIds: arrayUnion(uid),
    });

    // Manually increment memberCount
    const room = await fetchDoc(roomDoc(roomId));
    if (room) {
      await patchDoc(roomDoc(roomId), {
        memberCount: (room.memberCount || 0) + 1,
      });
    }
  }, [uid, user]);

  // ─── DELETE ROOM ───
  const deleteRoom = useCallback(async (roomId) => {
    // Delete all subcollections first
    const classroomsSnap = await getDocs(roomClassrooms(roomId));
    for (const d of classroomsSnap.docs) {
      await deleteDoc(d.ref);
    }

    const membersSnap = await getDocs(roomMembers(roomId));
    for (const d of membersSnap.docs) {
      await deleteDoc(d.ref);
    }

    // Delete the room document
    await removeDoc(roomDoc(roomId));

    // Reset active state if deleting current room
    if (activeRoomId === roomId) {
      setActiveRoomIdState(null);
      setActiveClassroomIdState(null);
    }
  }, [activeRoomId]);

  // ─── DERIVED STATE ───
  const activeRoom = rooms.find(r => r.id === activeRoomId) || null;
  const activeClassroom = activeRoomClassrooms.find(c => c.id === activeClassroomId) || null;

  // Build rooms with their classrooms and members attached for backward compat
  const enrichedRooms = rooms.map(room => {
    if (room.id === activeRoomId) {
      return {
        ...room,
        classrooms: activeRoomClassrooms,
        members: activeRoomMembers,
      };
    }
    return room;
  });

  return (
    <RoomContext.Provider value={{
      rooms: enrichedRooms,
      activeRoom: activeRoom ? { ...activeRoom, classrooms: activeRoomClassrooms, members: activeRoomMembers } : null,
      activeClassroom,
      setActiveRoom,
      setActiveClassroom,
      leaveRoom,
      addRoom,
      joinRoom,
      deleteRoom,
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used inside RoomProvider');
  return ctx;
}