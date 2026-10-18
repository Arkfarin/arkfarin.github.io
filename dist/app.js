'use strict';

const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const themeLabel = document.querySelector('.theme-label');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function updateTheme(theme, save = false) {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
  themeButton.setAttribute('aria-pressed', String(dark));
  themeLabel.textContent = dark ? 'Светлая' : 'Тёмная';
  themeMeta.setAttribute('content', dark ? '#141517' : '#f3f2ee');
  if (save) { try { localStorage.setItem('arkfarin-theme', theme); } catch (_) {} }
}
updateTheme(root.dataset.theme);
themeButton.addEventListener('click', () => updateTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
systemTheme.addEventListener('change', event => {
  try { if (localStorage.getItem('arkfarin-theme')) return; } catch (_) {}
  updateTheme(event.matches ? 'dark' : 'light');
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
const mobile = matchMedia('(max-width: 760px)');
function setMenu(open, restoreFocus = false) {
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('click', event => { if (!event.target.closest('.rail')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
mobile.addEventListener('change', () => setMenu(false));

const navLinks = [...document.querySelectorAll('.nav-link')].filter(link => link.getAttribute('href').startsWith('#'));
const sections = navLinks.map(link => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean);
let scrollScheduled = false;
function updateActiveSection() {
  scrollScheduled = false;
  if (!sections.length) return;
  let active = sections[0];
  const threshold = window.innerHeight * 0.36;
  for (const section of sections) { if (section.getBoundingClientRect().top <= threshold) active = section; }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) active = sections[sections.length - 1];
  navLinks.forEach(link => {
    const current = link.getAttribute('href') === '#' + active.id;
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateActiveSection); }
}, { passive: true });
window.addEventListener('resize', updateActiveSection, { passive: true });
window.addEventListener('load', updateActiveSection, { once: true });
updateActiveSection();

const copyButton = document.querySelector('[data-copy]');
const feedback = document.querySelector('.copy-feedback');
let copyTimeout;
copyButton?.addEventListener('click', async () => {
  clearTimeout(copyTimeout);
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(copyButton.dataset.copy);
    feedback.textContent = 'Скопировано. До встречи в Telegram.';
  } catch (_) {
    feedback.textContent = 'Ник для копирования: @arkfarin';
  }
  copyTimeout = setTimeout(() => { feedback.textContent = ''; }, 4000);
});

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.04, rootMargin: '0px 0px 20px 0px' });
  reveals.forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('reveal-pending'); observer.observe(element);
    }
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); reveals.forEach(element => element.classList.remove('reveal-pending')); }
  });
}
