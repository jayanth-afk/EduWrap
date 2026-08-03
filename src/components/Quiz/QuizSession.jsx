import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '../../contexts/QuizContext';
import { ArrowLeft, ArrowRight, Check, X, Trophy, RotateCcw, Sparkles, Lightbulb, BrainCircuit } from 'lucide-react';

export default function QuizSession() {
  const { quizzes, activeQuizId, setActiveQuizId, submitAnswer, finishQuiz, resetQuiz } = useQuiz();
  const quiz = quizzes.find(q => q.id === activeQuizId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  if (!quiz) return null;

  const alreadyCompleted = quiz.score !== null;
  const question = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelectOption = (optionIndex) => {
    if (showResult) return;
    setSelectedOption(optionIndex);
    setShowResult(true);
    submitAnswer(quiz.id, currentIndex, optionIndex);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      finishQuiz(quiz.id);
      setIsFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const handleRetake = () => {
    resetQuiz(quiz.id);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setIsFinished(false);
  };

  // ─── RESULTS SCREEN ──────────────────────────
  if (isFinished || alreadyCompleted) {
    const updatedQuiz = quizzes.find(q => q.id === activeQuizId);
    const score = updatedQuiz?.score ?? 0;
    const total = updatedQuiz?.totalQuestions ?? totalQuestions;
    const percent = Math.round((score / total) * 100);
    const grade = percent >= 90 ? 'A+' : percent >= 80 ? 'A' : percent >= 70 ? 'B' :
                  percent >= 60 ? 'C' : percent >= 50 ? 'D' : 'F';
    const gradeColor = percent >= 70 ? 'text-green-500' : percent >= 50 ? 'text-orange-500' : 'text-red-500';
    const gradeBg = percent >= 70 ? 'from-green-500/10 to-emerald-500/5' : percent >= 50 ? 'from-orange-500/10 to-amber-500/5' : 'from-red-500/10 to-rose-500/5';

    return (
      <div className="flex-1 w-full h-[calc(100vh-4rem)] flex flex-col bg-(--bg-primary) rounded-tl-xl border-l border-t border-(--border-subtle) overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-(--border-subtle) flex items-center shrink-0 bg-(--bg-glass) backdrop-blur-md">
          <button
            onClick={() => setActiveQuizId(null)}
            className="p-2 -ml-2 rounded-xl text-(--text-secondary) hover:bg-(--bg-glass) hover:text-(--text-primary) transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="ml-3 font-semibold text-lg truncate" style={{ fontFamily: 'var(--font-display)' }}>{quiz.title}</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-lg w-full"
          >
            {/* Trophy */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br ${gradeBg}`}
            >
              <Trophy className={`w-14 h-14 ${gradeColor}`} />
            </motion.div>

            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Quiz <span className="bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.68_0.17_var(--accent-hue))] text-transparent bg-clip-text">Complete!</span>
            </h2>
            <p className="text-(--text-secondary) mb-8">Here's how you performed:</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Grade', value: grade, color: gradeColor },
                { label: 'Correct', value: score, color: 'text-(--text-primary)' },
                { label: 'Total', value: total, color: 'text-(--text-primary)' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) p-5 rounded-2xl"
                >
                  <div className={`text-4xl font-bold mb-1 ${stat.color}`} style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                  <div className="text-xs text-(--text-muted) uppercase font-bold tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-(--border-default) rounded-full h-2.5 mb-8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  percent >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                  percent >= 50 ? 'bg-gradient-to-r from-orange-500 to-amber-400' :
                  'bg-gradient-to-r from-red-500 to-rose-400'
                }`}
              />
            </div>

            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveQuizId(null)}
                className="bg-(--bg-glass) backdrop-blur-md border border-(--border-subtle) text-(--text-primary) px-6 py-3 rounded-2xl font-semibold hover:shadow-(--shadow-glow) transition-all cursor-pointer"
              >
                Back to Library
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRetake}
                className="flex items-center gap-2 bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30))] text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── QUESTION SCREEN ──────────────────────────
  return (
    <div className="flex-1 w-full h-[calc(100vh-4rem)] flex flex-col bg-(--bg-primary) rounded-tl-xl border-l border-t border-(--border-subtle) overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 border-b border-(--border-subtle) flex items-center justify-between shrink-0 bg-(--bg-glass) backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveQuizId(null)}
            className="p-2 -ml-2 rounded-xl text-(--text-secondary) hover:bg-(--bg-glass) hover:text-(--text-primary) transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-lg truncate max-w-[200px] md:max-w-sm" style={{ fontFamily: 'var(--font-display)' }}>{quiz.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-(--text-muted) bg-(--bg-glass) backdrop-blur-md px-4 py-1.5 rounded-full border border-(--border-subtle)">
            <span className="text-[color:oklch(0.58_0.22_var(--accent-hue))]">{currentIndex + 1}</span> / {totalQuestions}
          </div>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="w-full bg-(--border-default) h-1">
        <motion.div
          className="h-full bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.68_0.17_var(--accent-hue))]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Question Area */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            {/* Question card */}
            <div className="bg-(--bg-glass) backdrop-blur-xl rounded-3xl p-8 border border-(--border-subtle) mb-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.06)] to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2 text-xs font-bold text-[color:oklch(0.58_0.22_var(--accent-hue))] mb-4 uppercase tracking-widest relative z-10">
                <Sparkles className="w-4 h-4" />
                Question {currentIndex + 1}
              </div>
              <p className="text-xl md:text-2xl font-semibold text-(--text-primary) leading-relaxed whitespace-pre-line relative z-10" style={{ fontFamily: 'var(--font-display)' }}>
                {question.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isCorrect = idx === question.correctIndex;
                const isSelected = selectedOption === idx;
                const optionLetters = ['A', 'B', 'C', 'D'];

                let cardClass = 'bg-(--bg-glass) backdrop-blur-xl border-(--border-subtle) hover:border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] hover:shadow-(--shadow-glow) cursor-pointer';
                let circleClass = 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))]';
                let textClass = 'text-(--text-primary)';

                if (showResult) {
                  if (isCorrect) {
                    cardClass = 'bg-green-500/8 backdrop-blur-xl border-green-500/30 shadow-lg shadow-green-500/10';
                    circleClass = 'bg-green-500 text-white';
                    textClass = 'text-green-600 dark:text-green-400 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    cardClass = 'bg-red-500/8 backdrop-blur-xl border-red-500/30 shadow-lg shadow-red-500/10';
                    circleClass = 'bg-red-500 text-white';
                    textClass = 'text-red-600 dark:text-red-400';
                  } else {
                    cardClass = 'bg-(--bg-glass) backdrop-blur-xl border-(--border-subtle) opacity-40';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    whileHover={!showResult ? { scale: 1.01, y: -2 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                    onClick={() => handleSelectOption(idx)}
                    disabled={showResult}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${cardClass}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${circleClass}`}>
                      {showResult && isCorrect ? <Check className="w-5 h-5" /> :
                       showResult && isSelected && !isCorrect ? <X className="w-5 h-5" /> :
                       optionLetters[idx]}
                    </div>
                    <span className={`text-lg font-medium transition-colors ${textClass}`}>
                      {option}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* AI Explanation */}
            {showResult && question.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6 p-5 rounded-2xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.06)] border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)] backdrop-blur-md"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[color:oklch(0.58_0.22_var(--accent-hue))] uppercase tracking-wider mb-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI Explanation</span>
                </div>
                <p className="text-sm text-(--text-secondary) leading-relaxed">
                  {question.explanation}
                </p>
              </motion.div>
            )}

            {/* Next button */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30))] text-white px-8 py-3.5 rounded-2xl font-semibold shadow-lg shadow-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] cursor-pointer text-lg"
                >
                  {currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
