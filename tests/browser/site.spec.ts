import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { mockData, ready } from './fixtures';
test.beforeEach(async ({ page }) => {
  await mockData(page);
});

test('routes, original Markdown, code copying, contents and history', async ({
  page,
  context,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await ready(page);
  await page.getByRole('link', { name: 'Открыть проект KIYORA' }).click();
  await expect(page).toHaveURL(/\/projects\/kiyora\/$/);
  await expect(
    page.getByRole('heading', { name: 'KIYORA', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Скопировать блок кода' })
    .first()
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'uv run kiyora\n',
  );
  await expect(
    page.getByRole('button', { name: 'Скопировать блок кода' }).first(),
  ).toHaveText('Скопировано');
  await page
    .getByRole('navigation', { name: 'Оглавление README' })
    .getByRole('link', { name: 'Данные', exact: true })
    .click();
  await expect(page).toHaveURL(/#%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5$/);
  await expect(page.locator('#данные')).toBeInViewport();
  const downloading = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Скачать .md' }).click();
  const download = await downloading;
  expect(await readFile((await download.path())!, 'utf8')).toBe(
    await readFile('content/projects/kiyora.md', 'utf8'),
  );
  await page
    .getByRole('navigation', { name: 'Другие проекты' })
    .getByRole('link', { name: /Luminesk/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Luminesk CLI', exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'KIYORA', exact: true }),
  ).toBeVisible();
  for (const slug of ['kiyora', 'luminesk']) {
    const response = await request.get(`/projects/${slug}/README.md`);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toBe(
      await readFile(`content/projects/${slug}.md`, 'utf8'),
    );
  }
  await page.goto('/projects/missing/');
  await expect(
    page.getByRole('heading', { name: /Страница не найдена/ }),
  ).toBeVisible();
  await page.goto('/projects/kiyora/unexpected');
  await expect(
    page.getByRole('heading', { name: /Страница не найдена/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('theme follows the system until overridden, persists and updates the logo', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Включить тёмную тему' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/projects/luminesk/');
  const logo = page.getByRole('img', { name: 'Luminesk-CLI', exact: true });
  await logo.scrollIntoViewIfNeeded();
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain('/docs/static/img/logo-with-cli.svg');
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain('/docs/static/img/logo-with-cli-dark.svg');
});

test('mobile navigation closes with Escape, outside click, link and breakpoint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await ready(page);
  const menu = page.getByRole('button', { name: 'Открыть меню' });
  await menu.click();
  await expect(page.getByRole('navigation', { name: 'Разделы' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.mouse.click(370, 800);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page
    .getByRole('navigation', { name: 'Разделы' })
    .getByRole('link', { name: 'Проекты' })
    .click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#projects-title')).toBeInViewport();
  await menu.click();
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.goto('/projects/kiyora/');
  const toc = page.locator('details').first();
  await expect(toc).not.toHaveAttribute('open');
  await toc.locator('summary').click();
  await toc.getByRole('link', { name: 'Запуск', exact: true }).click();
  await expect(toc).not.toHaveAttribute('open');
  await expect(page.locator('#запуск')).toBeInViewport();
});

for (const theme of ['light', 'dark'] as const) {
  test(`responsive layout, images, fonts and accessibility: ${theme}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.addInitScript(
      (value) => localStorage.setItem('arkfarin-theme', value),
      theme,
    );
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of [
        '/',
        '/projects/',
        '/projects/kiyora/',
        '/projects/luminesk/',
      ]) {
        await page.goto(route);
        await ready(page);
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} @ ${width}`,
        ).toBeTruthy();
        expect(await page.locator('[class*="undefined"]').count()).toBe(0);
        if (width === 390 || width === 1440) {
          expect(
            (
              await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                .analyze()
            ).violations,
          ).toEqual([]);
        }
      }
    }
    await page.goto('/projects/kiyora/');
    const screenshot = page.getByRole('img', {
      name: 'Экран текущей композиции',
    });
    await screenshot.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        screenshot.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBeTruthy();
    expect(
      await page.evaluate(
        () =>
          document.fonts.check('16px Manrope') &&
          document.fonts.check('800 32px Display'),
      ),
    ).toBeTruthy();
  });
}

test('clipboard fallback, keyboard focus and reduced motion', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Denied')) },
    }),
  );
  await page.goto('/');
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'К содержимому' })).toBeFocused();
  expect(
    await page
      .getByRole('link', { name: 'К содержимому' })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe('solid');
  expect(
    await page
      .locator('#hero-title')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.getByRole('button', { name: /Скопировать arkfarin/ }).click();
  await expect(page.locator('#contact').getByRole('status')).toHaveText(
    'Значение для копирования: arkfarin',
  );
  await page.goto('/projects/kiyora/');
  await page
    .getByRole('button', { name: 'Скопировать блок кода' })
    .first()
    .click();
  expect(await page.evaluate(() => getSelection()?.toString())).toBe(
    'uv run kiyora',
  );
});

test('static HTML contains content without JavaScript; home does not load Markdown', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4173/projects/kiyora/');
  await expect(
    staticPage.getByRole('heading', { name: 'KIYORA', exact: true }),
  ).toBeVisible();
  await expect(staticPage.locator('article')).toContainText('Quiet Precision');
  await context.close();
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/');
  await ready(page);
  expect(
    scripts.some((url) => /\/(Project|kiyora|luminesk)-/.test(url)),
  ).toBeFalsy();
  const title = page.locator('#hero-title');
  await expect(title).toBeVisible();
});

test('reveal animations stop on reduced motion and storage restrictions are tolerated', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      value: () => {
        throw new Error('Storage blocked');
      },
    });
    Object.defineProperty(Storage.prototype, 'setItem', {
      value: () => {
        throw new Error('Storage blocked');
      },
    });
  });
  await page.emulateMedia({
    reducedMotion: 'no-preference',
    colorScheme: 'dark',
  });
  await page.goto('/');
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(() => page.locator('[data-reveal="pending"]').count())
    .toBeGreaterThan(0);
  await page.locator('#about-title').scrollIntoViewIfNeeded();
  await expect(page.locator('#about-title')).toHaveAttribute(
    'data-reveal',
    'visible',
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);
  await expect(page.locator('#hero-title')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
