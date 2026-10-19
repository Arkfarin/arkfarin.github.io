import { useI18n } from '@/hooks/useI18n';
import ui from '@/components/ui/Primitives.module.css';
import { useSiteData } from '@/data/site';
import styles from './Hero.module.css';

export function Hero() {
  const { t } = useI18n();
  const { data } = useSiteData();
  const contact = data.links.contacts.find(
    (link) => link.main && !link.copyable,
  );
  return (
    <section className={styles['hero']} id="home" aria-labelledby="hero-title">
      <div className={styles['hero-top']}>
        <span>{t('heroTagline')}</span>
        {contact && (
          <a href={contact.value} target="_blank" rel="noopener noreferrer">
            {contact.title} <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
      <div className={styles['hero-wordmark']}>
        <div className={styles['red-band']} data-hero-band aria-hidden="true" />
        <h1 id="hero-title">
          <span data-hero-word>ARKFARIN</span>
        </h1>
      </div>
      <div className={styles['hero-intro']} data-hero-intro>
        <h2>
          {t('heroCode')}
          <br />
          {t('heroAutomate')}
          <br />
          <span className={ui['accent-text'] + ' ' + styles['accent-text']}>
            {t('heroBoring')}
          </span>
        </h2>
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
      <div className={styles['hero-bottom']}>
        <span>{t('heroMotto')}</span>
        <a
          href="#about"
          className={styles['scroll-cue']}
          aria-label={t('goAbout')}
        >
          <span>{t('next')}</span>
          <span className={styles['down-arrow']} aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
