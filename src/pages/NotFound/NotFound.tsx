import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router';
import { Footer } from '@/components/layout/Footer/Footer';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import styles from './NotFound.module.css';
import appStyles from '@/app/App.module.css';
import ui from '@/components/ui/Primitives.module.css';
export function NotFound() {
  const { t } = useI18n();
  usePageMetadata(
    t('notFoundMetaTitle'),
    t('notFoundMetaDescription'),
    '/404.html',
    { noindex: true },
  );
  return (
    <main
      id="main"
      tabIndex={-1}
      className={`${appStyles.main} ${styles.page}`}
    >
      <div className={styles.content}>
        <p className={ui['section-kicker']}>404</p>
        <h1>
          {t('notFoundTitle')}
          <span className={ui['accent-text']}>.</span>
        </h1>
        <p>{t('notFoundText')}</p>
        <Link className={`${ui.button} ${ui['button-solid']}`} to="/projects/">
          {t('toProjects')} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <Footer project />
    </main>
  );
}
