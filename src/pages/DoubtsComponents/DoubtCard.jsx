import { motion } from 'framer-motion';
import { MessageSquare, Eye, CheckCircle2, Bookmark, EyeOff } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import VoteControls from './VoteControls';

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function DoubtCard({ doubt, userVote, isSaved, onVote, onSave, onClick, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="group relative bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-3xl p-5 sm:p-6 hover:shadow-(--shadow-glow) hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Hover glow orb */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[color:oklch(0.58_0.22_var(--accent-hue))] opacity-0 blur-[60px] group-hover:opacity-10 transition-opacity duration-500 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="flex gap-4 relative z-10">
        {/* Vote Controls — Left */}
        <div className="hidden sm:flex shrink-0 pt-1">
          <VoteControls
            upvotes={doubt.upvotes}
            downvotes={doubt.downvotes}
            userVote={userVote}
            onVote={(dir) => onVote?.(doubt.id, dir)}
          />
        </div>

        {/* Content — Right */}
        <div className="flex-1 min-w-0">
          {/* Top: Category + Difficulty + Resolved */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="accent" size="sm">{doubt.category}</Badge>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${DIFFICULTY_STYLES[doubt.difficulty]}`}>
              {doubt.difficulty}
            </span>
            {doubt.isResolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                <CheckCircle2 size={10} /> Solved
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold mb-1.5 group-hover:text-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
            {doubt.title}
          </h3>

          {/* Preview */}
          <p className="text-sm text-(--text-secondary) line-clamp-2 mb-3 leading-relaxed">{doubt.body}</p>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {doubt.tags.map(tag => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-(--bg-elevated) border border-(--border-default) text-(--text-muted)">
                {tag}
              </span>
            ))}
          </div>

          {/* Bottom: Stats + Author */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-(--text-muted)">
              {/* Mobile vote */}
              <div className="flex sm:hidden items-center gap-1">
                <VoteControls upvotes={doubt.upvotes} downvotes={doubt.downvotes} userVote={userVote} onVote={(dir) => onVote?.(doubt.id, dir)} size="sm" vertical={false} />
              </div>
              <span className="hidden sm:flex items-center gap-1">
                <MessageSquare size={13} /> {doubt.answers.length} {doubt.answers.length === 1 ? 'answer' : 'answers'}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={13} /> {doubt.viewCount}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onSave?.(doubt.id); }}
                className={`p-1 rounded-lg transition-colors ${isSaved ? 'text-[color:oklch(0.58_0.22_var(--accent-hue))]' : 'text-(--text-muted) hover:text-(--text-primary)'}`}
                aria-label="Save doubt"
              >
                <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              <div className="flex items-center gap-2">
                {doubt.author.isAnonymous ? (
                  <div className="w-6 h-6 rounded-full bg-(--bg-elevated) border border-(--border-default) flex items-center justify-center">
                    <EyeOff size={12} className="text-(--text-muted)" />
                  </div>
                ) : (
                  <Avatar initials={doubt.author.initials} size="xs" />
                )}
                <span className="text-xs text-(--text-secondary) hidden sm:inline">
                  {doubt.author.isAnonymous ? 'Anonymous' : doubt.author.name}
                </span>
                {doubt.author.isAnonymous && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-(--text-muted) bg-(--bg-elevated) border border-(--border-default) px-1.5 py-0.5 rounded-full hidden sm:inline">
                    Anon
                  </span>
                )}
                <span className="text-[10px] text-(--text-muted)">· {doubt.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
