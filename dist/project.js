'use strict';

const codeFeedback = document.getElementById('code-feedback');
document.querySelectorAll('.copy-code').forEach(button => {
  button.hidden = false;
  let resetTimer;
  button.addEventListener('click', async () => {
    const code = button.closest('.code-block').querySelector('pre code, pre');
    if (!code) return;
    clearTimeout(resetTimer);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Скопировано';
      codeFeedback.textContent = 'Блок кода скопирован';
    } catch (_) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Код выделен';
      codeFeedback.textContent = 'Код выделен. Скопируйте его обычной командой копирования.';
    }
    resetTimer = setTimeout(() => { button.textContent = 'Копировать'; codeFeedback.textContent = ''; }, 2400);
  });
});

const tocDetails = document.querySelector('.readme-toc details');
const compactContents = matchMedia('(max-width: 1020px)');
if (tocDetails) {
  tocDetails.open = !compactContents.matches;
  compactContents.addEventListener('change', event => { tocDetails.open = !event.matches; });
  tocDetails.addEventListener('click', event => {
    if (compactContents.matches && event.target.closest('a')) tocDetails.open = false;
  });
}

const tocLinks = [...document.querySelectorAll('.readme-toc nav a')];
const tocHeadings = tocLinks.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
let tocScheduled = false;
function updateContents() {
  tocScheduled = false;
  if (!tocHeadings.length) return;
  let current = tocHeadings[0];
  const offset = compactContents.matches ? 130 : 80;
  for (const heading of tocHeadings) if (heading.getBoundingClientRect().top <= offset) current = heading;
  tocLinks.forEach(link => {
    const active = decodeURIComponent(link.hash.slice(1)) === current.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!tocScheduled) { tocScheduled = true; requestAnimationFrame(updateContents); }
}, { passive: true });
window.addEventListener('load', updateContents, { once: true });
updateContents();
