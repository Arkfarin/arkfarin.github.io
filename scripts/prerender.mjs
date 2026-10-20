import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import {
  render,
  fetchSiteData,
  pageHead,
  structuredData,
  absoluteUrl,
  siteBase,
  en,
} from '../.ssr/entry-server.js';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const data = await fetchSiteData();
const template = await readFile('dist/index.html', 'utf8');
const headMarker = /<!-- seo-head:start -->[\s\S]*?<!-- seo-head:end -->/;
if (!headMarker.test(template))
  throw new Error('SEO head markers are missing.');
const pages = [
  {
    path: '',
    file: 'index.html',
    title: en.homeMetaTitle,
    description: en.homeMetaDescription,
  },
  {
    path: 'projects/',
    file: 'projects/index.html',
    title: en.projectsMetaTitle,
    description: en.projectsMetaDescription,
  },
  ...data.projects.map((project) => ({
    path: `projects/${project.slug}/`,
    file: `projects/${project.slug}/index.html`,
    title: en.projectMetaTitle.replace('{title}', project.title),
    description: project.description,
    type: 'article',
    project,
  })),
  {
    path: '404.html',
    file: '404.html',
    title: en.notFoundMetaTitle,
    description: en.notFoundMetaDescription,
    noindex: true,
  },
];
const cssFiles = (await readdir('dist/assets')).filter(
  (file) => file.endsWith('.css') && !template.includes(file),
);
for (const page of pages) {
  const head = pageHead(page);
  const schema = structuredData(page, data);
  const metadata = [
    `<title>${escape(head.title)}</title>`,
    ...Object.entries(head.names).map(
      ([name, value]) => `<meta name="${name}" content="${escape(value)}">`,
    ),
    ...Object.entries(head.properties).map(
      ([name, value]) => `<meta property="${name}" content="${escape(value)}">`,
    ),
    `<link rel="canonical" href="${escape(head.canonical)}">`,
    `<link rel="sitemap" type="application/xml" href="${escape(absoluteUrl('sitemap.xml'))}">`,
    ...(schema
      ? [
          `<script type="application/ld+json" id="structured-data">${json(schema)}</script>`,
        ]
      : []),
  ].join('\n');
  const content = await render(`${siteBase}${page.path}`, data);
  let html = template
    .replace(headMarker, () => metadata)
    .replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
    .replace(
      '</body>',
      () =>
        `<script type="application/json" id="site-data">${json(data)}</script></body>`,
    );
  if (page.project)
    html = html.replace(
      '</head>',
      () =>
        cssFiles
          .map(
            (file) =>
              `<link rel="stylesheet" href="${siteBase}assets/${file}">`,
          )
          .join('') + '</head>',
    );
  await mkdir(`dist/${page.file.split('/').slice(0, -1).join('/')}`, {
    recursive: true,
  });
  await writeFile(`dist/${page.file}`, html);
}
const urls = pages
  .filter((page) => !page.noindex)
  .map((page) => absoluteUrl(page.path));
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`,
);
await writeFile(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('sitemap.xml')}\n`,
);
const markdownText = (text) => text.replace(/[\\[\]<>\r\n]/g, ' ');
await writeFile(
  'dist/llms.txt',
  `# Arkfarin\n\n> Python developer. Tools, automation and projects.\n\n## Website\n\n- [About Arkfarin](${absoluteUrl()}): Developer profile and contact links.\n- [Projects](${absoluteUrl('projects/')}): The full project catalog.\n\n## Projects\n\n${data.projects.map((project) => `- [${markdownText(project.title)}](${absoluteUrl(`projects/${project.slug}/`)}): ${markdownText(project.description)}`).join('\n')}\n\nProject titles, descriptions and technologies are included in the initial HTML. READMEs load when a project is opened in the browser. English is the default content language; the language selector translates the interface.\n`,
);
await writeFile('dist/.nojekyll', '');
await rm('.ssr', { recursive: true });
console.log(
  `Prerendered ${pages.length} pages; generated sitemap.xml, robots.txt and llms.txt.`,
);
