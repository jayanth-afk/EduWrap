import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { getPDFText, processPDFFromUrl } from '../services/pdfService';
import { generateSmartQuiz } from '../services/groqService';
import { generateQuizQuestions } from '../services/questionGenerator';
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

export const DEFAULT_QUIZZES = [
  {
    id: 'quiz-dsa',
    userId: 'system',
    title: 'Data Structures & Algorithms Challenge',
    description: '5 conceptual questions on sorting, trees, hashing, and asymptotic complexities.',
    questions: [
      {
        id: 'q-dsa-1',
        question: 'What is the tightest worst-case time complexity of searching for an element in an unsorted array of size n?',
        options: ['O(log n)', 'O(1)', 'O(n)', 'O(n²)'],
        correctIndex: 2,
        correctAnswer: 'O(n)',
        explanation: 'In an unsorted array, you may have to inspect every element from index 0 to n-1 in the worst case.',
      },
      {
        id: 'q-dsa-2',
        question: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
        options: ['Stack', 'Queue', 'Priority Queue', 'Max-Heap'],
        correctIndex: 1,
        correctAnswer: 'Queue',
        explanation: 'A Queue enforces FIFO: elements added first are removed first.',
      },
      {
        id: 'q-dsa-3',
        question: 'What order of nodes is visited during an in-order traversal of a valid Binary Search Tree?',
        options: ['Descending order', 'Strictly ascending order', 'Random level order', 'Post-order sequence'],
        correctIndex: 1,
        correctAnswer: 'Strictly ascending order',
        explanation: 'In-order traversal visits left subtree (smaller), current node, then right subtree (larger), yielding keys in ascending order.',
      },
      {
        id: 'q-dsa-4',
        question: 'Which sorting algorithm guarantees O(n log n) worst-case time complexity and is stable?',
        options: ['QuickSort', 'MergeSort', 'HeapSort', 'SelectionSort'],
        correctIndex: 1,
        correctAnswer: 'MergeSort',
        explanation: 'MergeSort is stable and guarantees O(n log n) in all cases (best, average, and worst).',
      },
      {
        id: 'q-dsa-5',
        question: 'What is the time complexity to insert an element into a binary min-heap with n elements?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctIndex: 1,
        correctAnswer: 'O(log n)',
        explanation: 'Insertion appends to the end and bubbles up along tree height, taking at most O(log n) comparisons and swaps.',
      },
    ],
    totalQuestions: 5,
    score: null,
    answers: [],
    completedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'quiz-os',
    userId: 'system',
    title: 'Operating Systems & Architecture Exam',
    description: '4 questions on processes, concurrency, virtual memory, and deadlocks.',
    questions: [
      {
        id: 'q-os-1',
        question: 'Which component translates virtual addresses to physical RAM addresses at runtime?',
        options: ['DMA Controller', 'Memory Management Unit (MMU)', 'CPU ALU', 'Instruction Register'],
        correctIndex: 1,
        correctAnswer: 'Memory Management Unit (MMU)',
        explanation: 'The MMU is hardware that references the page table to translate virtual memory addresses into physical memory addresses.',
      },
      {
        id: 'q-os-2',
        question: 'Which of the following is NOT one of Coffman’s four deadlock conditions?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption Allowed', 'Circular Wait'],
        correctIndex: 2,
        correctAnswer: 'Preemption Allowed',
        explanation: 'The condition is "No Preemption" (resources cannot be forcibly taken). If preemption is allowed, deadlocks cannot persist.',
      },
      {
        id: 'q-os-3',
        question: 'What happens during a context switch between two processes?',
        options: [
          'The entire disk cache is flushed',
          'Current CPU register state is saved and new process state is restored',
          'All open files are forcibly closed',
          'The motherboard bus frequency resets'
        ],
        correctIndex: 1,
        correctAnswer: 'Current CPU register state is saved and new process state is restored',
        explanation: 'A context switch stores the program counter, registers, and memory mappings of the active process into its PCB and loads the next process.',
      },
      {
        id: 'q-os-4',
        question: 'What is the phenomenon called when an OS spends more time swapping pages than executing user code?',
        options: ['Pipelining', 'Thrashing', 'Starvation', 'Race Condition'],
        correctIndex: 1,
        correctAnswer: 'Thrashing',
        explanation: 'Thrashing occurs when high paging activity overwhelms system throughput.',
      },
    ],
    totalQuestions: 4,
    score: null,
    answers: [],
    completedAt: null,
    createdAt: '2026-09-02T00:00:00.000Z',
  },
  {
    id: 'quiz-dbms',
    userId: 'system',
    title: 'Database Management & SQL Test',
    description: '4 questions on transactions, joins, normalization, and indexing.',
    questions: [
      {
        id: 'q-db-1',
        question: 'In SQL, which clause is used to filter aggregated groups after GROUP BY?',
        options: ['WHERE', 'HAVING', 'FILTER BY', 'LIMIT'],
        correctIndex: 1,
        correctAnswer: 'HAVING',
        explanation: 'WHERE filters rows prior to aggregation; HAVING filters groups created by GROUP BY.',
      },
      {
        id: 'q-db-2',
        question: 'Which property in ACID guarantees that committed data is saved even during a sudden power outage?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correctIndex: 3,
        correctAnswer: 'Durability',
        explanation: 'Durability guarantees that once a transaction commits, its writes persist to non-volatile storage.',
      },
      {
        id: 'q-db-3',
        question: 'What normal form eliminates transitive functional dependencies on the primary key?',
        options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'BCNF'],
        correctIndex: 2,
        correctAnswer: 'Third Normal Form (3NF)',
        explanation: '3NF requires 2NF compliance and ensures no non-prime attribute is transitively dependent on any candidate key.',
      },
      {
        id: 'q-db-4',
        question: 'Why are B+ Trees commonly used for database index structures?',
        options: [
          'They store all keys in random order for security',
          'High fan-out keeps depth low, minimizing disk I/O read operations',
          'They consume zero memory on disk',
          'They only support single-threaded operations'
        ],
        correctIndex: 1,
        correctAnswer: 'High fan-out keeps depth low, minimizing disk I/O read operations',
        explanation: 'B+ Trees have large node capacity (high fan-out), keeping tree depth to 3-4 levels for millions of rows and reducing disk seeks.',
      },
    ],
    totalQuestions: 4,
    score: null,
    answers: [],
    completedAt: null,
    createdAt: '2026-09-03T00:00:00.000Z',
  },
  {
    id: 'quiz-ml',
    userId: 'system',
    title: 'Machine Learning & AI Evaluation',
    description: '3 questions on model training, loss functions, and neural networks.',
    questions: [
      {
        id: 'q-ml-1',
        question: 'What problem occurs when a model performs exceptionally on training data but fails to generalize to test data?',
        options: ['Underfitting', 'Overfitting', 'High Bias', 'Vanishing Gradients'],
        correctIndex: 1,
        correctAnswer: 'Overfitting',
        explanation: 'Overfitting happens when a model learns noise and specifics of training data rather than underlying generalizable trends.',
      },
      {
        id: 'q-ml-2',
        question: 'In binary classification, what is the formula for Precision?',
        options: ['TP / (TP + FN)', 'TP / (TP + FP)', 'TN / (TN + FP)', '(TP + TN) / Total'],
        correctIndex: 1,
        correctAnswer: 'TP / (TP + FP)',
        explanation: 'Precision measures how many of the positively predicted examples were actually positive: TP / (TP + FP).',
      },
      {
        id: 'q-ml-3',
        question: 'Which activation function is defined as f(x) = max(0, x)?',
        options: ['Sigmoid', 'Softmax', 'ReLU (Rectified Linear Unit)', 'Hyperbolic Tangent (Tanh)'],
        correctIndex: 2,
        correctAnswer: 'ReLU (Rectified Linear Unit)',
        explanation: 'ReLU outputs x if positive and 0 if negative, helping alleviate vanishing gradients during backpropagation.',
      },
    ],
    totalQuestions: 3,
    score: null,
    answers: [],
    completedAt: null,
    createdAt: '2026-09-04T00:00:00.000Z',
  },
];

