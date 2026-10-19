import { useI18n } from '@/hooks/useI18n';
import { useClipboard } from '@/hooks/useClipboard';
import styles from './Contact.module.css';
export function ContactCopy({ value }: { value: string }) {
  const { t } = useI18n();
  const { copy, status } = useClipboard();
  return (
    <>
      <button
        className={styles['copy-contact']}
        type="button"
        onClick={() => void copy(value)}
      >
        {t('copyValue', { value })} <span aria-hidden="true">⧉</span>
      </button>
      <span className={styles['copy-feedback']} role="status">
        {status === 'copied'
          ? `${t('copied')}.`
          : status === 'failed'
            ? t('manualCopy', { value })
            : ''}
      </span>
    </>
  );
}
