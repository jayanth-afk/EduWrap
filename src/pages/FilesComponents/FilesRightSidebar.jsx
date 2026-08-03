import { motion } from 'framer-motion';
import { HardDrive, TrendingUp, Clock, FileText, Image, Video, Code, Star, ArrowDownToLine } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

const TYPE_ICONS = { pdf: FileText, image: Image, video: Video, doc: FileText, code: Code };
const TYPE_COLORS = { pdf: 'text-red-500', image: 'text-blue-500', video: 'text-purple-500', doc: 'text-sky-500', code: 'text-emerald-500' };

export default function FilesRightSidebar({
  storageUsed = '0 MB',
  storageTotal = '5.0 GB',
  filesByType = {},
  totalFiles = 0,
  activity = [],
  starredFiles = []
}) {
  const usedPercent = Math.min(((parseFloat(storageUsed || 0) / 5000) * 100), 100);

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto no-scrollbar p-4 bg-(--bg-elevated) border-l border-(--border-default)">

      {/* Storage Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <HardDrive size={15} className="text-(--text-muted)" />
          <h4 className="text-sm font-bold">Storage</h4>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-(--bg-elevated) mb-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(usedPercent, 3)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'oklch(0.58 0.22 var(--accent-hue))' }}
          />
        </div>
        <p className="text-xs text-(--text-muted)">{storageUsed} of {storageTotal} used</p>

        {/* Type breakdown */}
        <div className="mt-3 space-y-1.5">
          {Object.entries(filesByType || {}).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || FileText;
            const color = TYPE_COLORS[type] || 'text-(--text-muted)';
            return (
              <div key={type} className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1.5 ${color}`}>
                  <Icon size={12} />
                  <span className="capitalize">{type}</span>
                </span>
                <span className="text-(--text-muted)">{count} files</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Access (Starred) */}
      {starredFiles?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Star size={15} className="text-yellow-500" />
            <h4 className="text-sm font-bold">Quick Access</h4>
          </div>
          <div className="space-y-2">
            {starredFiles.slice(0, 5).map(file => {
              const Icon = TYPE_ICONS[file.type] || FileText;
              const color = TYPE_COLORS[file.type] || 'text-(--text-muted)';
              return (
                <div key={file.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                  <Icon size={13} className={color} />
                  <span className="text-xs text-(--text-secondary) truncate flex-1 group-hover:text-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors">{file.name}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h4 className="text-sm font-bold">Activity</h4>
        </div>
        <div className="space-y-2.5">
          {activity?.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <ArrowDownToLine size={12} className="text-(--text-muted) shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-(--text-secondary) leading-snug">
                  <span className="font-semibold text-(--text-primary)">{item.user}</span>{' '}
                  {item.action} <span className="text-[color:oklch(0.58_0.22_var(--accent-hue))]">{item.fileName}</span>
                  {item.target && <> in {item.target}</>}
                </p>
                <span className="text-[10px] text-(--text-muted)">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-(--bg-glass) backdrop-blur-xl border border-(--border-default) rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-(--text-muted)" />
          <h4 className="text-sm font-bold">Overview</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{totalFiles}</p>
            <p className="text-[10px] text-(--text-muted)">Total Files</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{starredFiles?.length || 0}</p>
            <p className="text-[10px] text-(--text-muted)">Starred</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
