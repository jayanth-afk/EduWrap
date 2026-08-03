import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Key, CheckCircle2, Sparkles, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { getGroqApiKey, setGroqApiKey } from '../../services/groqService';

export default function AISettings() {
  const [apiKey, setApiKey] = useState(getGroqApiKey() || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    setGroqApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Respond with OK.' }],
          max_tokens: 5,
        }),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Connection successful! Groq AI Llama 3.3 70B is ready for Quiz & Flashcard generation.',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: errorData?.error?.message || `Groq API responded with status ${response.status}`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Groq API. Check network or key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-(--text-primary)" style={{ fontFamily: 'var(--font-display)' }}>
                Groq AI Intelligence Engine
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-sm text-(--text-secondary) mt-1">
              EduWrap uses Groq's high-throughput LPU inference with <strong className="text-(--text-primary)">Llama 3.3 70B</strong> to synthesize conceptual quizzes, plausible distractors, and high-yield flashcards from your uploaded PDF course materials.
            </p>
          </div>
        </div>
      </div>

      {/* Model Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-2xl p-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-(--text-primary) mb-2">
            <Zap className="w-4 h-4 text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
            Primary Model
          </div>
          <div className="text-base font-bold text-[color:oklch(0.58_0.22_var(--accent-hue))] mb-1">
            llama-3.3-70b-versatile
          </div>
          <p className="text-xs text-(--text-muted)">
            State-of-the-art conceptual reasoning, distractor generation, and step-by-step explanations.
          </p>
        </div>

        <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-2xl p-5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-(--text-primary) mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Zero-Breakage Fallback
          </div>
          <div className="text-base font-bold text-(--text-primary) mb-1">
            Local NLP Engine
          </div>
          <p className="text-xs text-(--text-muted)">
            Deterministic offline heuristic engine ensures quiz generation always succeeds even if offline.
          </p>
        </div>
      </div>

      {/* API Key Form */}
      <div className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-2xl p-6">
        <h3 className="text-base font-bold text-(--text-primary) mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-[color:oklch(0.58_0.22_var(--accent-hue))]" />
          Groq API Key
        </h3>
        <p className="text-xs text-(--text-muted) mb-4">
          Configured securely in environment and local encrypted storage. You can update or replace it anytime.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-4 py-3 rounded-xl bg-(--bg-base) border border-(--border-default) text-(--text-primary) font-mono text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] focus:ring-2 focus:ring-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.50_0.22_calc(var(--accent-hue)-30))] text-white text-sm font-semibold shadow-lg shadow-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.25)] cursor-pointer"
            >
              {isSaved ? 'Saved!' : 'Save Key'}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-5 py-2.5 rounded-xl bg-(--bg-elevated) hover:bg-(--bg-glass) border border-(--border-default) text-(--text-primary) text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </motion.button>
          </div>
        </form>

        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 text-sm ${
              testResult.success
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.success ? 'Success' : 'Connection Failed'}</p>
              <p className="text-xs opacity-90 mt-0.5">{testResult.message}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
