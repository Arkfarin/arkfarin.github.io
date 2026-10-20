import { useI18n } from '@/hooks/useI18n';
import { useMemo, useRef } from 'react';
import type { Heading } from '@/lib/markdown/headings';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useActiveSection } from '@/hooks/useActiveSection';
import { markdownPath } from '@/data/projects';
import type { Project } from '@/types/project';
import styles from './TableOfContents.module.css';

export function TableOfContents({
  headings,
  project,
  source,
}: {
  headings: Heading[];
  project: Project;
  source: string;
}) {
  const { t } = useI18n();
  const compact = useMediaQuery('(max-width: 1020px)');
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const ids = useMemo(() => headings.map(({ id }) => id), [headings]);
  const active = useActiveSection(ids, compact ? 130 : 80);
  const links = headings.map((heading) => (
    <a
      key={heading.id}
      href={`#${encodeURIComponent(heading.id)}`}
      className={`${heading.depth > 2 ? styles['toc-h3'] : ''} ${active === heading.id ? styles.active : ''}`}
      aria-current={active === heading.id ? 'location' : undefined}
      onClick={() => {
        if (compact && detailsRef.current) detailsRef.current.open = false;
      }}
    >
      {heading.text}
    </a>
  ));
  return (
    <aside className={styles['readme-toc']}>
      {headings.length > 0 && (
        <>
          <details ref={detailsRef} className={styles['toc-mobile']}>
            <summary>{t('tocTitle')}</summary>
            <nav aria-label={t('tocLabel')}>{links}</nav>
          </details>
          <div className={styles['toc-desktop']}>
            <p>{t('tocTitle')}</p>
            <nav aria-label={t('tocLabel')}>{links}</nav>
          </div>
        </>
      )}
      <a
        className={styles['download-markdown']}
        href={
          source
            ? `data:text/markdown;charset=utf-8,${encodeURIComponent(source)}`
            : markdownPath(project)
        }
        download={`${project.slug}-README.md`}
      >
        {t('downloadMd')} <span aria-hidden="true">↓</span>
      </a>
    </aside>
  );
}
