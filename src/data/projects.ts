import type { Project } from '@/types/project';

export const projectPath = (slug: string) => `/projects/${slug}/`;
export const markdownPath = (project: Project) =>
  `${project.repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${encodeURIComponent(project.branch)}/README.md`;
interface MarkdownResult {
  source: string;
  error: boolean;
}
const pending = new Map<string, Promise<MarkdownResult>>();
const refreshed = new Map<string, Promise<MarkdownResult>>();
const snapshots = new Map<string, string>();
export const markdownKey = (project: Project) =>
  `${markdownPath(project)}:${project.readme_blob_sha}`;

export function seedMarkdown(projects: Project[], value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const sources = value as Record<string, unknown>;
  for (const project of projects) {
    const key = markdownKey(project);
    const source = Object.hasOwn(sources, key) ? sources[key] : undefined;
    if (typeof source !== 'string' || !source.trim()) continue;
    snapshots.set(markdownPath(project), source);
    pending.set(key, Promise.resolve({ source, error: false }));
  }
}

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
      snapshots.set(url, source);
      return { source, error: false };
    })
    .catch(() => {
      const source = snapshots.get(url);
      return { source: source ?? '', error: source === undefined };
    });
}

export function loadMarkdown(project: Project): Promise<MarkdownResult> {
  const key = markdownKey(project);
  let promise = pending.get(key);
  if (!promise) {
    promise = fetchMarkdown(project);
    pending.set(key, promise);
    refreshed.set(key, promise);
  }
  return promise;
}

export function refreshMarkdown(project: Project): Promise<MarkdownResult> {
  const key = markdownKey(project);
  let promise = refreshed.get(key);
  if (!promise) {
    promise = fetchMarkdown(project).then((result) => {
      pending.set(key, Promise.resolve(result));
      return result;
    });
    refreshed.set(key, promise);
  }
  return promise;
}

export function retryMarkdown(project: Project) {
  refreshed.delete(markdownKey(project));
  return refreshMarkdown(project);
}
