import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * =====================
 * Guarantees that navigating to any application route starts the destination
 * page at the very top (0, 0), eliminating carry-over scroll positions.
 *
 * Rules:
 * 1. Responds strictly to route pathname changes, NEVER normal component re-renders.
 * 2. If a specific fragment/hash exists (e.g. #section), scrolls to that element.
 * 3. Uses instant window.scrollTo to prevent visual disorientation or sluggish animations.
 * 4. Preserves internal component scrolling (modals, Workstation 4-line viewport, Academy 4-line canvas).
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // If navigating to a target element with a hash anchor
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        prevPathnameRef.current = pathname;
        return;
      }
    }

    // Scroll window to top whenever pathname changes
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    }
    prevPathnameRef.current = pathname;
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
