import type { SiteLink as LinkData } from '@/types/site';
import { SiteLink } from '@/components/ui/SiteLink/SiteLink';
import styles from './SocialLinks.module.css';
export function SocialLinks({ links }: { links: LinkData[] }) {
  return (
    <div data-reveal="ready" className={styles['social-list']}>
      {links.map((link, index) => (
        <SiteLink
          key={`${link.title}:${index}`}
          link={link}
          className={styles['social-link']}
        >
          <span>{link.title}</span>
          {(link.alt || link.copyable) && (
            <span className={styles['social-handle']}>
              {link.alt ?? link.value}
            </span>
          )}
          <span className={styles['social-arrow']} aria-hidden="true">
            {link.copyable ? '⧉' : '↗'}
          </span>
        </SiteLink>
      ))}
    </div>
  );
}
