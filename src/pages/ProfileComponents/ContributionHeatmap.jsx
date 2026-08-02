import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from '../../components/ui/Tooltip';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ContributionHeatmap() {
  const [gridData] = useState(() => {
    const data = [];
    const today = new Date();
    for (let w = 0; w < 14; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - ((13 - w) * 7 + (6 - d)));
        
        let level = 0;
        if (Math.random() > 0.4) {
          level = Math.floor(Math.random() * 4) + 1;
        }
        if (w === 13 && d > 3) level = Math.max(level, 2);

        week.push({
          date: date.toDateString(),
          level,
          xp: level * Math.floor(Math.random() * 50 + 10)
        });
      }
      data.push(week);
    }
    return data;
  });

  const getOpacityForLevel = (level) => {
    if (level === 0) return 'bg-(--bg-elevated) border border-(--border-default)';
    const opacities = [0.2, 0.5, 0.8, 1];
    return `bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_${opacities[level - 1]})] border border-transparent shadow-sm`;
  };

  return (
    <motion.div variants={itemVariants} className="bg-(--bg-glass) backdrop-blur-md rounded-3xl border border-(--border-default) p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-(--text-primary)">Study Activity</h3>
          <p className="text-sm text-(--text-secondary)">Your consistency over the last 3 months</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-(--text-primary)">42</p>
          <p className="text-xs text-(--text-muted)">Days Active</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 no-scrollbar">
        <div className="min-w-max flex gap-1">
          {gridData.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.map((day, dIndex) => (
                <Tooltip 
                  key={dIndex} 
                  content={
                    <div className="text-center">
                      <p className="font-semibold">{day.xp} XP</p>
                      <p className="text-[10px] text-(--text-muted)">{day.date}</p>
                    </div>
                  } 
                  position="top"
                >
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (wIndex * 7 + dIndex) * 0.005, type: 'spring', stiffness: 300 }}
                    className={`w-4 h-4 rounded-sm ${getOpacityForLevel(day.level)} cursor-pointer hover:ring-2 hover:ring-white/50 transition-all`}
                  />
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-(--text-muted)">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-(--bg-elevated) border border-(--border-default)" />
          <div className="w-3 h-3 rounded-sm bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.2)]" />
          <div className="w-3 h-3 rounded-sm bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.5)]" />
          <div className="w-3 h-3 rounded-sm bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.8)]" />
          <div className="w-3 h-3 rounded-sm bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_1)]" />
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
}
