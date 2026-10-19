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
  const animations: Animation[] = [];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let heroWord: HTMLElement | null = null;
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
    // Paint the completed fill before moving the same word into the Hero.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    if (stopped) return;
    if (!overlay || motion.matches) {
      reveal();
      return;
    }
    const word = overlay.querySelector<HTMLElement>('.preloader-word');
    const targetWord = document.querySelector<HTMLElement>('[data-hero-word]');
    heroWord = targetWord;
    const source = word?.getBoundingClientRect();
    const destination = targetWord?.getBoundingClientRect();
    const morph =
      word &&
      targetWord &&
      source &&
      destination &&
      destination.width > 0 &&
      destination.top < innerHeight &&
      destination.bottom > 0 &&
      (!location.hash || location.hash === '#home');

    window.addEventListener('resize', reveal, { once: true });
    motion.addEventListener('change', reveal, { once: true });
    try {
      const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
      const animate = (
        element: Element,
        keyframes: Keyframe[],
        duration: number,
        delay = 0,
      ) => {
        animations.push(
          element.animate(keyframes, {
            duration,
            delay,
            easing: ease,
            fill: 'both',
          }),
        );
      };
      if (morph) {
        const type = getComputedStyle(targetWord);
        targetWord.setAttribute('data-preloader-target', '');
        Object.assign(word.style, {
          position: 'fixed',
          left: `${destination.left}px`,
          top: `${destination.top}px`,
          fontFamily: type.fontFamily,
          fontSize: type.fontSize,
          fontWeight: type.fontWeight,
          lineHeight: type.lineHeight,
          letterSpacing: type.letterSpacing,
        });
        overlay.dataset.state = 'leaving';
        const final = word.getBoundingClientRect();
        animate(
          word,
          [
            {
              transform: `translate(${source.left - final.left}px, ${source.top - final.top}px) scale(${source.width / final.width}, ${source.height / final.height})`,
              color: getComputedStyle(document.documentElement)
                .getPropertyValue('--red')
                .trim(),
            },
            { transform: 'none', color: type.color },
          ],
          1050,
        );
        const band = document.querySelector('[data-hero-band]');
        const intro = document.querySelector('[data-hero-intro]');
        if (band)
          animate(
            band,
            [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
            760,
            180,
          );
        if (intro)
          animate(
            intro,
            [
              { opacity: 0, transform: 'translateY(18px)' },
              { opacity: 1, transform: 'none' },
            ],
            650,
            300,
          );
        animate(
          overlay,
          [
            { backgroundColor: getComputedStyle(overlay).backgroundColor },
            { backgroundColor: 'transparent' },
          ],
          650,
          100,
        );
      } else {
        // Direct project visits and deep links have no visible Hero to land in.
        animate(overlay, [{ opacity: 1 }, { opacity: 0 }], 320);
      }
      document.documentElement.dataset.loading = 'revealing';
      animate(
        root,
        [{ opacity: 0 }, { opacity: 1 }],
        morph ? 650 : 320,
        morph ? 120 : 0,
      );
      await Promise.allSettled(
        animations.map((animation) => animation.finished),
      );
    } catch {
      // An interrupted or unsupported animation must still reveal the page.
    } finally {
      reveal();
    }
  }
  function reveal() {
    if (stopped) return;
    stopped = true;
    window.removeEventListener('resize', reveal);
    motion.removeEventListener('change', reveal);
    heroWord?.removeAttribute('data-preloader-target');
    animations.forEach((animation) => animation.cancel());
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
