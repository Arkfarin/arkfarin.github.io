import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router';
import { footerLinks } from '@/data/navigation';
import styles from './Footer.module.css';
import ui from '@/components/ui/Primitives.module.css';
export function Footer({ project = false }: { project?: boolean }) {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <Link className={styles.brand} to="/#home">
        <img
          className={styles['brand-logo']}
          src={`${import.meta.env.BASE_URL}assets/logo_splash.svg`}
          alt=""
          width={36}
          height={36}
        />
        <span>
          ARKFARIN<span className={ui['accent-text']}>.</span>
        </span>
      </Link>
      <span>ark.farin.cc</span>
      <div className={styles.links}>
        {footerLinks.map(({ label, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer">
            {label} <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      <a className={styles['back-top']} href={project ? '#main' : '#home'}>
        {t('backTop')} <span aria-hidden="true">↑</span>
      </a>
    </footer>
  );
}
