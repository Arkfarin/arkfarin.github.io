import { useEffect, useRef, useState } from 'react';

export function useClipboard(successDuration = 4000) {
  const [status, setStatus] = useState<
    'idle' | 'copying' | 'copied' | 'failed'
  >('idle');
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
    setStatus('copying');
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      /* Caller shows a selectable fallback. */
    }
    if (mounted.current) {
      setStatus(copied ? 'copied' : 'failed');
      timeout.current = setTimeout(
        () => setStatus('idle'),
        copied ? successDuration : 4000,
      );
    }
    return copied;
  }
  return { copy, status };
}
