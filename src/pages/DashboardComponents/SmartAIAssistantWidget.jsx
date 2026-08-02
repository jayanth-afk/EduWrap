import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SmartAIAssistantWidget() {
  const navigate = useNavigate();

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="relative p-6 overflow-hidden group h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] to-transparent opacity-50"></div>
      <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] to-transparent rounded-3xl z-0 animate-[shimmer_3s_infinite]"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 text-[color:oklch(0.58_0.22_var(--accent-hue))]">
          <Sparkles size={18} className="fill-current" />
          <h3 className="font-bold text-sm uppercase tracking-wider">AI Insight</h3>
        </div>
        
        <p className="text-[15px] font-medium leading-relaxed mb-4">
          You haven’t revised <span className="text-[color:oklch(0.58_0.22_var(--accent-hue))]">Thermodynamics</span> in 5 days. Your quiz accuracy in this topic has dropped by 12%.
        </p>

        <button 
          onClick={() => navigate('/flashcards')}
          className="flex items-center gap-2 text-sm font-semibold bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity w-fit shadow-(--shadow-glow) cursor-pointer"
        >
          Review Now <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}