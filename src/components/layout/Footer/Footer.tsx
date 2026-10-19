import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router';
import styles from './Footer.module.css';
import ui from '@/components/ui/Primitives.module.css';
export function Footer({ project = false }: { project?: boolean }) {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <Link to="/#home">
        ARKFARIN<span className={ui['accent-text']}>.</span>
      </Link>
      <span>ark.farin.cc</span>
      <a className={styles['back-top']} href={project ? '#main' : '#home'}>
        {t('backTop')} <span aria-hidden="true">↑</span>
      </a>
    </footer>
  );
}
