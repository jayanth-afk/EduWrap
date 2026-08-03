import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, BookOpen, MessageSquare, Users, Sparkles, 
  Zap, Shield, Clock, BrainCircuit, Target, Video, CheckCircle2, Moon, Sun
} from 'lucide-react';
import { Button, IconButton } from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import LiquidEther from '../components/ui/LiquidEther';
import dashboardImg from '../assets/dashboard.png';

const FEATURES = [
  { icon: Users, title: 'Collaborative Study Rooms', desc: 'Virtual spaces to study together with video, audio, and screenshare.', color: 'blue' },
  { icon: BrainCircuit, title: 'AI Assistant', desc: 'Stuck on a concept? Your AI tutor explains it simply and instantly.', color: 'purple' },
  { icon: Zap, title: 'Smart Flashcards', desc: 'Auto-generate flashcards from your notes using spaced repetition.', color: 'yellow' },
  { icon: BookOpen, title: 'Multiplayer Notes', desc: 'Real-time collaborative note-taking that syncs instantly.', color: 'emerald' },
  { icon: Target, title: 'Interactive Quizzes', desc: 'Test your knowledge with gamified quizzes and track your progress.', color: 'red' },
  { icon: MessageSquare, title: 'Live Chat', desc: 'Dedicated channels for every subject with instant messaging.', color: 'cyan' },
  { icon: Video, title: 'Live Sessions', desc: 'Host or join live study sessions with built-in productivity timers.', color: 'pink' },
  { icon: Shield, title: 'Private & Secure', desc: 'Your academic data is encrypted and completely private.', color: 'slate' },
];

