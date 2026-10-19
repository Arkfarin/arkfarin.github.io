import { useSyncExternalStore } from 'react';
import {
  serverTheme,
  setTheme,
  subscribeTheme,
  themeSnapshot,
} from '@/lib/theme';

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    serverTheme,
  );
  return {
    theme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
