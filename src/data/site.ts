import { createContext, useContext } from 'react';
import type { SiteData } from '@/types/site';

export const emptySiteData: SiteData = {
  projects: [],
  links: { contacts: [], others: [] },
};
export const SiteDataContext = createContext<{
  data: SiteData;
  error: boolean;
}>({ data: emptySiteData, error: false });
export const useSiteData = () => useContext(SiteDataContext);
