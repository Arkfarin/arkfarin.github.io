import { defaultUrlTransform } from 'react-markdown';
import type { Project } from '@/types/project';

export function resolveMarkdownUrl(
  url: string,
  project: Project,
  image = false,
  base = '/',
) {
  const safe = defaultUrlTransform(url);
  if (!safe) return '';
  const asset = project.assets?.[url];
  if (asset) return `${base}${asset.src}`;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(safe)) return safe;
  const repository = project.repository.replace(/\/$/, '');
  const branch = encodeURIComponent(project.branch);
  const root = image
    ? `${repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${branch}/`
    : `${repository}/blob/${branch}/`;
  // Relative paths describe files in the upstream repository's README, not the site route.
  return new URL(safe.replace(/^\//, ''), root).href;
}
