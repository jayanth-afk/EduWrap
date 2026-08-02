import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import { PlayCircle, Users, ArrowRight } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

export default function ActiveStudyRoomsWidget() {
  const { activeRooms } = useDashboard();
  const navigate = useNavigate();

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="p-6 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
          <h3 className="font-bold text-lg">Live Rooms</h3>
        </div>
        <Link to="/rooms" className="text-xs font-semibold text-[color:oklch(0.58_0.22_var(--accent-hue))] hover:underline flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
        {activeRooms.map(room => (
          <div 
            key={room.id} 
            onClick={() => navigate(`/room/${room.id}`)}
            className="p-4 rounded-2xl bg-(--bg-elevated) border border-(--border-default) hover:border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.4)] transition-colors group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[color:oklch(0.58_0.22_var(--accent-hue))] opacity-5 blur-[40px] group-hover:opacity-10 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color:oklch(0.58_0.22_var(--accent-hue))]">{room.category}</span>
                <h4 className="font-bold text-[15px] mt-0.5 group-hover:text-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors">{room.name}</h4>
              </div>
              <button className="w-8 h-8 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex -space-x-2">
                <Avatar initials="A" size="sm" className="border-2 border-(--bg-elevated)" />
                <Avatar initials="B" size="sm" className="border-2 border-(--bg-elevated)" />
                <Avatar initials="C" size="sm" className="border-2 border-(--bg-elevated)" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-(--text-muted)">
                <Users size={14} />
                <span>{room.participants} active</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}