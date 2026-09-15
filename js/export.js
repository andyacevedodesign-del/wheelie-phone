// Export modal: the same code the canvas runs, in the shape you need it.

import { store } from './state.js';
import { generate, slugify, standaloneDoc } from './generator.js';

const $ = (sel) => document.querySelector(sel);

let currentTab = 'embed';

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function payload(tab) {
  const project = store.get();
  const out = generate(project);
  switch (tab) {
    case 'standalone':
      return {
        code: standaloneDoc(project),
        filename: `${slugify(project.name)}.html`,
        mime: 'text/html',
        hint: 'A complete page — open it in a browser or hand it off as a demo.',
      };
    case 'html':
      return {
        code: out.html,
        filename: `${slugify(project.name)}.html`,
        mime: 'text/html',
        hint: 'Markup only. Pair it with the CSS and JS tabs.',
      };
    case 'css':
      return {
        code: out.css,
        filename: `${slugify(project.name)}.css`,
        mime: 'text/css',
        hint: `Scoped under #${out.id}, so it can't fight your page styles.`,
      };
    case 'js':
      return {
        code: out.js,
        filename: `${slugify(project.name)}.js`,
        mime: 'text/javascript',
        hint: 'Runs after GSAP (and Draggable / InertiaPlugin) have loaded.',
      };
    default:
      return {
        code: out.embed,
        filename: `${slugify(project.name)}-embed.html`,
        mime: 'text/html',
        hint: 'One block of HTML + scoped CSS + GSAP tags + runtime. Paste into a Webflow Embed or any custom-HTML block.',
      };
  }
}

function renderExport() {
  const { code, hint } = payload(currentTab);
  $('#export-code').querySelector('code').textContent = code;
  $('#export-hint').textContent = hint;

  const project = store.get();
  const plugins = ['GSAP core'];
  if (project.carousel.drag) plugins.push('Draggable');
  if (project.carousel.drag && project.carousel.inertia) plugins.push('InertiaPlugin');
  $('#export-plugins-note').textContent =
    currentTab === 'css' || currentTab === 'html'
      ? ''
      : `Includes: ${plugins.join(', ')} (jsDelivr, GSAP 3.13 — every plugin is free to use).`;
}

export function initExport() {
  $('#btn-export').addEventListener('click', () => {
    $('#export-modal').hidden = false;
    renderExport();
  });
  $('#export-close').addEventListener('click', () => { $('#export-modal').hidden = true; });
  $('#export-modal').addEventListener('click', (e) => {
    if (e.target.id === 'export-modal') $('#export-modal').hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#export-modal').hidden) $('#export-modal').hidden = true;
  });

  $('#export-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-export-tab]');
    if (!btn) return;
    currentTab = btn.getAttribute('data-export-tab');
    document.querySelectorAll('[data-export-tab]').forEach((b) => b.classList.toggle('active', b === btn));
    renderExport();
  });

  $('#export-copy').addEventListener('click', async () => {
    const { code } = payload(currentTab);
    try {
      await navigator.clipboard.writeText(code);
      const btn = $('#export-copy');
      const label = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = label; }, 1400);
    } catch {
      alert('Clipboard access was blocked — select the code and copy it manually.');
    }
  });

  $('#export-download').addEventListener('click', () => {
    const { code, filename, mime } = payload(currentTab);
    downloadText(filename, code, mime);
  });
}
