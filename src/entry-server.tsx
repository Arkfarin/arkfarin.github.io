import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { SiteRoutes } from './app/router';
import { SiteDataContext } from './data/site';
import type { SiteData } from './types/site';
export { fetchSiteData } from './lib/site-data';
export { pageHead, structuredData, absoluteUrl, siteBase } from './lib/seo';
export { en } from './i18n/locales/en';

export async function render(url: string, data: SiteData): Promise<string> {
  const errors: unknown[] = [];
  const { prelude, postponed } = await prerenderToNodeStream(
    <StaticRouter basename={import.meta.env.BASE_URL} location={url}>
      <SiteDataContext value={{ data, error: false }}>
        <SiteRoutes />
      </SiteDataContext>
    </StaticRouter>,
    {
      signal: AbortSignal.timeout(15_000),
      // Inline completed route boundaries in the static HTML.
      progressiveChunkSize: Number.MAX_SAFE_INTEGER,
      onError(error) {
        errors.push(error);
      },
    },
  );
  let html = '';
  for await (const chunk of prelude) html += String(chunk);
  if (postponed || errors.length)
    throw new Error(`Incomplete prerender: ${url}`, { cause: errors[0] });
  return html;
}
