import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import {
  getHeadings,
  rehypeHeadings,
  omitRepeatedTitle,
} from '../src/lib/markdown/headings';
import { resolveMarkdownUrl } from '../src/lib/markdown/links';
import { markdownSchema } from '../src/lib/markdown/plugins';
import { rehypeCodeHighlight } from '../src/lib/markdown/highlight';
import { readFileSync } from 'node:fs';
import { parseSiteData } from '../src/lib/site-data';
const catalog = parseSiteData(
  readFileSync('tests/fixtures/site.gist', 'utf8'),
).projects;

const render = (markdown: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSanitize, markdownSchema)
      .use(rehypeHeadings)
      .use(rehypeCodeHighlight)
      .use(rehypeStringify)
      .processSync(markdown),
  );

test('GFM, unique Unicode anchors and highlighting share the document semantics', () => {
  const markdown =
    '# Title\n\n## Привет, `мир`!\n\n## Привет, `мир`!\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] Done\n\n~~old~~\n\n```python\nprint("hi")\n```\n\n```unknown-language\n<literal>\n```';
  const decoratedHeading = '## <em>Formatted</em> ![icon](icon.svg)';
  const decoratedId = getHeadings(decoratedHeading)[0].id;
  assert.ok(render(decoratedHeading).includes(`id="${decoratedId}"`));
  const html = render(markdown);
  for (const heading of getHeadings(markdown))
    assert.ok(html.includes(`id="${heading.id}"`));
  assert.deepEqual(
    getHeadings(markdown).map(({ id }) => id),
    ['привет-мир', 'привет-мир-1'],
  );
  for (const fragment of [
    '<table>',
    'type="checkbox"',
    '<del>old</del>',
    'hljs-string',
    '&#x3C;literal>',
  ])
    assert.ok(html.includes(fragment), fragment);
});

test('raw README HTML is preserved and sanitized before custom plugins', () => {
  const html = render(
    '<div align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="logo.svg"><img src="image.png" alt="Example" onerror="alert(1)"></picture></div>\n\n<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)',
  );
  assert.ok(html.includes('<picture>'));
  assert.ok(html.includes('srcset="logo.svg"'));
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('onerror'));
  assert.ok(!html.includes('javascript:'));
});

test('repository paths, local assets, fragments and external links resolve correctly', () => {
  const project = {
    ...catalog[0],
    assets: {
      'docs/screenshots/now-playing.png': { src: 'assets/kiyora.webp' },
    },
  };
  assert.equal(
    resolveMarkdownUrl('docs/screenshots/now-playing.png', project, true),
    '/assets/kiyora.webp',
  );
  assert.equal(
    resolveMarkdownUrl(
      'docs/screenshots/now-playing.png',
      project,
      true,
      '/portfolio/',
    ),
    '/portfolio/assets/kiyora.webp',
  );
  assert.equal(
    resolveMarkdownUrl('docs/VALIDATION.md#results', project),
    'https://github.com/Arkfarin/KIYORA/blob/main/docs/VALIDATION.md#results',
  );
  assert.equal(
    resolveMarkdownUrl('./images/test.png', project, true),
    'https://raw.githubusercontent.com/Arkfarin/KIYORA/main/images/test.png',
  );
  assert.equal(resolveMarkdownUrl('#запуск', project), '#запуск');
  assert.equal(
    resolveMarkdownUrl('https://example.com/a', project),
    'https://example.com/a',
  );
  assert.equal(resolveMarkdownUrl('javascript:alert(1)', project), '');
  assert.equal(omitRepeatedTitle('# KIYORA\n\nBody', 'KIYORA'), 'Body');
  assert.equal(
    omitRepeatedTitle('# Different\n\nBody', 'KIYORA'),
    '# Different\n\nBody',
  );
});