const LOCAL_STORAGE_KEY = 'eduwrap_local_quizzes';

function getInitialQuizzes() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map(q => q.id));
          return [...parsed, ...DEFAULT_QUIZZES.filter(d => !savedIds.has(d.id))];
        }
      }
    } catch (e) {
      console.warn('Failed to parse local quizzes:', e);
    }
  }
  return DEFAULT_QUIZZES;
}

function persistLocalQuizzes(quizzes) {
  if (typeof window !== 'undefined') {
    try {
      const toSave = quizzes.filter(q => q.userId !== 'system');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to persist local quizzes:', e);
    }
  }
}

const QuizContext = createContext(undefined);

export function QuizProvider({ children }) {
  const { user } = useUser();
  const uid = user?.id;

  const [quizzes, setQuizzes] = useState(getInitialQuizzes);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── REAL-TIME: Sync user's quizzes from Firestore ───
  useEffect(() => {
    if (!uid) {
      setQuizzes(getInitialQuizzes());
      setLoading(false);
      return;
    }

    const mapDocs = (snap) => snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      completedAt: d.data().completedAt?.toDate?.()?.toISOString() || d.data().completedAt,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
    }));

    const idealQuery = query(quizzesRef, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(30));
    let unsubscribe = safeOnSnapshot(idealQuery, (snap) => {
      const firestoreQuizzes = mapDocs(snap);
      setQuizzes(() => {
        const fsIds = new Set(firestoreQuizzes.map(q => q.id));
        const nonDuplicateDefaults = DEFAULT_QUIZZES.filter(d => !fsIds.has(d.id));
        return [...firestoreQuizzes, ...nonDuplicateDefaults];
      });
      setLoading(false);
    }, (err) => {
      console.warn('Quizzes ideal query failed, trying simple query:', err.message);
      const fallbackQuery = query(quizzesRef, where('userId', '==', uid), limit(30));
      unsubscribe = safeOnSnapshot(fallbackQuery, (snap) => {
        const firestoreQuizzes = mapDocs(snap);
        firestoreQuizzes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setQuizzes(() => {
          const fsIds = new Set(firestoreQuizzes.map(q => q.id));
          const nonDuplicateDefaults = DEFAULT_QUIZZES.filter(d => !fsIds.has(d.id));
          return [...firestoreQuizzes, ...nonDuplicateDefaults];
        });
        setLoading(false);
      }, (fallbackErr) => {
        console.warn('Quizzes fallback listener failed, keeping local quizzes:', fallbackErr);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── GENERATE QUIZ FROM PDFs ───
  const generateQuiz = async (selectedPdfIds, selectedPdfTitles, count = 10, allNotes = []) => {
    const effectiveUid = uid || 'user_local';
    let combinedText = '';

    for (const id of selectedPdfIds) {
      try {
        let text = await getPDFText(id);

        if (!text) {
          const note = allNotes.find(n => n.id === id);
          if (note?.url) {
            console.info(`[EduWrap] Extracting PDF text for quiz: ${note.title || id}`);
            text = await processPDFFromUrl(id, note.url);
          }
        }

        if (!text) {
          try {
            const { fetchDoc, noteDoc } = await import('../firebase/firestore');
            const firestoreNote = await fetchDoc(noteDoc(id));
            if (firestoreNote?.url) {
              text = await processPDFFromUrl(id, firestoreNote.url);
            }
          } catch (fsErr) {
            console.warn(`[EduWrap] Firestore PDF text fetch failed: ${id}`, fsErr);
          }
        }

        if (text && text.trim().length > 20) {
          combinedText += text + '\n\n';
        }
      } catch (err) {
        console.error(`[EduWrap] Failed to read PDF text: ${id}`, err);
      }
    }

    let questions = [];

    // 1. Attempt generation from extracted text if available
    if (combinedText.trim().length > 30) {
      try {
        questions = await generateSmartQuiz(combinedText, count);
      } catch (e) {
        console.warn('[EduWrap] Smart quiz generation failed, using local NLP generator:', e);
        questions = generateQuizQuestions(combinedText, count);
      }
    }

    // 2. If PDF was image-only or local NLP produced 0 questions, synthesize questions from topics/titles
    if (!questions || questions.length === 0) {
      const topicName = selectedPdfTitles?.[0] || 'Selected Study Material';
      console.info(`[EduWrap] Synthesizing conceptual quiz questions for topic: ${topicName}`);
      questions = [
        {
          id: `q-fallback-1-${Date.now()}`,
          question: `Which fundamental principle is central to the study of ${topicName}?`,
          options: [
            'Systematic problem decomposition and modular analysis',
            'Arbitrary trial and error without metrics',
            'Random memory allocation without tracking',
            'Single-pass unverified execution'
          ],
          correctIndex: 0,
          correctAnswer: 'Systematic problem decomposition and modular analysis',
          explanation: `Academic mastery of ${topicName} emphasizes structured decomposition and modular analysis.`,
        },
        {
          id: `q-fallback-2-${Date.now()}`,
          question: `In the context of ${topicName}, what is the primary purpose of optimization?`,
          options: [
            'Improving efficiency in terms of time, memory, or resource utilization',
            'Increasing the complexity of the implementation needlessly',
            'Eliminating all comments and documentation from the code',
            'Restricting concurrent execution permanently'
          ],
          correctIndex: 0,
          correctAnswer: 'Improving efficiency in terms of time, memory, or resource utilization',
          explanation: 'Optimization aims to maximize performance while minimizing resource overhead.',
        },
        {
          id: `q-fallback-3-${Date.now()}`,
          question: `When evaluating algorithms or models in ${topicName}, what is the key benchmark for scalability?`,
          options: [
            'Color scheme of the user interface',
            'Asymptotic time and space complexity with respect to input size n',
            'Number of lines of source code regardless of logic',
            'Date of initial publication'
          ],
          correctIndex: 1,
          correctAnswer: 'Asymptotic time and space complexity with respect to input size n',
          explanation: 'Asymptotic complexity provides a mathematical guarantee of scalability as input volume grows.',
        },
        {
          id: `q-fallback-4-${Date.now()}`,
          question: `What is the standard procedure to verify correctness in ${topicName}?`,
          options: [
            'Rigorous testing, boundary-case analysis, and peer code review',
            'Assuming correctness if compilation succeeds on one machine',
            'Ignoring edge cases and off-by-one errors',
            'Deploying without local verification'
          ],
          correctIndex: 0,
          correctAnswer: 'Rigorous testing, boundary-case analysis, and peer code review',
          explanation: 'Correctness verification requires exhaustive boundary testing and structural analysis.',
        }
      ];
    }

    const title = selectedPdfTitles.length > 1
      ? `Quiz from ${selectedPdfTitles.length} PDFs`
      : `Quiz: ${selectedPdfTitles[0] || 'Custom Study Quiz'}`;

    const quizId = `quiz-${Date.now()}`;
    const newQuiz = {
      id: quizId,
      userId: effectiveUid,
      title,
      description: `${questions.length} questions from ${title}.`,
      questions,
      totalQuestions: questions.length,
      score: null,
      answers: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    // If user is authenticated, persist to Firestore
    if (uid) {
      try {
        const firestoreId = await createDoc(quizzesRef, {
          userId: uid,
          title: newQuiz.title,
          description: newQuiz.description,
          questions: newQuiz.questions,
          totalQuestions: newQuiz.totalQuestions,
          score: null,
          answers: [],
          completedAt: null,
          createdAt: serverTimestamp(),
        });
        if (firestoreId) {
          newQuiz.id = firestoreId;
        }
      } catch (fsErr) {
        console.warn('[EduWrap] Firestore quiz creation failed, saved locally:', fsErr);
      }
    }

    setQuizzes(prev => {
      const updated = [newQuiz, ...prev.filter(q => q.id !== newQuiz.id)];
      persistLocalQuizzes(updated);
      return updated;
    });

    setActiveQuizId(newQuiz.id);
    return newQuiz.id;
  };

  // ─── SUBMIT ANSWER ───
  const submitAnswer = async (quizId, questionIndex, selectedOptionIndex) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const newAnswers = [...(quiz.answers || [])];
    newAnswers[questionIndex] = selectedOptionIndex;

    setQuizzes(prev => {
      const updated = prev.map(q => q.id === quizId ? { ...q, answers: newAnswers } : q);
      persistLocalQuizzes(updated);
      return updated;
    });

    if (uid && quiz.userId !== 'system' && !quiz.id.startsWith('quiz-')) {
      try {
        await patchDoc(quizDoc(quizId), { answers: newAnswers });
      } catch (err) {
        console.warn('Firestore answer submit warning:', err);
      }
    }
  };

  // ─── FINISH QUIZ ───
  const finishQuiz = async (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const correct = quiz.questions.reduce((acc, q, i) => {
      return acc + ((quiz.answers || [])[i] === q.correctIndex ? 1 : 0);
    }, 0);

    const nowIso = new Date().toISOString();

    setQuizzes(prev => {
      const updated = prev.map(q => q.id === quizId ? { ...q, score: correct, completedAt: nowIso } : q);
      persistLocalQuizzes(updated);
      return updated;
    });

    if (uid && quiz.userId !== 'system' && !quiz.id.startsWith('quiz-')) {
      try {
        await patchDoc(quizDoc(quizId), {
          score: correct,
          completedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore quiz finish warning:', err);
      }
    }
  };

  // ─── RESET QUIZ ───
  const resetQuiz = async (quizId) => {
    setQuizzes(prev => {
      const updated = prev.map(q => q.id === quizId ? { ...q, score: null, answers: [], completedAt: null } : q);
      persistLocalQuizzes(updated);
      return updated;
    });

    const quiz = quizzes.find(q => q.id === quizId);
    if (uid && quiz && quiz.userId !== 'system' && !quiz.id.startsWith('quiz-')) {
      try {
        await patchDoc(quizDoc(quizId), {
          score: null,
          answers: [],
          completedAt: null,
        });
      } catch (err) {
        console.warn('Firestore quiz reset warning:', err);
      }
    }
  };

  // ─── DELETE QUIZ ───
  const deleteQuiz = async (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    setQuizzes(prev => {
      const updated = prev.filter(q => q.id !== quizId);
      persistLocalQuizzes(updated);
      return updated;
    });

    if (activeQuizId === quizId) setActiveQuizId(null);

    if (uid && quiz && quiz.userId !== 'system' && !quiz.id.startsWith('quiz-')) {
      try {
        await removeDoc(quizDoc(quizId));
      } catch (err) {
        console.warn('Firestore quiz delete warning:', err);
      }
    }
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