const STATS = [
  { value: '10K+', label: 'Active Students' },
  { value: '500+', label: 'Study Groups' },
  { value: '2M+', label: 'Flashcards Created' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const TESTIMONIALS = [
  { name: 'Sarah Jenkins', role: 'Computer Science Major', text: 'EduWrap completely changed how our study group operates. We no longer need 5 different apps.', initials: 'SJ', avatar: null },
  { name: 'Marcus Chen', role: 'Medical Student', text: 'The AI flashcard generation alone saves me hours every week. Absolutely incredible platform.', initials: 'MC', avatar: null },
  { name: 'Elena Rodriguez', role: 'Law Student', text: 'The study rooms make remote learning feel like we are all in the library together. A must-have!', initials: 'ER', avatar: null },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const { theme, setTheme } = useTheme();
  const toggleTheme = (e) => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'light' : 'dark', e);
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark', e);
    }
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-(--bg-base) overflow-hidden font-sans">
      
      {/* ─── ANIMATED BACKGROUND ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
        <div className="w-full h-full pointer-events-auto">
          <LiquidEther 
            resolution={0.25}
            iterationsPoisson={16}
            iterationsViscous={16}
            dt={0.02}
          />
        </div>
      </div>

      {/* ─── FLOATING NAVBAR ─── */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${scrolled ? 'bg-(--bg-elevated)/95 border border-(--border-strong) shadow-(--shadow-md)' : 'bg-transparent border-transparent'}`}>
            <div className="flex items-center gap-3">
              <img 
                src="/logo-icon.png" 
                alt="EduWrap" 
                className="w-9 h-9 rounded-xl object-cover shadow-(--shadow-glow) ring-1 ring-white/10" 
              />
              <span className="font-bold text-lg hidden sm:block" style={{ fontFamily: 'var(--font-display)' }}>EduWrap</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-(--text-secondary)">
              <a href="#features" className="hover:text-(--text-primary) transition-colors">Features</a>
              <a href="#demo" className="hover:text-(--text-primary) transition-colors">Demo</a>
              <a href="#testimonials" className="hover:text-(--text-primary) transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center gap-3">
              <IconButton variant="ghost" aria-label="Toggle Theme" onClick={toggleTheme}>
                {theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? <Moon size={18} /> : <Sun size={18} />}
              </IconButton>
              <Button variant="ghost" className="hidden sm:flex" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="primary" onClick={() => navigate('/signup')}>Get Started</Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative z-10 pt-40 pb-20 px-6 md:pt-48 md:pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <Badge variant="accent" className="mb-8 px-4 py-1.5 text-sm rounded-full shadow-(--shadow-glow)">
            <Sparkles size={14} className="mr-2" /> EduWrap is now in public beta
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold leading-[1.1] tracking-tight mb-8" style={{ fontFamily: 'var(--font-display)' }}>
            Study Smarter,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.65_0.18_calc(var(--accent-hue)_+_40))]">
              Together.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-(--text-secondary) max-w-2xl mb-12 leading-relaxed">
            The all-in-one collaborative workspace for college students. Notes, flashcards, AI assistance, and live study sessions — finally unified in one beautiful app.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto h-14 px-8 text-base shadow-(--shadow-glow)" onClick={() => navigate('/signup')}>
              Start Learning for Free <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-base bg-(--bg-glass)">
              <Clock size={20} className="mr-2" /> Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Floating UI Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="max-w-5xl mx-auto mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-(--bg-base) via-transparent to-transparent z-10 bottom-0 h-1/3 pointer-events-none" />
          <div className="rounded-2xl border border-(--border-strong) bg-(--bg-elevated)/95 shadow-2xl overflow-hidden ring-1 ring-white/10">
            <div className="h-12 border-b border-(--border-strong) flex items-center px-4 gap-2 bg-(--bg-surface)">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <img src={dashboardImg} alt="EduWrap Dashboard Interface" className="w-full h-auto block border-b border-(--border-strong)" />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section className="relative z-10 py-12 border-y border-(--border-default) bg-(--bg-surface)/90">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-[color:oklch(0.58_0.22_var(--accent-hue))]" style={{ fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-(--text-secondary) mt-2 uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Everything you need to <span className="text-[color:oklch(0.58_0.22_var(--accent-hue))]">ace your exams</span>
            </h2>
            <p className="text-lg text-(--text-secondary)">
              Stop switching between 10 different apps. EduWrap brings the best study tools into one deeply integrated, intelligent workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card interactive className="h-full bg-(--bg-surface)/90 hover:bg-(--bg-elevated) transition-colors duration-300">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-(--border-default)"
                      style={{ 
                        background: 'oklch(0.58 0.22 var(--accent-hue) / 0.1)',
                        color: 'oklch(0.58 0.22 var(--accent-hue))'
                      }}
                    >
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{feature.title}</h3>
                    <p className="text-(--text-secondary) text-sm leading-relaxed flex-1">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="relative z-10 py-24 bg-(--bg-surface)/90 border-y border-(--border-default)">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ fontFamily: 'var(--font-display)' }}>
            Loved by students everywhere
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full bg-(--bg-elevated)">
                  <CardContent className="p-8">
                    <div className="flex gap-1 text-[color:oklch(0.58_0.22_var(--accent-hue))] mb-6">
                      {[1,2,3,4,5].map(star => <Sparkles key={star} size={16} className="fill-current" />)}
                    </div>
                    <p className="text-lg mb-8 italic">"{t.text}"</p>
                    <div className="flex items-center gap-4">
                      <Avatar initials={t.initials} size="md" />
                      <div>
                        <div className="font-bold">{t.name}</div>
                        <div className="text-xs text-(--text-muted)">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FOOTER ─── */}
      <section className="relative z-10 py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center p-12 md:p-16 rounded-[2.5rem] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue))] to-[color:oklch(0.40_0.25_var(--accent-hue))] opacity-10" />
          <div className="absolute inset-0 border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] rounded-[2.5rem] bg-(--bg-elevated)/90" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to transform your grades?
            </h2>
            <p className="text-xl text-(--text-secondary) mb-10 max-w-2xl mx-auto">
              Join thousands of students who are already studying smarter, not harder. It takes 30 seconds to sign up.
            </p>
            <Button size="lg" variant="primary" className="h-16 px-10 text-lg shadow-(--shadow-glow)" onClick={() => navigate('/signup')}>
              Get Started for Free <ArrowRight size={24} className="ml-2" />
            </Button>
            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-(--text-muted)">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-500" /> Free forever plan</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-(--border-default) bg-(--bg-surface) py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <img 
              src="/logo-icon.png" 
              alt="EduWrap" 
              className="w-8 h-8 rounded-lg object-cover shadow-sm" 
            />
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>EduWrap</span>
          </div>
          <div className="flex gap-6 text-sm text-(--text-secondary)">
            <Link to="/privacy" className="hover:text-(--text-primary) transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-(--text-primary) transition-colors">Terms of Service</Link>
            <a href="mailto:support@eduwrap.app" className="hover:text-(--text-primary) transition-colors">Contact Support</a>
          </div>
          <p className="text-sm text-(--text-muted)">
            © 2026 EduWrap Inc. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
