import { useState, useRef } from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { ArrowLeft, Check, X, RotateCcw, RotateCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Stack from '../ui/Stack';
import Flashcard from './Flashcard';

export default function StudyMode() {
  const { decks, activeDeckId, setActiveDeckId, updateCardStatus, updateDeckLastStudied } = useFlashcards();
  const deck = decks.find(d => d.id === activeDeckId);
  const stackRef = useRef(null);
  
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, learning: 0 });

  if (!deck) return null;

  const cardsToStudy = deck.cards.filter(c => c.status !== 'known');

  const handleSwipeRight = (card) => {
    updateCardStatus(deck.id, card.id, 'known');
    setSessionStats(prev => ({ ...prev, known: prev.known + 1 }));
  };

  const handleSwipeLeft = (card) => {
    updateCardStatus(deck.id, card.id, 'learning');
    setSessionStats(prev => ({ ...prev, learning: prev.learning + 1 }));
  };

  const handleEmpty = () => {
    updateDeckLastStudied(deck.id);
    setIsFinished(true);
  };

  const handleReset = () => {
    deck.cards.forEach(c => updateCardStatus(deck.id, c.id, 'new'));
    setIsFinished(false);
    setSessionStats({ known: 0, learning: 0 });
  };

  const totalCards = deck.cards.length;
  const studiedCards = sessionStats.known + sessionStats.learning;
  const progressPercent = totalCards > 0 ? Math.round((studiedCards / totalCards) * 100) : 0;

  return (
    <div className="flex-1 w-full h-[calc(100vh-4rem)] flex flex-col bg-(--bg-primary) rounded-tl-xl border-l border-t border-(--border-subtle) overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-glass) backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveDeckId(null)}
            className="p-2 -ml-2 rounded-xl text-(--text-secondary) hover:bg-(--bg-glass) hover:text-(--text-primary) transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-lg truncate max-w-[200px] md:max-w-sm" style={{ fontFamily: 'var(--font-display)' }}>{deck.title}</h2>
        </div>
        {!isFinished && (
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-(--text-muted) bg-(--bg-glass) backdrop-blur-md px-4 py-1.5 rounded-full border border-(--border-subtle)">
              <span className="text-[color:oklch(0.58_0.22_var(--accent-hue))]">{cardsToStudy.length}</span> remaining
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-(--border-default) h-1">
        <motion.div
          className="h-full bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.68_0.17_var(--accent-hue))]"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4">
        {cardsToStudy.length === 0 && !isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>All Caught Up!</h2>
            <p className="text-(--text-secondary) mb-8">You've mastered all the cards in this deck.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleReset}
              className="bg-(--bg-glass) backdrop-blur-md border border-(--border-subtle) text-(--text-primary) px-6 py-3 rounded-2xl font-semibold hover:shadow-(--shadow-glow) transition-all cursor-pointer"
            >
              Reset Deck & Study Again
            </motion.button>
          </motion.div>
        ) : isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-lg w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] to-transparent rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-12 h-12 text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Session <span className="bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.68_0.17_var(--accent-hue))] text-transparent bg-clip-text">Complete</span>
            </h2>
            <p className="text-(--text-secondary) mb-8">Great job! Here's how you did:</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold text-green-500 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{sessionStats.known}</div>
                <div className="text-xs text-(--text-muted) uppercase font-bold tracking-wider">Mastered</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) p-6 rounded-2xl"
              >
                <div className="text-4xl font-bold text-orange-500 mb-1" style={{ fontFamily: 'var(--font-display)' }}>{sessionStats.learning}</div>
                <div className="text-xs text-(--text-muted) uppercase font-bold tracking-wider">Learning</div>
              </motion.div>
            </div>

            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveDeckId(null)}
                className="bg-(--bg-glass) backdrop-blur-md border border-(--border-subtle) text-(--text-primary) px-6 py-3 rounded-2xl font-semibold hover:shadow-(--shadow-glow) transition-all cursor-pointer"
              >
                Back to Library
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleReset}
                className="flex items-center gap-2 bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30))] text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Study Again
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="text-center text-(--text-muted) text-sm mb-8 font-medium flex items-center gap-2 bg-(--bg-glass) backdrop-blur-md px-4 py-2 rounded-full border border-(--border-subtle)">
              <span>Click to flip</span>
              <span className="text-(--border-default)">•</span>
              <span className="text-green-500">Swipe Right = Known</span>
              <span className="text-(--border-default)">•</span>
              <span className="text-orange-500">Swipe Left = Learning</span>
            </div>
            
            <Stack 
              ref={stackRef}
              cards={cardsToStudy}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onEmpty={handleEmpty}
              renderCard={(card, isFlipped, onFlip) => (
                <Flashcard 
                  front={card.front} 
                  back={card.back} 
                  isFlipped={isFlipped} 
                  onFlip={onFlip} 
                />
              )}
            />

            <div className="flex items-center gap-8 md:gap-12 mt-8 md:mt-10 w-full max-w-md justify-center">
              {/* Learning Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => stackRef.current?.swipeLeft()}
                className="flex flex-col items-center group cursor-pointer"
                title="Mark as Learning (Left Arrow)"
              >
                <div className="w-14 h-14 rounded-full border-2 border-orange-500/30 flex items-center justify-center text-orange-500 mb-2 bg-orange-500/5 group-hover:bg-orange-500/20 group-hover:border-orange-500/60 transition-all backdrop-blur-md shadow-sm">
                  <X className="w-6 h-6" />
                </div>
                <span className="text-xs text-(--text-muted) group-hover:text-orange-400 font-semibold uppercase tracking-wider transition-colors">Learning</span>
              </motion.button>

              {/* Flip Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => stackRef.current?.flip()}
                className="flex flex-col items-center group cursor-pointer"
                title="Flip Card (Spacebar)"
              >
                <div className="w-12 h-12 rounded-full border border-(--border-subtle) flex items-center justify-center text-(--text-secondary) mb-2 bg-(--bg-glass) group-hover:bg-(--bg-elevated) group-hover:text-[color:oklch(0.58_0.22_var(--accent-hue))] group-hover:border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.4)] transition-all backdrop-blur-md shadow-sm">
                  <RotateCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                </div>
                <span className="text-xs text-(--text-muted) group-hover:text-(--text-primary) font-semibold uppercase tracking-wider transition-colors">Flip</span>
              </motion.button>

              {/* Known Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => stackRef.current?.swipeRight()}
                className="flex flex-col items-center group cursor-pointer"
                title="Mark as Known (Right Arrow)"
              >
                <div className="w-14 h-14 rounded-full border-2 border-green-500/30 flex items-center justify-center text-green-500 mb-2 bg-green-500/5 group-hover:bg-green-500/20 group-hover:border-green-500/60 transition-all backdrop-blur-md shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-xs text-(--text-muted) group-hover:text-green-400 font-semibold uppercase tracking-wider transition-colors">Known</span>
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
