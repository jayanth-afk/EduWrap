import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '../../../contexts/RoomContext';
import { useUser } from '../../../contexts/UserContext';
import { Plus, GripVertical, CheckCircle2, Clock, CheckSquare, X, Trash2, ArrowRight } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { 
  roomTasks, 
  createDoc, 
  patchDoc, 
  removeDoc, 
  safeOnSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  db
} from '../../../firebase/firestore';

const DEFAULT_TASKS = [
  { id: 't1', title: 'Design database schema for user profiles', priority: 'High Priority', tag: 'Database', status: 'todo', assignee: 'Alex', due: 'Today' },
  { id: 't2', title: 'Implement dark mode toggle', priority: 'Feature', tag: 'UI', status: 'todo', assignee: 'You', due: 'Next week' },
  { id: 't3', title: 'Build the polymorphic workspace switching logic', priority: 'Core', tag: 'Architecture', status: 'in-progress', assignee: 'Sarah', due: 'Active now' },
  { id: 't4', title: 'Setup Vite project with Tailwind & Lucide', priority: 'Setup', tag: 'Infra', status: 'completed', assignee: 'Alex', due: 'Oct 24' },
];

export default function ProjectWorkspace() {
  const { activeRoom, activeClassroom } = useRoom();
  const { user } = useUser();
  const roomId = activeRoom?.id;
  const storageKey = `ew_project_tasks_${roomId || 'default'}`;

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High Priority');
  const [newTaskTag, setNewTaskTag] = useState('Feature');
  const [newTaskDue, setNewTaskDue] = useState('Today');

  // Real-time Firestore sync for room tasks
  useEffect(() => {
    if (!roomId) return;

    const q = query(roomTasks(roomId), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = safeOnSnapshot(q, (snap) => {
      if (!snap.empty) {
        const firestoreTasks = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));
        setTasks(firestoreTasks);
      }
    }, (err) => {
      console.warn('Room tasks listener:', err);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {}
  }, [tasks, storageKey]);

  if (!activeClassroom) return null;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const createdTask = {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      tag: newTaskTag,
      status: 'todo',
      assignee: user?.name || 'You',
      due: newTaskDue || 'Today',
      classroomId: activeClassroom?.id || null,
      createdAt: serverTimestamp(),
    };

    setNewTaskTitle('');
    setIsNewTaskModalOpen(false);

    // Optimistic local state update
    const tempId = `t-${Date.now()}`;
    setTasks(prev => [{ ...createdTask, id: tempId }, ...prev]);

    if (roomId) {
      try {
        const docId = await createDoc(roomTasks(roomId), createdTask);
        if (docId) {
          setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: docId } : t));
        }
      } catch (err) {
        console.error('Failed to create room task in Firestore:', err);
      }
    }
  };

  const moveTask = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    if (roomId && !taskId.startsWith('t-')) {
      try {
        await patchDoc(doc(db, 'rooms', roomId, 'tasks', taskId), { status: newStatus });
      } catch (err) {
        console.error('Failed to update task status in Firestore:', err);
      }
    }
  };

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));

    if (roomId && !taskId.startsWith('t-')) {
      try {
        await removeDoc(doc(db, 'rooms', roomId, 'tasks', taskId));
      } catch (err) {
        console.error('Failed to delete task in Firestore:', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-(--bg-primary) overflow-hidden relative">
      {/* Topbar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-(--border-default) flex flex-wrap items-center justify-between gap-3 shrink-0 bg-(--bg-elevated)/50 backdrop-blur-md">
        <div>
          <h2 className="font-bold text-lg">{activeClassroom.name}</h2>
          <p className="text-xs text-(--text-muted)">Project tasks and milestones</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--bg-glass) border border-(--border-subtle)">
            <CheckSquare size={14} className="text-(--text-muted)" />
            <span className="text-xs font-medium text-(--text-primary)">{completionRate}% Completed</span>
          </div>
          <button 
            onClick={() => setIsNewTaskModalOpen(true)} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-(--shadow-glow)"
          >
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto p-3 sm:p-6 flex gap-4 sm:gap-6">
        {/* TO DO Column */}
        <div className="w-72 sm:w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm text-(--text-secondary) flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span> To Do
            </h3>
            <span className="text-xs font-bold bg-(--bg-elevated) px-2 py-0.5 rounded-md text-(--text-muted)">{todoTasks.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {todoTasks.map(task => (
              <div key={task.id} className="bg-(--bg-glass) border border-(--border-subtle) rounded-2xl p-4 shadow-sm group hover:border-(--border-default) transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded">{task.priority}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveTask(task.id, 'in-progress')} className="p-1 text-xs text-(--text-muted) hover:text-(--accent) cursor-pointer" title="Move to In Progress">
                      <ArrowRight size={12} />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1 text-xs text-(--text-muted) hover:text-red-500 cursor-pointer" title="Delete Task">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="font-medium text-sm mb-4 text-(--text-primary)">{task.title}</p>
                <div className="flex items-center justify-between">
                  <Avatar initials={task.assignee[0]} size="sm" />
                  <span className="flex items-center gap-1 text-xs text-(--text-muted)"><Clock size={12} /> {task.due}</span>
                </div>
              </div>
            ))}
            {todoTasks.length === 0 && (
              <p className="text-xs text-center text-(--text-muted) py-8 border border-dashed border-(--border-subtle) rounded-2xl">No tasks to do</p>
            )}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="w-72 sm:w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm text-(--text-secondary) flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue))] animate-pulse"></span> In Progress
            </h3>
            <span className="text-xs font-bold bg-(--bg-elevated) px-2 py-0.5 rounded-md text-(--text-muted)">{inProgressTasks.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {inProgressTasks.map(task => (
              <div key={task.id} className="bg-(--bg-glass) border border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.4)] rounded-2xl p-4 shadow-(--shadow-glow) group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[color:oklch(0.58_0.22_var(--accent-hue))]"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">{task.priority}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveTask(task.id, 'completed')} className="p-1 text-xs text-(--text-muted) hover:text-green-500 cursor-pointer" title="Mark as Completed">
                      <CheckCircle2 size={12} />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1 text-xs text-(--text-muted) hover:text-red-500 cursor-pointer" title="Delete Task">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="font-medium text-sm mb-4 text-(--text-primary)">{task.title}</p>
                <div className="flex items-center justify-between">
                  <Avatar initials={task.assignee[0]} size="sm" />
                  <span className="flex items-center gap-1 text-xs font-semibold text-[color:oklch(0.58_0.22_var(--accent-hue))]">{task.due}</span>
                </div>
              </div>
            ))}
            {inProgressTasks.length === 0 && (
              <p className="text-xs text-center text-(--text-muted) py-8 border border-dashed border-(--border-subtle) rounded-2xl">No tasks in progress</p>
            )}
          </div>
        </div>

        {/* COMPLETED Column */}
        <div className="w-72 sm:w-80 shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm text-(--text-secondary) flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Completed
            </h3>
            <span className="text-xs font-bold bg-(--bg-elevated) px-2 py-0.5 rounded-md text-(--text-muted)">{completedTasks.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {completedTasks.map(task => (
              <div key={task.id} className="bg-(--bg-elevated) border border-(--border-default) rounded-2xl p-4 opacity-75 group hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-[10px] font-bold uppercase text-green-500">{task.tag || 'Done'}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="p-1 text-xs text-(--text-muted) opacity-0 group-hover:opacity-100 hover:text-red-500 cursor-pointer" title="Delete Task">
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="font-medium text-sm line-through text-(--text-muted) mb-3">{task.title}</p>
                <div className="flex items-center justify-between pl-6">
                  <Avatar initials={task.assignee[0]} size="sm" className="grayscale" />
                  <span className="text-[10px] text-(--text-muted)">{task.due}</span>
                </div>
              </div>
            ))}
            {completedTasks.length === 0 && (
              <p className="text-xs text-center text-(--text-muted) py-8 border border-dashed border-(--border-subtle) rounded-2xl">No completed tasks yet</p>
            )}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      <AnimatePresence>
        {isNewTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsNewTaskModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-(--bg-glass) backdrop-blur-2xl border border-(--border-strong) p-6 rounded-3xl shadow-(--shadow-2xl) w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-(--text-primary)">Add Project Task</h3>
                <button onClick={() => setIsNewTaskModalOpen(false)} className="p-1.5 rounded-lg text-(--text-muted) hover:bg-(--bg-hover) cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">Task Description</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Implement API rate limit handling"
                    className="w-full bg-(--bg-elevated) border border-(--border-default) rounded-xl px-3 py-2.5 text-sm text-(--text-primary) outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value)}
                      className="w-full bg-(--bg-elevated) border border-(--border-default) rounded-xl px-3 py-2.5 text-sm text-(--text-primary) outline-none"
                    >
                      <option value="High Priority">High Priority</option>
                      <option value="Feature">Feature</option>
                      <option value="Core">Core</option>
                      <option value="Fix">Bug Fix</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">Due Time</label>
                    <input
                      type="text"
                      value={newTaskDue}
                      onChange={e => setNewTaskDue(e.target.value)}
                      placeholder="e.g. Tomorrow"
                      className="w-full bg-(--bg-elevated) border border-(--border-default) rounded-xl px-3 py-2.5 text-sm text-(--text-primary) outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}