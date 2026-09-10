import { useQuiz } from '../contexts/QuizContext';
import QuizLibrary from '../components/Quiz/QuizLibrary';
import QuizSession from '../components/Quiz/QuizSession';

export default function Quiz() {
  const { activeQuizId, loading } = useQuiz();

  if (loading) {
    return (
      <div className="flex-1 h-full w-full bg-(--bg-primary) overflow-hidden flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-(--border-default) border-t-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-full animate-spin" />
          <span className="text-xs text-(--text-muted)">Loading quizzes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full bg-(--bg-primary) overflow-hidden flex flex-col">
      {activeQuizId ? <QuizSession /> : <QuizLibrary />}
    </div>
  );
}
