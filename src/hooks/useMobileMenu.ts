import { useEffect, useRef, useState } from 'react';

export function useMobileMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const closeOutside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const resize = () => setOpen(false);
    const media = matchMedia('(max-width: 760px)');
    media.addEventListener('change', resize);
    if (open) {
      document.addEventListener('pointerdown', closeOutside);
      document.addEventListener('focusin', closeOutside);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      media.removeEventListener('change', resize);
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, containerRef, buttonRef };
}
