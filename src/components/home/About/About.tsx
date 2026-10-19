import { useI18n } from '@/hooks/useI18n';
import ui from '@/components/ui/Primitives.module.css';
import styles from './About.module.css';
import { useReveal } from '@/hooks/useReveal';

export function About() {
  const { t } = useI18n();
  const revealRef = useReveal<HTMLElement>();
  return (
    <section
      ref={revealRef}
      className={styles['about'] + ' ' + ui['section-pad']}
      id="about"
      aria-labelledby="about-title"
    >
      <div data-reveal="ready" className={ui['section-top']}>
        <span className={ui['section-kicker'] + ' ' + styles['section-kicker']}>
          {t('navAbout')}
        </span>
        <span className={ui['section-rule']} aria-hidden="true"></span>
      </div>
      <div className={styles['about-grid']}>
        <h2
          data-reveal="ready"
          className={ui['large-heading']}
          id="about-title"
        >
          {t('aboutTitle1')}
          <br />
          {t('aboutTitle2')}
          <br />
          <span className={ui['accent-text']}>{t('aboutTitle3')}</span>
        </h2>
        <div data-reveal="ready" className={styles['about-copy']}>
          <p className={styles['lead']}>
            {t('aboutLead1')}
            <br />
            {t('aboutLead2')}
          </p>
          <p>{t('aboutScript')}</p>
          <p>{t('aboutWork')}</p>
        </div>
      </div>
      <div data-reveal="ready" className={styles['offscreen']}>
        <div>
          <span
            className={ui['section-kicker'] + ' ' + styles['section-kicker']}
          >
            {t('offscreenLabel')}
          </span>
          <h3>
            {t('offscreenTitle1')}
            <br />
            {t('offscreenTitle2')}
          </h3>
        </div>
        <div className={styles['offscreen-description']}>
          <p>{t('offscreenText')}</p>
          <div className={styles['offscreen-links']}>
            <a className={ui['text-link']} href="#links">
              {t('navLinks')} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
