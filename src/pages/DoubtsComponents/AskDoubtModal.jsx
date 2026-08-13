import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle2, Sparkles, EyeOff, Eye } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';
import { useUser } from '../../contexts/UserContext';

const CATEGORIES = ['DSA', 'Physics', 'Chemistry', 'AI/ML', 'Maths', 'Coding', 'Interview Prep', 'Competitive'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const DIFF_COLORS = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/30',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export default function AskDoubtModal({ isOpen, onClose, onSubmit }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: '',
    tags: '',
    difficulty: 'beginner',
    isAnonymous: false,
  });
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category) return;
    setSubmitState('loading');

    setTimeout(() => {
      const newId = onSubmit({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        isAnonymous: formData.isAnonymous,
        author: { id: 'me', name: user?.name || 'You', initials: (user?.name || 'Y').charAt(0).toUpperCase() },
        scope: 'global',
      });
      setSubmitState('success');
      setTimeout(() => {
        setFormData({ title: '', body: '', category: '', tags: '', difficulty: 'beginner', isAnonymous: false });
        setSubmitState('idle');
        onClose(newId);
      }, 1200);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => submitState === 'idle' && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-(--bg-elevated) border border-(--border-strong) rounded-3xl shadow-(--shadow-lg) overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            {submitState === 'idle' && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-default) shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center shadow-(--shadow-glow)">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Ask a Doubt</h2>
                    <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">The community is here to help</p>
                  </div>
                </div>
                <IconButton size="sm" onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
              </div>
            )}

            {/* Form */}
            {submitState === 'idle' && (
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Why does quicksort have O(n²) worst case?"
                    className="w-full bg-(--bg-glass) border border-(--border-default) rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">Details</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData(p => ({ ...p, body: e.target.value }))}
                    placeholder="Explain your doubt in detail. You can use markdown for formatting..."
                    rows={4}
                    className="w-full bg-(--bg-glass) border border-(--border-default) rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-2">Category *</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, category: cat }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          formData.category === cat
                            ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] shadow-(--shadow-glow)'
                            : 'bg-(--bg-glass) text-(--text-secondary) border-(--border-default) hover:border-(--border-strong)'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, difficulty: diff }))}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                          formData.difficulty === diff
                            ? DIFF_COLORS[diff]
                            : 'bg-(--bg-glass) text-(--text-secondary) border-(--border-default)'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))}
                    placeholder="e.g. sorting, complexity, algorithms"
                    className="w-full bg-(--bg-glass) border border-(--border-default) rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                  />
                  {formData.tags && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {formData.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-(--bg-elevated) border border-(--border-default) text-(--text-muted)">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-(--bg-glass) border border-(--border-default)">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      formData.isAnonymous
                        ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))]'
                        : 'bg-(--bg-elevated) text-(--text-muted)'
                    }`}>
                      {formData.isAnonymous ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-(--text-primary)">Post Anonymously</div>
                      <div className="text-[10px] text-(--text-muted)">Your identity will be hidden from everyone</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, isAnonymous: !p.isAnonymous }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      formData.isAnonymous
                        ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue))]'
                        : 'bg-(--border-default)'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                      formData.isAnonymous ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <Button type="submit" variant="primary" className="w-full h-12 text-base shadow-(--shadow-glow)" disabled={!formData.title.trim() || !formData.category}>
                  <Sparkles size={18} className="mr-2" /> Publish Doubt
                </Button>
              </form>
            )}

            {/* Loading */}
            {submitState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-(--border-default) border-t-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-full animate-spin mb-4" />
                <p className="font-medium text-(--text-primary)">Publishing your doubt...</p>
              </div>
            )}

            {/* Success */}
            {submitState === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="font-bold text-lg mb-1">Your doubt is live!</p>
                <p className="text-sm text-(--text-secondary)">The community will start responding shortly.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
