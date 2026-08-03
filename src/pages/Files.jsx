import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Users, Upload } from 'lucide-react';
import { FileProvider, useFiles } from '../contexts/FileContext';
import FilesTopBar from './FilesComponents/FilesTopBar';
import FilesLeftSidebar from './FilesComponents/FilesLeftSidebar';
import FilesWorkspace from './FilesComponents/FilesWorkspace';
import FilesRightSidebar from './FilesComponents/FilesRightSidebar';
import FilePreviewModal from './FilesComponents/FilePreviewModal';
import UploadModal from './FilesComponents/UploadModal';
import DragDropOverlay from './FilesComponents/DragDropOverlay';

function FilesContent() {
  const {
    files, folders, activity,
    addFile, toggleStar, togglePin, incrementDownload,
    storageUsed, storageTotal, filesByType, totalFiles,
  } = useFiles();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState('recent');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [previewFileId, setPreviewFileId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Category filter
    if (activeCategory) result = result.filter(f => f.category === activeCategory);

    // Nav filter
    switch (activeFilter) {
      case 'recent': result = result.sort((a, b) => a.lastAccessedAt > b.lastAccessedAt ? -1 : 1); break;
      case 'downloads': result = result.filter(f => f.source?.type === 'study-room'); break;
      case 'starred': result = result.filter(f => f.isStarred); break;
      case 'shared': result = result.filter(f => f.owner.id !== 'me'); break;
      case 'uploaded': result = result.filter(f => f.source?.type === 'upload'); break;
      case 'classroom': result = result.filter(f => f.source?.type === 'study-room'); break;
      case 'ai': result = result.filter(f => f.source?.type === 'ai-generated'); break;
      case 'flashcard': result = result.filter(f => f.source?.type === 'flashcard'); break;
      case 'quiz': result = result.filter(f => f.source?.type === 'quiz'); break;
      default: break;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (activeSort) {
      case 'name': result = result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'size': result = result.sort((a, b) => b.sizeBytes - a.sizeBytes); break;
      case 'downloads': result = result.sort((a, b) => b.downloadCount - a.downloadCount); break;
      default: break; // 'recent' is default order
    }

    return result;
  }, [files, activeCategory, activeFilter, searchQuery, activeSort]);

  const previewFile = previewFileId ? files.find(f => f.id === previewFileId) : null;
  const starredFiles = files.filter(f => f.isStarred);

  // Compute filter counts
  const fileCounts = useMemo(() => ({
    all: files.length,
    starred: files.filter(f => f.isStarred).length,
    shared: files.filter(f => f.owner.id !== 'me').length,
    uploaded: files.filter(f => f.source?.type === 'upload').length,
    ai: files.filter(f => f.source?.type === 'ai-generated').length,
    flashcard: files.filter(f => f.source?.type === 'flashcard').length,
    quiz: files.filter(f => f.source?.type === 'quiz').length,
    classroom: files.filter(f => f.source?.type === 'study-room').length,
  }), [files]);

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    // In a real app, we'd process e.dataTransfer.files here
    setIsUploadOpen(true);
  }, []);

  const handleUploadSubmit = (data, file) => {
    addFile(data, file);
  };

  return (
    <div
      className="flex flex-1 min-h-0 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <DragDropOverlay isDragging={isDragging} />

      {/* LEFT SIDEBAR — Desktop */}
      <div className="hidden lg:flex w-56 shrink-0 z-10">
        <FilesLeftSidebar
          activeFilter={activeFilter}
          onFilterChange={(f) => { setActiveFilter(f); setActiveFolder(null); }}
          activeCategory={activeCategory}
          onCategoryChange={(c) => { setActiveCategory(c); setActiveFolder(null); }}
          folders={folders}
          onFolderClick={(id) => { setActiveFolder(id); setActiveFilter('all'); setActiveCategory(null); }}
          fileCounts={fileCounts}
        />
      </div>

      {/* LEFT SIDEBAR — Mobile Drawer */}
      <AnimatePresence>
        {isMobileLeftOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileLeftOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden">
              <FilesLeftSidebar
                activeFilter={activeFilter}
                onFilterChange={(f) => { setActiveFilter(f); setActiveFolder(null); setIsMobileLeftOpen(false); }}
                activeCategory={activeCategory}
                onCategoryChange={(c) => { setActiveCategory(c); setActiveFolder(null); setIsMobileLeftOpen(false); }}
                folders={folders}
                onFolderClick={(id) => { setActiveFolder(id); setIsMobileLeftOpen(false); }}
                fileCounts={fileCounts}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CENTER — Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-(--border-default) bg-(--bg-elevated)/80 backdrop-blur-md z-10">
          <button onClick={() => setIsMobileLeftOpen(true)} className="p-2 rounded-lg hover:bg-(--bg-glass)">
            <Menu size={20} />
          </button>
          <div className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>Resource Hub</div>
          <button onClick={() => setIsMobileRightOpen(true)} className="p-2 rounded-lg hover:bg-(--bg-glass) relative">
            <Users size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <FilesTopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeSort={activeSort}
              onSortChange={setActiveSort}
              viewMode={viewMode}
              onViewChange={setViewMode}
              onUpload={() => setIsUploadOpen(true)}
              fileCount={filteredFiles.length}
            />

            <FilesWorkspace
              files={filteredFiles}
              folders={folders}
              viewMode={viewMode}
              activeFolder={activeFolder}
              onFolderClick={setActiveFolder}
              onBackFolder={() => setActiveFolder(null)}
              onStar={toggleStar}
              onPreview={setPreviewFileId}
            />
          </div>
        </div>

        {/* Mobile FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[color:oklch(0.58_0.22_var(--accent-hue))] text-white flex items-center justify-center shadow-[0_4px_20px_oklch(0.58_0.22_var(--accent-hue)_/_0.4)]"
          onClick={() => setIsUploadOpen(true)}
          whileTap={{ scale: 0.9 }}
        >
          <Upload size={24} />
        </motion.button>
      </div>

      {/* RIGHT SIDEBAR — Desktop */}
      <div className="hidden xl:flex w-72 shrink-0 z-10">
        <FilesRightSidebar
          storageUsed={storageUsed}
          storageTotal={storageTotal}
          filesByType={filesByType}
          totalFiles={totalFiles}
          activity={activity}
          starredFiles={starredFiles}
        />
      </div>

      {/* RIGHT SIDEBAR — Mobile Drawer */}
      <AnimatePresence>
        {isMobileRightOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm" onClick={() => setIsMobileRightOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed inset-y-0 right-0 w-80 z-50 xl:hidden">
              <FilesRightSidebar storageUsed={storageUsed} storageTotal={storageTotal} filesByType={filesByType} totalFiles={totalFiles} activity={activity} starredFiles={starredFiles} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFileId(null)}
        onStar={toggleStar}
        onDownload={incrementDownload}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleUploadSubmit}
        folders={folders}
      />
    </div>
  );
}

export default function Files() {
  return <FilesContent />;
}
