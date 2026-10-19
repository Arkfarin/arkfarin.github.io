import type { SiteData, SiteLink } from '../types/site';
import type { Project } from '../types/project';

const SITE_DATA_URL =
  'https://gist.github.com/Arkfarin/1a4b2ba90dde5629ace2f9330522f0cd/raw';
// gist.github.com's redirect lacks CORS headers; its raw destination allows browser requests.
const SITE_DATA_RAW_URL = SITE_DATA_URL.replace(
  'gist.github.com',
  'gist.githubusercontent.com',
);

// The Gist uses comments, {...} lists and ["key": value] records.
// Parse containers structurally; never execute remote text as JavaScript.
function parseDocument(source: string): unknown {
  if (source.length > 1_000_000) throw new Error('Site data is too large');
  const pattern =
    /\s+|\/\/[^\n\r]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|[{}[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/gy;
  const tokens: string[] = [];
  let offset = 0;
  while (offset < source.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (!match) throw new Error(`Invalid site data at ${offset}`);
    const token = match[0];
    if (!/^\s|^\//.test(token)) tokens.push(token);
    offset = pattern.lastIndex;
  }
  let index = 0;
  function value(depth = 0): unknown {
    if (depth > 30) throw new Error('Site data is nested too deeply');
    const token = tokens[index++];
    if (token !== '{' && token !== '[') return JSON.parse(token);
    const close = token === '{' ? '}' : ']';
    const record = tokens[index + 1] === ':';
    const entries: [string, unknown][] = [];
    const items: unknown[] = [];
    while (tokens[index] !== close) {
      if (index >= tokens.length) throw new Error('Unclosed site data');
      if (record) {
        const key: unknown = JSON.parse(tokens[index++]);
        if (typeof key !== 'string' || tokens[index++] !== ':')
          throw new Error('Invalid site data property');
        if (entries.some(([name]) => name === key))
          throw new Error(`Duplicate property: ${key}`);
        entries.push([key, value(depth + 1)]);
      } else items.push(value(depth + 1));
      if (tokens[index] === close) break;
      if (tokens[index++] !== ',') throw new Error('Expected comma');
    }
    index++;
    return record || (token === '{' && !items.length)
      ? Object.fromEntries(entries)
      : items;
  }
  const result = value();
  if (index !== tokens.length) throw new Error('Unexpected trailing data');
  return result;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
}
function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && !Object.keys(value).length)
    return [];
  throw new Error('Expected a list');
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error('Expected nonempty text');
  return value.trim();
}
function optionalText(value: unknown): string | undefined {
  if (value === undefined || (typeof value === 'string' && !value.trim()))
    return undefined;
  return text(value);
}
function webUrl(value: unknown): string {
  const url = text(value);
  const parsed = new URL(url);
  if (
    !['https:', 'http:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  )
    throw new Error('Expected an HTTP(S) URL');
  return url;
}
function link(value: unknown): SiteLink {
  const item = record(value);
  for (const key of ['copyable', 'main'])
    if (item[key] !== undefined && typeof item[key] !== 'boolean')
      throw new Error(`Invalid ${key}`);
  return {
    title: text(item.title),
    value: item.copyable ? text(item.value) : webUrl(item.value),
    alt: optionalText(item.alt),
    ...(item.background !== undefined && {
      background: webUrl(item.background),
    }),
    main: item.main === true,
    copyable: item.copyable === true,
  };
}

export function parseSiteData(source: string): SiteData {
  const data = record(parseDocument(source));
  const links = record(data.links);
  const contacts = list(links.contacts).map(link);
  if (contacts.filter((item) => item.main).length > 1)
    throw new Error('Only one main contact is allowed');
  const slugs = new Set<string>();
  const projects = list(data.projects).map((value): Project => {
    const item = record(value);
    const slug = text(item.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug))
      throw new Error(`Invalid or duplicate slug: ${slug}`);
    slugs.add(slug);
    const repository = webUrl(item.repository).replace(/\/$/, '');
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repository))
      throw new Error(`Invalid GitHub repository: ${slug}`);
    return {
      slug,
      title: text(item.title),
      description: text(item.description),
      ...(item.background !== undefined && {
        background: webUrl(item.background),
      }),
      technologies: [...new Set(list(item.technologies).map(text))],
      repository,
      branch: item.branch === undefined ? 'main' : text(item.branch),
      category: item.category === undefined ? undefined : text(item.category),
      language: item.language === undefined ? undefined : text(item.language),
      readme_blob_sha:
        typeof item.readme_blob_sha === 'string' ? item.readme_blob_sha : '',
    };
  });
  return {
    projects,
    links: { contacts, others: list(links.others).map(link) },
  };
}

export async function fetchSiteData(): Promise<SiteData> {
  const response = await fetch(
    typeof window === 'undefined' ? SITE_DATA_URL : SITE_DATA_RAW_URL,
    {
      signal: AbortSignal.timeout(15_000),
      cache: 'no-cache',
    },
  );
  if (!response.ok) throw new Error(`Site data: HTTP ${response.status}`);
  return parseSiteData(await response.text());
}
