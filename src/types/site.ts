import type { Project } from './project';

export interface SiteLink {
  title: string;
  value: string;
  alt?: string;
  main?: boolean;
  copyable?: boolean;
}

export interface SiteData {
  links: { contacts: SiteLink[]; others: SiteLink[] };
  projects: Project[];
}
