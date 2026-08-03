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

const DEFAULT_CLASSROOMS = [
  { id: 'c-chat', name: 'General Chat', type: 'discussion', unread: 0, typing: [] },
  { id: 'c-notes', name: 'Shared Notes', type: 'notes', activeCursors: 0 },
  { id: 'c-live', name: 'Live Session', type: 'live', activeParticipants: 0 },
  { id: 'c-tasks', name: 'Project Tasks', type: 'project', activeTasks: 0 },
];

const DEFAULT_ROOMS = [
  {
    id: 'room-eng',
    name: 'CS & Algorithms Hub',
    category: 'Engineering',
    icon: '🚀',
    tags: ['DSA', 'LeetCode', 'System Design'],
    description: 'Collaborative study group for data structures, algorithms, and technical interviews.',
    memberCount: 42,
    memberIds: ['demo-1', 'demo-2'],
    privacy: 'public',
    inviteCode: 'CSALGO',
    createdBy: 'system',
    createdAt: '2 hours ago',
    classrooms: DEFAULT_CLASSROOMS,
    members: [
      { userId: 'u1', name: 'Alex Rivera', avatar: 'AR', role: 'admin', status: 'online' },
      { userId: 'u2', name: 'Sophia Chen', avatar: 'SC', role: 'member', status: 'online' },
      { userId: 'u3', name: 'David Kim', avatar: 'DK', role: 'member', status: 'offline' }
    ]
  },
  {
    id: 'room-med',
    name: 'Med & Anatomy Study Circle',
    category: 'Medicine',
    icon: '🧬',
    tags: ['Anatomy', 'Biochem', 'USMLE'],
    description: 'High-yield medical flashcard reviews, clinical cases, and live whiteboard discussions.',
    memberCount: 28,
    memberIds: ['demo-3'],
    privacy: 'public',
    inviteCode: 'MEDANAT',
    createdBy: 'system',
    createdAt: '5 hours ago',
    classrooms: DEFAULT_CLASSROOMS,
    members: [
      { userId: 'u4', name: 'Dr. Elena Rostova', avatar: 'ER', role: 'admin', status: 'online' },
      { userId: 'u5', name: 'Marcus Vance', avatar: 'MV', role: 'member', status: 'online' }
    ]
  },
  {
    id: 'room-ai',
    name: 'AI / Machine Learning Guild',
    category: 'Engineering',
    icon: '🤖',
    tags: ['PyTorch', 'Transformers', 'GenAI'],
    description: 'Deep learning research paper readings, fine-tuning setups, and project sprints.',
    memberCount: 35,
    memberIds: ['demo-4'],
    privacy: 'public',
    inviteCode: 'AIMLGD',
    createdBy: 'system',
    createdAt: '1 day ago',
    classrooms: DEFAULT_CLASSROOMS,
    members: [
      { userId: 'u6', name: 'Priya Sharma', avatar: 'PS', role: 'admin', status: 'online' },
      { userId: 'u7', name: 'Lucas Scott', avatar: 'LS', role: 'member', status: 'online' }
    ]
  },
  {
    id: 'room-art',
    name: 'UI/UX & Design Systems',
    category: 'Arts & Design',
    icon: '🎨',
    tags: ['Figma', 'Design Systems', 'Micro-interactions'],
    description: 'Critiques, wireframing sessions, and product design explorations.',
    memberCount: 19,
    memberIds: ['demo-5'],
    privacy: 'public',
    inviteCode: 'DESIGN',
    createdBy: 'system',
    createdAt: '2 days ago',
    classrooms: DEFAULT_CLASSROOMS,
    members: [
      { userId: 'u8', name: 'Zoe Martinez', avatar: 'ZM', role: 'admin', status: 'online' }
    ]
  }
];

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [activeRoomId, setActiveRoomIdState] = useState(null);
  const [activeClassroomId, setActiveClassroomIdState] = useState(null);
  const [activeRoomMembers, setActiveRoomMembers] = useState([]);
  const [activeRoomClassrooms, setActiveRoomClassrooms] = useState([]);
  const [lastVisited, setLastVisited] = useState({});

  // ─── LOAD ALL ROOMS (real-time, bounded to 25 for zero-cost quota safety) ───
  useEffect(() => {
    const q = query(roomsRef, orderBy('createdAt', 'desc'), limit(25));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        const firestoreRooms = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: timeAgo(d.data().createdAt),
          classrooms: d.data().classrooms || DEFAULT_CLASSROOMS,
          members: d.data().members || [
            { userId: d.data().createdBy || 'user', name: 'Host', avatar: 'H', role: 'admin', status: 'online' }
          ]
        }));
        
        // Merge Firestore rooms with default template rooms
        setRooms(prev => {
          const ids = new Set(firestoreRooms.map(r => r.id));
          const unmergedDefaults = DEFAULT_ROOMS.filter(r => !ids.has(r.id));
          return [...firestoreRooms, ...unmergedDefaults];
        });
      }
    }, (err) => {
      console.warn('Rooms Firestore listener warning:', err);
    });

    return () => unsubscribe();
  }, []);

  // ─── LOAD CLASSROOMS for active room (real-time) ───
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoomClassrooms([]);
      return;
    }

    // Immediately provide default classrooms while listener initializes
    const foundRoom = rooms.find(r => r.id === activeRoomId) || DEFAULT_ROOMS.find(r => r.id === activeRoomId);
    if (foundRoom?.classrooms && foundRoom.classrooms.length > 0) {
      setActiveRoomClassrooms(foundRoom.classrooms);
    } else {
      setActiveRoomClassrooms(DEFAULT_CLASSROOMS);
    }

    const q = query(roomClassrooms(activeRoomId), orderBy('createdAt', 'asc'));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        setActiveRoomClassrooms(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })));
      }
    }, (err) => {
      console.warn('Classrooms Firestore listener warning:', err);
    });

    return () => unsubscribe();
  }, [activeRoomId, rooms]);

  // ─── LOAD MEMBERS for active room (real-time) ───
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoomMembers([]);
      return;
    }

    const foundRoom = rooms.find(r => r.id === activeRoomId) || DEFAULT_ROOMS.find(r => r.id === activeRoomId);
    if (foundRoom?.members && foundRoom.members.length > 0) {
      setActiveRoomMembers(foundRoom.members);
    }

    const unsubscribe = safeOnSnapshot(roomMembers(activeRoomId), (snap) => {
      if (snap && snap.docs && snap.docs.length > 0) {
        setActiveRoomMembers(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        })));
      }
    }, (err) => {
      console.warn('Members Firestore listener warning:', err);
    });

    return () => unsubscribe();
  }, [activeRoomId, rooms]);

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
    if (!roomId) {
      setActiveRoomIdState(null);
      setActiveClassroomIdState(null);
      return;
    }

    setActiveRoomIdState(roomId);
    
    // Find room info
    const currentRoom = rooms.find(r => r.id === roomId) || DEFAULT_ROOMS.find(r => r.id === roomId);
    const roomClasses = currentRoom?.classrooms || DEFAULT_CLASSROOMS;
    setActiveRoomClassrooms(roomClasses);

    // Restore last visited classroom or pick the first available
    const lastClassroom = lastVisited[roomId];
    const initialClassId = lastClassroom && roomClasses.some(c => c.id === lastClassroom)
      ? lastClassroom
      : roomClasses[0]?.id || 'c-chat';

    setActiveClassroomIdState(initialClassId);

    // Update member status if user is logged in
    if (uid && roomId) {
      const memberRef = doc(roomMembers(roomId), uid);
      patchDoc(memberRef, { status: 'online', lastActive: serverTimestamp() }).catch(() => {});
    }
  }, [uid, lastVisited, rooms]);

  // ─── SET ACTIVE CLASSROOM ───
  const setActiveClassroom = useCallback((classroomId) => {
    setActiveClassroomIdState(classroomId);
    if (activeRoomId) {
      setLastVisited(prev => ({ ...prev, [activeRoomId]: classroomId }));
    }
  }, [activeRoomId]);

  // ─── LEAVE ROOM ───
  const leaveRoom = useCallback(() => {
    if (uid && activeRoomId) {
      const memberRef = doc(roomMembers(activeRoomId), uid);
      patchDoc(memberRef, { status: 'offline', currentClassroom: null }).catch(() => {});
    }
    setActiveRoomIdState(null);
    setActiveClassroomIdState(null);
  }, [uid, activeRoomId]);

  // ─── CREATE ROOM ───
  const addRoom = useCallback(async (newRoomData) => {
    const effectiveUid = uid || 'user_' + Date.now();
    const roomId = `room-${Date.now()}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const creatorMember = {
      userId: effectiveUid,
      name: user?.name || 'You',
      avatar: user?.avatar || (user?.name?.[0] || 'Y').toUpperCase(),
      role: 'admin',
      status: 'online',
      currentClassroom: 'c-chat',
    };

    const newRoom = {
      id: roomId,
      name: newRoomData.name || 'New Study Room',
      category: newRoomData.category || 'Engineering',
      icon: newRoomData.icon || '🚀',
      tags: newRoomData.tags || [],
      description: newRoomData.description || '',
      memberCount: 1,
      memberIds: [effectiveUid],
      privacy: newRoomData.privacy || 'public',
      inviteCode: inviteCode,
      createdBy: effectiveUid,
      isPersonal: true,
      createdAt: 'Just now',
      classrooms: DEFAULT_CLASSROOMS,
      members: [creatorMember],
    };

    // 1. Optimistically update local state immediately so navigation is instantaneous
    setRooms(prev => [newRoom, ...prev.filter(r => r.id !== roomId)]);
    setActiveRoomIdState(roomId);
    setActiveClassroomIdState('c-chat');
    setActiveRoomClassrooms(DEFAULT_CLASSROOMS);
    setActiveRoomMembers([creatorMember]);

    // 2. Persist room & default classrooms to Firestore in the background
    try {
      await createDocWithId(roomDoc(roomId), {
        name: newRoom.name,
        category: newRoom.category,
        icon: newRoom.icon,
        tags: newRoom.tags,
        description: newRoom.description,
        memberCount: 1,
        memberIds: [effectiveUid],
        privacy: newRoom.privacy,
        inviteCode: newRoom.inviteCode,
        createdBy: effectiveUid,
        isPersonal: true,
        createdAt: serverTimestamp(),
      });

      for (const cr of DEFAULT_CLASSROOMS) {
        await createDocWithId(doc(roomClassrooms(roomId), cr.id), {
          name: cr.name,
          type: cr.type,
          unread: 0,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }

      await createDocWithId(doc(roomMembers(roomId), effectiveUid), {
        ...creatorMember,
        joinedAt: serverTimestamp(),
      }).catch(() => {});
    } catch (err) {
      console.warn('Firestore room sync saved locally:', err);
    }

    return roomId;
  }, [uid, user]);

  // ─── JOIN ROOM ───
  const joinRoom = useCallback(async (roomId) => {
    const effectiveUid = uid || 'guest_' + Date.now();
    const newMember = {
      userId: effectiveUid,
      name: user?.name || 'Explorer',
      avatar: user?.avatar || (user?.name?.[0] || 'E').toUpperCase(),
      role: 'member',
      status: 'online',
      currentClassroom: null,
    };

    // Optimistically update rooms
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const memberIds = Array.isArray(r.memberIds) ? r.memberIds : [];
        return {
          ...r,
          memberCount: (r.memberCount || 0) + 1,
          memberIds: memberIds.includes(effectiveUid) ? memberIds : [...memberIds, effectiveUid],
          members: [...(r.members || []), newMember],
        };
      }
      return r;
    }));

    setActiveRoomMembers(prev => [...prev, newMember]);

    try {
      await createDocWithId(doc(roomMembers(roomId), effectiveUid), {
        ...newMember,
        joinedAt: serverTimestamp(),
      });

      await patchDoc(roomDoc(roomId), {
        memberIds: arrayUnion(effectiveUid),
      });

      const room = await fetchDoc(roomDoc(roomId));
      if (room) {
        await patchDoc(roomDoc(roomId), {
          memberCount: (room.memberCount || 0) + 1,
        });
      }
    } catch (err) {
      console.warn('Room join synced locally:', err);
    }
  }, [uid, user]);

  // ─── DELETE ROOM ───
  const deleteRoom = useCallback(async (roomId) => {
    // 1. Optimistic removal
    setRooms(prev => prev.filter(r => r.id !== roomId));

    if (activeRoomId === roomId) {
      setActiveRoomIdState(null);
      setActiveClassroomIdState(null);
      setActiveRoomClassrooms([]);
      setActiveRoomMembers([]);
    }

    // 2. Firestore clean-up in background
    try {
      const classroomsSnap = await getDocs(roomClassrooms(roomId));
      for (const d of classroomsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }

      const membersSnap = await getDocs(roomMembers(roomId));
      for (const d of membersSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }

      await removeDoc(roomDoc(roomId)).catch(() => {});
    } catch (err) {
      console.warn('Delete room handled locally:', err);
    }
  }, [activeRoomId]);

  // ─── DERIVED STATE ───
  const rawActiveRoom = rooms.find(r => r.id === activeRoomId) || DEFAULT_ROOMS.find(r => r.id === activeRoomId) || null;

  const currentClassrooms = activeRoomClassrooms.length > 0
    ? activeRoomClassrooms
    : (rawActiveRoom?.classrooms || DEFAULT_CLASSROOMS);

  const currentMembers = activeRoomMembers.length > 0
    ? activeRoomMembers
    : (rawActiveRoom?.members || []);

  const activeRoom = rawActiveRoom ? {
    ...rawActiveRoom,
    classrooms: currentClassrooms,
    members: currentMembers,
  } : null;

  const activeClassroom = currentClassrooms.find(c => c.id === activeClassroomId) || currentClassrooms[0] || null;

  // Build enriched rooms
  const enrichedRooms = rooms.map(room => {
    if (room.id === activeRoomId) {
      return {
        ...room,
        classrooms: currentClassrooms,
        members: currentMembers,
      };
    }
    return {
      ...room,
      classrooms: room.classrooms || DEFAULT_CLASSROOMS,
      members: room.members || [],
    };
  });

  return (
    <RoomContext.Provider value={{
      rooms: enrichedRooms,
      activeRoom,
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