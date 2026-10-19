import { useI18n } from '@/hooks/useI18n';
import type { ReactNode } from 'react';
import type { SiteLink as LinkData } from '@/types/site';
import { useClipboard } from '@/hooks/useClipboard';
import { BackgroundImage } from '@/components/ui/BackgroundImage/BackgroundImage';
import background from '@/components/ui/BackgroundImage/BackgroundImage.module.css';
import ui from '@/components/ui/Primitives.module.css';
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
  const { locale, t } = useI18n();
  const { copy, status } = useClipboard(2000);
  const isCopied = status === 'copied';
  const copiedLabel = `${t('copied').toLocaleUpperCase(locale)}!`;
  const linkClassName = [
    className,
    link.background && background.surface,
    link.copyable && styles.copyable,
  ]
    .filter(Boolean)
    .join(' ');
  const image = link.background && (
    <BackgroundImage key={link.background} src={link.background} />
  );
  if (!link.copyable)
    return (
      <a
        href={link.value}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        {image}
        {children}
      </a>
    );
  return (
    <>
      <button
        type="button"
        className={linkClassName}
        aria-label={
          isCopied ? copiedLabel : t('copyValue', { value: link.title })
        }
        disabled={status === 'copying' || isCopied}
        data-copied={isCopied}
        onClick={() => void copy(link.value)}
      >
        {image}
        {isCopied ? copiedLabel : children}
      </button>
      <span
        className={status === 'failed' ? styles.feedback : ui['sr-only']}
        role="status"
      >
        {isCopied
          ? t('copiedName', { title: link.title })
          : status === 'failed'
            ? t('copyFailed', { value: link.value })
            : ''}
      </span>
    </>
  );
}
