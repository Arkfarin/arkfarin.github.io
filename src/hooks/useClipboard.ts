import { useEffect, useRef, useState } from 'react';

export function useClipboard() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timeout.current);
    };
  }, []);

  async function copy(text: string) {
    clearTimeout(timeout.current);
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      /* Caller shows a selectable fallback. */
    }
    if (mounted.current) {
      setStatus(copied ? 'copied' : 'failed');
      timeout.current = setTimeout(() => setStatus('idle'), 4000);
    }
    return copied;
  }
  return { copy, status };
}
