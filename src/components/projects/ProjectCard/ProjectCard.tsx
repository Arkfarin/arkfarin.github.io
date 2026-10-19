import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router';
import { projectPath } from '@/data/projects';
import type { Project } from '@/types/project';
import styles from './ProjectCard.module.css';
export function ProjectCard({ project }: { project: Project }) {
  const { t } = useI18n();
  return (
    <Link
      className={styles['project-card']}
      to={projectPath(project.slug)}
      aria-label={t('openProject', { title: project.title })}
    >
      <div className={styles['project-card-top']}>
        <span>{project.category}</span>
        <span className={styles['project-card-arrow']} aria-hidden="true">
          ↗
        </span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <div className={styles['project-card-bottom']}>
        <div className={styles['project-card-tags']}>
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        <span>
          {t('details')} <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
