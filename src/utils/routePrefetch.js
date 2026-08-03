/**
 * Route prefetching utility to load page chunks in idle time or on hover
 * ensures instantaneous 0ms page transitions across the entire app.
 */

const routeModules = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/rooms': () => import('../pages/Rooms'),
  '/notes': () => import('../pages/Notes'),
  '/flashcards': () => import('../pages/Flashcards'),
  '/quiz': () => import('../pages/Quiz'),
  '/doubts': () => import('../pages/Doubts'),
  '/files': () => import('../pages/Files'),
  '/profile': () => import('../pages/Profile'),
  '/settings': () => import('../pages/Settings/SettingsLayout'),
  '/sandbox': () => import('../pages/Sandbox'),
};

const prefetchedCache = new Set();

/**
 * Prefetch a single route by path
 */
export function prefetchRoute(path) {
  const normalized = path.split('?')[0].split('#')[0];
  if (prefetchedCache.has(normalized)) return;

  const importer = routeModules[normalized];
  if (typeof importer === 'function') {
    prefetchedCache.add(normalized);
    importer().catch(() => {
      prefetchedCache.delete(normalized);
    });
  }
}

/**
 * Prefetch all primary routes during browser idle time
 */
export function prefetchAllRoutesIdle() {
  const prefetchNext = () => {
    const paths = Object.keys(routeModules);
    paths.forEach((path, idx) => {
      setTimeout(() => {
        prefetchRoute(path);
      }, idx * 100);
    });
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchNext, { timeout: 2000 });
    } else {
      setTimeout(prefetchNext, 800);
    }
  }
}
