import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Eye, Bookmark, Sparkles, Send, EyeOff } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import VoteControls from './VoteControls';
import AnswerCard from './AnswerCard';
import { useUser } from '../../contexts/UserContext';

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function DoubtThread({ doubt, userVotes, onVoteDoubt, onVoteAnswer, onAddAnswer, onBack }) {
  const { user } = useUser();
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymousAnswer, setIsAnonymousAnswer] = useState(false);

  const bestAnswer = doubt.answers.find(a => a.isBestAnswer);
  const otherAnswers = doubt.answers.filter(a => !a.isBestAnswer);

  const handleSubmitAnswer = () => {
    if (!answerText.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onAddAnswer(doubt.id, {
        author: { id: 'me', name: user?.name || 'You', initials: (user?.name || 'Y').charAt(0).toUpperCase() },
        body: answerText,
        isAnonymous: isAnonymousAnswer,
      });
      setAnswerText('');
      setIsAnonymousAnswer(false);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 pr-1">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-(--text-muted) hover:text-(--text-primary) transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Feed
        </button>

        {/* Question */}
        <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-full blur-[100px] opacity-5 pointer-events-none" />

          <div className="flex gap-4 relative z-10">
            <div className="hidden sm:flex shrink-0">
              <VoteControls upvotes={doubt.upvotes} downvotes={doubt.downvotes} userVote={userVotes[doubt.id]} onVote={(dir) => onVoteDoubt(doubt.id, dir)} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="accent" size="md">{doubt.category}</Badge>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${DIFFICULTY_STYLES[doubt.difficulty]}`}>
                  {doubt.difficulty}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {doubt.title}
              </h1>

              <div className="text-sm text-(--text-primary) leading-relaxed whitespace-pre-line mb-5">
                {doubt.body}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mb-5">
                {doubt.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-(--bg-elevated) border border-(--border-default) text-(--text-muted)">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-(--border-default)">
                <div className="flex items-center gap-3">
                  {doubt.author.isAnonymous ? (
                    <div className="w-8 h-8 rounded-full bg-(--bg-elevated) border border-(--border-default) flex items-center justify-center">
                      <EyeOff size={14} className="text-(--text-muted)" />
                    </div>
                  ) : (
                    <Avatar initials={doubt.author.initials} size="sm" />
                  )}
                  <div>
                    <span className="text-sm font-semibold">
                      {doubt.author.isAnonymous ? 'Anonymous' : doubt.author.name}
                    </span>
                    {doubt.author.isAnonymous && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-(--text-muted) bg-(--bg-elevated) border border-(--border-default) px-1.5 py-0.5 rounded-full ml-2">
                        Anon
                      </span>
                    )}
                    <span className="text-xs text-(--text-muted) ml-2">{doubt.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-(--text-muted)">
                  <span className="flex items-center gap-1"><MessageSquare size={13} /> {doubt.answers.length}</span>
                  <span className="flex items-center gap-1"><Eye size={13} /> {doubt.viewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Answer */}
        {bestAnswer && (
          <div>
            <AnswerCard
              answer={bestAnswer}
              doubtId={doubt.id}
              userVote={userVotes[`${doubt.id}_${bestAnswer.id}`]}
              onVote={onVoteAnswer}
              isBest={true}
            />
          </div>
        )}

        {/* AI Explanation */}
        <div className="bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.05)] border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-[color:oklch(0.58_0.22_var(--accent-hue))] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            AI Explanation
          </div>
          <p className="text-sm text-(--text-secondary) leading-relaxed">
            {doubt.category === 'DSA' && 'This is a classic algorithmic analysis question. The key insight is understanding how pivot selection affects partition balance, which directly determines the recursion depth and therefore the time complexity.'}
            {doubt.category === 'Physics' && 'This is one of the most common misconceptions in Newtonian mechanics. The resolution lies in carefully identifying which object each force acts upon — action-reaction pairs always act on different bodies.'}
            {doubt.category === 'Maths' && 'This proof technique (proof by contradiction) is fundamental in mathematics. The key is assuming the opposite of what you want to prove and showing it leads to a logical impossibility.'}
            {doubt.category === 'Chemistry' && 'Catalysts provide an alternative reaction pathway with lower activation energy. They affect reaction rate, not thermodynamic equilibrium position.'}
            {doubt.category === 'AI/ML' && 'Understanding the architectural differences between CNNs and RNNs is fundamental to choosing the right model for your data type — spatial vs. sequential.'}
            {doubt.category === 'Coding' && 'This is a core concept in software engineering. Understanding the underlying principles helps you make better architectural decisions in real-world applications.'}
            {!['DSA', 'Physics', 'Maths', 'Chemistry', 'AI/ML', 'Coding'].includes(doubt.category) && 'AI analysis for this topic is being generated. Check back soon for an intelligent breakdown of this discussion.'}
          </p>
        </div>

        {/* Other Answers */}
        {otherAnswers.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-(--text-muted) mb-4">
              Community Answers ({otherAnswers.length})
            </h3>
            <div className="space-y-4">
              {otherAnswers.map(answer => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  doubtId={doubt.id}
                  userVote={userVotes[`${doubt.id}_${answer.id}`]}
                  onVote={onVoteAnswer}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Answer Input */}
      <div className="shrink-0 border-t border-(--border-default) pt-4 mt-2 bg-(--bg-base)">
        <div className="flex gap-3">
          {isAnonymousAnswer ? (
            <div className="w-8 h-8 rounded-full bg-(--bg-elevated) border border-(--border-default) flex items-center justify-center shrink-0 mt-1">
              <EyeOff size={14} className="text-(--text-muted)" />
            </div>
          ) : (
            <Avatar initials={(user?.name || 'Y').charAt(0).toUpperCase()} size="sm" className="shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={isAnonymousAnswer ? 'Write your anonymous answer...' : 'Write your answer...'}
              rows={2}
              className="w-full bg-(--bg-glass) border border-(--border-default) rounded-xl px-4 py-3 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              {/* Anonymous toggle */}
              <button
                type="button"
                onClick={() => setIsAnonymousAnswer(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isAnonymousAnswer
                    ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)]'
                    : 'text-(--text-muted) bg-(--bg-glass) border-(--border-default) hover:text-(--text-primary)'
                }`}
              >
                <EyeOff size={13} />
                {isAnonymousAnswer ? 'Anonymous' : 'Go Anonymous'}
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitAnswer}
                loading={isSubmitting}
                disabled={!answerText.trim()}
                className="shadow-(--shadow-glow)"
              >
                <Send size={14} className="mr-1.5" /> Submit Answer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
