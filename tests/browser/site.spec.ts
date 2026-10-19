import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { mockData, ready, markdown } from './fixtures';
test.beforeEach(async ({ page }) => {
  await mockData(page);
});

test('routes, original Markdown, code copying, contents and history', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await ready(page);
  await page.getByRole('link', { name: 'Открыть проект Alpha' }).click();
  await expect(page).toHaveURL(/\/projects\/alpha\/$/);
  await expect(
    page.getByRole('heading', { name: 'Alpha', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Скопировать блок кода' })
    .first()
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'npm run example\n',
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
  expect(await readFile((await download.path())!, 'utf8')).toBe(markdown);
  await page
    .getByRole('navigation', { name: 'Другие проекты' })
    .getByRole('link', { name: /Beta/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Beta', exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Alpha', exact: true }),
  ).toBeVisible();
  await page.goto('/projects/missing/');
  await expect(
    page.getByRole('heading', { name: /Страница не найдена/ }),
  ).toBeVisible();
  await page.goto('/projects/alpha/unexpected');
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
  await page.goto('/projects/beta/');
  const logo = page.getByRole('img', { name: 'Example logo', exact: true });
  await logo.scrollIntoViewIfNeeded();
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain('/logo-dark.svg');
  await page.getByRole('button', { name: 'Включить светлую тему' }).click();
  await expect
    .poll(() => logo.evaluate((img: HTMLImageElement) => img.currentSrc))
    .toContain('/logo-light.svg');
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
  await page.goto('/projects/alpha/');
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
        '/projects/alpha/',
        '/projects/beta/',
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
    await page.goto('/projects/alpha/');
    const screenshot = page.getByRole('img', {
      name: 'Example logo',
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
  await page.getByRole('button', { name: 'Скопировать Game ID' }).click();
  await expect(page.locator('#links').getByRole('status')).toHaveText(
    'Не удалось скопировать. Выделите значение: 1234 (56)',
  );
  await page.goto('/projects/alpha/');
  await page
    .getByRole('button', { name: 'Скопировать блок кода' })
    .first()
    .click();
  expect(await page.evaluate(() => getSelection()?.toString())).toBe(
    'npm run example',
  );
});

test('static HTML contains content without JavaScript; home does not load Markdown', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('http://127.0.0.1:4173/');
  await expect(staticPage.locator('#hero-title')).toHaveText('ARKFARIN');
  await expect(staticPage.locator('#projects')).toBeVisible();
  await context.close();
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/');
  await ready(page);
  expect(
    scripts.some((url) => /\/(Project|alpha|beta)-/.test(url)),
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
