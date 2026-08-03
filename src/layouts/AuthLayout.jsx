import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-(--bg-primary) overflow-hidden text-(--text-primary)">
      
      {/* LEFT SIDE - Animated Ambient Visuals */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-(--bg-elevated) border-r border-(--border-subtle)">
        {/* Glow Orbs */}
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[100px] opacity-20 will-change-transform transform-gpu"
          style={{ background: 'oklch(0.58 0.22 calc(var(--accent-hue) + 60))' }}
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 will-change-transform transform-gpu"
          style={{ background: 'oklch(0.60 0.18 calc(var(--accent-hue) - 30))' }}
        />

        <div className="relative z-10 text-center max-w-md">
          <img 
            src="/logo-icon.png" 
            alt="EduWrap" 
            className="w-24 h-24 mx-auto mb-6 rounded-3xl object-cover shadow-(--shadow-glow) ring-2 ring-white/10 hover:scale-105 transition-transform" 
          />
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Your Study OS
          </h1>
          <p className="text-lg text-(--text-secondary) leading-relaxed">
            Join the most powerful collaborative workspace built entirely for students. Connect, study, and level up together.
          </p>
        </div>

        {/* Floating Mockup Elements */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-10 right-10 bg-(--bg-glass) backdrop-blur-xl border border-(--border-subtle) rounded-2xl p-4 shadow-(--shadow-xl) w-64"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-white text-xs">AI</div>
            <div className="h-4 w-24 bg-(--bg-elevated) rounded-full"></div>
          </div>
          <div className="h-3 w-full bg-(--bg-primary) rounded-full mb-2"></div>
          <div className="h-3 w-4/5 bg-(--bg-primary) rounded-full"></div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Form Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
