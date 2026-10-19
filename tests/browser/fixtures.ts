import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { SITE_DATA_RAW_URL, parseSiteData } from '../../src/lib/site-data';

export const gist = await readFile('tests/fixtures/site.gist', 'utf8');
export const siteData = parseSiteData(gist);
export async function mockData(page: Page, body = gist) {
  await page.route(SITE_DATA_RAW_URL, (route) =>
    route.fulfill({ contentType: 'text/plain', body }),
  );
  for (const project of siteData.projects) {
    const body = await readFile(`content/projects/${project.slug}.md`, 'utf8');
    await page.route(
      `https://raw.githubusercontent.com/${project.repository.split('github.com/')[1]}/${project.branch}/README.md`,
      (route) => route.fulfill({ contentType: 'text/plain', body }),
    );
  }
}
export async function ready(page: Page) {
  await page.locator('#preloader').waitFor({ state: 'detached' });
}
