// Completed work sets the target; elapsed time can only slow it down.
export function startPreloader() {
  const overlay = document.getElementById('preloader');
  const root = document.getElementById('root')!;
  const start = performance.now();
  const tasks = new Set<string>();
  let target = 0;
  let previous = start;
  let shown = 0;
  let stopped = false;
  root.inert = true;
  function frame(now: number) {
    if (stopped) return;
    const allowed = Math.min(target, ((now - start) / 500) * 100);
    shown = Math.min(allowed, shown + ((now - previous) / 140) * 100);
    previous = now;
    overlay?.style.setProperty('--progress', `${shown}%`);
    overlay?.setAttribute('aria-valuenow', String(Math.floor(shown)));
    if (shown < 100) requestAnimationFrame(frame);
    else void finish();
  }
  async function finish() {
    // Keep the fully coloured word visible before starting the letter exit.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    if (stopped) return;
    overlay?.setAttribute('data-state', 'leaving');
    const animations = overlay?.getAnimations({ subtree: true }) ?? [];
    await Promise.allSettled(animations.map((animation) => animation.finished));
    reveal();
  }
  function reveal() {
    stopped = true;
    root.inert = false;
    delete document.documentElement.dataset.loading;
    overlay?.remove();
    window.dispatchEvent(new Event('site-ready'));
  }
  requestAnimationFrame(frame);
  return {
    complete(task: 'data' | 'fonts' | 'document' | 'page') {
      if (tasks.has(task)) return;
      tasks.add(task);
      target += { data: 55, fonts: 15, document: 10, page: 20 }[task];
    },
    reveal,
  };
}

export function waitForDocument() {
  return new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
}

export function waitForFonts() {
  return Promise.allSettled([
    document.fonts.load('800 100px Display'),
    document.fonts.load('400 16px Manrope'),
    document.fonts.load('700 16px Manrope'),
  ]);
}
