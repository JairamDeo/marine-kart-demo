import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to top on every route change (including redirects). */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el) {
        el.scrollIntoView();
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Admin / account portal scrolls inside <main>, not the window
    document.querySelectorAll('[data-scroll-reset]').forEach((node) => {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    });
  }, [pathname, search, hash]);

  return null;
}
