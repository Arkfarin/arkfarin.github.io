import type { SiteData } from '@/types/site';

export const siteOrigin = import.meta.env.VITE_SITE_URL;
export const siteBase = import.meta.env.BASE_URL;
export const absoluteUrl = (path = '') =>
  `${siteOrigin}${siteBase}${path.replace(/^\/+/, '')}`;

export interface PageMetadata {
  title: string;
  description: string;
  path: string;
  type?: string;
  noindex?: boolean;
  locale?: string;
}

export function pageHead({
  title,
  description,
  path,
  type = 'website',
  noindex = false,
  locale = 'en',
}: PageMetadata) {
  const url = absoluteUrl(path);
  const image = absoluteUrl('assets/og-card.png');
  const imageAlt =
    'Arkfarin — Python developer. Tools, automation and projects.';
  return {
    title,
    canonical: url,
    names: {
      description,
      robots: noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large',
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
      'twitter:image:alt': imageAlt,
    },
    properties: {
      'og:site_name': 'ARKFARIN',
      'og:title': title,
      'og:description': description,
      'og:type': type,
      'og:url': url,
      'og:locale':
        (
          {
            en: 'en_US',
            ru: 'ru_RU',
            uk: 'uk_UA',
            ja: 'ja_JP',
            zh: 'zh_CN',
            ky: 'ky_KG',
          } as Record<string, string>
        )[locale] ?? locale,
      'og:image': image,
      'og:image:secure_url': image,
      'og:image:type': 'image/png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': imageAlt,
    },
  };
}

export function structuredData(page: PageMetadata, data: SiteData) {
  if (page.noindex) return null;
  const url = absoluteUrl(page.path);
  const home = absoluteUrl();
  const personId = `${home}#person`;
  const websiteId = `${home}#website`;
  const path = page.path.replace(/^\/|\/$/g, '');
  const project = data.projects.find(({ slug }) => path === `projects/${slug}`);
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: home,
      name: 'ARKFARIN',
      publisher: { '@id': personId },
      inLanguage: 'en',
    },
    {
      '@type': 'Person',
      '@id': personId,
      name: 'Arkfarin',
      url: home,
      jobTitle: 'Python developer',
      sameAs: [
        ...new Set(
          data.links.contacts
            .filter((link) => !link.copyable)
            .map((link) => link.value),
        ),
      ],
    },
    {
      '@type': !path
        ? 'ProfilePage'
        : path === 'projects'
          ? 'CollectionPage'
          : 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: page.locale ?? 'en',
      isPartOf: { '@id': websiteId },
      ...(!path && { mainEntity: { '@id': personId } }),
      ...(path === 'projects' && {
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: data.projects.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            url: absoluteUrl(`projects/${item.slug}/`),
          })),
        },
      }),
      ...(project && {
        about: {
          '@type': 'SoftwareSourceCode',
          name: project.title,
          description: project.description,
          codeRepository: project.repository,
          keywords: project.technologies.join(', '),
        },
      }),
      ...(path && { breadcrumb: { '@id': `${url}#breadcrumbs` } }),
    },
  ];
  if (path) {
    const items = [
      { name: 'Arkfarin', item: home },
      { name: 'Projects', item: absoluteUrl('projects/') },
      ...(project ? [{ name: project.title, item: url }] : []),
    ];
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumbs`,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        ...item,
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
