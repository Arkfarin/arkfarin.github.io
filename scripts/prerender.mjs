import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import {
  render,
  fetchSiteData,
  parseSiteData,
  loadMarkdown,
  primeMarkdown,
} from '../.ssr/entry-server.js';

// Explicit local fixtures make build verification deterministic. Production uses the Gist.
const data = process.env.SITE_DATA_FILE
  ? parseSiteData(await readFile(process.env.SITE_DATA_FILE, 'utf8'))
  : await fetchSiteData();
const catalog = data.projects;
const markdown = new Map();
await Promise.all(
  catalog.map(async (project) => {
    if (process.env.SITE_MARKDOWN_DIR) {
      const source = await readFile(
        `${process.env.SITE_MARKDOWN_DIR}/${project.slug}.md`,
        'utf8',
      );
      primeMarkdown(project, source);
      markdown.set(project.slug, source);
    } else {
      const result = await loadMarkdown(project);
      if (result.error)
        console.warn(
          `README unavailable for ${project.slug}; rendering its retry state.`,
        );
      else markdown.set(project.slug, result.source);
    }
    for (const asset of Object.values(project.assets ?? {}))
      await readFile(`public/${asset.src}`);
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
import { readdir } from 'node:fs/promises';
const cssFiles = (await readdir('dist/assets')).filter(
  (file) => file.endsWith('.css') && !template.includes(file),
);
for (const page of pages) {
  let html = template;
  const content = await render(`${base}${page.path}`, data);
  html = html.replace(
    '<div id="root"></div>',
    () => `<div id="root" data-route="${base}${page.path}">${content}</div>`,
  );
  html = html.replace(
    '</body>',
    () =>
      `<script type="application/json" id="site-data">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script></body>`,
  );
  if (page.project || page.missing || page.listing) {
    const title = page.project
      ? `${page.project.title} — проекты Arkfarin`
      : page.listing
        ? 'Projects — проекты Arkfarin'
        : 'Страница не найдена — Arkfarin';
    const description =
      page.project?.description ??
      (page.listing
        ? 'Все проекты Arkfarin: инструменты, приложения и эксперименты.'
        : 'Такой страницы нет. Вернитесь к проектам Arkfarin.');
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
  if (page.project && markdown.has(page.project.slug))
    await writeFile(
      `dist/projects/${page.project.slug}/README.md`,
      markdown.get(page.project.slug),
    );
}
await writeFile('dist/.nojekyll', '');
await rm('.ssr', { recursive: true });
console.log(
  `Prerendered ${pages.length} pages; published ${markdown.size} original Markdown files.`,
);
