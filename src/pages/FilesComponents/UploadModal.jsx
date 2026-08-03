import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, Sparkles, FileText, Check } from 'lucide-react';
import { Button, IconButton } from '../../components/ui/Button';

const CATEGORIES = ['DSA', 'Physics', 'Chemistry', 'AI/ML', 'Maths', 'Coding', 'Interview Prep', 'Assignments'];
const FILE_TYPES = [
  { ext: '.pdf', type: 'pdf' }, { ext: '.md', type: 'doc' }, { ext: '.png', type: 'image' },
  { ext: '.jpg', type: 'image' }, { ext: '.jpeg', type: 'image' }, { ext: '.mp4', type: 'video' }, 
  { ext: '.py', type: 'code' }, { ext: '.js', type: 'code' }, { ext: '.jsx', type: 'code' },
  { ext: '.ts', type: 'code' }, { ext: '.tsx', type: 'code' }, { ext: '.zip', type: 'archive' },
];

export default function UploadModal({ isOpen, onClose, onSubmit, folders }) {
  const [formData, setFormData] = useState({ name: '', category: 'DSA', folder: null, tags: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setSelectedFile(file);
    const fileName = file.name;
    const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : '';
    
    // Guess category from name or default
    let guessedCat = 'DSA';
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('physic')) guessedCat = 'Physics';
    else if (lowerName.includes('chem')) guessedCat = 'Chemistry';
    else if (lowerName.includes('ai') || lowerName.includes('ml')) guessedCat = 'AI/ML';
    else if (lowerName.includes('math')) guessedCat = 'Maths';
    else if (lowerName.includes('code') || lowerName.includes('algo')) guessedCat = 'Coding';
    
    setFormData(prev => ({
      ...prev,
      name: fileName,
      category: prev.category || guessedCat
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;
    setUploadState('loading');

    const ext = formData.name.includes('.') ? formData.name.substring(formData.name.lastIndexOf('.')).toLowerCase() : '';
    const typeMatch = FILE_TYPES.find(t => t.ext === ext);

    const sizeBytes = selectedFile ? selectedFile.size : (Math.floor(Math.random() * 2000000) + 100000);
    const sizeStr = (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB';

    try {
      await onSubmit({
        name: formData.name,
        type: typeMatch?.type || 'doc',
        size: sizeStr,
        sizeBytes: sizeBytes,
        category: formData.category,
        folder: formData.folder,
        source: { type: 'upload', action: 'Manually uploaded' },
        owner: { id: 'me', name: 'You', initials: 'Y' },
      }, selectedFile);

      setUploadState('success');
      setTimeout(() => {
        setFormData({ name: '', category: 'DSA', folder: null, tags: '' });
        setSelectedFile(null);
        setUploadState('idle');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadState('idle');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => uploadState === 'idle' && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-(--bg-elevated) border border-(--border-strong) rounded-3xl shadow-(--shadow-lg) overflow-hidden flex flex-col max-h-[90vh]"
          >
            {uploadState === 'idle' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-default) shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.1)] text-[color:oklch(0.58_0.22_var(--accent-hue))] flex items-center justify-center shadow-(--shadow-glow)">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Upload Resource</h2>
                      <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">Add to your academic library</p>
                    </div>
                  </div>
                  <IconButton size="sm" onClick={onClose}><X size={18} /></IconButton>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Drop zone / File Picker */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer?.files?.[0];
                      if (file) processFile(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      selectedFile 
                        ? 'border-green-500/50 bg-green-500/5' 
                        : 'border-(--border-default) hover:border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.5)] bg-(--bg-glass)'
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3 text-green-500">
                        <FileText size={24} />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-(--text-primary) truncate max-w-[220px]">{selectedFile.name}</p>
                          <p className="text-[10px] text-(--text-muted)">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change file</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-(--text-muted) mb-2" />
                        <p className="text-sm font-medium text-(--text-secondary)">Click or drag files here</p>
                        <p className="text-[10px] text-(--text-muted) mt-1">PDF, Images, Code, Documents up to 50MB</p>
                      </>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">File Name *</label>
                    <input
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Binary Search Notes.pdf"
                      className="w-full bg-(--bg-glass) border border-(--border-default) rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[color:oklch(0.58_0.22_var(--accent-hue))] transition-colors"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-2">Category *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button" onClick={() => setFormData(p => ({ ...p, category: cat }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                            formData.category === cat
                              ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)] shadow-(--shadow-glow)'
                              : 'bg-(--bg-glass) text-(--text-secondary) border-(--border-default) hover:border-(--border-strong)'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Folder */}
                  {folders?.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-2">Folder (optional)</label>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setFormData(p => ({ ...p, folder: null }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                            !formData.folder ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)]'
                            : 'bg-(--bg-glass) text-(--text-secondary) border-(--border-default)'
                          }`}
                        >None</button>
                        {folders.map(f => (
                          <button key={f.id} type="button" onClick={() => setFormData(p => ({ ...p, folder: f.id }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                              formData.folder === f.id ? 'bg-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.15)] text-[color:oklch(0.58_0.22_var(--accent-hue))] border-[color:oklch(0.58_0.22_var(--accent-hue)_/_0.3)]'
                              : 'bg-(--bg-glass) text-(--text-secondary) border-(--border-default)'
                            }`}
                          >{f.icon} {f.name}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button type="submit" variant="primary" className="w-full h-12 text-base shadow-(--shadow-glow) cursor-pointer" disabled={!formData.name.trim() || !formData.category}>
                    <Sparkles size={18} className="mr-2" /> Upload Resource
                  </Button>
                </form>
              </>
            )}

            {uploadState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-(--border-default) border-t-[color:oklch(0.58_0.22_var(--accent-hue))] rounded-full animate-spin mb-4" />
                <p className="font-medium text-(--text-primary)">Uploading resource & syncing database...</p>
              </div>
            )}

            {uploadState === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="font-bold text-lg mb-1">Resource Added!</p>
                <p className="text-sm text-(--text-secondary)">Your file is now safely saved in your library.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
