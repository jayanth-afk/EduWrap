import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Crown, UserPlus, Trash2, Search, RefreshCw,
  FileText, MessageSquare, Settings2, AlertTriangle,
  CheckCircle2, X, Loader2, ChevronDown, ChevronRight,
  Eye, Users, File, Megaphone, Zap, Lock,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import {
  isSuperAdmin,
  fetchCoAdmins,
  addCoAdmin,
  removeCoAdmin,
  fetchAppSettings,
  updateAppSettings,
  fetchAllDoubts,
  deleteDoubtAdmin,
  fetchAllNotes,
  deleteNoteAdmin,
  fetchAllFiles,
  deleteFileAdmin,
} from '../../services/adminService';

// ─── SECTION COLLAPSE TOGGLE ───
function SectionHeader({ icon: Icon, title, subtitle, isOpen, onToggle, count, accentColor = 'var(--accent-hue)' }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 rounded-2xl bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) hover:border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-[color:oklch(0.58_0.22_${accentColor}_/_0.12)] text-[color:oklch(0.58_0.22_${accentColor})] flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-(--text-primary)">{title}</h3>
          <p className="text-[10px] text-(--text-muted)">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {typeof count === 'number' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))]">
            {count}
          </span>
        )}
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={16} className="text-(--text-muted)" />
        </motion.div>
      </div>
    </button>
  );
}

// ─── TOAST NOTIFICATION ───
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl text-sm font-medium ${
        type === 'success'
          ? 'bg-green-500/10 border-green-500/20 text-green-500'
          : 'bg-red-500/10 border-red-500/20 text-red-500'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </motion.div>
  );
}

