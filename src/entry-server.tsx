import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { SiteRoutes } from './app/router';
import { SiteDataContext } from './data/site';
import type { SiteData } from './types/site';
export { primeMarkdown, loadMarkdown } from './data/projects';
export { fetchSiteData, parseSiteData } from './lib/site-data';

export function render(url: string, data: SiteData): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    const output = new Writable({
      write(chunk, _encoding, callback) {
        html += String(chunk);
        callback();
      },
    });
    output.on('finish', () => {
      clearTimeout(timeout);
      resolve(html);
    });
    output.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    const stream = renderToPipeableStream(
      <StaticRouter basename={import.meta.env.BASE_URL} location={url}>
        <SiteDataContext value={{ data, error: false }}>
          <SiteRoutes />
        </SiteDataContext>
      </StaticRouter>,
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError(error) {
          clearTimeout(timeout);
          reject(error);
        },
      },
    );
    const timeout = setTimeout(() => {
      stream.abort();
      reject(new Error(`Rendering timed out: ${url}`));
    }, 15000);
  });
}
