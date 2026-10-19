import { ru, type MessageKey, type Messages } from './locales/ru';
import { en } from './locales/en';
import { uk } from './locales/uk';
import { ja } from './locales/ja';
import { zh } from './locales/zh';
import { ky } from './locales/ky';

export const locales = ['ru', 'en', 'uk', 'ja', 'zh', 'ky'] as const;
export type Locale = (typeof locales)[number];
export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
  ja: '日本語',
  zh: '简体中文',
  ky: 'Кыргызча',
};
export const messages: Record<Locale, Messages> = { ru, en, uk, ja, zh, ky };
export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && locales.some((locale) => locale === value)
  );
}
export function translate(
  locale: Locale,
  key: MessageKey,
  values: Record<string, string> = {},
) {
  return messages[locale][key].replace(
    /\{(\w+)\}/g,
    (placeholder, name: string) => values[name] ?? placeholder,
  );
}
// Functions stay stable across renders, including useMemo dependencies.
export const translators = Object.fromEntries(
  locales.map((locale) => [
    locale,
    (key: MessageKey, values?: Record<string, string>) =>
      translate(locale, key, values),
  ]),
) as Record<
  Locale,
  (key: MessageKey, values?: Record<string, string>) => string
>;
