/**
 * questionGenerator.js
 *
 * Generates study questions from extracted PDF text.
 * Supports three question types:
 *   1. Definition Q&A  — "What is X?" / answer
 *   2. Fill-in-the-blank — sentence with keyword removed
 *   3. Multiple Choice  — question + 4 options (1 correct)
 */

// ─── STOP WORDS ─────────────────────────────────────────────
// Words that should never be used as question terms or answer keywords
const STOP_WORDS = new Set([
  // Pronouns & determiners
  'it', 'its', 'this', 'that', 'these', 'those', 'they', 'them', 'their',
  'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'i', 'me', 'my', 'mine',
  // Common verbs & auxiliaries
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'shall', 'may',
  'might', 'can', 'must', 'need', 'let', 'make', 'made', 'get', 'got',
  'go', 'goes', 'went', 'gone', 'come', 'came', 'take', 'took', 'taken',
  'give', 'gave', 'given', 'say', 'said', 'tell', 'told', 'know', 'knew',
  'think', 'thought', 'see', 'saw', 'seen', 'want', 'use', 'used', 'using',
  'find', 'found', 'put', 'run', 'set', 'try', 'ask', 'work', 'call',
  'keep', 'kept', 'start', 'show', 'shown', 'help', 'turn', 'move',
  // Common adverbs & adjectives
  'very', 'also', 'just', 'only', 'even', 'still', 'already', 'always',
  'never', 'often', 'well', 'much', 'many', 'more', 'most', 'some', 'any',
  'each', 'every', 'all', 'both', 'few', 'other', 'another', 'such',
  'same', 'different', 'new', 'old', 'first', 'last', 'next', 'good',
  'great', 'important', 'big', 'small', 'long', 'little', 'own',
  // Prepositions & conjunctions
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'into',
  'through', 'between', 'after', 'before', 'during', 'without', 'under',
  'over', 'above', 'below', 'and', 'but', 'or', 'nor', 'not', 'so',
  'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'why',
  'because', 'since', 'while', 'although', 'though', 'than', 'then',
  // Articles & misc
  'the', 'a', 'an', 'of', 'as', 'no', 'yes', 'like', 'way', 'here',
  'there', 'now', 'time', 'thing', 'things', 'something', 'nothing',
  'everything', 'anything', 'example', 'case', 'part', 'place',
  // Presentation/document artifacts
  'slide', 'page', 'chapter', 'section', 'figure', 'table', 'note',
  'click', 'button', 'image', 'video', 'lecture', 'class', 'course',
  'student', 'students', 'teacher', 'question', 'answer', 'task',
  'output', 'input', 'result', 'value', 'step', 'number', 'line',
]);

function isStopWord(word) {
  return STOP_WORDS.has(word.toLowerCase().replace(/[^a-z]/g, ''));
}

// ─── HELPERS ────────────────────────────────────────────────

/** Split text into clean sentences */
function extractSentences(text) {
  if (!text || text.trim().length === 0) return [];

  return text
    .replace(/\n/g, ' ')
    // Split on sentence-ending punctuation
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    // Must be a real sentence
    .filter(s => {
      if (s.length < 30 || s.length > 300) return false;
      // Must contain at least 5 words
      const words = s.split(/\s+/);
      if (words.length < 5) return false;
      // Skip URLs, file paths, code-like lines
      if (/https?:\/\/|www\.|\/{2}|[{}();=<>]|=>|const |let |var |function |import /.test(s)) return false;
      // Skip lines that are mostly numbers / symbols
      const letterRatio = (s.match(/[a-zA-Z]/g) || []).length / s.length;
      if (letterRatio < 0.6) return false;
      // Must end like a sentence (period, question mark, etc.)
      if (!/[.!?]$/.test(s)) return false;
      return true;
    });
}

