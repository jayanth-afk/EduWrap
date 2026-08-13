import { motion } from 'framer-motion';
import { CheckCircle2, Award, MessageSquare, EyeOff } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import VoteControls from './VoteControls';

export default function AnswerCard({ answer, doubtId, userVote, onVote, isBest = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 transition-all ${
        isBest
          ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.08)]'
          : 'bg-(--bg-glass) border-(--border-default)'
      }`}
    >
      {/* Best Answer Banner */}
      {isBest && (
        <div className="flex items-center gap-2 mb-3 text-green-500 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 size={14} />
          Best Answer
        </div>
      )}

      <div className="flex gap-4">
        {/* Vote */}
        <div className="shrink-0 hidden sm:block">
          <VoteControls
            upvotes={answer.upvotes}
            downvotes={0}
            userVote={userVote}
            onVote={(dir) => onVote?.(doubtId, answer.id, dir)}
            size="sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            {answer.author.isAnonymous ? (
              <div className="w-7 h-7 rounded-full bg-(--bg-elevated) border border-(--border-default) flex items-center justify-center">
                <EyeOff size={13} className="text-(--text-muted)" />
              </div>
            ) : (
              <Avatar initials={answer.author.initials} size="sm" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-(--text-primary)">
                  {answer.author.isAnonymous ? 'Anonymous' : answer.author.name}
                </span>
                {answer.author.isAnonymous && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-(--text-muted) bg-(--bg-elevated) border border-(--border-default) px-1.5 py-0.5 rounded-full">
                    Anon
                  </span>
                )}
                {answer.isVerified && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-[color:oklch(0.58_0.22_var(--accent-hue))] bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] px-1.5 py-0.5 rounded-full">
                    <Award size={9} /> Verified
                  </span>
                )}
              </div>
              <span className="text-[10px] text-(--text-muted)">{answer.createdAt}</span>
            </div>
          </div>

          {/* Body */}
          <div className="text-sm text-(--text-primary) leading-relaxed whitespace-pre-line mb-3">
            {answer.body}
          </div>

          {/* Mobile vote + stats */}
          <div className="flex items-center justify-between">
            <div className="flex sm:hidden">
              <VoteControls upvotes={answer.upvotes} downvotes={0} userVote={userVote} onVote={(dir) => onVote?.(doubtId, answer.id, dir)} size="sm" vertical={false} />
            </div>
            {answer.replies?.length > 0 && (
              <span className="text-xs text-(--text-muted) flex items-center gap-1">
                <MessageSquare size={12} /> {answer.replies.length} {answer.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          {/* Nested Replies */}
          {answer.replies?.length > 0 && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-(--border-default) space-y-3">
              {answer.replies.map(reply => (
                <div key={reply.id} className="flex items-start gap-2">
                  <Avatar initials={reply.author.initials} size="xs" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{reply.author.name}</span>
                      <span className="text-[10px] text-(--text-muted)">{reply.createdAt}</span>
                    </div>
                    <p className="text-xs text-(--text-secondary) mt-0.5">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
