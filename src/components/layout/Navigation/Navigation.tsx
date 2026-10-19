import { useI18n } from '@/hooks/useI18n';
import { Link, useLocation } from 'react-router';
import { navigation } from '@/data/navigation';
import { useActiveSection } from '@/hooks/useActiveSection';
import styles from './Navigation.module.css';

const sections = navigation.map(({ id }) => id);
export function Navigation({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const { t } = useI18n();
  const location = useLocation();
  const currentSection = useActiveSection(sections);
  const active =
    location.pathname === '/'
      ? currentSection
      : /^\/projects(?:\/|$)/.test(location.pathname)
        ? 'projects'
        : '';
  return (
    <nav
      id="navigation"
      className={`${styles.navigation} ${open ? styles.open : ''}`}
      aria-label={t('sections')}
    >
      {navigation.map(({ id, label }) => (
        <Link
          key={id}
          to={
            id === 'projects' && location.pathname !== '/'
              ? '/projects/'
              : `/#${id}`
          }
          onClick={close}
          className={`${styles['nav-link']} ${active === id ? styles.active : ''}`}
          aria-current={active === id ? 'location' : undefined}
        >
          {t(label)}
          <span aria-hidden="true">↗</span>
        </Link>
      ))}
    </nav>
  );
}
