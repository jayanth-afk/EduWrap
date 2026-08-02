import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Users, FileText, Settings, User, Layers, HelpCircle, MessageCircleQuestion, Folder, Terminal } from 'lucide-react';
import { Input } from '../ui/Input';

const COMMANDS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Go to Dashboard', to: '/dashboard' },
  { id: 'rooms', icon: Users, label: 'Go to Study Rooms', to: '/rooms' },
  { id: 'notes', icon: FileText, label: 'Go to Notes', to: '/notes' },
  { id: 'flashcards', icon: Layers, label: 'Go to Flashcards', to: '/flashcards' },
  { id: 'quiz', icon: HelpCircle, label: 'Go to Quizzes', to: '/quiz' },
  { id: 'doubts', icon: MessageCircleQuestion, label: 'Go to Doubts & Discussions', to: '/doubts' },
  { id: 'files', icon: Folder, label: 'Go to Files & Resources', to: '/files' },
  { id: 'sandbox', icon: Terminal, label: 'Go to Code Sandbox', to: '/sandbox' },
  { id: 'profile', icon: User, label: 'My Profile', to: '/profile' },
  { id: 'settings', icon: Settings, label: 'Settings', to: '/settings' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef(null);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        navigate(cmd.to);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuery('');
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[10vh] px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-(--bg-elevated) border border-(--border-strong) rounded-2xl shadow-(--shadow-lg) overflow-hidden flex flex-col"
        >
          <div className="flex items-center gap-3 p-3 border-b border-(--border-default)">
            <Search size={20} className="text-(--text-muted) ml-2 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base text-(--text-primary) placeholder:text-(--text-muted) h-10"
            />
            <kbd className="px-2 py-1 rounded-md bg-(--bg-surface) border border-(--border-default) text-[10px] text-(--text-muted) font-mono shrink-0">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-sm text-(--text-muted)">
                No results found.
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                  Suggestions
                </div>
                {filteredCommands.map((cmd, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        navigate(cmd.to);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left ${
                        isSelected 
                          ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))]' 
                          : 'text-(--text-secondary) hover:bg-(--bg-glass)'
                      }`}
                    >
                      <cmd.icon size={18} className={isSelected ? 'text-[color:oklch(0.58_0.22_var(--accent-hue))]' : 'text-(--text-muted)'} />
                      <span className="font-medium">{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-(--border-default) bg-(--bg-surface) text-[10px] text-(--text-muted) flex gap-4">
            <span><kbd className="font-mono">↑↓</kbd> to navigate</span>
            <span><kbd className="font-mono">↵</kbd> to select</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
