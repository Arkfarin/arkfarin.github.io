import { useI18n } from '@/hooks/useI18n';
import { useSiteData } from '@/data/site';
import { useReveal } from '@/hooks/useReveal';
import { SocialLinks } from '../SocialLinks/SocialLinks';
import ui from '@/components/ui/Primitives.module.css';
import styles from './OtherLinks.module.css';

export function OtherLinks() {
  const { t } = useI18n();
  const { data } = useSiteData();
  const ref = useReveal<HTMLElement>();
  return (
    <section
      id="links"
      ref={ref}
      className={`${ui['section-pad']} ${styles.section}`}
      aria-labelledby="links-title"
    >
      <div data-reveal="ready" className={styles.intro}>
        <h2 id="links-title" className={ui['large-heading']}>
          {t('navLinks')}
          <span className={ui['accent-text']}>.</span>
        </h2>
        <p>{t('otherLinksDesc')}</p>
      </div>
      {data.links.others.length ? (
        <SocialLinks links={data.links.others} />
      ) : (
        <p>{t('emptyLinks')}</p>
      )}
    </section>
  );
}
