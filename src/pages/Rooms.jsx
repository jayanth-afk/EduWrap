import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Hash, X, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';
import { Button, IconButton } from '../components/ui/Button';
import { MagicBentoGrid, MagicBentoCard } from '../components/ui/MagicBento';

const CATEGORIES = [
  { id: 'all', label: 'All Rooms', icon: '🌍' },
  { id: 'eng', label: 'Engineering', icon: '⚙️' },
  { id: 'med', label: 'Medicine', icon: '🧬' },
  { id: 'art', label: 'Arts & Design', icon: '🎨' },
  { id: 'bus', label: 'Business', icon: '📊' },
  { id: 'personal', label: 'My Rooms', icon: '👤' },
];

export default function Rooms() {
  const navigate = useNavigate();
  const { rooms, setActiveRoom, addRoom, joinRoom, deleteRoom } = useRoom();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinState, setJoinState] = useState('idle'); // idle, loading, success
  const [joinError, setJoinError] = useState('');

  // New Room Form State
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    category: 'Engineering',
    icon: '🚀',
    description: '',
    tags: ''
  });
  const [createState, setCreateState] = useState('idle');

  const filteredRooms = rooms.filter(room => {
    const tags = Array.isArray(room.tags) ? room.tags : [];
    const matchesSearch = (room.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeCategory === 'personal') {
      return room.isPersonal && matchesSearch;
    }
    const matchesCat = activeCategory === 'all' || (room.category || '').toLowerCase().includes(activeCategory.toLowerCase()) || activeCategory === room.id.slice(5, 8); // simplified matching
    return matchesCat && matchesSearch;
  });

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setJoinState('loading');
    setJoinError('');
    
    try {
      const matchingRoom = rooms.find(r => (r.inviteCode && r.inviteCode.toUpperCase() === code) || r.id === inviteCode.trim());
      if (matchingRoom) {
        await joinRoom(matchingRoom.id);
        setJoinState('success');
        setTimeout(() => {
          setIsJoinModalOpen(false);
          setJoinState('idle');
          setInviteCode('');
          setActiveRoom(matchingRoom.id);
          navigate(`/room/${matchingRoom.id}`);
        }, 800);
      } else {
        setJoinState('idle');
        setJoinError('Room not found with this code. Please verify the invite code.');
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setJoinState('idle');
      setJoinError('An error occurred while joining. Please try again.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomData.name.trim()) return;
    setCreateState('loading');
    
    try {
      const roomId = await addRoom({
        ...newRoomData,
        tags: newRoomData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      
      setCreateState('success');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateState('idle');
        setNewRoomData({ name: '', category: 'Engineering', icon: '🚀', description: '', tags: '' });
        
        if (roomId) {
          setActiveRoom(roomId);
          navigate(`/room/${roomId}`);
        }
      }, 800);
    } catch (err) {
      console.error('Failed to create room:', err);
      setCreateState('idle');
    }
  };

  const handleEnterRoom = (roomId) => {
    setActiveRoom(roomId);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-(--bg-primary) p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full min-w-0">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Campus Directory</h1>
          <p className="text-(--text-secondary)">Discover active study communities and collaborate in real-time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setIsJoinModalOpen(true)}>
            <Hash size={18} className="mr-2" /> Join via Code
          </Button>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} className="mr-2" /> Create Room
          </Button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-2xl p-2 shadow-(--shadow-sm) min-w-0"
      >
        <div className="flex items-center overflow-x-auto no-scrollbar w-full md:w-auto p-1 gap-2 min-w-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id 
                  ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] shadow-(--shadow-glow)' 
                  : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated)'
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0 px-2 md:px-0">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search rooms..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-(--bg-elevated) border border-(--border-default) rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
          />
        </div>
      </motion.div>

      {/* Room Grid */}
      <MagicBentoGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleEnterRoom(room.id)}
              className="group cursor-pointer block h-full"
            >
              <MagicBentoCard className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-3xl p-6 flex flex-col h-full !transition-none overflow-hidden">
                {/* Subtle animated background glow on hover */}
                <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-[color:oklch(0.58_0.22_var(--accent-hue))] opacity-0 blur-[60px] group-hover:opacity-10 transition-opacity duration-500 rounded-full pointer-events-none" />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_var(--accent-hue))] text-white flex items-center justify-center text-2xl shadow-lg">
                    {room.icon}
                  </div>
                  
                  {/* Live Indicator & Delete */}
                  <div className="flex items-center gap-2">
                    {room.isPersonal && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this study room?')) {
                            deleteRoom(room.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors z-20"
                        title="Delete Room"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex-1 relative z-10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[color:oklch(0.58_0.22_var(--accent-hue))] mb-1">{room.category}</div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>{room.name}</h3>
                  <p className="text-sm text-(--text-secondary) line-clamp-2">{room.description}</p>
                </div>

                <div className="flex items-center gap-2 mb-6 flex-wrap relative z-10">
                  {room.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium px-2 py-1 rounded-md bg-(--bg-elevated) border border-(--border-default) text-(--text-muted)">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-(--border-default) flex items-center justify-between mt-auto relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {room.members.slice(0, 3).map((m, idx) => (
                        <div key={m.id} className="w-7 h-7 rounded-full bg-(--bg-elevated) border-2 border-(--bg-glass) flex items-center justify-center text-[10px] font-bold" style={{ zIndex: 3 - idx }}>
                          {m.avatar}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-(--text-muted) flex items-center gap-1">
                      <Users size={12} /> {room.memberCount}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </MagicBentoCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </MagicBentoGrid>

      {/* Join Private Room Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => joinState === 'idle' && setIsJoinModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-(--bg-glass) backdrop-blur-2xl border border-(--border-strong) p-8 rounded-3xl shadow-(--shadow-2xl) w-full max-w-md"
            >
              {joinState === 'idle' && (
                <IconButton 
                  className="absolute top-4 right-4" 
                  variant="ghost" 
                  onClick={() => setIsJoinModalOpen(false)}
                >
                  <X size={20} />
                </IconButton>
              )}

              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] rounded-2xl flex items-center justify-center text-[color:oklch(0.58_0.22_var(--accent-hue))] mb-4 shadow-(--shadow-glow)">
                  <Hash size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Join Private Room</h2>
                <p className="text-(--text-secondary) text-sm">Enter the invite code provided by your administrator or study group leader.</p>
              </div>

              {joinState === 'idle' && (
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      value={inviteCode}
                      onChange={(e) => { setInviteCode(e.target.value); setJoinError(''); }}
                      placeholder="e.g. CS50-WINTER-26" 
                      className="w-full bg-(--bg-elevated) border border-(--border-strong) rounded-xl p-4 text-center font-mono text-lg focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] focus:ring-1 focus:ring-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all tracking-wider"
                      autoFocus
                    />
                    {joinError && (
                      <p className="text-xs text-red-400 mt-2 text-center">{joinError}</p>
                    )}
                  </div>
                  <Button type="submit" variant="primary" className="w-full h-12 text-base">
                    Join Ecosystem
                  </Button>
                </form>
              )}

              {joinState === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-(--border-default) border-t-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-full animate-spin mb-4" />
                  <p className="font-medium text-(--text-primary)">Validating credentials...</p>
                </div>
              )}

              {joinState === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="font-bold text-lg mb-1">Access Granted</p>
                  <p className="text-sm text-(--text-secondary)">Routing you into the workspace...</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => createState === 'idle' && setIsCreateModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-(--bg-glass) backdrop-blur-2xl border border-(--border-strong) p-8 rounded-3xl shadow-(--shadow-2xl) w-full max-w-md"
            >
              {createState === 'idle' && (
                <IconButton 
                  className="absolute top-4 right-4" 
                  variant="ghost" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  <X size={20} />
                </IconButton>
              )}

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] rounded-2xl flex items-center justify-center text-[color:oklch(0.58_0.22_var(--accent-hue))] mb-4 shadow-(--shadow-glow)">
                  <Plus size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Create Study Room</h2>
                <p className="text-(--text-secondary) text-sm">Build a new collaborative ecosystem.</p>
              </div>

              {createState === 'idle' && (
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 shrink-0">
                      <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1">Icon</label>
                      <input 
                        type="text" 
                        value={newRoomData.icon}
                        onChange={(e) => setNewRoomData(prev => ({...prev, icon: e.target.value}))}
                        className="w-full bg-(--bg-elevated) border border-(--border-strong) rounded-xl p-3 text-center text-xl focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1">Room Name *</label>
                      <input 
                        type="text" 
                        required
                        value={newRoomData.name}
                        onChange={(e) => setNewRoomData(prev => ({...prev, name: e.target.value}))}
                        placeholder="e.g. Data Structures Prep" 
                        className="w-full bg-(--bg-elevated) border border-(--border-strong) rounded-xl p-3 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1">Category</label>
                    <select 
                      value={newRoomData.category}
                      onChange={(e) => setNewRoomData(prev => ({...prev, category: e.target.value}))}
                      className="w-full bg-(--bg-elevated) border border-(--border-strong) rounded-xl p-3 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all appearance-none"
                    >
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.label}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1">Description</label>
                    <input 
                      type="text" 
                      value={newRoomData.description}
                      onChange={(e) => setNewRoomData(prev => ({...prev, description: e.target.value}))}
                      placeholder="Brief description of the room's goal" 
                      className="w-full bg-(--bg-elevated) border border-(--border-strong) rounded-xl p-3 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1">Tags (Comma separated)</label>
                    <input 
                      type="text" 
                      value={newRoomData.tags}
                      onChange={(e) => setNewRoomData(prev => ({...prev, tags: e.target.value}))}
                      placeholder="e.g. React, Exams, Group Project" 
                      className="w-full bg-(--bg-elevated) border border-(--border-strong) rounded-xl p-3 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-all"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full h-12 text-base mt-2">
                    Create Workspace
                  </Button>
                </form>
              )}

              {createState === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-(--border-default) border-t-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-full animate-spin mb-4" />
                  <p className="font-medium text-(--text-primary)">Constructing workspace...</p>
                </div>
              )}

              {createState === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center mb-4">
                    <Sparkles size={32} />
                  </div>
                  <p className="font-bold text-lg mb-1">Room Created</p>
                  <p className="text-sm text-(--text-secondary)">Routing you into the workspace...</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}