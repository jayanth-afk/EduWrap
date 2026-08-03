import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { getPDFText } from '../services/pdfService';
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

const FlashcardContext = createContext(undefined);

export function FlashcardProvider({ children }) {
  const { user, isLoggedIn } = useUser();
  const uid = user?.id;

  const [decks, setDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── REAL-TIME: Load user's flashcard decks (limit 30 for zero-cost quota safety) ───
  useEffect(() => {
    if (!uid) {
      setDecks([]);
      setLoading(false);
      return;
    }

    const q = query(flashcardDecksRef, where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      setDecks(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        lastStudied: d.data().lastStudied?.toDate?.()?.toISOString() || d.data().lastStudied,
      })));
      setLoading(false);
    }, (err) => {
      console.error('Flashcards listener error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  // ─── UPDATE CARD STATUS ───
  const updateCardStatus = async (deckId, cardId, status) => {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    const updatedCards = deck.cards.map(card =>
      card.id === cardId ? { ...card, status } : card
    );

    await patchDoc(flashcardDeckDoc(deckId), { cards: updatedCards });
  };

  // ─── UPDATE LAST STUDIED ───
  const updateDeckLastStudied = async (deckId) => {
    await patchDoc(flashcardDeckDoc(deckId), { lastStudied: serverTimestamp() });
  };

  // ─── DELETE DECK ───
  const deleteDeck = async (deckId) => {
    await removeDoc(flashcardDeckDoc(deckId));
    if (activeDeckId === deckId) setActiveDeckId(null);
  };

  // ─── GENERATE DECK FROM PDFs ───
  const generateDeck = async (selectedPdfIds, selectedPdfTitles, count) => {
    if (!uid) return null;

    let combinedText = '';
    for (const id of selectedPdfIds) {
      try {
        const text = await getPDFText(id);
        if (text) combinedText += text + '\n\n';
      } catch (err) {
        console.error('Failed to read text for pdf:', id, err);
      }
    }

    let cards = [];
    if (combinedText.trim().length > 50) {
      cards = generateFlashcards(combinedText, count);
    }

    if (cards.length === 0) {
      cards = [{
        id: crypto.randomUUID(),
        front: 'No readable text found in the selected PDF(s).',
        back: 'This PDF may be image-based (scanned). Try selecting a different PDF with selectable text.',
        status: 'new',
      }];
    }

    const title = selectedPdfTitles.length > 1
      ? `Generated from ${selectedPdfTitles.length} PDFs`
      : `Generated: ${selectedPdfTitles[0] || 'Custom Deck'}`;

    const deckId = await createDoc(flashcardDecksRef, {
      userId: uid,
      title,
      description: 'Smart flashcards extracted from your study materials.',
      cards,
      lastStudied: null,
    });

    return deckId;
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
