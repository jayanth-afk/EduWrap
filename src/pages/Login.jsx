import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

const GithubIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const XIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#1877F2"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
import { useUser } from '../contexts/UserContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGithub, loginWithTwitter, loginWithFacebook, loginAsGuest, isLoggedIn, error: authError, clearError } = useUser();

  // Automatically navigate as soon as user is authenticated
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    clearError();
    try {
      const user = await loginWithGoogle();
      if (user) {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err?.message) setError(err.message);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    clearError();
    try {
      const user = await loginWithGithub();
      if (user) {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err?.message) setError(err.message);
    }
  };

  const handleTwitterLogin = async () => {
    setError('');
    clearError();
    try {
      const user = await loginWithTwitter();
      if (user) {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err?.message) setError(err.message);
    }
  };

  const handleFacebookLogin = async () => {
    setError('');
    clearError();
    try {
      const user = await loginWithFacebook();
      if (user) {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err?.message) setError(err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-(--bg-glass) backdrop-blur-2xl border border-(--border-strong) rounded-3xl p-8 shadow-(--shadow-xl) w-full max-w-md mx-auto"
    >
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-sm text-(--text-muted) hover:text-(--text-primary) transition-colors mb-6 group w-fit"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to home
      </button>

      {/* Mobile Brand Header */}
      <div className="flex lg:hidden items-center gap-2.5 mb-6">
        <img src="/logo-icon.png" alt="EduWrap" className="w-9 h-9 rounded-xl object-cover shadow-(--shadow-glow) ring-1 ring-white/10" />
        <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>EduWrap</span>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
        <p className="text-(--text-secondary)">Enter your credentials to access your workspace.</p>
      </div>

      {/* Error Alert */}
      {(error || authError) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error || authError}</span>
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-(--text-secondary) mb-1.5 ml-1">Email</label>
          <Input 
            icon={Mail} 
            type="email" 
            placeholder="name@example.com" 
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required 
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
            <label className="text-sm font-medium text-(--text-secondary)">Password</label>
            <a href="#" className="text-xs text-(--text-muted) hover:text-(--text-primary) transition-colors">Forgot password?</a>
          </div>
          <Input 
            icon={Lock} 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            required 
          />
        </div>

        <div className="pt-2">
          <Button type="submit" loading={loading} className="w-full">
            Log In <ArrowRight size={16} />
          </Button>
        </div>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-(--border-default)"></div>
        <span className="text-xs text-(--text-muted) uppercase tracking-wider font-medium">Or continue with</span>
        <div className="flex-1 h-px bg-(--border-default)"></div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">
        <button 
          type="button"
          onClick={handleGoogleLogin}
          aria-label="Sign in with Google"
          title="Google"
          className="relative overflow-hidden group flex items-center justify-center py-2.5 px-2 rounded-xl border border-(--border-default) bg-(--bg-glass) hover:border-(--border-strong) hover:bg-white/5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
        </button>
        <button 
          type="button"
          onClick={handleGithubLogin}
          aria-label="Sign in with GitHub"
          title="GitHub"
          className="relative overflow-hidden group flex items-center justify-center py-2.5 px-2 rounded-xl border border-(--border-default) bg-(--bg-glass) hover:border-(--border-strong) hover:bg-white/5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <GithubIcon size={18} />
        </button>
        <button 
          type="button"
          onClick={handleTwitterLogin}
          aria-label="Sign in with X (Twitter)"
          title="X (Twitter)"
          className="relative overflow-hidden group flex items-center justify-center py-2.5 px-2 rounded-xl border border-(--border-default) bg-(--bg-glass) hover:border-(--border-strong) hover:bg-white/5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <XIcon size={16} />
        </button>
        <button 
          type="button"
          onClick={handleFacebookLogin}
          aria-label="Sign in with Facebook"
          title="Facebook"
          className="relative overflow-hidden group flex items-center justify-center py-2.5 px-2 rounded-xl border border-(--border-default) bg-(--bg-glass) hover:border-(--border-strong) hover:bg-white/5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <FacebookIcon size={18} />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-(--border-default)/50 text-center">
        <button
          type="button"
          onClick={() => { loginAsGuest(); navigate('/dashboard'); }}
          className="text-xs font-semibold text-[color:oklch(0.58_0.22_var(--accent-hue))] hover:underline inline-flex items-center gap-1.5 py-1 px-3 rounded-lg bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)] transition-all active:scale-95 cursor-pointer"
        >
          ✨ Explore with Guest / Demo Mode
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-(--text-secondary)">
        Don't have an account?{' '}
        <Link to="/signup" className="text-(--text-primary) font-semibold hover:underline">Sign up</Link>
      </p>
    </motion.div>
  );
}
