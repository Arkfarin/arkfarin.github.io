import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter, matchPath } from 'react-router';
import { SiteRoutes } from './app/router';
import { Bootstrap } from './app/Bootstrap';
import { parseSiteData } from './lib/site-data';
import { seedMarkdown } from './data/projects';
import type { SiteData } from './types/site';
import { startPreloader, waitForDocument, waitForFonts } from './lib/preloader';
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

let initialData: SiteData | undefined;
const snapshot = document.getElementById('site-data')?.textContent;
try {
  if (snapshot) initialData = parseSiteData(snapshot);
  const readmes = document.getElementById('project-readmes')?.textContent;
  if (initialData && readmes)
    seedMarkdown(initialData.projects, JSON.parse(readmes));
} catch {
  // A damaged snapshot falls back to the normal data request.
  initialData = undefined;
}
const onDataReady = () => preloader.complete('data');
const app = (
  <StrictMode>
    <Bootstrap initialData={initialData} onDataReady={onDataReady}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <SiteRoutes onReady={() => preloader.complete('page')} />
      </BrowserRouter>
    </Bootstrap>
  </StrictMode>
);
const root = document.getElementById('root')!;
function mount() {
  if (initialData && root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
if (
  initialData &&
  matchPath(
    `${import.meta.env.BASE_URL}projects/:slug/`,
    window.location.pathname,
  )
) {
  // A failed lazy chunk must not replace the readable static project with an error.
  void import('./pages/Project/Project')
    .then(mount)
    .catch(() => preloader.reveal());
} else mount();
