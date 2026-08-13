import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, Bell, ShieldAlert, Flame, BrainCircuit, Shield } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import AppearanceSettings from './AppearanceSettings';
import ProfileSettings from './ProfileSettings';
import NotificationSettings from './NotificationSettings';
import FirebaseUsageSettings from './FirebaseUsageSettings';
import AISettings from './AISettings';
import DangerZone from './DangerZone';
import AdminPanel from './AdminPanel';

const BASE_TABS = [
  { id: 'profile', label: 'Profile', icon: User, component: ProfileSettings },
  { id: 'ai', label: 'Groq AI & Models', icon: BrainCircuit, component: AISettings },
  { id: 'appearance', label: 'Appearance', icon: Palette, component: AppearanceSettings },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationSettings },
  { id: 'firebase', label: 'Firebase & Quotas', icon: Flame, component: FirebaseUsageSettings },
  { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, component: DangerZone },
];

const ADMIN_TAB = { id: 'admin', label: 'Admin Panel', icon: Shield, component: AdminPanel };

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState('profile');
  const { isAdmin, isCoAdmin } = useUser();

  const TABS = (isAdmin || isCoAdmin) ? [ADMIN_TAB, ...BASE_TABS] : BASE_TABS;

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || ProfileSettings;

  return (
    <div className="flex-1 flex flex-col h-full bg-(--bg-base)">
      {/* Header */}
      <header className="h-16 px-6 border-b border-(--border-default) flex items-center bg-(--bg-elevated) shrink-0 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">Settings</h1>
          <p className="text-xs text-(--text-muted)">Manage your account preferences</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Settings Sidebar */}
        <aside className="w-full lg:w-64 border-r lg:border-r border-(--border-default) bg-(--bg-elevated)/50 shrink-0 overflow-x-auto lg:overflow-y-auto no-scrollbar">
          <nav className="flex lg:flex-col gap-1 p-4 min-w-max lg:min-w-0">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden ${
                    isActive
                      ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] shadow-(--shadow-glow) border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)]'
                      : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-glass) border border-transparent'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-(--bg-base) relative">
          <div className="max-w-2xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
