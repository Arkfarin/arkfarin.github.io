import { test, expect } from '@playwright/test';
import { SITE_DATA_RAW_URL } from '../../src/lib/site-data';
import { mockData, ready, siteData, gist } from './fixtures';

test('the Gist controls projects, contacts, other links and clipboard actions', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const data = structuredClone(siteData);
  data.projects.push({
    ...data.projects[0],
    slug: 'third-project',
    title: 'Third project',
  });
  data.links.contacts = [
    {
      title: 'Email service',
      value: 'https://example.com/contact',
      alt: 'new-contact',
      main: true,
    },
    { title: 'Another contact', value: 'https://example.com/another' },
  ];
  await mockData(page, JSON.stringify(data));
  let requests = 0;
  page.on('request', (request) => {
    if (request.url() === SITE_DATA_RAW_URL) requests++;
  });
  await page.goto('/');
  await ready(page);
  await expect(
    page.locator('#projects a[aria-label^="Открыть проект"]'),
  ).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: /Написать в Email service/ }),
  ).toHaveAttribute('href', 'https://example.com/contact');
  await expect(
    page.locator('#contact').getByRole('link', { name: /Contact/ }),
  ).toHaveCount(0);
  await expect(
    page.locator('#links').getByRole('link', { name: /Profile/ }),
  ).toHaveAttribute('href', 'https://example.com/profile');
  await page.getByRole('button', { name: 'Скопировать Game ID' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '1234 (56)',
  );
  await expect(page.locator('#links').getByRole('status')).toHaveText(
    'Game ID: скопировано',
  );
  await page.getByRole('link', { name: /Остальные проекты/ }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.getByRole('heading', { name: 'Projects.' })).toBeVisible();
  await expect(page.locator('a[aria-label^="Открыть проект"]')).toHaveCount(3);
  await page
    .getByRole('link', { name: 'Открыть проект Third project' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Third project', exact: true }),
  ).toBeVisible();
  await expect(page.locator('article')).toContainText('Example README.');
  expect(requests).toBe(1);
  await expect(page.locator('#preloader')).toHaveCount(0);
  await page.goto('/projects/third-project/');
  await ready(page);
  await expect(
    page.getByRole('heading', { name: 'Third project', exact: true }),
  ).toBeVisible();
});

test('preloader starts grey, waits for real data, fills and exits in the selected theme', async ({
  page,
}) => {
  await page.emulateMedia({
    reducedMotion: 'no-preference',
    colorScheme: 'dark',
  });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(SITE_DATA_RAW_URL, async (route) => {
    await gate;
    await route.fulfill({ contentType: 'text/plain', body: gist });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const loader = page.getByRole('progressbar');
  await expect(loader).toBeVisible();
  await expect(loader).toHaveCSS('background-color', 'rgb(20, 21, 23)');
  await expect(page.locator('.preloader-word')).toHaveCSS(
    'color',
    'rgb(133, 133, 133)',
  );
  await expect(page.locator('#root')).toHaveAttribute('inert', '');
  await expect.poll(() => loader.getAttribute('aria-valuenow')).toBe('25');
  await expect(page.locator('#hero-title')).not.toBeVisible();
  release();
  await expect(loader).toHaveAttribute('aria-valuenow', '100');
  await expect(loader).toHaveAttribute('data-state', 'leaving');
  await ready(page);
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect(page.locator('#root')).not.toHaveAttribute('inert', '');
});

test('even an immediate response takes at least 500ms; fonts are part of the load', async ({
  page,
}) => {
  await mockData(page);
  await page.addInitScript(() => {
    window.addEventListener(
      'site-ready',
      () => performance.mark('loader-hidden'),
      { once: true },
    );
  });
  await page.goto('/projects/');
  await ready(page);
  expect(
    await page.evaluate(
      () => performance.getEntriesByName('loader-hidden')[0].startTime,
    ),
  ).toBeGreaterThanOrEqual(500);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('800 100px Display') &&
        document.fonts.check('700 16px Manrope'),
    ),
  ).toBe(true);
  await expect(page.getByRole('heading', { name: 'Projects.' })).toBeVisible();
});

test('font loading and README loading both hold the preloader until settled', async ({
  page,
}) => {
  await mockData(page);
  let releaseFont!: () => void;
  const font = new Promise<void>((resolve) => {
    releaseFont = resolve;
  });
  await page.route('**/assets/body-bold*.woff', async (route) => {
    await font;
    await route.continue();
  });
  let releaseReadme!: () => void;
  const readme = new Promise<void>((resolve) => {
    releaseReadme = resolve;
  });
  await page.route(
    'https://raw.githubusercontent.com/example/alpha/main/README.md',
    async (route) => {
      await readme;
      await route.fulfill({
        contentType: 'text/plain',
        body: '# Alpha\n\n## Loaded remotely\n\nActual content.',
      });
    },
  );
  await page.goto('/projects/alpha/', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () =>
      Number(await page.getByRole('progressbar').getAttribute('aria-valuenow')),
    )
    .toBeGreaterThanOrEqual(55);
  await expect(page.getByRole('progressbar')).not.toHaveAttribute(
    'aria-valuenow',
    '100',
  );
  releaseReadme();
  await expect(page.locator('article')).toContainText('Actual content.');
  await expect(page.getByRole('progressbar')).toBeVisible();
  releaseFont();
  await ready(page);
  await expect(
    page.getByRole('heading', { name: 'Loaded remotely' }),
  ).toBeVisible();
});

test('network failure reveals a saved version and offers retry', async ({
  page,
}) => {
  await page.route(SITE_DATA_RAW_URL, (route) => route.abort());
  await page.goto('/');
  await ready(page);
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось обновить данные',
  );
  await expect(page.locator('#hero-title')).toBeVisible();
  await mockData(page);
  await page.getByRole('button', { name: 'Повторить загрузку' }).click();
  await ready(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a failed page module ends loading with a retry action', async ({
  page,
}) => {
  await mockData(page);
  await page.route('**/assets/Project-*.js', (route) => route.abort());
  await page.goto('/projects/alpha/');
  await ready(page);
  await expect(
    page.getByRole('heading', { name: 'Не удалось открыть страницу.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Повторить загрузку' }),
  ).toBeVisible();
});

test('empty data, malformed data and README errors do not trap visitors behind the loader', async ({
  page,
}) => {
  await mockData(
    page,
    JSON.stringify({ links: { contacts: [], others: [] }, projects: [] }),
  );
  await page.goto('/projects/');
  await ready(page);
  await expect(page.getByText('Проекты пока не добавлены.')).toBeVisible();
  await mockData(page, '{ broken');
  await page.goto('/');
  await ready(page);
  await expect(page.getByRole('alert')).toBeVisible();
  await mockData(page);
  await page.route(
    'https://raw.githubusercontent.com/example/alpha/main/README.md',
    (route) => route.fulfill({ status: 503 }),
  );
  await page.goto('/projects/alpha/');
  await ready(page);
  await expect(page.getByRole('alert')).toContainText(
    'Не удалось загрузить README',
  );
  await page.route(
    'https://raw.githubusercontent.com/example/alpha/main/README.md',
    (route) => route.fulfill({ body: '## Recovered README' }),
  );
  await page.getByRole('button', { name: 'Повторить загрузку' }).click();
  await expect(
    page.getByRole('heading', { name: 'Recovered README' }),
  ).toBeVisible();
});
