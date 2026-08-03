import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { getPDFText, processPDFFromUrl } from '../services/pdfService';
import { generateSmartQuiz } from '../services/groqService';
import {
  quizzesRef,
  quizDoc,
  createDoc,
  patchDoc,
  removeDoc,
  safeOnSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from '../firebase/firestore';

const QuizContext = createContext(undefined);

export function QuizProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [quizzes, setQuizzes] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── REAL-TIME: Load user's quizzes (limit 30 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) {
      setQuizzes([]);
      setLoading(false);
      return;
    }

    const q = query(quizzesRef, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setQuizzes(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        completedAt: d.data().completedAt?.toDate?.()?.toISOString() || d.data().completedAt,
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
      })));
      setLoading(false);
    }, (err) => {
      console.error('Quizzes listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── GENERATE QUIZ FROM PDFs ───
  const generateQuiz = async (selectedPdfIds, selectedPdfTitles, count, allNotes = []) => {
    if (!uid) return null;

    let combinedText = '';
    for (const id of selectedPdfIds) {
      try {
        let text = await getPDFText(id);

        // If text is not cached yet (PDF was never viewed), force-extract it now
        if (!text) {
          const note = allNotes.find(n => n.id === id);
          if (note?.url) {
            console.info(`[EduWrap] Force-extracting PDF text for quiz: ${note.title || id}`);
            text = await processPDFFromUrl(id, note.url);
          }
        }

        if (text) combinedText += text + '\n\n';
      } catch (err) {
        console.error('Failed to read text for pdf:', id, err);
      }
    }

    let questions = [];
    if (combinedText.trim().length > 50) {
      questions = await generateSmartQuiz(combinedText, count);
    }

    if (questions.length === 0) return null;

    const title = selectedPdfTitles.length > 1
      ? `Quiz from ${selectedPdfTitles.length} PDFs`
      : `Quiz: ${selectedPdfTitles[0] || 'Custom'}`;

    const quizId = await createDoc(quizzesRef, {
      userId: uid,
      title,
      description: `${questions.length} questions from your study materials.`,
      questions,
      totalQuestions: questions.length,
      score: null,
      answers: [],
      completedAt: null,
    });

    return quizId;
  };

  // ─── SUBMIT ANSWER ───
  const submitAnswer = async (quizId, questionIndex, selectedOptionIndex) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const newAnswers = [...(quiz.answers || [])];
    newAnswers[questionIndex] = selectedOptionIndex;

    await patchDoc(quizDoc(quizId), { answers: newAnswers });
  };

  // ─── FINISH QUIZ ───
  const finishQuiz = async (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const correct = quiz.questions.reduce((acc, q, i) => {
      return acc + ((quiz.answers || [])[i] === q.correctIndex ? 1 : 0);
    }, 0);

    await patchDoc(quizDoc(quizId), {
      score: correct,
      completedAt: serverTimestamp(),
    });
  };

  // ─── RESET QUIZ ───
  const resetQuiz = async (quizId) => {
    await patchDoc(quizDoc(quizId), {
      score: null,
      answers: [],
      completedAt: null,
    });
  };

  // ─── DELETE QUIZ ───
  const deleteQuiz = async (quizId) => {
    await removeDoc(quizDoc(quizId));
    if (activeQuizId === quizId) setActiveQuizId(null);
  };

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        activeQuizId,
        setActiveQuizId,
        generateQuiz,
        submitAnswer,
        finishQuiz,
        resetQuiz,
        deleteQuiz,
        loading,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
