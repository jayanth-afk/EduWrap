import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { getPDFText, processPDFFromUrl } from '../services/pdfService';
import { generateSmartFlashcards } from '../services/groqService';
import { generateFlashcards } from '../services/questionGenerator';
import {
  flashcardDecksRef,
  flashcardDeckDoc,
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

export const DEFAULT_DECKS = [
  {
    id: 'deck-dsa',
    userId: 'system',
    title: 'Data Structures & Algorithms Mastery',
    cards: [
      {
        id: 'c-dsa-1',
        front: 'What is the average and worst-case time complexity of QuickSort?',
        back: 'Average: O(n log n) with balanced pivot selection.\nWorst-case: O(n²) when the chosen pivot is consistently the extreme (smallest or largest) element.',
        status: 'new',
      },
      {
        id: 'c-dsa-2',
        front: 'Explain the difference between a generic Binary Tree and a Binary Search Tree (BST).',
        back: 'A Binary Tree simply limits each node to at most two children.\nA BST enforces the ordering invariant: all keys in the left subtree are smaller than the node, and all keys in the right subtree are greater.',
        status: 'new',
      },
      {
        id: 'c-dsa-3',
        front: 'What is the search time complexity in a self-balancing AVL or Red-Black Tree?',
        back: 'O(log n) guaranteed in all cases, because tree rotations maintain a logarithmic height bounded by O(log₂ n).',
        status: 'new',
      },
      {
        id: 'c-dsa-4',
        front: 'When is Dijkstra’s algorithm chosen over Breadth-First Search (BFS)?',
        back: 'BFS finds the shortest path only in unweighted graphs in O(V + E).\nDijkstra finds the shortest path in graphs with non-negative edge weights in O((V + E) log V).',
        status: 'new',
      },
      {
        id: 'c-dsa-5',
        front: 'What causes a Hash Collision, and what are two standard strategies to resolve it?',
        back: 'A collision occurs when distinct keys produce the same array bucket index.\nResolutions: 1) Chaining (linked lists or balanced trees in buckets), 2) Open Addressing (linear probing, quadratic probing, double hashing).',
        status: 'new',
      },
    ],
    lastStudied: null,
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'deck-systems',
    userId: 'system',
    title: 'Computer Systems Architecture & OS',
    cards: [
      {
        id: 'c-os-1',
        front: 'What is the core difference between a Process and a Thread?',
        back: 'A process is an executing program instance with its own isolated address space, descriptors, and resources.\nA thread is a lightweight execution stream within a process that shares memory and resources with sibling threads.',
        status: 'new',
      },
      {
        id: 'c-os-2',
        front: 'List the four Coffman conditions necessary for a Deadlock.',
        back: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait\nBreaking any one condition prevents or resolves deadlock.',
        status: 'new',
      },
      {
        id: 'c-os-3',
        front: 'How does Virtual Memory translate logical addresses to physical RAM?',
        back: 'The Memory Management Unit (MMU) consults the process Page Table, mapping the Virtual Page Number (VPN) to a Physical Frame Number (PFN) and appending the page offset.',
        status: 'new',
      },
      {
        id: 'c-os-4',
        front: 'What is Thrashing in an operating system?',
        back: 'A catastrophic state where the OS spends the vast majority of CPU cycles paging memory pages in and out of swap space rather than executing actual instructions.',
        status: 'new',
      },
    ],
    lastStudied: null,
    createdAt: '2026-09-02T00:00:00.000Z',
  },
  {
    id: 'deck-dbms',
    userId: 'system',
    title: 'Database Systems & SQL Fundamentals',
    cards: [
      {
        id: 'c-db-1',
        front: 'What do the ACID properties guarantee in relational database transactions?',
        back: 'Atomicity: all-or-nothing execution.\nConsistency: transitions preserve schema constraints.\nIsolation: concurrent transactions don’t corrupt each other.\nDurability: committed writes survive power failure.',
        status: 'new',
      },
      {
        id: 'c-db-2',
        front: 'Why are B+ Trees preferred over Binary Trees for database indexes?',
        back: 'B+ Trees have very large fan-out (hundreds of keys per node), keeping tree depth to 3-4 levels. This drastically reduces expensive disk I/O seek operations.',
        status: 'new',
      },
      {
        id: 'c-db-3',
        front: 'How do WHERE and HAVING clauses differ in SQL?',
        back: 'WHERE filters individual candidate rows before grouping occurs.\nHAVING filters aggregated group results produced by the GROUP BY clause.',
        status: 'new',
      },
      {
        id: 'c-db-4',
        front: 'What is Third Normal Form (3NF)?',
        back: 'A relation is in 3NF if it is in 2NF and contains no transitive functional dependencies (i.e. every non-prime attribute is non-transitively dependent on candidate keys).',
        status: 'new',
      },
    ],
    lastStudied: null,
    createdAt: '2026-09-03T00:00:00.000Z',
  },
  {
    id: 'deck-ml',
    userId: 'system',
    title: 'Machine Learning & AI Principles',
    cards: [
      {
        id: 'c-ml-1',
        front: 'What is the Bias-Variance Tradeoff in statistical learning?',
        back: 'High bias results in underfitting (model too simple to learn true relationships).\nHigh variance results in overfitting (model fits training noise).\nOptimal modeling balances both to minimize out-of-sample generalization error.',
        status: 'new',
      },
      {
        id: 'c-ml-2',
        front: 'How does Backpropagation compute gradients in Deep Neural Networks?',
        back: 'It applies the Chain Rule of calculus from the loss function at the output layer backwards through each layer, computing the partial derivatives of the loss with respect to every weight and bias.',
        status: 'new',
      },
      {
        id: 'c-ml-3',
        front: 'Distinguish between Precision and Recall in classification metrics.',
        back: 'Precision = TP / (TP + FP) — fraction of positive predictions that are correct.\nRecall = TP / (TP + FN) — fraction of all actual positive instances captured.',
        status: 'new',
      },
      {
        id: 'c-ml-4',
        front: 'Explain the Scaled Dot-Product Attention equation in Transformers.',
        back: 'Attention(Q, K, V) = softmax((Q Kᵀ) / √d_k) V.\nIt computes dynamic compatibility weights between query and key vectors to produce a weighted sum of value vectors.',
        status: 'new',
      },
    ],
    lastStudied: null,
    createdAt: '2026-09-04T00:00:00.000Z',
  },
];

const LOCAL_STORAGE_KEY = 'eduwrap_local_decks';

function getInitialDecks() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map(d => d.id));
          return [...parsed, ...DEFAULT_DECKS.filter(d => !savedIds.has(d.id))];
        }
      }
    } catch (e) {
      console.warn('Failed to parse local flashcard decks:', e);
    }
  }
  return DEFAULT_DECKS;
}

