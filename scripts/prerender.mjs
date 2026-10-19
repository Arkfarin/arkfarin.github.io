import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { render, fetchSiteData, loadMarkdown } from '../.ssr/entry-server.js';

const data = await fetchSiteData();
const catalog = data.projects;
await Promise.all(
  catalog.map(async (project) => {
    const { error } = await loadMarkdown(project);
    if (error)
      console.warn(
        `README unavailable for ${project.slug}; rendering its retry state.`,
      );
  }),
);
const template = await readFile('dist/index.html', 'utf8');
const base = template.match(/src="([^"]*)theme-init.js"/)?.[1];
if (!base?.startsWith('/'))
  throw new Error('Use an absolute Vite base path, e.g. / or /portfolio/.');
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const pages = [
  { path: '', file: 'index.html' },
  { path: 'projects/', file: 'projects/index.html', listing: true },
  ...catalog.map((project) => ({
    path: `projects/${project.slug}/`,
    file: `projects/${project.slug}/index.html`,
    project,
  })),
  { path: '404.html', file: '404.html', missing: true },
];
// SSR uses the same CSS module names as the client. Include lazy-page CSS before paint.
// Vite puts CSS links in the manifest only when requested; use the emitted stylesheet names.
const cssFiles = (await readdir('dist/assets')).filter(
  (file) => file.endsWith('.css') && !template.includes(file),
);
for (const page of pages) {
  let html = template;
  const content = await render(`${base}${page.path}`, data);
  html = html.replace(
    '<div id="root"></div>',
    () => `<div id="root">${content}</div>`,
  );
  html = html.replace(
    '</body>',
    () =>
      `<script type="application/json" id="site-data">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script></body>`,
  );
  if (page.project || page.missing || page.listing) {
    const title = page.project
      ? `${page.project.title} — Arkfarin projects`
      : page.listing
        ? 'Projects — Arkfarin'
        : 'Page not found — Arkfarin';
    const description =
      page.project?.description ??
      (page.listing
        ? 'All Arkfarin projects: tools, apps and experiments.'
        : 'This page doesn’t exist. Return to Arkfarin’s projects.');
    html = html
      .replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`)
      .replace(
        /(<meta name="description" content=")[^"]*/,
        `$1${escape(description)}`,
      )
      .replace(
        /(<meta property="og:title" content=")[^"]*/,
        `$1${escape(title)}`,
      )
      .replace(
        /(<meta property="og:description" content=")[^"]*/,
        `$1${escape(description)}`,
      )
      .replace(
        /(<meta property="og:type" content=")[^"]*/,
        `$1${page.project ? 'article' : 'website'}`,
      );
  }
  const url = `https://ark.farin.cc${base}${page.path}`;
  html = html
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${escape(url)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${escape(url)}`);
  if (page.project)
    html = html.replace(
      '</head>',
      cssFiles
        .map((file) => `<link rel="stylesheet" href="${base}assets/${file}">`)
        .join('') + '</head>',
    );
  if (page.missing)
    html = html.replace(
      '</head>',
      '<meta name="robots" content="noindex"></head>',
    );
  await mkdir(`dist/${page.file.split('/').slice(0, -1).join('/')}`, {
    recursive: true,
  });
  await writeFile(`dist/${page.file}`, html);
}
await writeFile('dist/.nojekyll', '');
await rm('.ssr', { recursive: true });
console.log(`Prerendered ${pages.length} pages.`);
