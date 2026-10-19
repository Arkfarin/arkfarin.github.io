import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className={styles['theme-toggle']}
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? t('switchLight') : t('switchDark')}
      aria-pressed={theme === 'dark'}
    >
      <span className={styles['theme-symbol']} aria-hidden="true">
        ◐
      </span>
      <span className={styles['theme-label']}>
        {theme === 'dark' ? t('light') : t('dark')}
      </span>
    </button>
  );
}
