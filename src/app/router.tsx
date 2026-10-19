import { useI18n } from '@/hooks/useI18n';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { App } from './App';
import { Home } from '@/pages/Home/Home';
import { Projects } from '@/pages/Projects/Projects';
import { NotFound } from '@/pages/NotFound/NotFound';
import { PageBoundary } from '@/components/ui/PageBoundary/PageBoundary';
import styles from './App.module.css';
const Project = lazy(() => import('@/pages/Project/Project'));
function Ready({
  children,
  onReady,
}: {
  children: ReactNode;
  onReady?: () => void;
}) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return children;
}
export function SiteRoutes({ onReady }: { onReady?: () => void }) {
  const { t } = useI18n();
  return (
    <Routes>
      <Route element={<App />}>
        <Route
          index
          element={
            <Ready onReady={onReady}>
              <Home />
            </Ready>
          }
        />
        <Route
          path="projects"
          element={
            <Ready onReady={onReady}>
              <Projects />
            </Ready>
          }
        />
        <Route
          path="projects/:slug"
          element={
            <PageBoundary onReady={onReady}>
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
                <Ready onReady={onReady}>
                  <Project />
                </Ready>
              </Suspense>
            </PageBoundary>
          }
        />
        <Route
          path="*"
          element={
            <Ready onReady={onReady}>
              <NotFound />
            </Ready>
          }
        />
      </Route>
    </Routes>
  );
}
