import { useEffect } from 'react';
import { useLocation } from 'react-router';
export function useRouteScroll() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    const scroll = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      // React Router handles hash links; move keyboard focus along with the viewport.
      if (!target.hasAttribute('tabindex'))
        target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
      return true;
    };
    if (document.documentElement.dataset.loading) {
      window.addEventListener('site-ready', scroll, { once: true });
      return () => window.removeEventListener('site-ready', scroll);
    }
    if (scroll()) return;
    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(document.getElementById('root')!, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [pathname, hash, key]);
}
