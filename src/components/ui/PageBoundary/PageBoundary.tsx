import { Component, type ReactNode } from 'react';
import styles from '@/app/App.module.css';
import ui from '@/components/ui/Primitives.module.css';
import { useI18n } from '@/hooks/useI18n';

function PageFailure() {
  const { t } = useI18n();
  return (
    <main id="main" className={`${styles.main} ${styles.loading}`}>
      <h1>{t('pageError')}</h1>
      <p className={styles.failure}>{t('connectionError')}</p>
      <button
        className={`${ui.button} ${ui['button-solid']}`}
        type="button"
        onClick={() => window.location.reload()}
      >
        {t('retry')}
      </button>
    </main>
  );
}

export class PageBoundary extends Component<
  {
    children: ReactNode;
    onReady?: () => void;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onReady?.();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <PageFailure />;
  }
}
