import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { locales, messages, translate } from '../../src/i18n/messages';
import { SITE_DATA_RAW_URL } from '../../src/lib/site-data';
import { mockData, ready, gist, siteData } from './fixtures';

for (const locale of locales) {
  test(`language ${locale}: content, persistence, routes and mobile layout`, async ({
    page,
  }) => {
    await mockData(page);
    const text = messages[locale];
    await page.goto('/');
    await ready(page);
    const select = page.getByRole('combobox');
    await expect(select.locator('option')).toHaveText([
      'Русский 🇷🇺',
      'English 🇬🇧',
      'Українська 🇺🇦',
      '日本語 🇯🇵',
      '简体中文 🇨🇳',
      'Кыргызча 🇰🇬',
    ]);
    await select.selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(select).toHaveAccessibleName(text.language);
    await expect(page).toHaveTitle(text.homeMetaTitle);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      text.homeMetaDescription,
    );
    await expect(page.locator('#home')).toContainText(text.heroCode);
    await expect(page.locator('#about')).toContainText(text.aboutWork);
    await expect(page.locator('#contact-title')).toHaveText(
      `${text.contactTitle}.`,
    );
    await expect(page.locator('#projects')).toContainText(
      siteData.projects[0].description,
    );
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      // Check actual controls and headings too: overflow:clip must not conceal broken layout.
      const clipped = await page
        .locator(
          '#home h2, #contact h2, #links h2, aside select, #contact a[class*="button"], #home a[class*="button"]',
        )
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return (
                box.left < -1 ||
                box.right > innerWidth + 1 ||
                element.scrollWidth > element.clientWidth + 2
              );
            })
            .map((element) => element.textContent),
        );
      expect(clipped, `${locale} @ ${width}`).toEqual([]);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: text.openMenu }).click();
    await expect(
      page.getByRole('navigation', { name: text.sections }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page
      .getByRole('link', { name: text.allProjects, exact: true })
      .click();
    await expect(page).toHaveURL(/\/projects\/$/);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(`${text.projectsPageTitle}.`);
    expect(
      await heading.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    await page.reload();
    await ready(page);
    await expect(select).toHaveValue(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await page
      .getByRole('link', {
        name: translate(locale, 'openProject', { title: 'KIYORA' }),
      })
      .click();
    await expect(
      page.getByRole('link', { name: text.githubSource }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: text.copyCode }).first(),
    ).toBeVisible();
    await expect(page).toHaveTitle(
      translate(locale, 'projectMetaTitle', { title: 'KIYORA' }),
    );
    await page.goto('/missing-page/');
    await ready(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      `${text.notFoundTitle}.`,
    );
  });
}

test('language stays in sync across tabs and works when storage is blocked', async ({
  page,
  context,
}) => {
  await mockData(page);
  await page.goto('/');
  await ready(page);
  const other = await context.newPage();
  await mockData(other);
  await other.goto('/');
  await ready(other);
  await page.getByRole('combobox').selectOption('uk');
  await expect(other.locator('html')).toHaveAttribute('lang', 'uk');
  await other.close();
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem'])
      Object.defineProperty(Storage.prototype, method, {
        value: () => {
          throw new Error('Blocked');
        },
      });
  });
  await page.reload();
  await ready(page);
  await page.getByRole('combobox').selectOption('ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page
    .getByRole('link', { name: messages.ja.allProjects, exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    `${messages.ja.projectsPageTitle}.`,
  );
});

test('language selection and localized errors are accessible in both themes', async ({
  page,
}) => {
  await mockData(page);
  await page.goto('/');
  await ready(page);
  await page.getByRole('combobox').focus();
  await page.keyboard.press('e');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('combobox')).toHaveValue('en');
  for (const theme of ['dark', 'light']) {
    await page
      .getByRole('button', {
        name:
          theme === 'dark' ? messages.en.switchDark : messages.en.switchLight,
      })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
  await page.route(SITE_DATA_RAW_URL, (route) => route.abort());
  await page.reload();
  await ready(page);
  await expect(page.getByRole('alert')).toContainText(messages.en.staleData);
  await expect(
    page.getByRole('button', { name: messages.en.retry }),
  ).toBeVisible();
});

test('hero animations pause behind the preloader and run after it disappears', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(SITE_DATA_RAW_URL, async (route) => {
    await gate;
    await route.fulfill({ contentType: 'text/plain', body: gist });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const title = page.locator('#hero-title');
  await expect(title).toHaveCSS('animation-play-state', 'paused');
  await expect(title).not.toHaveCSS('animation-name', 'none');
  release();
  await ready(page);
  await expect(title).toHaveCSS('animation-play-state', 'running');
  await expect
    .poll(() =>
      title.evaluate((element) => element.getAnimations()[0]?.playState),
    )
    .toBe('finished');
  await expect(page.locator('[class*="hero-intro"]')).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(title).toHaveCSS('animation-name', 'none');
});
