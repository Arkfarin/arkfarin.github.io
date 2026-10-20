import type { Project } from '@/types/project';

export const projectPath = (slug: string) => `/projects/${slug}/`;
export const markdownPath = (project: Project) =>
  `${project.repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${encodeURIComponent(project.branch)}/README.md`;
export interface MarkdownResult {
  source: string;
  error: boolean;
}
const pending = new Map<string, Promise<MarkdownResult>>();
export const markdownKey = (project: Project) =>
  `${markdownPath(project)}:${project.readme_blob_sha}`;

function fetchMarkdown(project: Project): Promise<MarkdownResult> {
  const url = markdownPath(project);
  return fetch(url, {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-cache',
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`README: HTTP ${response.status}`);
      const source = await response.text();
      if (!source.trim()) throw new Error('README is empty');
      return { source, error: false };
    })
    .catch(() => ({ source: '', error: true }));
}

export function loadMarkdown(project: Project): Promise<MarkdownResult> {
  const key = markdownKey(project);
  let promise = pending.get(key);
  if (!promise) {
    promise = fetchMarkdown(project);
    pending.set(key, promise);
  }
  return promise;
}

export function clearMarkdown(project: Project) {
  pending.delete(markdownKey(project));
}
