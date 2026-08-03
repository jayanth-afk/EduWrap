import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = "August 3, 2026";

  const sections = [
    {
      icon: CheckCircle2,
      title: "1. Acceptance of Terms",
      content: [
        "By accessing, downloading, or using EduWrap (\"the Service\"), you agree to be legally bound by these Terms of Service.",
        "If you do not agree to these terms, you may not access or use the Service."
      ]
    },
    {
      icon: Sparkles,
      title: "2. Description of Service",
      content: [
        "EduWrap provides an AI-augmented collaborative study environment including real-time study rooms, notes management, flashcard generation, peer doubts discussion, and interactive quiz sessions.",
        "We continually evolve and improve features, meaning features may be modified, expanded, or deprecated with notice."
      ]
    },
    {
      icon: ShieldAlert,
      title: "3. User Conduct & Acceptable Use",
      content: [
        "**Prohibited Behavior**: You agree not to upload malicious software, harass other scholars in study rooms, or violate the academic integrity guidelines of your educational institution.",
        "**Account Security**: You are responsible for safeguarding your login credentials and for all activities conducted under your authenticated account."
      ]
    },
    {
      icon: FileText,
      title: "4. Intellectual Property & Study Content",
      content: [
        "**Your Content**: You retain full ownership and intellectual property rights over any notes, flashcards, or documents you create and upload to EduWrap.",
        "**License to EduWrap**: You grant EduWrap a limited, non-exclusive license to process, store, and display your study content strictly as needed to provide workspace synchronization and AI features to you."
      ]
    },
    {
      icon: AlertCircle,
      title: "5. Disclaimer of Warranties & Limitation of Liability",
      content: [
        "EduWrap is provided on an \"AS IS\" and \"AS AVAILABLE\" basis without warranties of any kind. While we strive for 99.9% uptime, we do not guarantee uninterrupted service.",
        "To the maximum extent permitted by applicable law, EduWrap shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the platform."
      ]
    },
    {
      icon: HelpCircle,
      title: "6. Modifications & Contact",
      content: [
        "We reserve the right to revise these Terms at any time. Material updates will be communicated through our platform or via email.",
        "For any inquiries regarding these terms, reach out to us at **legal@eduwrap.app**."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary) selection:bg-[color:oklch(0.58_0.22_var(--accent-hue)/0.3)]">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-[color:oklch(0.58_0.22_var(--accent-hue)/0.12)] blur-[120px] rounded-full" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-(--bg-surface)/80 border-b border-(--border-default) px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/logo-icon.png" 
              alt="EduWrap" 
              className="w-9 h-9 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform" 
            />
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>EduWrap</span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-(--border-default) bg-(--bg-surface) hover:border-(--border-strong) hover:bg-white/5 transition-all"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <main className="max-w-4xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[color:oklch(0.58_0.22_var(--accent-hue)/0.3)] bg-[color:oklch(0.58_0.22_var(--accent-hue)/0.1)] text-xs font-semibold text-[color:oklch(0.75_0.18_var(--accent-hue))] mb-4">
            <FileText size={14} /> Legal & Terms
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Terms of Service
          </h1>
          <p className="text-(--text-secondary) max-w-2xl mx-auto text-base">
            Please read these terms carefully before using the EduWrap collaborative study platform.
          </p>
          <p className="text-xs text-(--text-muted) mt-3">
            Last Updated: <span className="font-medium text-(--text-secondary)">{lastUpdated}</span>
          </p>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-6 md:p-8 rounded-3xl border border-(--border-default) bg-(--bg-surface)/70 backdrop-blur-xl shadow-sm"
              >
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue)/0.15)] text-[color:oklch(0.75_0.18_var(--accent-hue))] flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3.5 text-sm leading-relaxed text-(--text-secondary)">
                  {section.content.map((paragraph, pIdx) => {
                    const parts = paragraph.split('**');
                    if (parts.length >= 3) {
                      return (
                        <p key={pIdx}>
                          <strong className="text-(--text-primary) font-semibold">{parts[1]}:</strong>
                          {parts.slice(2).join('')}
                        </p>
                      );
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="mt-14 pt-8 border-t border-(--border-default) flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-(--text-muted)">
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-(--text-primary) transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/login" className="hover:text-(--text-primary) transition-colors">Login</Link>
            <span>•</span>
            <Link to="/signup" className="hover:text-(--text-primary) transition-colors">Create Account</Link>
          </div>
          <p>© 2026 EduWrap Inc. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
