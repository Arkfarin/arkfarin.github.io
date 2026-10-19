import { useEffect, useState } from 'react';

export function useActiveSection(
  ids: readonly string[],
  offset: number | 'viewport' = 'viewport',
) {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const elements = ids
        .map((id) => document.getElementById(id))
        .filter((el) => el !== null);
      if (!elements.length) return;
      let current = elements[0];
      const threshold =
        offset === 'viewport' ? window.innerHeight * 0.36 : offset;
      for (const element of elements)
        if (element.getBoundingClientRect().top <= threshold) current = element;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8
      )
        current = elements[elements.length - 1];
      setActive(current.id);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('load', schedule);
    };
  }, [ids, offset]);
  return active;
}
