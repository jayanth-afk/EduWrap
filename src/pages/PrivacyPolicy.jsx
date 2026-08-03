import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, Database, Eye, Trash2, Mail, Globe, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "August 3, 2026";

  const sections = [
    {
      icon: Database,
      title: "1. Information We Collect",
      content: [
        "**Account Information**: When you sign up via Email, Google, GitHub, X (Twitter), or Facebook, we collect your name, email address, and profile picture provided by your authentication provider.",
        "**Study Workspace Content**: Notes, flashcards, custom decks, quiz responses, study room chats, and uploaded study files you create or upload within EduWrap.",
        "**Usage & Telemetry Data**: Technical telemetry including browser type, operating system, timestamped study activity streaks, and session metrics used strictly to improve workspace responsiveness."
      ]
    },
    {
      icon: Eye,
      title: "2. How We Use Your Information",
      content: [
        "**Workspace Synchronization**: To store, synchronize, and retrieve your study resources in real-time across your connected devices.",
        "**AI-Powered Study Assistance**: To generate intelligent flashcards, explain concepts in Doubt resolution, and structure practice quizzes tailored to your subjects.",
        "**Account Security & Authentication**: To verify identity, handle cross-device logins, and prevent unauthorized access to your private study rooms."
      ]
    },
    {
      icon: Lock,
      title: "3. Third-Party Integrations & OAuth",
      content: [
        "**Authentication Providers**: We support single sign-on (SSO) via Google, GitHub, X (Twitter), and Facebook. We only request basic profile permissions (name, email, public avatar) required to establish your account.",
        "**Cloud Infrastructure**: EduWrap is powered by Google Firebase (Authentication & Cloud Firestore). Your data is transmitted using encrypted TLS/HTTPS and stored securely with industry-standard access controls.",
        "**No Third-Party Ad Selling**: We do not sell, rent, or monetize your personal data or study materials with third-party advertisers."
      ]
    },
    {
      icon: Trash2,
      title: "4. Data Retention & User Data Deletion",
      content: [
        "**Right to Erasure**: You have full control over your personal data. You can delete your notes, flashcards, and uploaded files at any time directly within the application.",
        "**Account & Data Deletion Requests**: If you wish to completely delete your account and all associated Firestore records, you can submit a deletion request via Settings or email us at **support@eduwrap.app**.",
        "**Facebook Data Deletion Callback**: If you authenticated with Facebook, you can revoke access or request data removal through your Facebook Settings under **Apps and Websites > EduWrap > Remove**."
      ]
    },
    {
      icon: Shield,
      title: "5. Security of Your Information",
      content: [
        "We implement industry-standard administrative and technical safeguards to protect your personal information against unauthorized access, loss, or alteration.",
        "While no online platform is 100% immune from security threats, our infrastructure utilizes continuous security rules enforcement and Firebase role-based authorization."
      ]
    },
    {
      icon: Mail,
      title: "6. Contact Us",
      content: [
        "If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our privacy team at:",
        "**Email**: privacy@eduwrap.app",
        "**Support**: support@eduwrap.app"
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
            <Shield size={14} /> Privacy & Data Transparency
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Privacy Policy
          </h1>
          <p className="text-(--text-secondary) max-w-2xl mx-auto text-base">
            Your privacy and the security of your study data are paramount. Learn how EduWrap manages, safeguards, and respects your information.
          </p>
          <p className="text-xs text-(--text-muted) mt-3">
            Last Updated: <span className="font-medium text-(--text-secondary)">{lastUpdated}</span>
          </p>
        </motion.div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-2xl border border-(--border-default) bg-(--bg-surface)/60 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="font-semibold text-sm mb-1">Zero Ad Tracking</h3>
            <p className="text-xs text-(--text-secondary)">We never sell or monetize your study data to third-party ad brokers.</p>
          </div>

          <div className="p-4 rounded-2xl border border-(--border-default) bg-(--bg-surface)/60 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <Lock size={18} />
            </div>
            <h3 className="font-semibold text-sm mb-1">Encrypted In Transit</h3>
            <p className="text-xs text-(--text-secondary)">All communication and sync runs over secure TLS/HTTPS protocols.</p>
          </div>

          <div className="p-4 rounded-2xl border border-(--border-default) bg-(--bg-surface)/60 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Trash2 size={18} />
            </div>
            <h3 className="font-semibold text-sm mb-1">Instant Data Control</h3>
            <p className="text-xs text-(--text-secondary)">Delete notes, flashcards, or your entire account at your request.</p>
          </div>
        </div>

        {/* Policy Sections */}
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
            <Link to="/terms" className="hover:text-(--text-primary) transition-colors">Terms of Service</Link>
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
