import { useEffect, useRef } from 'react';
import { useMediaQuery } from './useMediaQuery';

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  useEffect(() => {
    if (!ref.current || reducedMotion || !('IntersectionObserver' in window))
      return;
    const elements = Array.from(ref.current.querySelectorAll('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-reveal', 'visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.04, rootMargin: '0px 0px 20px 0px' },
    );
    elements.forEach((element) => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.setAttribute('data-reveal', 'pending');
        observer.observe(element);
      }
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) =>
        element.setAttribute('data-reveal', 'ready'),
      );
    };
  }, [reducedMotion]);
  return ref;
}
