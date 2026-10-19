import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mkdtemp,
  cp,
  symlink,
  readFile,
  writeFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';
import { parseSiteData, SITE_DATA_RAW_URL } from '../src/lib/site-data';

// Integration gate: add only data/content in an isolated copy and build for a subpath.
test(
  'a new project and a subdirectory deployment need no component changes',
  { timeout: 60000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'arkfarin-extension-'));
    try {
      for (const path of [
        'src',
        'public',
        'content',
        'scripts',
        'index.html',
        'package.json',
        'tsconfig.json',
        'vite.config.ts',
      ])
        await cp(path, join(directory, path), { recursive: true });
      await symlink(
        resolve('node_modules'),
        join(directory, 'node_modules'),
        'dir',
      );
      const catalogPath = join(directory, 'site-data.json');
      const data = parseSiteData(
        await readFile('tests/fixtures/site.gist', 'utf8'),
      );
      const catalog = data.projects;
      catalog.push({
        slug: 'integration-example',
        title: 'Integration Example',
        description: 'A data-only project.',
        category: 'Test',
        technologies: ['TypeScript'],
        repository: 'https://github.com/example/project',
        branch: 'main',
        readme_blob_sha: '',
        language: 'en',
        assets: {
          'docs/image.webp': {
            src: 'assets/kiyora.webp',
            width: 1280,
            height: 820,
          },
        },
      });
      await writeFile(catalogPath, JSON.stringify(data));
      const markdown =
        '# Integration Example\n\n## Details\n\n| Feature | Value |\n| - | - |\n| Table | Works |\n\n- [x] GFM task\n\n![Example image](docs/image.webp)\n\n[Relative link](docs/guide.md)\n\n## Details\n\n```typescript\nconst answer: number = 42;\n```';
      await writeFile(
        join(directory, 'content/projects/integration-example.md'),
        markdown,
      );
      await promisify(execFile)('npm', ['run', 'build'], {
        cwd: directory,
        env: {
          ...process.env,
          SITE_BASE: '/portfolio/',
          SITE_DATA_FILE: catalogPath,
          SITE_MARKDOWN_DIR: join(directory, 'content/projects'),
        },
        maxBuffer: 2 * 1024 * 1024,
      });
      const output = join(directory, 'dist');
      const html = await readFile(
        join(output, 'projects/integration-example/index.html'),
        'utf8',
      );
      for (const expected of [
        '<table>',
        'hljs-keyword',
        'id="details-1"',
        '/portfolio/assets/kiyora.webp',
        'https://github.com/example/project/blob/main/docs/guide.md',
      ])
        assert.ok(html.includes(expected), expected);
      assert.equal(
        await readFile(
          join(output, 'projects/integration-example/README.md'),
          'utf8',
        ),
        markdown,
      );
      assert.ok(
        (await readFile(join(output, 'projects/index.html'), 'utf8')).includes(
          '/portfolio/projects/integration-example/',
        ),
      );
      // Serve files exactly as a static host would, without a history fallback.
      const server = createServer(async (request, response) => {
        try {
          const path = new URL(
            request.url ?? '/',
            'http://localhost',
          ).pathname.replace(/^\/portfolio\//, '');
          const file = path.endsWith('/') || !path ? `${path}index.html` : path;
          const types: Record<string, string> = {
            js: 'application/javascript',
            css: 'text/css',
            html: 'text/html',
            svg: 'image/svg+xml',
            woff: 'font/woff',
            webp: 'image/webp',
            png: 'image/png',
          };
          response.setHeader(
            'Content-Type',
            types[file.split('.').at(-1) ?? ''] ?? 'text/plain',
          );
          response.end(await readFile(join(output, file)));
        } catch {
          response.writeHead(404);
          response.end('Not found');
        }
      });
      await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 390, height: 844 },
          reducedMotion: 'reduce',
        });
        await page.route(SITE_DATA_RAW_URL, (route) =>
          route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(data),
          }),
        );
        await page.route(
          'https://raw.githubusercontent.com/example/project/main/README.md',
          (route) =>
            route.fulfill({ contentType: 'text/plain', body: markdown }),
        );
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const base = `http://127.0.0.1:${address.port}/portfolio`;
        await page.goto(`${base}/projects/integration-example/`);
        await page
          .getByRole('heading', { name: 'Integration Example', exact: true })
          .waitFor();
        await page.getByRole('table').waitFor();
        assert.equal(
          await page
            .locator('html')
            .evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page
          .getByRole('img', { name: 'Example image' })
          .scrollIntoViewIfNeeded();
        await page.waitForFunction(() =>
          [...document.images].every(
            (img) => img.complete && img.naturalWidth > 0,
          ),
        );
        await page.getByRole('button', { name: 'Открыть меню' }).click();
        await page
          .getByRole('navigation', { name: 'Разделы' })
          .getByRole('link', { name: 'Проекты' })
          .click();
        await page
          .getByRole('link', { name: 'Открыть проект Integration Example' })
          .click();
        assert.equal(page.url(), `${base}/projects/integration-example/`);
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
        await new Promise<void>((done) => server.close(() => done()));
      }
      // Duplicate slugs must fail the publication gate.
      catalog.push(catalog.at(-1)!);
      await writeFile(catalogPath, JSON.stringify(data));
      await assert.rejects(
        promisify(execFile)('npm', ['run', 'build'], {
          cwd: directory,
          env: {
            ...process.env,
            SITE_BASE: '/portfolio/',
            SITE_DATA_FILE: catalogPath,
            SITE_MARKDOWN_DIR: join(directory, 'content/projects'),
          },
        }),
        /duplicate slug/i,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);
