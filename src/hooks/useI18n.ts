import { useSyncExternalStore } from 'react';
import { translators } from '@/i18n/messages';
import {
  languageSnapshot,
  serverLanguage,
  setLanguage,
  subscribeLanguage,
} from '@/i18n/store';
export function useI18n() {
  const locale = useSyncExternalStore(
    subscribeLanguage,
    languageSnapshot,
    serverLanguage,
  );
  return { locale, t: translators[locale], setLanguage };
}
