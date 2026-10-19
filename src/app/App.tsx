import { useI18n } from '@/hooks/useI18n';
import { Outlet } from 'react-router';
import { Header } from '@/components/layout/Header/Header';
import { useRouteScroll } from '@/hooks/useRouteScroll';
import { useSiteData } from '@/data/site';
import styles from './App.module.css';
export function App() {
  const { t } = useI18n();
  useRouteScroll();
  const { data, error } = useSiteData();
  return (
    <>
      <Header />
      <div className={styles.routeProgress} aria-hidden="true" />
      {error && (
        <div className={styles.error} role="alert">
          <span>
            {data.projects.length ||
            data.links.contacts.length ||
            data.links.others.length
              ? t('staleData')
              : t('dataError')}
          </span>
          <button type="button" onClick={() => window.location.reload()}>
            {t('retry')}
          </button>
        </div>
      )}
      <div className={styles.page} data-route-content>
        <Outlet />
      </div>
    </>
  );
}
