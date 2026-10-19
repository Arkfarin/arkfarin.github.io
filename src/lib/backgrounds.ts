import type { SiteData } from '../types/site';

function loadBackground(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve();
    };
    const timeout = setTimeout(() => {
      finish();
      image.removeAttribute('src');
    }, 15_000);
    image.decoding = 'async';
    image.onload = () => void image.decode().then(finish, finish);
    image.onerror = finish;
    image.src = src;
  });
}

export function waitForBackgrounds(data: SiteData) {
  const sources = new Set(
    [...data.projects, ...data.links.contacts, ...data.links.others].flatMap(
      ({ background }) => (background ? [background] : []),
    ),
  );
  return Promise.all([...sources].map(loadBackground));
}
