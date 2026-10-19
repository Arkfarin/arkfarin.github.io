import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { SiteRoutes } from './app/router';
import { SiteDataContext, emptySiteData } from './data/site';
import { fetchSiteData, parseSiteData } from './lib/site-data';
import { startPreloader, waitForDocument, waitForFonts } from './lib/preloader';
import { waitForBackgrounds } from './lib/backgrounds';
import { initializeLanguage } from './i18n/store';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/typography.css';
import './styles/global.css';
import './styles/animations.css';

initializeLanguage();
const preloader = startPreloader();
void waitForDocument().then(() => preloader.complete('document'));
void waitForFonts().then(() => preloader.complete('fonts'));

async function bootstrap() {
  let data = emptySiteData;
  let error = false;
  try {
    data = await fetchSiteData();
  } catch {
    error = true;
    const snapshot = document.getElementById('site-data')?.textContent;
    if (snapshot) {
      try {
        data = parseSiteData(snapshot);
      } catch {
        /* Show an explicit empty/error state. */
      }
    }
  }
  preloader.complete('data');
  void waitForBackgrounds(data).then(() => preloader.complete('backgrounds'));
  // Prerendered HTML remains useful without JS. With JS, render the fresh Gist
  // rather than hydrating a potentially outdated build-time catalog.
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SiteDataContext value={{ data, error }}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <SiteRoutes onReady={() => preloader.complete('page')} />
        </BrowserRouter>
      </SiteDataContext>
    </StrictMode>,
  );
}
void bootstrap().catch(() => preloader.reveal());
