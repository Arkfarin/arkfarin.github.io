import { useEffect, useState, type ReactNode } from 'react';
import { SiteDataContext, emptySiteData } from '@/data/site';
import { fetchSiteData } from '@/lib/site-data';
import type { SiteData } from '@/types/site';

export function Bootstrap({
  initialData,
  onDataReady,
  children,
}: {
  initialData?: SiteData;
  onDataReady: () => void;
  children: ReactNode;
}) {
  const [state, setState] = useState({
    data: initialData ?? emptySiteData,
    error: false,
  });
  useEffect(() => {
    let active = true;
    if (initialData) onDataReady();
    void fetchSiteData()
      .then((data) => {
        if (active) setState({ data, error: false });
      })
      .catch(() => {
        if (active) setState((previous) => ({ ...previous, error: true }));
      })
      .finally(() => {
        if (active) onDataReady();
      });
    return () => {
      active = false;
    };
  }, [initialData, onDataReady]);
  return <SiteDataContext value={state}>{children}</SiteDataContext>;
}