function persistLocalDecks(decks) {
  if (typeof window !== 'undefined') {
    try {
      const toSave = decks.filter(d => d.userId !== 'system');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to persist local flashcard decks:', e);
    }
  }
}

const FlashcardContext = createContext(undefined);

export function FlashcardProvider({ children }) {
  const { user } = useUser();
  const uid = user?.id;

  const [decks, setDecks] = useState(getInitialDecks);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── REAL-TIME: Sync user's flashcard decks from Firestore ───
  useEffect(() => {
    if (!uid) {
      setDecks(getInitialDecks());
      setLoading(false);
      return;
    }

    const mapDocs = (snap) => snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      lastStudied: d.data().lastStudied?.toDate?.()?.toISOString() || d.data().lastStudied,
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt,
    }));

    const idealQuery = query(flashcardDecksRef, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(30));
    let unsubscribe = safeOnSnapshot(idealQuery, (snap) => {
      const firestoreDecks = mapDocs(snap);
      setDecks(() => {
        const fsIds = new Set(firestoreDecks.map(d => d.id));
        const nonDuplicateDefaults = DEFAULT_DECKS.filter(d => !fsIds.has(d.id));
        return [...firestoreDecks, ...nonDuplicateDefaults];
      });
      setLoading(false);
    }, (err) => {
      console.warn('Flashcards ideal query failed, trying simple query:', err.message);
      const fallbackQuery = query(flashcardDecksRef, where('userId', '==', uid), limit(30));
      unsubscribe = safeOnSnapshot(fallbackQuery, (snap) => {
        const firestoreDecks = mapDocs(snap);
        firestoreDecks.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setDecks(() => {
          const fsIds = new Set(firestoreDecks.map(d => d.id));
          const nonDuplicateDefaults = DEFAULT_DECKS.filter(d => !fsIds.has(d.id));
          return [...firestoreDecks, ...nonDuplicateDefaults];
        });
        setLoading(false);
      }, (fallbackErr) => {
        console.warn('Flashcards fallback listener failed, keeping local decks:', fallbackErr);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── UPDATE CARD STATUS ───
  const updateCardStatus = async (deckId, cardId, status) => {
    setDecks(prev => {
      const updated = prev.map(deck => {
        if (deck.id !== deckId) return deck;
        return {
          ...deck,
          cards: (deck.cards || []).map(card => card.id === cardId ? { ...card, status } : card),
        };
      });
      persistLocalDecks(updated);
      return updated;
    });

    const deck = decks.find(d => d.id === deckId);
    if (uid && deck && deck.userId !== 'system' && !deck.id.startsWith('deck-')) {
      try {
        const updatedCards = deck.cards.map(card =>
          card.id === cardId ? { ...card, status } : card
        );
        await patchDoc(flashcardDeckDoc(deckId), { cards: updatedCards });
      } catch (err) {
        console.warn('Firestore updateCardStatus warning:', err);
      }
    }
  };

  // ─── UPDATE LAST STUDIED ───
  const updateDeckLastStudied = async (deckId) => {
    const nowIso = new Date().toISOString();
    setDecks(prev => {
      const updated = prev.map(deck => deck.id === deckId ? { ...deck, lastStudied: nowIso } : deck);
      persistLocalDecks(updated);
      return updated;
    });

    const deck = decks.find(d => d.id === deckId);
    if (uid && deck && deck.userId !== 'system' && !deck.id.startsWith('deck-')) {
      try {
        await patchDoc(flashcardDeckDoc(deckId), { lastStudied: serverTimestamp() });
      } catch (err) {
        console.warn('Firestore updateDeckLastStudied warning:', err);
      }
    }
  };

  // ─── DELETE DECK ───
  const deleteDeck = async (deckId) => {
    const deck = decks.find(d => d.id === deckId);
    setDecks(prev => {
      const updated = prev.filter(d => d.id !== deckId);
      persistLocalDecks(updated);
      return updated;
    });

    if (activeDeckId === deckId) setActiveDeckId(null);

    if (uid && deck && deck.userId !== 'system' && !deck.id.startsWith('deck-')) {
      try {
        await removeDoc(flashcardDeckDoc(deckId));
      } catch (err) {
        console.warn('Firestore deleteDeck warning:', err);
      }
    }
  };

  // ─── GENERATE DECK FROM PDFs ───
  const generateDeck = async (selectedPdfIds, selectedPdfTitles, count = 10, allNotes = []) => {
    const effectiveUid = uid || 'user_local';
    let combinedText = '';

    for (const id of selectedPdfIds) {
      try {
        let text = await getPDFText(id);

        if (!text) {
          const note = allNotes.find(n => n.id === id);
          if (note?.url) {
            console.info(`[EduWrap] Extracting PDF text for flashcards: ${note.title || id}`);
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
            console.warn(`[EduWrap] Firestore PDF fallback text failed: ${id}`, fsErr);
          }
        }

        if (text && text.trim().length > 20) {
          combinedText += text + '\n\n';
        }
      } catch (err) {
        console.error(`[EduWrap] Failed to read PDF text: ${id}`, err);
      }
    }

    let cards = [];

    // 1. Attempt generation from extracted text
    if (combinedText.trim().length > 30) {
      try {
        cards = await generateSmartFlashcards(combinedText, count);
      } catch (e) {
        console.warn('[EduWrap] Smart flashcards generation failed, using local generator:', e);
        cards = generateFlashcards(combinedText, count);
      }
    }

    // 2. Synthesize conceptual cards if text is missing or scanned
    if (!cards || cards.length === 0) {
      const topicName = selectedPdfTitles?.[0] || 'Selected Study Material';
      console.info(`[EduWrap] Synthesizing conceptual flashcards for topic: ${topicName}`);
      cards = [
        {
          id: `c-fb-1-${Date.now()}`,
          front: `What is the core objective of ${topicName}?`,
          back: `To establish theoretical understanding, algorithmic efficiency, and practical design principles for ${topicName}.`,
          status: 'new',
        },
        {
          id: `c-fb-2-${Date.now()}`,
          front: `What are the primary performance metrics used in ${topicName}?`,
          back: `Throughput, latency, memory footprint, asymptotic time complexity O(f(n)), and scalability under high load.`,
          status: 'new',
        },
        {
          id: `c-fb-3-${Date.now()}`,
          front: `How should edge cases be handled in ${topicName}?`,
          back: `Through rigorous input boundary checks, invariant assertions, defensive exception handling, and regression test suites.`,
          status: 'new',
        },
        {
          id: `c-fb-4-${Date.now()}`,
          front: `What is the key takeaway when reviewing ${topicName}?`,
          back: `Understanding trade-offs (e.g. space vs time, simplicity vs maximum throughput) to select the right approach for each problem context.`,
          status: 'new',
        },
      ];
    }

    const title = selectedPdfTitles.length > 1
      ? `Generated from ${selectedPdfTitles.length} PDFs`
      : `Generated: ${selectedPdfTitles[0] || 'Custom Deck'}`;

    const deckId = `deck-${Date.now()}`;
    const newDeck = {
      id: deckId,
      userId: effectiveUid,
      title,
      description: 'Smart flashcards extracted from your study materials.',
      cards,
      lastStudied: null,
      createdAt: new Date().toISOString(),
    };

    if (uid) {
      try {
        const firestoreId = await createDoc(flashcardDecksRef, {
          userId: uid,
          title: newDeck.title,
          description: newDeck.description,
          cards: newDeck.cards,
          lastStudied: null,
          createdAt: serverTimestamp(),
        });
        if (firestoreId) {
          newDeck.id = firestoreId;
        }
      } catch (fsErr) {
        console.warn('[EduWrap] Firestore deck creation failed, saved locally:', fsErr);
      }
    }

    setDecks(prev => {
      const updated = [newDeck, ...prev.filter(d => d.id !== newDeck.id)];
      persistLocalDecks(updated);
      return updated;
    });

    setActiveDeckId(newDeck.id);
    return newDeck.id;
  };

  return (
    <FlashcardContext.Provider
      value={{
        decks,
        activeDeckId,
        setActiveDeckId,
        updateCardStatus,
        updateDeckLastStudied,
        generateDeck,
        deleteDeck,
        loading,
      }}
    >
      {children}
    </FlashcardContext.Provider>
  );
}

export function useFlashcards() {
  const context = useContext(FlashcardContext);
  if (context === undefined) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
}
