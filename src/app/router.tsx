import { useI18n } from '@/hooks/useI18n';
import { lazy, Suspense, useLayoutEffect, type ReactNode } from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router';
import { App } from './App';
import { Home } from '@/pages/Home/Home';
import { Projects } from '@/pages/Projects/Projects';
import { NotFound } from '@/pages/NotFound/NotFound';
import { PageBoundary } from '@/components/ui/PageBoundary/PageBoundary';
import { usePageTransition } from '@/hooks/usePageTransition';
import styles from './App.module.css';
const importProject = () => import('@/pages/Project/Project');
let projectModule: ReturnType<typeof importProject> | undefined;
const loadProject = () => (projectModule ??= importProject());
const Project = lazy(loadProject);
async function prepare(pathname: string) {
  if (matchPath('/projects/:slug', pathname)) await loadProject();
}
function Ready({
  children,
  onReady,
}: {
  children: ReactNode;
  onReady?: () => void;
}) {
  const { key } = useLocation();
  useLayoutEffect(() => {
    onReady?.();
  }, [onReady, key]);
  return children;
}
export function SiteRoutes({ onReady }: { onReady?: () => void }) {
  const { t } = useI18n();
  const { location, onReady: pageReady } = usePageTransition(prepare, onReady);
  return (
    <Routes location={location}>
      <Route element={<App />}>
        <Route
          index
          element={
            <Ready onReady={pageReady}>
              <Home />
            </Ready>
          }
        />
        <Route
          path="projects"
          element={
            <Ready onReady={pageReady}>
              <Projects />
            </Ready>
          }
        />
        <Route
          path="projects/:slug"
          element={
            <PageBoundary key={location.pathname} onReady={pageReady}>
              <Suspense
                fallback={
                  <main
                    id="main"
                    className={`${styles.main} ${styles.loading}`}
                    role="status"
                  >
                    {t('loadingProject')}
                  </main>
                }
              >
                <Ready onReady={pageReady}>
                  <Project />
                </Ready>
              </Suspense>
            </PageBoundary>
          }
        />
        <Route
          path="*"
          element={
            <Ready onReady={pageReady}>
              <NotFound />
            </Ready>
          }
        />
      </Route>
    </Routes>
  );
}
