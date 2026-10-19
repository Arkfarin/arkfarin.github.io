import { useEffect } from 'react';
export function usePageMetadata(
  title: string,
  description: string,
  path: string,
  type = 'website',
) {
  useEffect(() => {
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', description);
    for (const [key, value] of Object.entries({
      title,
      description,
      type,
      url: `https://ark.farin.cc${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`,
    }))
      document
        .querySelector(`meta[property="og:${key}"]`)
        ?.setAttribute('content', value);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        'href',
        `https://ark.farin.cc${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`,
      );
  }, [title, description, path, type]);
}
