import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

const pathKey = (path: string) => path.replace(/\/+$/, '') || '/';

// Keep the outgoing route mounted until its replacement is ready. This also
// covers browser history and programmatic navigation, without changing links.
export function usePageTransition(
  prepare: (pathname: string) => Promise<unknown>,
  onInitialReady?: () => void,
) {
  const destination = useLocation();
  const [location, setLocation] = useState(destination);
  const displayed = useRef(destination);
  const committed = useRef<(() => void) | null>(null);

  const onReady = useCallback(() => {
    onInitialReady?.();
    // Parent layout effects subscribe before this runs, including on lazy pages.
    queueMicrotask(() => window.dispatchEvent(new Event('route-ready')));
    committed.current?.();
    committed.current = null;
  }, [onInitialReady]);

  useEffect(() => {
    if (destination === displayed.current) return;
    let cancelled = false;
    const animations: Animation[] = [];
    const html = document.documentElement;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const content = document.querySelector<HTMLElement>('[data-route-content]');
    const samePage =
      pathKey(destination.pathname) === pathKey(displayed.current.pathname);
    const animate =
      !samePage &&
      !html.dataset.loading &&
      !motion.matches &&
      content !== null &&
      typeof content.animate === 'function';
    const finishMotion = () =>
      animations.forEach((animation) => {
        if (animation.playState === 'running') animation.finish();
      });
    motion.addEventListener('change', finishMotion);

    const run = async () => {
      if (cancelled) return;
      if (animate) {
        html.dataset.routeTransition = 'preparing';
        content.setAttribute('aria-busy', 'true');
        // Load the destination module while the previous page stays usable.
        await prepare(destination.pathname);
        if (cancelled) return;
        html.dataset.routeTransition = 'leaving';
        content.inert = true;
        if (!motion.matches) {
          const exit = content.animate(
            [
              { opacity: 1, transform: 'translateY(0)' },
              { opacity: 0, transform: 'translateY(-18px)' },
            ],
            {
              duration: 180,
              easing: 'cubic-bezier(0.4, 0, 1, 1)',
              fill: 'both',
            },
          );
          animations.push(exit);
          await exit.finished.catch(() => {});
          if (cancelled) return;
        }
        html.dataset.routeTransition = 'entering';
        animations.forEach((animation) => animation.cancel());
      } else {
        displayed.current = destination;
        setLocation(destination);
        return;
      }

      // Ready runs inside Suspense, so the fallback is never animated in.
      const ready = new Promise<void>((resolve) => {
        committed.current = resolve;
      });
      displayed.current = destination;
      setLocation(destination);
      await ready;
      if (cancelled) return;
      animations.forEach((animation) => animation.cancel());
      if (animate) {
        content.inert = false;
        const main = document.getElementById('main');
        if (main && !destination.hash) {
          if (!main.hasAttribute('tabindex')) main.tabIndex = -1;
          main.focus({ preventScroll: true });
        }
        if (!motion.matches) {
          const enter = content.animate(
            [
              { opacity: 0, transform: 'translateY(26px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            {
              duration: 520,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'both',
            },
          );
          animations.push(enter);
          await enter.finished.catch(() => {});
        }
      }
    };

    const clear = () => {
      motion.removeEventListener('change', finishMotion);
      animations.forEach((animation) => animation.cancel());
      delete html.dataset.routeTransition;
      if (content) {
        content.inert = false;
        content.removeAttribute('aria-busy');
      }
    };
    // Yield once so both immediate and animated navigation share cancellation.
    void Promise.resolve()
      .then(run)
      .catch(() => {
        // Animation failure must never prevent the requested navigation.
        if (!cancelled) {
          displayed.current = destination;
          setLocation(destination);
        }
      })
      .finally(() => {
        if (!cancelled) clear();
      });
    return () => {
      cancelled = true;
      committed.current?.();
      committed.current = null;
      motion.removeEventListener('change', finishMotion);
      clear();
    };
  }, [destination, prepare]);

  return { location, onReady };
}
