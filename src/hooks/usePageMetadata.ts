import { useEffect } from 'react';
import { useI18n } from './useI18n';
import { useSiteData } from '@/data/site';
import { pageHead, structuredData, type PageMetadata } from '@/lib/seo';

export function usePageMetadata(
  title: string,
  description: string,
  path: string,
  options: Pick<PageMetadata, 'type' | 'noindex'> = {},
) {
  const { locale } = useI18n();
  const { data } = useSiteData();
  const { type, noindex } = options;
  useEffect(() => {
    const page = { title, description, path, type, noindex, locale };
    const head = pageHead(page);
    document.title = head.title;
    for (const [attribute, values] of [
      ['name', head.names],
      ['property', head.properties],
    ] as const) {
      for (const [key, value] of Object.entries(values)) {
        let meta = document.head.querySelector<HTMLMetaElement>(
          `meta[${attribute}="${key}"]`,
        );
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attribute, key);
          document.head.append(meta);
        }
        meta.content = value;
      }
    }
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = head.canonical;
    const schema = structuredData(page, data);
    let script = document.getElementById('structured-data');
    if (!schema) script?.remove();
    else {
      if (!script) {
        script = document.createElement('script');
        script.id = 'structured-data';
        script.setAttribute('type', 'application/ld+json');
        document.head.append(script);
      }
      script.textContent = JSON.stringify(schema).replaceAll('<', '\\u003c');
    }
  }, [title, description, path, type, noindex, locale, data]);
}
