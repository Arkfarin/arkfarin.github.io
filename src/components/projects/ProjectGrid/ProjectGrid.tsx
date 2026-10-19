import { useI18n } from '@/hooks/useI18n';
import type { Project } from '@/types/project';
import { ProjectCard } from '../ProjectCard/ProjectCard';
import styles from './ProjectGrid.module.css';
export function ProjectGrid({ projects }: { projects: readonly Project[] }) {
  const { t } = useI18n();
  if (!projects.length) return <p>{t('emptyProjects')}</p>;
  return (
    <div data-reveal="ready" className={styles['project-grid']}>
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}
