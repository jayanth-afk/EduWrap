import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';

export default function Flashcard({ front, back, isFlipped: controlledFlipped, onFlip }) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleToggle = (e) => {
    e?.stopPropagation?.();
    if (onFlip) {
      onFlip(!isFlipped);
    } else {
      setInternalFlipped(!isFlipped);
    }
  };

  return (
    <div 
      className="w-full h-full cursor-pointer relative select-none"
      style={{ perspective: 1200 }}
      onClick={handleToggle}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 w-full h-full bg-(--bg-elevated) rounded-3xl border border-(--border-subtle) flex flex-col items-center justify-between p-8 md:p-10 text-center shadow-xl will-change-transform"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Decorative corner gradient */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.08)] to-transparent rounded-br-full rounded-tl-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.05)] to-transparent rounded-tl-full rounded-br-3xl pointer-events-none" />
          
          <div className="text-xs font-bold uppercase tracking-widest text-[color:oklch(0.58_0.22_var(--accent-hue))] relative z-10">
            Question
          </div>

          <div className="my-auto relative z-10 px-2">
            <h3 
              className="text-xl md:text-2xl lg:text-3xl text-(--text-primary) font-semibold tracking-tight leading-relaxed whitespace-pre-line" 
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {front}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-(--text-muted) relative z-10 font-medium bg-(--bg-glass) px-3 py-1.5 rounded-full border border-(--border-subtle)">
            <RotateCw className="w-3.5 h-3.5 text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
            <span>Click to flip</span>
          </div>
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full bg-(--bg-elevated) rounded-3xl border-2 border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.4)] flex flex-col items-center justify-between p-8 md:p-10 text-center shadow-xl will-change-transform"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Accent glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.06)] to-transparent rounded-3xl pointer-events-none" />
          
          <div className="text-xs font-bold uppercase tracking-widest text-[color:oklch(0.58_0.22_var(--accent-hue))] relative z-10">
            Answer
          </div>

          <div className="my-auto relative z-10 px-2">
            <p className="text-lg md:text-xl lg:text-2xl text-(--text-primary) leading-relaxed whitespace-pre-line font-medium">
              {back}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-(--text-muted) relative z-10 font-medium bg-(--bg-glass) px-3 py-1.5 rounded-full border border-(--border-subtle)">
            <RotateCw className="w-3.5 h-3.5 text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
            <span>Click to flip back</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
