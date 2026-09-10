import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Stack = forwardRef(function Stack({ cards, renderCard, onSwipeRight, onSwipeLeft, onEmpty }, ref) {
  const [index, setIndex] = useState(0);
  const [flippedId, setFlippedId] = useState(null);
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastFlipTimeRef = useRef(0);

  const triggerFlip = (card) => {
    if (!card) return;
    const now = Date.now();
    if (now - lastFlipTimeRef.current < 220) return;
    lastFlipTimeRef.current = now;
    setFlippedId((prev) => (prev === card.id ? null : card.id));
  };

  const swipeRight = () => {
    if (index < cards.length) {
      if (onSwipeRight) onSwipeRight(cards[index]);
      setFlippedId(null);
      setIndex((prev) => prev + 1);
    }
  };

  const swipeLeft = () => {
    if (index < cards.length) {
      if (onSwipeLeft) onSwipeLeft(cards[index]);
      setFlippedId(null);
      setIndex((prev) => prev + 1);
    }
  };

  useImperativeHandle(ref, () => ({
    flip: () => {
      if (cards[index]) triggerFlip(cards[index]);
    },
    swipeRight,
    swipeLeft,
    isFlipped: cards[index] ? flippedId === cards[index].id : false,
  }));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (cards[index]) triggerFlip(cards[index]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        swipeRight();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        swipeLeft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, cards, onSwipeRight, onSwipeLeft]);

  // Notify parent when empty
  useEffect(() => {
    if (index >= cards.length && onEmpty) {
      onEmpty();
    }
  }, [index, cards.length, onEmpty]);

  if (index >= cards.length) {
    return null;
  }

  // Sliced cards to show depth stack
  const activeCards = cards.slice(index, index + 3);

  const handlePointerDown = (e) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDraggingRef.current = false;
  };

  const handlePointerUp = (e, card) => {
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;
    // If mouse/pointer didn't drag and click was short, flip!
    if (!isDraggingRef.current && dx < 10 && dy < 10 && dt < 500) {
      triggerFlip(card);
    }
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 80;
    if (info.offset.x > swipeThreshold) {
      swipeRight();
    } else if (info.offset.x < -swipeThreshold) {
      swipeLeft();
    } else {
      // Tap detected via Framer Motion drag end
      if (Math.abs(info.offset.x) < 8 && Math.abs(info.offset.y) < 8) {
        triggerFlip(cards[index]);
      }
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  return (
    <div className="relative w-80 h-[26rem] md:w-[32rem] md:h-[36rem] flex items-center justify-center [perspective:1000px]">
      <AnimatePresence>
        {[...activeCards].reverse().map((card, idx) => {
          const isTop = idx === activeCards.length - 1;
          const cardIndex = activeCards.length - 1 - idx; // 0 for top, 1 for middle, 2 for back

          // Depth styling
          const scale = 1 - cardIndex * 0.05;
          const yOffset = cardIndex * 20;
          const zIndex = 10 - cardIndex;

          return (
            <motion.div
              key={card.id}
              className="absolute w-full h-full will-change-transform"
              style={{ zIndex }}
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{
                scale,
                y: yOffset,
                opacity: isTop ? 1 : 0.7,
              }}
              exit={{ 
                x: 300, 
                opacity: 0, 
                scale: 0.5, 
                transition: { duration: 0.2 } 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onPointerDown={isTop ? handlePointerDown : undefined}
              onPointerUp={isTop ? (e) => handlePointerUp(e, card) : undefined}
              onDragStart={isTop ? handleDragStart : undefined}
              onDragEnd={isTop ? handleDragEnd : undefined}
              whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            >
              <div className="w-full h-full pointer-events-auto relative">
                {renderCard(card, flippedId === card.id, () => triggerFlip(card))}
                {/* Blur overlay on non-top cards so text doesn't bleed through */}
                {!isTop && (
                  <div className="absolute inset-0 rounded-3xl backdrop-blur-md bg-(--bg-elevated)/60 pointer-events-none" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

export default Stack;
