type Theme = 'light' | 'dark';
const key = 'arkfarin-theme';
const listeners = new Set<() => void>();
let override: Theme | undefined;
let removeListeners: (() => void) | undefined;

function preference(): Theme | undefined {
  if (override) return override;
  try {
    const value = localStorage.getItem(key);
    return value === 'light' || value === 'dark' ? value : undefined;
  } catch {
    return undefined;
  }
}
function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#141517' : '#f3f2ee');
  listeners.forEach((notify) => notify());
}
export const themeSnapshot = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
export const serverTheme = (): Theme => 'light';
export function setTheme(theme: Theme) {
  override = theme;
  try {
    localStorage.setItem(key, theme);
  } catch {
    /* Keep this tab's preference in memory. */
  }
  apply(theme);
}
export function subscribeTheme(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const sync = () =>
      apply(preference() ?? (media.matches ? 'dark' : 'light'));
    const storage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        override = undefined;
        sync();
      }
    };
    media.addEventListener('change', sync);
    window.addEventListener('storage', storage);
    removeListeners = () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('storage', storage);
    };
  }
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0) {
      removeListeners?.();
      removeListeners = undefined;
    }
  };
}
