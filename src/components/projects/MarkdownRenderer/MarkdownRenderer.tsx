import { useI18n } from '@/hooks/useI18n';
import { useMemo, type ComponentPropsWithoutRef } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { rehypeCodeHighlight } from '@/lib/markdown/highlight';
import { resolveMarkdownUrl } from '@/lib/markdown/links';
import { rehypeHeadings } from '@/lib/markdown/headings';
import { markdownSchema } from '@/lib/markdown/plugins';
import type { Project } from '@/types/project';
import { CodeBlock } from './CodeBlock';
import { MarkdownPicture } from './MarkdownPicture';
import styles from './MarkdownRenderer.module.css';

function Heading({
  level,
  id,
  children,
}: ComponentPropsWithoutRef<'h2'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const { t } = useI18n();
  const Tag = `h${level}` as const;
  return (
    <Tag id={id}>
      {children}
      <a
        href={`#${encodeURIComponent(id ?? '')}`}
        className={styles['heading-anchor']}
        aria-label={t('headingAnchor', { id: id ?? '' })}
      >
        #
      </a>
    </Tag>
  );
}
export function MarkdownRenderer({
  markdown,
  project,
}: {
  markdown: string;
  project: Project;
}) {
  const { t } = useI18n();
  const components = useMemo<Components>(
    () => ({
      h1: ({ node: _node, ...props }) => <Heading {...props} level={1} />,
      h2: ({ node: _node, ...props }) => <Heading {...props} level={2} />,
      h3: ({ node: _node, ...props }) => <Heading {...props} level={3} />,
      h4: ({ node: _node, ...props }) => <Heading {...props} level={4} />,
      h5: ({ node: _node, ...props }) => <Heading {...props} level={5} />,
      h6: ({ node: _node, ...props }) => <Heading {...props} level={6} />,
      a: ({ node: _node, href, children, ...props }) => (
        <a
          {...props}
          href={href}
          {...(href?.startsWith('#')
            ? {}
            : { target: '_blank', rel: 'noopener noreferrer' })}
        >
          {children}
        </a>
      ),
      img: ({ node: _node, src, alt, ...props }) => {
        const asset = Object.values(project.assets ?? {}).find(
          (asset) => src === `${import.meta.env.BASE_URL}${asset?.src}`,
        );
        return (
          <img
            {...props}
            src={src}
            alt={alt ?? ''}
            className={
              asset?.width && asset?.height
                ? styles['project-image']
                : props.className
            }
            width={asset?.width ?? props.width}
            height={asset?.height ?? props.height}
            loading="lazy"
            decoding="async"
          />
        );
      },
      picture: ({ node, ...props }) => (
        <MarkdownPicture {...props} node={node} project={project} />
      ),
      source: ({ node: _node, srcSet, ...props }) => (
        <source
          {...props}
          srcSet={srcSet
            ?.split(',')
            .map((candidate) => {
              const [url, ...descriptor] = candidate.trim().split(/\s+/);
              return [
                resolveMarkdownUrl(
                  url,
                  project,
                  true,
                  import.meta.env.BASE_URL,
                ),
                ...descriptor,
              ].join(' ');
            })
            .join(', ')}
        />
      ),
      pre: ({ node, children, ...props }) => {
        const code = node?.children.find(
          (child) => child.type === 'element' && child.tagName === 'code',
        );
        const className =
          code?.type === 'element'
            ? String(code.properties.className ?? '')
            : '';
        return (
          <CodeBlock {...props} className={className}>
            {children}
          </CodeBlock>
        );
      },
      table: ({ node: _node, ...props }) => (
        <div
          className={styles['markdown-table']}
          tabIndex={0}
          role="group"
          aria-label={t('table')}
        >
          <table {...props} />
        </div>
      ),
    }),
    [project, t],
  );
  return (
    <article className={styles['markdown-body']} lang={project.language}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSchema],
          rehypeHeadings,
          rehypeCodeHighlight,
        ]}
        components={components}
        urlTransform={(url, key) =>
          resolveMarkdownUrl(
            url,
            project,
            key === 'src' || key === 'srcSet',
            import.meta.env.BASE_URL,
          )
        }
      >
        {markdown}
      </Markdown>
    </article>
  );
}
