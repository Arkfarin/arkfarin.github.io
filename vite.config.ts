import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => {
  const origin = new URL(process.env.SITE_URL ?? 'https://ark.farin.cc');
  if (
    origin.protocol !== 'https:' ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  )
    throw new Error(
      'SITE_URL must be an HTTPS origin, e.g. https://ark.farin.cc.',
    );
  const base = process.env.SITE_BASE ?? '/';
  if (!/^\/(?:[^?#\\]*\/)?$/.test(base) || base.startsWith('//'))
    throw new Error(
      'SITE_BASE must start and end with /, e.g. / or /portfolio/.',
    );
  return {
    base,
    plugins: [react()],
    define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(origin.origin) },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: { copyPublicDir: !isSsrBuild },
  };
});
