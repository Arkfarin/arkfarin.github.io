import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'parse5';

const attr = (node, name) =>
  node.attrs?.find((item) => item.name === name)?.value;
function all(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap((child) => all(child, predicate)),
  ];
}
const tags = (node, name) => all(node, (item) => item.tagName === name);
const text = (node) =>
  node.nodeName === '#text'
    ? node.value
    : (node.childNodes ?? []).map(text).join('');
const one = (nodes, label) => {
  assert.equal(nodes.length, 1, `Expected one ${label}, found ${nodes.length}`);
  return nodes[0];
};
const byId = (doc, id) =>
  one(
    all(doc, (node) => attr(node, 'id') === id),
    `#${id}`,
  );
const meta = (doc, key, attribute = 'name') =>
  attr(
    one(
      tags(doc, 'meta').filter((node) => attr(node, attribute) === key),
      key,
    ),
    'content',
  );
const canonical = (doc) =>
  attr(
    one(
      tags(doc, 'link').filter((node) => attr(node, 'rel') === 'canonical'),
      'canonical',
    ),
    'href',
  );
const visible = (node) => {
  for (let current = node; current; current = current.parentNode)
    assert.equal(
      attr(current, 'hidden'),
      undefined,
      'Content has a hidden ancestor',
    );
};
const home = parse(await readFile('dist/index.html', 'utf8'));
const data = JSON.parse(text(byId(home, 'site-data')));
const rootUrl = canonical(home);
const pages = [
  { path: '', file: 'index.html' },
  { path: 'projects/', file: 'projects/index.html' },
  ...data.projects.map((project) => ({
    path: `projects/${project.slug}/`,
    file: `projects/${project.slug}/index.html`,
    project,
  })),
  { path: '404.html', file: '404.html', noindex: true },
];
const titles = new Set();
const documents = new Map();
for (const page of pages) {
  const html = await readFile(`dist/${page.file}`, 'utf8');
  const doc = parse(html);
  const url = new URL(page.path, rootUrl).href;
  documents.set(url, doc);
  assert.equal(canonical(doc), url, `${page.file}: canonical`);
  assert.notEqual(
    attr(one(tags(doc, 'html'), 'html'), 'data-prerendered'),
    undefined,
  );
  const title = text(one(tags(doc, 'title'), 'title'));
  assert(title.trim(), `${page.file}: empty title`);
  assert(!titles.has(title), `${page.file}: duplicate title`);
  titles.add(title);
  const description = meta(doc, 'description');
  assert(description?.trim(), `${page.file}: empty description`);
  if (page.path && !page.noindex)
    assert.notEqual(
      description,
      meta(home, 'description'),
      `${page.file}: home description reused`,
    );
  if (page.project) assert.equal(description, page.project.description);
  assert.equal(meta(doc, 'og:title', 'property'), title);
  assert.equal(meta(doc, 'og:description', 'property'), description);
  assert.equal(meta(doc, 'og:url', 'property'), url);
  assert.equal(meta(doc, 'twitter:title'), title);
  assert.equal(meta(doc, 'twitter:description'), description);
  assert.equal(meta(doc, 'twitter:card'), 'summary_large_image');
  assert.equal(
    meta(doc, 'og:image', 'property'),
    new URL('assets/og-card.png', rootUrl).href,
  );
  assert.equal(meta(doc, 'twitter:image'), meta(doc, 'og:image', 'property'));
  assert.equal(meta(doc, 'og:image:width', 'property'), '1200');
  assert.equal(meta(doc, 'og:image:height', 'property'), '630');
  assert.equal(meta(doc, 'robots').includes('noindex'), !!page.noindex);
  visible(one(tags(doc, 'h1'), 'h1'));
  visible(byId(doc, 'main'));
  assert(
    !html.includes('id="S:') && !html.includes('id="B:'),
    `${page.file}: streaming fallback`,
  );
  if (page.project) {
    const article = one(tags(doc, 'article'), 'article');
    visible(article);
    assert(text(article).trim(), `${page.file}: empty README`);
  }
  const readmes = JSON.parse(text(byId(doc, 'project-readmes')));
  for (const project of data.projects) {
    const sourceUrl = project.repository.replace(
      'https://github.com/',
      'https://raw.githubusercontent.com/',
    );
    const key = `${sourceUrl}/${encodeURIComponent(project.branch)}/README.md:${project.readme_blob_sha}`;
    assert(
      readmes[key]?.trim(),
      `${page.file}: missing snapshot for ${project.slug}`,
    );
  }
  const schemas = tags(doc, 'script').filter(
    (node) => attr(node, 'type') === 'application/ld+json',
  );
  if (page.noindex) assert.equal(schemas.length, 0);
  else {
    const schema = JSON.parse(text(one(schemas, 'JSON-LD')));
    assert.equal(schema['@context'], 'https://schema.org');
    const pageEntity = schema['@graph'].find(
      (node) => node['@id'] === `${url}#webpage`,
    );
    assert.equal(pageEntity?.url, url);
    assert.equal(pageEntity?.name, title);
    assert.equal(pageEntity?.description, description);
  }
}
let links = 0;
for (const [url, doc] of documents) {
  for (const anchor of tags(doc, 'a')) {
    const href = attr(anchor, 'href');
    if (!href) continue;
    const target = new URL(href, url);
    if (target.origin !== new URL(rootUrl).origin) continue;
    const fragment = decodeURIComponent(target.hash.slice(1));
    target.hash = '';
    target.search = '';
    const destination = documents.get(target.href);
    assert(destination, `Broken internal link from ${url}: ${href}`);
    if (fragment)
      assert(
        all(destination, (node) => attr(node, 'id') === fragment).length,
        `Missing anchor: ${href}`,
      );
    links++;
  }
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
assert.deepEqual(
  urls.sort(),
  pages
    .filter((page) => !page.noindex)
    .map((page) => new URL(page.path, rootUrl).href)
    .sort(),
);
const robots = await readFile('dist/robots.txt', 'utf8');
assert.match(robots, /User-agent: \*\s+Allow: \//);
assert(!robots.includes('Disallow: /'));
assert(robots.includes(`Sitemap: ${new URL('sitemap.xml', rootUrl).href}`));
const llms = await readFile('dist/llms.txt', 'utf8');
for (const url of urls) assert(llms.includes(url), `llms.txt misses ${url}`);
const image = await readFile('dist/assets/og-card.png');
assert.equal(image.subarray(1, 4).toString(), 'PNG');
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
console.log(
  `SEO checks passed: ${pages.length} HTML pages, ${links} internal links, metadata, visible content, snapshots, JSON-LD, sitemap, robots and OG image.`,
);
