import { useI18n } from '@/hooks/useI18n';
import ui from '@/components/ui/Primitives.module.css';
import { useSiteData } from '@/data/site';
import { SiteLink } from '@/components/ui/SiteLink/SiteLink';
import styles from './Contact.module.css';
import { Footer } from '@/components/layout/Footer/Footer';
import { SocialLinks } from '../SocialLinks/SocialLinks';
import { useReveal } from '@/hooks/useReveal';

export function Contact() {
  const { t } = useI18n();
  const { data } = useSiteData();
  const main = data.links.contacts.find((link) => link.main);
  const secondaryContacts = data.links.contacts.filter((link) => !link.main);
  const revealRef = useReveal<HTMLElement>();
  return (
    <section
      ref={revealRef}
      className={
        styles['contact'] +
        ' ' +
        (ui['section-pad'] + ' ' + styles['section-pad'])
      }
      id="contact"
      aria-labelledby="contact-title"
    >
      <div
        data-reveal="ready"
        className={ui['section-top'] + ' ' + styles['section-top']}
      >
        <span className={ui['section-kicker']}>{t('navContact')}</span>
        <span className={ui['section-rule']} aria-hidden="true"></span>
      </div>
      <div data-reveal="ready" className={styles['contact-top']}>
        <h2 id="contact-title">
          {t('contactTitle')}
          <span className={ui['accent-text']}>.</span>
        </h2>
        <span className={styles['contact-arrow']} aria-hidden="true">
          ↗
        </span>
      </div>
      <div className={styles['contact-grid']}>
        <div data-reveal="ready" className={styles['contact-intro']}>
          <p>
            {t('contactIntro1')}
            <br />
            {t('contactIntro2')}
          </p>
          {main && (
            <SiteLink
              link={main}
              className={ui['button'] + ' ' + ui['button-red']}
            >
              {main.copyable
                ? t('copyValue', { value: main.title })
                : t('writeTo', { title: main.title })}{' '}
              <span aria-hidden="true">{main.copyable ? '⧉' : '↗'}</span>
            </SiteLink>
          )}
        </div>
        {secondaryContacts.length > 0 && (
          <SocialLinks links={secondaryContacts} />
        )}
        {data.links.contacts.length === 0 && <p>{t('emptyContacts')}</p>}
      </div>
      <Footer />
    </section>
  );
}