/** Find key terms in a sentence (capitalized words, technical terms) — skip stop words */
function findKeyTerms(sentence) {
  const words = sentence.split(/\s+/);
  const terms = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z-]/g, '');
    if (word.length < 4) continue;
    if (isStopWord(word)) continue;

    // Capitalized word not at start of sentence — likely a proper noun or key concept
    if (i > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      terms.push({ word, index: i, score: 4 });
    }
    // Long technical-looking word (8+ chars)
    else if (word.length >= 8) {
      terms.push({ word, index: i, score: 3 });
    }
    // Medium technical word (6+ chars)
    else if (word.length >= 6) {
      terms.push({ word, index: i, score: 2 });
    }
    // Shorter but still valid
    else if (word.length >= 4) {
      terms.push({ word, index: i, score: 1 });
    }
  }

  return terms.sort((a, b) => b.score - a.score);
}

/** Shuffle array */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── DEFINITION QUESTIONS ────────────────────────────────────

function generateDefinitionQuestions(sentences) {
  const questions = [];

  for (const sentence of sentences) {
    // Match patterns like "X is a/an/the Y" where X is a meaningful term
    const match = sentence.match(
      /\b([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-zA-Z]+){0,3}?)\s+(?:is|are|refers?\s+to|means?|describes?|represents?)\s+(?:a|an|the|when|how)?\s*(.{20,})/
    );

    if (!match) continue;

    const term = match[1].trim();
    const definition = match[0].trim().replace(/\.$/, '');

    // Quality checks
    if (term.length < 3 || term.length > 40) continue;
    if (isStopWord(term)) continue;
    // Term must contain at least one word with 4+ letters
    if (!term.split(/\s+/).some(w => w.replace(/[^a-zA-Z]/g, '').length >= 4)) continue;
    // Skip if the term itself looks like a sentence fragment
    if (term.split(/\s+/).length > 4) continue;
    // Definition must be substantive
    if (definition.length < 30) continue;

    questions.push({
      type: 'definition',
      front: `What is ${term}?`,
      back: definition,
      sentence,
      term,
    });
  }

  return questions;
}

// ─── FILL IN THE BLANK ──────────────────────────────────────

function generateFillInBlank(sentences) {
  const questions = [];

  for (const sentence of sentences) {
    const terms = findKeyTerms(sentence);
    if (terms.length === 0) continue;

    // Pick the best term (highest score)
    const best = terms[0];
    const words = sentence.split(/\s+/);
    const original = words[best.index];
    const cleanAnswer = original.replace(/[^a-zA-Z-]/g, '');

    // Answer must be meaningful
    if (cleanAnswer.length < 4) continue;
    if (isStopWord(cleanAnswer)) continue;

    words[best.index] = '________';
    const blankSentence = words.join(' ');

    // The question should still read coherently
    if (blankSentence.length < 30) continue;

    questions.push({
      type: 'fill-blank',
      front: `Fill in the blank:\n\n"${blankSentence}"`,
      back: cleanAnswer,
      sentence,
      term: cleanAnswer,
    });
  }

  return questions;
}

// ─── MULTIPLE CHOICE ────────────────────────────────────────

function generateMultipleChoice(sentences, allTerms) {
  const questions = [];

  for (const sentence of sentences) {
    const terms = findKeyTerms(sentence);
    if (terms.length === 0) continue;

    const best = terms[0];
    const correctAnswer = best.word;

    if (correctAnswer.length < 4 || isStopWord(correctAnswer)) continue;

    // Generate 3 wrong answers from other terms in the document
    let distractors = allTerms
      .filter(t =>
        t.toLowerCase() !== correctAnswer.toLowerCase() &&
        t.length >= 4 &&
        !isStopWord(t)
      )
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Fallback general academic distractors if document terms are limited
    const FALLBACK_TERMS = [
      'Abstraction', 'Algorithm', 'Architecture', 'Complexity', 'Concurrency',
      'Encapsulation', 'Framework', 'Hierarchy', 'Interface', 'Modularity',
      'Normalization', 'Optimization', 'Protocol', 'Recursion', 'Synchronization'
    ];
    if (distractors.length < 3) {
      for (const ft of FALLBACK_TERMS) {
        if (ft.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(ft)) {
          distractors.push(ft);
          if (distractors.length >= 3) break;
        }
      }
    }

    if (distractors.length < 3) continue;

    const words = sentence.split(/\s+/);
    words[best.index] = '________';
    const questionText = words.join(' ');

    if (questionText.length < 30) continue;

    const options = shuffle([correctAnswer, ...distractors]);

    questions.push({
      type: 'multiple-choice',
      question: `Fill in the blank:\n\n"${questionText}"`,
      options,
      correctIndex: options.indexOf(correctAnswer),
      correctAnswer,
      sentence,
    });
  }

  return questions;
}

