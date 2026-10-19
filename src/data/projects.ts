import type { Project } from '@/types/project';

export const projectPath = (slug: string) => `/projects/${slug}/`;
export const markdownPath = (project: Project) =>
  `${project.repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${encodeURIComponent(project.branch)}/README.md`;
interface MarkdownResult {
  source: string;
  error: boolean;
}
const pending = new Map<string, Promise<MarkdownResult>>();
const key = (project: Project) =>
  `${markdownPath(project)}:${project.readme_blob_sha}`;

export function loadMarkdown(project: Project): Promise<MarkdownResult> {
  let promise = pending.get(key(project));
  if (!promise) {
    promise = fetch(markdownPath(project), {
      signal: AbortSignal.timeout(15_000),
      cache: 'no-cache',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`README: HTTP ${response.status}`);
        return { source: await response.text(), error: false };
      })
      .catch(() => ({ source: '', error: true }));
    pending.set(key(project), promise);
  }
  return promise;
}

export function retryMarkdown(project: Project) {
  pending.delete(key(project));
  return loadMarkdown(project);
}
