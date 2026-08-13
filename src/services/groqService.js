/**
 * groqService.js
 *
 * Groq AI integration for ultra-fast, intelligent Quiz & Flashcard generation.
 * Uses Llama 3.3 70B Versatile on Groq Cloud with graceful local NLP fallback.
 */

import { generateQuizQuestions, generateFlashcards } from './questionGenerator';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

/**
 * Retrieve the active Groq API key from localStorage or Vite environment variable.
 */
export function getGroqApiKey() {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('eduwrap_groq_api_key');
    if (userKey && userKey.trim()) return userKey.trim();
  }
  return import.meta.env.VITE_GROQ_API_KEY || '';
}

/**
 * Save user custom Groq API key.
 */
export function setGroqApiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('eduwrap_groq_api_key', key.trim());
    } else {
      localStorage.removeItem('eduwrap_groq_api_key');
    }
  }
}

/**
 * Clean & truncate source text to avoid exceeding token limits while preserving high-yield context.
 */
function prepareSourceText(text, maxChars = 24000) {
  if (!text) return '';
  const clean = text
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > maxChars ? clean.substring(0, maxChars) + '...' : clean;
}

/**
 * Execute request to Groq OpenAI-compatible Chat API with JSON response format.
 */
async function callGroqAPI(messages, model = PRIMARY_MODEL) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('No Groq API key configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`Groq API error (${response.status}):`, errBody);
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq API returned empty response content');
    }

    return JSON.parse(content);
  } catch (err) {
    clearTimeout(timeoutId);
    // If primary model failed, try fast fallback model once
    if (model === PRIMARY_MODEL) {
      console.info('Retrying with Groq fallback model:', FALLBACK_MODEL);
      return callGroqAPI(messages, FALLBACK_MODEL);
    }
    throw err;
  }
}

/**
 * Secondary AI pass — filter generated questions for relevance using the fast 8B model.
 * Evaluates each question against the source material and removes irrelevant/poor-quality ones.
 * Uses fail-open pattern: if filtering fails, all questions are returned unfiltered.
 *
 * @param {Array} questions - Generated quiz questions
 * @param {string} sourceTextExcerpt - First portion of source text for context
 * @returns {Promise<Array>} Filtered questions (only relevant ones)
 */
