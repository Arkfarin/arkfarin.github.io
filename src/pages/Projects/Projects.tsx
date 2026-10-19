import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router';
import { useSiteData } from '@/data/site';
import { ProjectGrid } from '@/components/projects/ProjectGrid/ProjectGrid';
import { Footer } from '@/components/layout/Footer/Footer';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import app from '@/app/App.module.css';
import ui from '@/components/ui/Primitives.module.css';
import styles from './Projects.module.css';

export function Projects() {
  const { t } = useI18n();
  const { data } = useSiteData();
  usePageMetadata(
    t('projectsMetaTitle'),
    t('projectsMetaDescription'),
    '/projects/',
  );
  return (
    <main id="main" tabIndex={-1} className={`${app.main} ${styles.page}`}>
      <header className={styles.header}>
        <Link to="/" className={ui['text-link']}>
          ← {t('homeBack')}
        </Link>
        <h1>
          {t('projectsPageTitle')}
          <span className={ui['accent-text']}>.</span>
        </h1>
        <p>{t('projectsSubtitle')}</p>
      </header>
      <section className={styles.catalog} aria-label={t('allProjects')}>
        <ProjectGrid projects={data.projects} />
      </section>
      <div className={styles.footer}>
        <Footer project />
      </div>
    </main>
  );
}
