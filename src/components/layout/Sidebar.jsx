import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Layers, HelpCircle,
  Folder, User, Settings, Keyboard, X, MessageCircleQuestion,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { CountBadge } from '../ui/Badge';
import { useUser } from '../../contexts/UserContext';

import { prefetchRoute } from '../../utils/routePrefetch';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard,       label: 'Dashboard' },
  { to: '/rooms',      icon: Users,                 label: 'Study Rooms', badge: 2 },
  { to: '/notes',      icon: FileText,              label: 'Notes' },
  { to: '/flashcards', icon: Layers,                label: 'Flashcards' },
  { to: '/quiz',       icon: HelpCircle,            label: 'Quiz' },
  { to: '/doubts',     icon: MessageCircleQuestion, label: 'Doubts' },
  { to: '/files',      icon: Folder,                label: 'Files' },
];

const BOTTOM_ITEMS = [
  { to: '/profile',  icon: User,     label: 'Profile'  },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function NavItem({ to, icon: Icon, label, badge, isCollapsed, onClick, className = '' }) {
  const content = (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={() => prefetchRoute(to)}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group overflow-hidden
         ${isActive
           ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] font-semibold shadow-(--shadow-glow) border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)]'
           : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-glass) border border-transparent'
         } ${className}`
      }
      aria-label={`Navigate to ${label}`}
    >
      {({ isActive }) => (
        <>
          {/* Active glow dot (collapsed only) */}
          {isActive && isCollapsed && (
            <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-r-full" />
          )}

          <Icon size={18} className="shrink-0" aria-hidden="true" />
          
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 truncate"
            >
              {label}
            </motion.span>
          )}

          {!isCollapsed && badge && (
            <CountBadge count={badge} className="ml-auto shrink-0" />
          )}



          {/* Badge dot for collapsed state */}
          {isCollapsed && badge && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue))] border-2 border-(--bg-elevated)" />
          )}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    );
  }
  return content;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, toggleCollapse }) {
  const { logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  return (
    <motion.aside
      className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-screen border-r border-(--border-default) shrink-0 transition-transform duration-300 ease-in-out lg:translate-x-0 bg-(--bg-elevated) backdrop-blur-xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
    >
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-(--border-default) shrink-0 overflow-hidden">
        <img 
          src="/logo-icon.png" 
          alt="EduWrap" 
          className="w-10 h-10 shrink-0 rounded-xl object-cover shadow-(--shadow-glow) ring-1 ring-white/10" 
        />
        
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex-1 min-w-0"
          >
            <div className="text-base font-bold truncate" style={{ fontFamily: 'var(--font-display)' }}>EduWrap</div>
            <div className="text-[10px] uppercase tracking-wider text-(--text-muted) font-semibold">Workspace</div>
          </motion.div>
        )}

        {/* Mobile close button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-(--bg-glass) text-(--text-muted)"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map(item => (
          <NavItem 
            key={item.to} 
            {...item} 
            isCollapsed={isCollapsed} 
            onClick={() => { if (window.innerWidth < 1024) onClose(); }} 
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-(--border-default) flex flex-col gap-1 shrink-0">
        {BOTTOM_ITEMS.map(item => (
          <NavItem 
            key={item.to} 
            {...item} 
            isCollapsed={isCollapsed} 
            onClick={() => { if (window.innerWidth < 1024) onClose(); }} 
          />
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 text-red-500 hover:bg-red-500/10 border border-transparent"
          aria-label="Log out"
        >
          <LogOut size={18} className="shrink-0" aria-hidden="true" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 text-left"
            >
              Log out
            </motion.span>
          )}
        </button>

        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex items-center justify-center w-full mt-2 p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-glass) transition-colors border border-transparent hover:border-(--border-default)"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>


      </div>
    </motion.aside>
  );
}
