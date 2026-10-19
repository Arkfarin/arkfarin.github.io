import { useI18n } from '@/hooks/useI18n';
import { Link, useLocation } from 'react-router';
import { ThemeToggle } from '@/components/ui/ThemeToggle/ThemeToggle';
import { LanguageSelect } from '@/components/ui/LanguageSelect/LanguageSelect';
import { Navigation } from '../Navigation/Navigation';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import styles from './Header.module.css';

function HeaderMenu() {
  const { t } = useI18n();
  const { open, setOpen, containerRef, buttonRef } = useMobileMenu();
  return (
    <aside ref={containerRef} className={styles.rail} aria-label={t('siteNav')}>
      <Link className={styles.brand} to="/#home" aria-label={t('homeLabel')}>
        ARK
        <span>
          FARIN<span className={styles['brand-dot']}>.</span>
        </span>
      </Link>
      <Navigation open={open} close={() => setOpen(false)} />
      <div className={styles['rail-bottom']}>
        <LanguageSelect />
        <ThemeToggle />
      </div>
      <button
        ref={buttonRef}
        className={styles['menu-toggle']}
        type="button"
        aria-expanded={open}
        aria-controls="navigation"
        aria-label={open ? t('closeMenu') : t('openMenu')}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>
    </aside>
  );
}
export function Header() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  return (
    <>
      <a className={styles['skip-link']} href="#main">
        {t('skip')}
      </a>
      <HeaderMenu key={pathname} />
    </>
  );
}