// ─── PUBLIC API ─────────────────────────────────────────────

/**
 * Generate flashcard-style questions from PDF text.
 * @param {string} text - Extracted PDF text
 * @param {number} count - Number of cards to generate
 * @returns {Array<{id: string, front: string, back: string, status: string}>}
 */
export function generateFlashcards(text, count) {
  const sentences = extractSentences(text);
  if (sentences.length === 0) return [];

  const shuffledSentences = shuffle(sentences);

  // Generate both types
  const definitionQs = generateDefinitionQuestions(shuffledSentences);
  const fillBlankQs = generateFillInBlank(shuffledSentences);

  // Interleave for variety
  const allQuestions = [];
  let dIdx = 0, fIdx = 0;
  let useDefinition = true;
  while (allQuestions.length < count * 3 && (dIdx < definitionQs.length || fIdx < fillBlankQs.length)) {
    if (useDefinition && dIdx < definitionQs.length) {
      allQuestions.push(definitionQs[dIdx++]);
    } else if (fIdx < fillBlankQs.length) {
      allQuestions.push(fillBlankQs[fIdx++]);
    } else if (dIdx < definitionQs.length) {
      allQuestions.push(definitionQs[dIdx++]);
    }
    useDefinition = !useDefinition;
  }

  // Deduplicate by term
  const seen = new Set();
  const unique = allQuestions.filter(q => {
    const key = q.term?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, count).map(q => ({
    id: crypto.randomUUID(),
    front: q.front,
    back: q.back,
    status: 'new',
  }));
}

/**
 * Generate quiz questions (multiple choice) from PDF text.
 * @param {string} text - Extracted PDF text
 * @param {number} count - Number of questions to generate
 * @returns {Array<{id, question, options, correctIndex, correctAnswer}>}
 */
export function generateQuizQuestions(text, count) {
  const sentences = extractSentences(text);
  if (sentences.length === 0) return [];

  const shuffledSentences = shuffle(sentences);

  // Collect all key terms for distractors
  const allTerms = new Set();
  for (const s of sentences) {
    for (const t of findKeyTerms(s)) {
      if (t.word.length >= 4 && !isStopWord(t.word)) {
        allTerms.add(t.word);
      }
    }
  }
  const termArray = [...allTerms];

  // Generate fill-blank MC questions
  const mcQuestions = generateMultipleChoice(shuffledSentences, termArray);

  // Generate definition-based MC questions
  const defQuestions = generateDefinitionQuestions(shuffledSentences);
  const defMC = defQuestions.map(q => {
    const correctAnswer = q.term;
    if (correctAnswer.length < 4 || isStopWord(correctAnswer)) return null;

    const distractors = termArray
      .filter(t => t.toLowerCase() !== correctAnswer.toLowerCase() && t.length >= 4 && !isStopWord(t))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    if (distractors.length < 3) return null;

    const options = shuffle([correctAnswer, ...distractors]);
    return {
      id: crypto.randomUUID(),
      question: `Which term best completes: "${q.back.replace(new RegExp(q.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '________')}"`,
      options,
      correctIndex: options.indexOf(correctAnswer),
      correctAnswer,
    };
  }).filter(Boolean);

  // Merge, shuffle, deduplicate
  const allQuestions = shuffle([...mcQuestions, ...defMC]);
  const seen = new Set();
  const unique = allQuestions.filter(q => {
    const key = q.correctAnswer?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, count).map(q => ({
    ...q,
    id: q.id || crypto.randomUUID(),
  }));
}
