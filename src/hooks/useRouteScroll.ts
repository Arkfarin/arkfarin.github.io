import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

const positions = new Map<string, number>();
const entries = new Map<string, number>();
const pathKey = (path: string) => path.replace(/\/+$/, '') || '/';

export function useRouteScroll() {
  const { pathname, hash, key } = useLocation();
  const navigation = useNavigationType();
  const navigationRef = useRef(navigation);
  const previousPath = useRef<string | null>(null);

  // Router history changes before the outgoing page finishes its transition.
  useLayoutEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const path = pathKey(pathname);
    const changedPage = previousPath.current !== path;
    previousPath.current = path;
    const historyPosition =
      navigationRef.current === 'POP' ? entries.get(key) : undefined;
    const top = historyPosition ?? positions.get(path) ?? 0;
    let restored = false;
    let id = '';
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      // Malformed fragments fall back to the saved position.
    }
    if (document.documentElement.dataset.loading) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    const restore = () => {
      if (document.documentElement.dataset.loading) return;
      const target =
        id && historyPosition === undefined
          ? document.getElementById(id)
          : null;
      if (target) {
        if (!target.hasAttribute('tabindex'))
          target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView({
          behavior:
            changedPage ||
            matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'instant'
              : 'smooth',
        });
      } else {
        window.scrollTo({ top, behavior: 'instant' });
      }
      restored = true;
      remember();
    };
    const remember = () => {
      if (restored) {
        positions.set(path, window.scrollY);
        entries.set(key, window.scrollY);
      }
    };

    // Wait for the real content: a Suspense fallback cannot restore a deep scroll.
    window.addEventListener('route-ready', restore);
    window.addEventListener('site-ready', restore);
    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      window.removeEventListener('route-ready', restore);
      window.removeEventListener('site-ready', restore);
      window.removeEventListener('scroll', remember);
    };
  }, [pathname, hash, key]);
}
