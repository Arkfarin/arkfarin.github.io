import { useI18n } from '@/hooks/useI18n';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  projectPath,
  loadMarkdown,
  clearMarkdown,
  markdownKey,
  type MarkdownResult,
} from '@/data/projects';
import { useSiteData } from '@/data/site';
import type { Project as ProjectData } from '@/types/project';
import { MarkdownRenderer } from '@/components/projects/MarkdownRenderer/MarkdownRenderer';
import { TableOfContents } from '@/components/projects/TableOfContents/TableOfContents';
import { Footer } from '@/components/layout/Footer/Footer';
import { NotFound } from '@/pages/NotFound/NotFound';
import { getHeadings, omitRepeatedTitle } from '@/lib/markdown/headings';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import styles from './Project.module.css';
import ui from '@/components/ui/Primitives.module.css';
import appStyles from '@/app/App.module.css';

function ProjectContent({ project }: { project: ProjectData }) {
  const { t } = useI18n();
  const {
    data: { projects },
  } = useSiteData();
  const [result, setResult] = useState<MarkdownResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void loadMarkdown(project).then((result) => {
      if (active) setResult(result);
    });
    return () => {
      active = false;
    };
  }, [project, attempt]);
  useEffect(() => {
    if (result && window.location.hash)
      window.dispatchEvent(new Event('route-ready'));
  }, [result]);
  const { source = '', error = false } = result ?? {};
  const markdown = useMemo(
    () => omitRepeatedTitle(source, project.title),
    [source, project.title],
  );
  const headings = useMemo(() => getHeadings(markdown), [markdown]);
  const next =
    projects[
      (projects.findIndex((item) => item.slug === project.slug) + 1) %
        projects.length
    ];
  usePageMetadata(
    t('projectMetaTitle', { title: project.title }),
    project.description,
    projectPath(project.slug),
    { type: 'article' },
  );
  return (
    <main
      id="main"
      tabIndex={-1}
      className={`${appStyles.main} ${styles['project-main']}`}
    >
      <header className={styles['project-header']}>
        <nav
          className={styles['project-breadcrumb']}
          aria-label={t('breadcrumb')}
        >
          <Link to="/projects/">← {t('allProjects')}</Link>
          <span aria-hidden="true">/</span>
          <span>{project.title}</span>
        </nav>
        <div className={styles['project-header-row']}>
          <div>
            <p
              className={ui['section-kicker'] + ' ' + styles['section-kicker']}
            >
              {project.category}
            </p>
            <h1>{project.title}</h1>
          </div>
          <a
            className={`${ui['button'] + ' ' + styles['button']} ${ui['button-solid']}`}
            href={project.repository}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className={styles['project-page-description']}>
          {project.description}
        </p>
        <div className={styles['project-page-tags']}>
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
      </header>
      <div className={styles['readme-layout']}>
        <section
          className={styles['readme-file']}
          aria-label={t('readmeLabel')}
        >
          <div className={styles['readme-toolbar']}>
            <span>README.md</span>
            <a
              href={`${project.repository}/blob/${encodeURIComponent(project.branch)}/README.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('githubSource')} ↗
            </a>
          </div>
          {!result ? (
            <p className={styles['readme-status']} role="status">
              {t('loading')}
            </p>
          ) : error ? (
            <div className={styles['readme-error']} role="alert">
              <p>{t('readmeError')}</p>
              <button
                className={`${ui.button} ${ui['button-solid']}`}
                type="button"
                onClick={() => {
                  clearMarkdown(project);
                  setResult(null);
                  setAttempt((value) => value + 1);
                }}
              >
                {t('retry')}
              </button>
            </div>
          ) : (
            <MarkdownRenderer markdown={markdown} project={project} />
          )}
        </section>
        {result && !error && (
          <TableOfContents
            headings={headings}
            project={project}
            source={source}
          />
        )}
      </div>
      <nav
        className={styles['project-page-bottom']}
        aria-label={t('otherProjectsNav')}
      >
        <Link className={ui['text-link']} to="/projects/">
          ← {t('allProjects')}
        </Link>
        {next && next.slug !== project.slug && (
          <Link className={ui['text-link']} to={projectPath(next.slug)}>
            {next.title} <span aria-hidden="true">→</span>
          </Link>
        )}
      </nav>
      <Footer project />
    </main>
  );
}
export default function Project() {
  const { slug } = useParams();
  const { data } = useSiteData();
  const project = data.projects.find((project) => project.slug === slug);
  return project ? (
    <ProjectContent key={markdownKey(project)} project={project} />
  ) : (
    <NotFound />
  );
}
