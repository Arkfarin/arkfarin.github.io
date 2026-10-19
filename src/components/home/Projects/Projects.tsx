import { useI18n } from '@/hooks/useI18n';
import ui from '@/components/ui/Primitives.module.css';
import { Link } from 'react-router';
import { useSiteData } from '@/data/site';
import styles from './Projects.module.css';
import { ProjectGrid } from '@/components/projects/ProjectGrid/ProjectGrid';
import { useReveal } from '@/hooks/useReveal';

export function Projects() {
  const { t } = useI18n();
  const { data } = useSiteData();
  const revealRef = useReveal<HTMLElement>();
  return (
    <section
      ref={revealRef}
      className={
        styles['projects'] +
        ' ' +
        (ui['section-pad'] + ' ' + styles['section-pad'])
      }
      id="projects"
      aria-labelledby="projects-title"
    >
      <div
        data-reveal="ready"
        className={ui['section-top'] + ' ' + styles['section-top']}
      >
        <span className={ui['section-kicker']}>{t('selected')}</span>
        <Link
          className={ui['text-link'] + ' ' + styles['text-link']}
          to="/projects/"
        >
          {t('allProjects')} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <h2
        data-reveal="ready"
        className={styles['projects-heading']}
        id="projects-title"
      >
        {t('projectsTitle1')}
        <br />
        <span>{t('projectsTitle2')}</span>
      </h2>

      <ProjectGrid projects={data.projects.slice(0, 2)} />
      {data.projects.length > 2 && (
        <div className={styles.more}>
          <Link className={`${ui.button} ${ui['button-red']}`} to="/projects/">
            {t('otherProjects')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
    </section>
  );
}
