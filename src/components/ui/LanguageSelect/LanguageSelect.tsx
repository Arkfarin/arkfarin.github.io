import { useI18n } from '@/hooks/useI18n';
import { isLocale, locales, localeNames } from '@/i18n/messages';
import styles from './LanguageSelect.module.css';

const localeFlags = {
  ru: '🇷🇺',
  en: '🇬🇧',
  uk: '🇺🇦',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ky: '🇰🇬',
};

export function LanguageSelect() {
  const { locale, t, setLanguage } = useI18n();
  return (
    <div className={styles.control}>
      <select
        aria-label={t('language')}
        title={localeNames[locale]}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLanguage(event.target.value);
        }}
      >
        {locales.map((value) => (
          <option
            key={value}
            value={value}
            lang={value}
            title={localeNames[value]}
          >
            {localeNames[value]} {localeFlags[value]}
          </option>
        ))}
      </select>
      <span aria-hidden="true">⌄</span>
    </div>
  );
}