async function filterQuestionsByRelevance(questions, sourceTextExcerpt) {
  if (!questions || questions.length === 0) return questions;

  const apiKey = getGroqApiKey();
  if (!apiKey) return questions; // No key — skip filtering

  try {
    // Send a compact representation of questions for filtering
    const questionsForReview = questions.map((q, i) => ({
      index: i,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    const prompt = `You are a strict academic quality reviewer. Review each quiz question below and determine if it is RELEVANT and HIGH-QUALITY based on the source study material provided.

A question is RELEVANT if:
1. It directly tests a concept, fact, mechanism, or definition from the source material
2. It is clearly worded and unambiguous
3. All 4 options are plausible and distinct
4. It tests understanding, not just surface-level pattern matching
5. It is NOT a trivial fill-in-the-blank with a random word removed

A question is IRRELEVANT if:
1. It tests something NOT covered in the source material
2. It is poorly worded, ambiguous, or confusing
3. The options are too similar or obviously wrong
4. It is a trivial "fill in the blank" that removes a random word
5. It is generic and could apply to any topic

For each question, output its index and whether it is "relevant" or "irrelevant".

Return a JSON object:
{
  "evaluations": [
    { "index": 0, "verdict": "relevant", "reason": "Tests core concept of X" },
    { "index": 1, "verdict": "irrelevant", "reason": "Too generic, not specific to material" }
  ]
}

SOURCE MATERIAL (excerpt):
${sourceTextExcerpt.substring(0, 8000)}

QUESTIONS TO REVIEW:
${JSON.stringify(questionsForReview, null, 2)}`;

    console.info(`[EduWrap] Running Groq AI relevance filtering on ${questions.length} questions...`);

    // Use the fast model for filtering to stay within rate limits
    const result = await callGroqAPI([
      { role: 'system', content: 'You are a strict academic quiz quality reviewer. Output only valid JSON.' },
      { role: 'user', content: prompt },
    ], FALLBACK_MODEL);

    const evaluations = result?.evaluations || [];

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      console.warn('[EduWrap] Groq AI filtering returned no evaluations — keeping all questions');
      return questions;
    }

    // Build a set of relevant indices
    const relevantIndices = new Set();
    for (const ev of evaluations) {
      if (typeof ev.index === 'number' && ev.verdict === 'relevant') {
        relevantIndices.add(ev.index);
      }
    }

    // If AI marked everything as irrelevant (unlikely but defensive), return top half
    if (relevantIndices.size === 0) {
      console.warn('[EduWrap] AI marked all questions irrelevant — returning all as fallback');
      return questions;
    }

    const filtered = questions.filter((_, i) => relevantIndices.has(i));
    console.info(`[EduWrap] Groq AI filtering: ${filtered.length}/${questions.length} questions passed relevance check`);

    // If too few survived, return all (fail-open)
    if (filtered.length < Math.ceil(questions.length * 0.3)) {
      console.warn('[EduWrap] Too few questions survived filtering — returning all');
      return questions;
    }

    return filtered;
  } catch (err) {
    // Fail-open: if filtering fails, return all questions unfiltered
    console.warn('[EduWrap] Groq AI relevance filtering failed — returning all questions:', err.message || err);
    return questions;
  }
}

/**
 * Generate intelligent, conceptual Multiple Choice Quiz Questions from source material.
 * @param {string} text - Raw extracted text from PDF(s)
 * @param {number} count - Target number of questions (default 10)
 * @returns {Promise<Array<{id: string, question: string, options: string[], correctIndex: number, correctAnswer: string, explanation: string}>>}
 */
export async function generateSmartQuiz(text, count = 10) {
  const sourceText = prepareSourceText(text);

  // If text is too short or empty, return empty
  if (!sourceText || sourceText.length < 50) {
    return [];
  }

  const apiKey = getGroqApiKey();

  // If API key is present, attempt Groq AI generation
  if (apiKey) {
    try {
      const prompt = `You are an expert university professor and exam creator.
Analyze the following study material and generate exactly ${count + 5} highly relevant, conceptual, and rigorous multiple-choice questions.

GUIDELINES:
1. Do NOT generate fill-in-the-blank or masked sentences (avoid "________ is an algorithm").
2. Formulate clear, natural questions that test deep understanding, mechanisms, comparisons, definitions, and problem solving.
3. Provide exactly 4 distinct, plausible options for each question (1 correct answer and 3 smart distractors).
4. Include a concise, helpful explanation for why the correct answer is right.

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "What is the primary advantage of X over Y?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct."
    }
  ]
}

STUDY MATERIAL:
${sourceText}`;

      const result = await callGroqAPI([
        { role: 'system', content: 'You are an educational assessment expert that outputs strictly structured JSON.' },
        { role: 'user', content: prompt }
      ]);

      const rawQuestions = result?.questions || result?.quizzes || [];

      if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
        const validated = rawQuestions
          .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === 'number')
          .map(q => {
            const correctIdx = Math.max(0, Math.min(3, Math.floor(q.correctIndex)));
            return {
              id: crypto.randomUUID ? crypto.randomUUID() : `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              question: q.question.trim(),
              options: q.options.map(opt => String(opt).trim()),
              correctIndex: correctIdx,
              correctAnswer: String(q.options[correctIdx]).trim(),
              explanation: q.explanation || 'Verified from course study materials.',
              aiGenerated: true,
            };
          });

        if (validated.length > 0) {
          // Run AI relevance filtering on the generated questions
          const filtered = await filterQuestionsByRelevance(validated, sourceText);
          return filtered.slice(0, count);
        }
      }
    } catch (aiError) {
      console.warn('Groq AI quiz generation failed, falling back to local NLP generator:', aiError.message || aiError);
    }
  }

  // Fallback to local NLP rule-based question generator
  return generateQuizQuestions(text, count);
}

/**
 * Generate conceptual, high-yield Flashcards from source material using Groq AI.
 * @param {string} text - Raw extracted text from PDF(s)
 * @param {number} count - Target number of flashcards (default 12)
 * @returns {Promise<Array<{id: string, front: string, back: string, status: string}>>}
 */
export async function generateSmartFlashcards(text, count = 12) {
  const sourceText = prepareSourceText(text);

  if (!sourceText || sourceText.length < 50) {
    return [];
  }

  const apiKey = getGroqApiKey();

  if (apiKey) {
    try {
      const prompt = `You are a cognitive learning specialist. Create ${count} high-yield, conceptual flashcards from the provided study material.

GUIDELINES:
1. "front": A clear, thought-provoking question, key concept query, or mechanism prompt (e.g. "How does ... work?", "What is the key difference between X and Y?", "Define ... and state its time complexity").
2. "back": A clear, complete, and memorable answer/explanation.
3. Avoid vague fragments or trivial fill-in-the-blanks.

Return a JSON object with this exact structure:
{
  "cards": [
    {
      "front": "What is the core principle of ...?",
      "back": "Clear and comprehensive explanation..."
    }
  ]
}

STUDY MATERIAL:
${sourceText}`;

      const result = await callGroqAPI([
        { role: 'system', content: 'You are a master study assistant that outputs strictly structured JSON.' },
        { role: 'user', content: prompt }
      ]);

      const rawCards = result?.cards || result?.flashcards || [];

      if (Array.isArray(rawCards) && rawCards.length > 0) {
        const validated = rawCards
          .filter(c => c.front && c.back)
          .map(c => ({
            id: crypto.randomUUID ? crypto.randomUUID() : `card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            front: c.front.trim(),
            back: c.back.trim(),
            status: 'new',
            aiGenerated: true,
          }));

        if (validated.length > 0) {
          return validated.slice(0, count);
        }
      }
    } catch (aiError) {
      console.warn('Groq AI flashcards generation failed, falling back to local NLP generator:', aiError.message || aiError);
    }
  }

  // Fallback to local NLP rule-based generator
  return generateFlashcards(text, count);
}
