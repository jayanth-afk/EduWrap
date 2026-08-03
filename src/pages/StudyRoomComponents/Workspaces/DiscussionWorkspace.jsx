import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Sparkles, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { useRoom } from '../../../contexts/RoomContext';
import { useUser } from '../../../contexts/UserContext';
import { 
  roomMessages, 
  createDoc, 
  safeOnSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  timeAgo 
} from '../../../firebase/firestore';

const DEFAULT_MESSAGES = [
  { id: 'm1', author: 'Dr. House', avatar: 'D', role: 'admin', text: 'Welcome to the discussion board. Keep it civil.', time: '10:00 AM' },
  { id: 'm2', author: 'Sarah Jenkins', avatar: 'S', role: 'member', text: 'Did anyone understand the last lecture?', time: '10:45 AM' },
  { id: 'm3', author: 'Alex Chen', avatar: 'A', role: 'member', text: 'Mostly, but the part about thermodynamics was confusing.', time: '10:47 AM' },
];

export default function DiscussionWorkspace() {
  const { activeRoom, activeClassroom } = useRoom();
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const bottomRef = useRef(null);

  const roomId = activeRoom?.id;
  const classroomId = activeClassroom?.id;

  // Real-time Firestore sync for room messages
  useEffect(() => {
    if (!roomId) return;

    const q = query(roomMessages(roomId), orderBy('createdAt', 'asc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      if (!snap.empty) {
        const firestoreMsgs = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          time: timeAgo(d.data().createdAt),
        }));
        // Filter by classroom if tagged, or show all room messages
        const relevant = firestoreMsgs.filter(m => !m.classroomId || m.classroomId === classroomId);
        setMessages(relevant.length > 0 ? relevant : DEFAULT_MESSAGES);
      }
    }, (err) => {
      console.warn('Discussion messages listener:', err);
    });

    return () => unsubscribe();
  }, [roomId, classroomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeClassroom?.typing]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textToSend = input.trim();
    setInput('');

    const newMsg = {
      author: user?.name || 'You',
      avatar: (user?.name?.[0] || 'Y').toUpperCase(),
      role: 'member',
      text: textToSend,
      classroomId: classroomId || null,
      userId: user?.id || 'anonymous',
      createdAt: serverTimestamp(),
    };

    // Optimistic UI update
    setMessages(prev => [...prev, {
      ...newMsg,
      id: `temp-${Date.now()}`,
      time: 'just now',
    }]);

    if (roomId) {
      try {
        await createDoc(roomMessages(roomId), newMsg);
      } catch (err) {
        console.error('Failed to send discussion message:', err);
      }
    }
  };

  if (!activeClassroom) return null;

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-(--border-default) flex items-center justify-between shrink-0 bg-(--bg-elevated)/50 backdrop-blur-md">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="text-(--text-muted)">#</span> {activeClassroom.name}
          </h2>
          <p className="text-xs text-(--text-muted)">General discussion for {activeRoom.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-(--bg-glass) text-(--text-muted) transition-colors">
            <Sparkles size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-(--bg-glass) text-(--text-muted) transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start gap-3 sm:gap-4 group">
            <Avatar initials={msg.avatar} className="shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-bold text-sm ${msg.role === 'admin' ? 'text-[color:oklch(0.58_0.22_var(--accent-hue))]' : 'text-(--text-primary)'}`}>
                  {msg.author}
                </span>
                <span className="text-[10px] text-(--text-muted)">{msg.time}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">
                {msg.text}
              </p>
            </div>
          </div>
        ))}

        {activeClassroom.typing && activeClassroom.typing.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-(--text-muted) italic pt-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-(--text-muted) animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-(--text-muted) animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-(--text-muted) animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            {activeClassroom.typing.join(', ')} {activeClassroom.typing.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 shrink-0 bg-(--bg-primary)">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-(--bg-elevated) border border-(--border-default) rounded-2xl p-2 focus-within:border-[color:oklch(0.58_0.22_var(--accent-hue))] focus-within:ring-1 focus-within:ring-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all">
          <button type="button" className="p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-glass) transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message #${activeClassroom.name}`}
            className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-[15px] px-2 text-(--text-primary) placeholder:text-(--text-muted)"
          />
          <button type="button" className="p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-glass) transition-colors hidden sm:block">
            <Smile size={20} />
          </button>
          <button type="submit" disabled={!input.trim()} className="p-2 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}