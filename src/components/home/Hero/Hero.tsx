import { useI18n } from '@/hooks/useI18n';
import ui from '@/components/ui/Primitives.module.css';
import styles from './Hero.module.css';

export function Hero() {
  const { t } = useI18n();
  return (
    <section className={styles['hero']} id="home" aria-labelledby="hero-title">
      <div className={styles['hero-wordmark']}>
        <div className={styles['red-band']} data-hero-band aria-hidden="true" />
        <h1 id="hero-title">
          <span data-hero-word>ARKFARIN</span>
        </h1>
      </div>
      <div className={styles['hero-intro']} data-hero-intro>
        <div>
          <h2>
            {t('heroCode')}
            <br />
            {t('heroAutomate')}
            <br />
            <span className={ui['accent-text'] + ' ' + styles['accent-text']}>
              {t('heroBoring')}
            </span>
          </h2>
          <p className={styles['hero-motto']}>{t('heroMotto')}</p>
        </div>
        <div className={styles['hero-description']}>
          <p>{t('heroDescription')}</p>
          <div className={styles['hero-actions']}>
            <a
              className={ui['button'] + ' ' + ui['button-solid']}
              href="#projects"
            >
              {t('viewProjects')} <span aria-hidden="true">↗</span>
            </a>
            <a
              className={ui['text-link'] + ' ' + styles['text-link']}
              href="#about"
            >
              {t('moreAbout')} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
