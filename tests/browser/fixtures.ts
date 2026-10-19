import type { Page } from '@playwright/test';
import { SITE_DATA_RAW_URL, parseSiteData } from '../../src/lib/site-data';
import { gist } from '../fixtures/site-data';

export { gist, siteData } from '../fixtures/site-data';
export const markdown = `Example README.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://example.com/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://example.com/logo-light.svg">
  <img src="https://example.com/logo-light.svg" width="100" alt="Example logo">
</picture>

## Запуск

\`\`\`bash
npm run example
\`\`\`

## Данные

Example project data.
`;
export async function mockData(page: Page, body = gist) {
  await page.route(SITE_DATA_RAW_URL, (route) =>
    route.fulfill({ contentType: 'text/plain', body }),
  );
  await page.route('https://example.com/logo-*.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect width="100" height="40" fill="#888"/></svg>',
    }),
  );
  let projects;
  try {
    projects = parseSiteData(body).projects;
  } catch {
    return;
  }
  for (const project of projects) {
    await page.route(
      `https://raw.githubusercontent.com/${project.repository.split('github.com/')[1]}/${project.branch}/README.md`,
      (route) => route.fulfill({ contentType: 'text/plain', body: markdown }),
    );
  }
}
export async function ready(page: Page) {
  await page.locator('#preloader').waitFor({ state: 'detached' });
}
