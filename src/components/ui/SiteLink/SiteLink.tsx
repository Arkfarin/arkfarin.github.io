import { useI18n } from '@/hooks/useI18n';
import type { ReactNode } from 'react';
import type { SiteLink as LinkData } from '@/types/site';
import { useClipboard } from '@/hooks/useClipboard';
import styles from './SiteLink.module.css';

export function SiteLink({
  link,
  children,
  className,
}: {
  link: LinkData;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const { copy, status } = useClipboard();
  if (!link.copyable)
    return (
      <a
        href={link.value}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={t('copyValue', { value: link.title })}
        onClick={() => void copy(link.value)}
      >
        {children}
      </button>
      <span className={styles.feedback} role="status">
        {status === 'copied'
          ? t('copiedName', { title: link.title })
          : status === 'failed'
            ? t('copyFailed', { value: link.value })
            : ''}
      </span>
    </>
  );
}