export default function AdminPanel() {
  const { user, isAdmin } = useUser();

  // Section open states
  const [openSections, setOpenSections] = useState({ coAdmins: true, doubts: false, notes: false, settings: false });
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Co-Admin state
  const [coAdmins, setCoAdmins] = useState([]);
  const [newCoAdminEmail, setNewCoAdminEmail] = useState('');
  const [coAdminLoading, setCoAdminLoading] = useState(false);

  // Doubts state
  const [allDoubts, setAllDoubts] = useState([]);
  const [doubtsLoading, setDoubtsLoading] = useState(false);
  const [doubtsSearch, setDoubtsSearch] = useState('');

  // Notes/Files state
  const [allNotes, setAllNotes] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSearch, setNotesSearch] = useState('');

  // App settings state
  const [appSettings, setAppSettings] = useState({ maintenanceMode: false, globalAnnouncement: '', maxQuizQuestions: 20 });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ─── LOAD CO-ADMINS ───
  const loadCoAdmins = useCallback(async () => {
    setCoAdminLoading(true);
    const list = await fetchCoAdmins();
    setCoAdmins(list);
    setCoAdminLoading(false);
  }, []);

  useEffect(() => { loadCoAdmins(); }, [loadCoAdmins]);

  // ─── LOAD DOUBTS ───
  const loadDoubts = useCallback(async () => {
    setDoubtsLoading(true);
    const list = await fetchAllDoubts();
    setAllDoubts(list);
    setDoubtsLoading(false);
  }, []);

  // ─── LOAD NOTES & FILES ───
  const loadNotesAndFiles = useCallback(async () => {
    setNotesLoading(true);
    const [notes, files] = await Promise.all([fetchAllNotes(), fetchAllFiles()]);
    setAllNotes(notes);
    setAllFiles(files);
    setNotesLoading(false);
  }, []);

  // ─── LOAD APP SETTINGS ───
  const loadAppSettings = useCallback(async () => {
    setSettingsLoading(true);
    const s = await fetchAppSettings();
    setAppSettings(s);
    setSettingsLoading(false);
  }, []);

  // Load data when sections open
  useEffect(() => { if (openSections.doubts && allDoubts.length === 0) loadDoubts(); }, [openSections.doubts]);
  useEffect(() => { if (openSections.notes && allNotes.length === 0 && allFiles.length === 0) loadNotesAndFiles(); }, [openSections.notes]);
  useEffect(() => { if (openSections.settings) loadAppSettings(); }, [openSections.settings]);

  // ─── HANDLERS ───
  const handleAddCoAdmin = async () => {
    if (!newCoAdminEmail.trim() || !isAdmin) return;
    setCoAdminLoading(true);
    const updated = await addCoAdmin(newCoAdminEmail);
    if (updated) setCoAdmins(updated);
    setNewCoAdminEmail('');
    setCoAdminLoading(false);
    showToast(`Added ${newCoAdminEmail} as co-admin`);
  };

  const handleRemoveCoAdmin = async (email) => {
    if (!isAdmin) return;
    setCoAdminLoading(true);
    const updated = await removeCoAdmin(email);
    if (updated) setCoAdmins(updated);
    setCoAdminLoading(false);
    showToast(`Removed ${email} from co-admins`);
  };

  const handleDeleteDoubt = async (doubtId, title) => {
    const ok = await deleteDoubtAdmin(doubtId);
    if (ok) {
      setAllDoubts(prev => prev.filter(d => d.id !== doubtId));
      showToast(`Deleted doubt: "${title}"`);
    } else {
      showToast('Failed to delete doubt', 'error');
    }
  };

  const handleDeleteNote = async (noteId, title) => {
    const ok = await deleteNoteAdmin(noteId);
    if (ok) {
      setAllNotes(prev => prev.filter(n => n.id !== noteId));
      showToast(`Deleted note: "${title}"`);
    } else {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleDeleteFile = async (fileId, name) => {
    const ok = await deleteFileAdmin(fileId);
    if (ok) {
      setAllFiles(prev => prev.filter(f => f.id !== fileId));
      showToast(`Deleted file: "${name}"`);
    } else {
      showToast('Failed to delete file', 'error');
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    await updateAppSettings(appSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    setSettingsLoading(false);
    showToast('App settings saved');
  };

  // Filter helpers
  const filteredDoubts = allDoubts.filter(d =>
    (d.title || '').toLowerCase().includes(doubtsSearch.toLowerCase()) ||
    (d.category || '').toLowerCase().includes(doubtsSearch.toLowerCase()) ||
    (d.author?.name || '').toLowerCase().includes(doubtsSearch.toLowerCase())
  );

  const filteredNotes = allNotes.filter(n =>
    (n.title || '').toLowerCase().includes(notesSearch.toLowerCase()) ||
    (n.userId || '').toLowerCase().includes(notesSearch.toLowerCase())
  );

  const filteredFiles = allFiles.filter(f =>
    (f.name || '').toLowerCase().includes(notesSearch.toLowerCase()) ||
    (f.owner?.name || '').toLowerCase().includes(notesSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Admin Header */}
      <div className="bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.08)] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30)_/_0.05)] backdrop-blur-xl border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.05)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center shrink-0">
            <Shield size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-(--text-primary)" style={{ fontFamily: 'var(--font-display)' }}>
                Admin Control Panel
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <Crown size={10} /> SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-(--text-secondary) mt-1">
              Signed in as <strong className="text-(--text-primary)">{user?.email}</strong>. Full access to moderation, user management, and critical app settings.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════ CO-ADMIN MANAGEMENT ═══════════ */}
      <SectionHeader
        icon={Users}
        title="Co-Admin Management"
        subtitle="Assign and manage co-admins who can moderate content"
        isOpen={openSections.coAdmins}
        onToggle={() => toggleSection('coAdmins')}
        count={coAdmins.length}
      />
      <AnimatePresence>
        {openSections.coAdmins && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-5 space-y-4">
              {/* Add co-admin */}
              {isAdmin && (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newCoAdminEmail}
                    onChange={(e) => setNewCoAdminEmail(e.target.value)}
                    placeholder="Enter email to add as co-admin..."
                    className="flex-1 bg-(--bg-base) border border-(--border-default) rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCoAdmin()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddCoAdmin}
                    disabled={coAdminLoading || !newCoAdminEmail.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {coAdminLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Add
                  </motion.button>
                </div>
              )}

              {/* Co-admin list */}
              <div className="space-y-2">
                {coAdmins.length === 0 && !coAdminLoading && (
                  <p className="text-xs text-(--text-muted) text-center py-4">No co-admins assigned yet.</p>
                )}
                {coAdminLoading && coAdmins.length === 0 && (
                  <div className="flex items-center justify-center py-4 gap-2 text-(--text-muted) text-xs">
                    <Loader2 size={14} className="animate-spin" /> Loading co-admins...
                  </div>
                )}
                {coAdmins.map((email) => (
                  <div key={email} className="flex items-center justify-between px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-default)">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center">
                        <Users size={13} />
                      </div>
                      <span className="text-sm text-(--text-primary) font-medium">{email}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        CO-ADMIN
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveCoAdmin(email)}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove co-admin"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ DOUBTS MODERATION ═══════════ */}
      <SectionHeader
        icon={MessageSquare}
        title="All Doubts — Moderation"
        subtitle="View and delete doubts posted by all users"
        isOpen={openSections.doubts}
        onToggle={() => toggleSection('doubts')}
        count={allDoubts.length || undefined}
      />
      <AnimatePresence>
        {openSections.doubts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-5 space-y-3">
              {/* Search + Refresh */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                  <input
                    type="text"
                    value={doubtsSearch}
                    onChange={(e) => setDoubtsSearch(e.target.value)}
                    placeholder="Search by title, category, or author..."
                    className="w-full bg-(--bg-base) border border-(--border-default) rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                  />
                </div>
                <button
                  onClick={loadDoubts}
                  disabled={doubtsLoading}
                  className="p-2 rounded-xl bg-(--bg-elevated) border border-(--border-default) text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={doubtsLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Doubts list */}
              <div className="max-h-80 overflow-y-auto space-y-2 no-scrollbar">
                {doubtsLoading && allDoubts.length === 0 && (
                  <div className="flex items-center justify-center py-6 gap-2 text-(--text-muted) text-xs">
                    <Loader2 size={14} className="animate-spin" /> Loading all doubts...
                  </div>
                )}
                {!doubtsLoading && filteredDoubts.length === 0 && (
                  <p className="text-xs text-(--text-muted) text-center py-6">No doubts found.</p>
                )}
                {filteredDoubts.map(doubt => (
                  <div key={doubt.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-default) group hover:border-red-500/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-(--text-primary) truncate">{doubt.title || 'Untitled Doubt'}</span>
                        {doubt.category && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-(--bg-glass) text-(--text-muted) shrink-0">
                            {doubt.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-(--text-muted)">by {doubt.author?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-(--text-muted)">· {doubt.answers?.length || 0} answers</span>
                        {doubt.createdAt && <span className="text-[10px] text-(--text-muted)">· {new Date(doubt.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoubt(doubt.id, doubt.title)}
                      className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 ml-2"
                      title="Delete doubt"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ ALL PDFs & FILES ═══════════ */}
      <SectionHeader
        icon={FileText}
        title="All PDFs & Files"
        subtitle="View all uploaded notes and files across all users"
        isOpen={openSections.notes}
        onToggle={() => toggleSection('notes')}
        count={(allNotes.length + allFiles.length) || undefined}
      />
      <AnimatePresence>
        {openSections.notes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-5 space-y-3">
              {/* Search + Refresh */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                  <input
                    type="text"
                    value={notesSearch}
                    onChange={(e) => setNotesSearch(e.target.value)}
                    placeholder="Search by title or owner..."
                    className="w-full bg-(--bg-base) border border-(--border-default) rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                  />
                </div>
                <button
                  onClick={loadNotesAndFiles}
                  disabled={notesLoading}
                  className="p-2 rounded-xl bg-(--bg-elevated) border border-(--border-default) text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={notesLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {notesLoading && allNotes.length === 0 && allFiles.length === 0 && (
                <div className="flex items-center justify-center py-6 gap-2 text-(--text-muted) text-xs">
                  <Loader2 size={14} className="animate-spin" /> Loading all notes & files...
                </div>
              )}

              {/* Notes section */}
              {filteredNotes.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) px-1 pt-2">
                    Notes / PDFs ({filteredNotes.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                    {filteredNotes.map(note => (
                      <div key={note.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-default) group hover:border-red-500/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText size={13} className="text-(--text-muted) shrink-0" />
                            <span className="text-sm font-medium text-(--text-primary) truncate">{note.title || 'Untitled'}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-(--bg-glass) text-(--text-muted) shrink-0">
                              {note.type || 'text'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-(--text-muted)">Owner: {note.userId || 'Unknown'}</span>
                            {note.url && <span className="text-[10px] text-green-500">Has URL</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id, note.title)}
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 ml-2"
                          title="Delete note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files section */}
              {filteredFiles.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) px-1 pt-2">
                    Files ({filteredFiles.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                    {filteredFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-(--bg-elevated) border border-(--border-default) group hover:border-red-500/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <File size={13} className="text-(--text-muted) shrink-0" />
                            <span className="text-sm font-medium text-(--text-primary) truncate">{file.name || 'Untitled'}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-(--bg-glass) text-(--text-muted) shrink-0">
                              {file.size || '?'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-(--text-muted)">by {file.owner?.name || file.userId || 'Unknown'}</span>
                            <span className="text-[10px] text-(--text-muted)">· {file.category || 'General'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-1.5 rounded-lg text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 ml-2"
                          title="Delete file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!notesLoading && filteredNotes.length === 0 && filteredFiles.length === 0 && (
                <p className="text-xs text-(--text-muted) text-center py-6">No notes or files found in database.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ APP CRITICAL SETTINGS ═══════════ */}
      <SectionHeader
        icon={Settings2}
        title="Critical App Settings"
        subtitle="Maintenance mode, announcements, and quiz limits"
        isOpen={openSections.settings}
        onToggle={() => toggleSection('settings')}
      />
      <AnimatePresence>
        {openSections.settings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-5 space-y-5">
              {settingsLoading && (
                <div className="flex items-center justify-center py-4 gap-2 text-(--text-muted) text-xs">
                  <Loader2 size={14} className="animate-spin" /> Loading settings...
                </div>
              )}

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-(--bg-elevated) border border-(--border-default)">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    appSettings.maintenanceMode
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-(--bg-glass) text-(--text-muted)'
                  }`}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-(--text-primary)">Maintenance Mode</div>
                    <div className="text-[10px] text-(--text-muted)">Disables all non-admin features when enabled</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAppSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    appSettings.maintenanceMode ? 'bg-red-500' : 'bg-(--border-default)'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    appSettings.maintenanceMode ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Global Announcement */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
                  <Megaphone size={15} className="text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
                  Global Announcement Banner
                </div>
                <textarea
                  value={appSettings.globalAnnouncement || ''}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, globalAnnouncement: e.target.value }))}
                  placeholder="Enter a message to show all users as a top banner (leave empty to hide)..."
                  rows={2}
                  className="w-full bg-(--bg-base) border border-(--border-default) rounded-xl px-4 py-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors resize-none"
                />
              </div>

              {/* Max Quiz Questions */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-(--bg-elevated) border border-(--border-default)">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-(--text-primary)">Max Quiz Questions</div>
                    <div className="text-[10px] text-(--text-muted)">Limit the maximum number of AI-generated quiz questions</div>
                  </div>
                </div>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={appSettings.maxQuizQuestions || 20}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, maxQuizQuestions: parseInt(e.target.value) || 20 }))}
                  className="w-16 bg-(--bg-base) border border-(--border-default) rounded-lg px-2 py-1.5 text-sm text-center font-mono text-(--text-primary) focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                />
              </div>

              {/* Save button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30))] text-white text-sm font-semibold shadow-lg shadow-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.25)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {settingsLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : settingsSaved ? (
                  <><CheckCircle2 size={16} /> Saved!</>
                ) : (
                  <><Settings2 size={16} /> Save Settings</>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
