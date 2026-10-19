import { useI18n } from '@/hooks/useI18n';
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useClipboard } from '@/hooks/useClipboard';
import styles from './CodeBlock.module.css';
import ui from '@/components/ui/Primitives.module.css';

export function CodeBlock({
  children,
  ...props
}: ComponentPropsWithoutRef<'pre'> & { children?: ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLPreElement>(null);
  const { copy, status } = useClipboard();
  const language = props.className?.match(/language-([\w-]+)/)?.[1];
  async function copyCode() {
    const element = ref.current;
    if (!element) return;
    if (!(await copy(element.textContent ?? '')) && element.isConnected) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
  return (
    <div className={styles['code-block']}>
      <div className={styles['code-toolbar']}>
        <span>{language ?? 'code'}</span>
        <button
          className={styles['copy-code']}
          type="button"
          aria-label={t('copyCode')}
          onClick={() => void copyCode()}
        >
          {status === 'copied'
            ? t('copied')
            : status === 'failed'
              ? t('codeSelected')
              : t('copy')}
        </button>
      </div>
      <pre
        {...props}
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={t('codeBlock')}
      >
        {children}
      </pre>
      <span className={ui['sr-only']} role="status">
        {status === 'copied'
          ? t('codeCopied')
          : status === 'failed'
            ? t('codeManual')
            : ''}
      </span>
    </div>
  );
}
