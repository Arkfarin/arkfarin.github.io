import type { ComponentPropsWithoutRef } from 'react';
import type { Element } from 'hast';
import type { Project } from '@/types/project';
import { resolveMarkdownUrl } from '@/lib/markdown/links';
import styles from './MarkdownRenderer.module.css';

const assetBase = import.meta.env.BASE_URL;

type Props = ComponentPropsWithoutRef<'picture'> & {
  node?: Element;
  project: Project;
};
export function MarkdownPicture({ node, project, children, ...props }: Props) {
  const elements =
    node?.children.filter(
      (child): child is Element => child.type === 'element',
    ) ?? [];
  const sources = elements.filter((child) => child.tagName === 'source');
  const dark = sources.find(
    (source) => source.properties.media === '(prefers-color-scheme: dark)',
  );
  const light = sources.find(
    (source) => source.properties.media === '(prefers-color-scheme: light)',
  );
  const fallback = elements.find((child) => child.tagName === 'img');
  // CSS selects the explicit site theme before hydration, including a saved dark theme.
  // Other responsive pictures keep their native browser source selection.
  if (sources.length === 2 && dark && light && fallback) {
    const alt = String(fallback.properties.alt ?? '');
    return (
      <div className={styles['readme-logo']}>
        {[
          { source: light, theme: 'light' },
          { source: dark, theme: 'dark' },
        ].map(({ source, theme }) => (
          <img
            key={theme}
            className={
              theme === 'dark' ? styles['theme-dark'] : styles['theme-light']
            }
            src={resolveMarkdownUrl(
              String(source.properties.srcSet),
              project,
              true,
              assetBase,
            )}
            alt={alt}
            width={Number(fallback.properties.width) || undefined}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
    );
  }
  return <picture {...props}>{children}</picture>;
}
