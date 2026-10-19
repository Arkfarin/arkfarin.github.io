import { defaultLocale, isLocale, translate, type Locale } from './messages';

const key = 'arkfarin-language';
const listeners = new Set<() => void>();
let selected: Locale | undefined;
function preference(): Locale {
  try {
    const value = localStorage.getItem(key);
    if (isLocale(value)) return value;
  } catch {
    /* A selection still works for this tab when storage is blocked. */
  }
  return defaultLocale;
}
function apply(locale: Locale) {
  selected = locale;
  document.documentElement.lang = locale;
  document
    .getElementById('preloader')
    ?.setAttribute('aria-label', translate(locale, 'loadingSite'));
  listeners.forEach((notify) => notify());
}
export const languageSnapshot = (): Locale => selected ?? preference();
export const serverLanguage = (): Locale => defaultLocale;
export function initializeLanguage() {
  apply(preference());
}
export function setLanguage(locale: Locale) {
  try {
    localStorage.setItem(key, locale);
  } catch {
    /* Use the in-memory selection. */
  }
  apply(locale);
}
function storage(event: StorageEvent) {
  if (event.key === key || event.key === null) apply(preference());
}
export function subscribeLanguage(notify: () => void) {
  listeners.add(notify);
  if (listeners.size === 1) window.addEventListener('storage', storage);
  return () => {
    listeners.delete(notify);
    if (!listeners.size) window.removeEventListener('storage', storage);
  };
}
