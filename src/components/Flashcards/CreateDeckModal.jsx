import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileBox, BrainCircuit, CheckCircle2, Sparkles } from 'lucide-react';
import { useNotes } from '../../contexts/NotesContext';
import { useFlashcards } from '../../contexts/FlashcardContext';

export default function CreateDeckModal({ isOpen, onClose }) {
  const { notes } = useNotes();
  const { generateDeck } = useFlashcards();
  
  const pdfNotes = notes.filter(n => n.type === 'pdf');
  
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [cardCount, setCardCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const togglePdf = (id) => {
    setSelectedPdfs(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedPdfs.length === 0) return;
    
    setIsGenerating(true);
    setError('');
    try {
      const selectedTitles = pdfNotes
        .filter(n => selectedPdfs.includes(n.id))
        .map(n => n.title);
        
      await generateDeck(selectedPdfs, selectedTitles, cardCount, notes);
      onClose();
    } catch (e) {
      console.error("Failed to generate deck", e);
      setError('An error occurred while generating flashcards.');
    } finally {
      setIsGenerating(false);
      setSelectedPdfs([]);
      setCardCount(10);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="bg-(--bg-primary) border border-(--border-subtle) rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-(--border-subtle) bg-(--bg-glass) backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
                </div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Generate Deck</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-glass) rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="font-semibold text-(--text-primary) mb-2 text-sm uppercase tracking-wider">Select Source Material</h3>
              <p className="text-sm text-(--text-secondary) mb-4">Choose PDFs for AI-powered flashcard generation.</p>
              
              <div className="space-y-2 mb-8 max-h-64 overflow-y-auto pr-2">
                {pdfNotes.length === 0 ? (
                  <div className="text-center py-8 text-(--text-muted) bg-(--bg-glass) backdrop-blur-md rounded-2xl border border-(--border-subtle)">
                    No PDFs found. Import PDFs in the Notes section first!
                  </div>
                ) : (
                  pdfNotes.map(pdf => {
                    const isSelected = selectedPdfs.includes(pdf.id);
                    return (
                      <button
                        key={pdf.id}
                        onClick={() => togglePdf(pdf.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.08)] border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.25)] shadow-sm' 
                            : 'bg-(--bg-glass) border-(--border-subtle) hover:border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)]'
                        }`}
                      >
                        <FileBox className={`w-5 h-5 shrink-0 ${isSelected ? 'text-[color:oklch(0.58_0.22_var(--accent-hue))]' : 'text-(--text-muted)'}`} />
                        <span className={`flex-1 truncate text-sm ${isSelected ? 'font-semibold text-(--text-primary)' : 'text-(--text-secondary)'}`}>
                          {pdf.title}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[color:oklch(0.58_0.22_var(--accent-hue))] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              <h3 className="font-semibold text-(--text-primary) mb-3 text-sm uppercase tracking-wider">Number of Cards</h3>
              <div className="flex items-center gap-4 bg-(--bg-glass) backdrop-blur-md p-4 rounded-xl border border-(--border-subtle)">
                <span className="text-xs text-(--text-muted) font-bold">1</span>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={cardCount} 
                  onChange={e => setCardCount(parseInt(e.target.value))}
                  className="flex-1 accent-[color:oklch(0.58_0.22_var(--accent-hue))] cursor-pointer"
                />
                <span className="text-lg font-bold w-8 text-right text-[color:oklch(0.58_0.22_var(--accent-hue))]">{cardCount}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 mt-4 bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.06)] rounded-2xl border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[color:oklch(0.58_0.22_var(--accent-hue))]">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Groq AI Neural Filtering Active</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] uppercase tracking-wider">
                  Llama 3.3 70B
                </span>
              </div>

              {error && (
                <div className="mt-4 p-3.5 bg-red-500/8 text-red-500 text-sm rounded-xl border border-red-500/20 font-medium">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-(--border-subtle) bg-(--bg-glass) backdrop-blur-md flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 font-semibold text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer rounded-xl"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={isGenerating || selectedPdfs.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30))] text-white rounded-xl font-semibold shadow-lg shadow-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] disabled:opacity-50 transition-all cursor-pointer"
              >
                <BrainCircuit className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Groq AI Generating...' : 'Generate with Groq AI'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
