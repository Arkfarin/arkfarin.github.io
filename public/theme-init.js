// Runs before CSS/React to prevent a flash of the wrong theme.
(() => {
  document.documentElement.dataset.loading = 'true';
  try {
    const language = localStorage.getItem('arkfarin-language');
    if (['ru', 'en', 'uk', 'ja', 'zh', 'ky'].includes(language))
      document.documentElement.lang = language;
  } catch {
    /* Storage may be blocked. */
  }
  let saved;
  try {
    saved = localStorage.getItem('arkfarin-theme');
  } catch {
    /* Storage may be blocked. */
  }
  const theme =
    saved === 'light' || saved === 'dark'
      ? saved
      : matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content =
    theme === 'dark' ? '#141517' : '#f3f2ee';
})();
