// PNG export. The wheel is DOM in 3D plus a couple of WebGL layers, which
// rules out the usual DOM-to-canvas libraries — they flatten 3D transforms.
// Instead the component is serialised into an <svg><foreignObject>, which the
// browser rasterises with its own engine, so transforms, gradients, shadows
// and text all come out as they look on screen. Two things a DOM clone can't
// carry have to be patched in first: canvas pixels, and anything loaded over
// the network (an SVG rendered as an image won't fetch external resources).

import { store } from './state.js';
import { slugify } from './generator.js';

const $ = (sel) => document.querySelector(sel);

const settings = { scale: 2, transparent: true };

// ---------------------------------------------------------------------------
// Fetch-and-inline, so the rasteriser has everything locally.

const inlined = new Map();

async function toDataUri(url) {
  if (!url || /^data:/.test(url)) return url;
  if (inlined.has(url)) return inlined.get(url);
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    inlined.set(url, data);
    return data;
  } catch {
    inlined.set(url, null); // the host blocks cross-origin reads
    return null;
  }
}

// Lato comes from Google Fonts, which an SVG-as-image can't reach. Pull the
// woff2 files in and re-declare the face with data URIs. Best effort: if any
// of it fails the export still happens, in the fallback sans.
async function embedFonts(project) {
  if (!project.theme.loadLato) return '';
  try {
    const cssRes = await fetch('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap');
    if (!cssRes.ok) return '';
    let css = await cssRes.text();
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1]))];
    for (const url of urls) {
      const data = await toDataUri(url);
      if (data) css = css.split(url).join(data);
    }
    return css.replace(/url\(https:\/\/[^)]+\)/g, 'url()'); // drop any that failed
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------

function previewParts() {
  const iframe = $('#preview');
  const doc = iframe?.contentDocument;
  const root = doc?.querySelector('.wheelie-phone');
  if (!root) throw new Error('The preview has not finished loading yet.');
  return { win: iframe.contentWindow, doc, root };
}

async function buildCanvas({ scale, transparent }) {
  const { win, doc, root } = previewParts();
  const shots = win.WheeliePhone?.snapshot?.() || { backdrop: null, slabs: null };

  const rect = root.getBoundingClientRect();
  const w = Math.max(Math.round(rect.width), 1);
  const h = Math.max(Math.round(rect.height), 1);

  const clone = root.cloneNode(true);
  let missing = 0;

  // 1. Canvases clone empty — swap in the pixels the runtime just gave us.
  const liveCanvases = [...root.querySelectorAll('canvas')];
  const cloneCanvases = [...clone.querySelectorAll('canvas')];
  cloneCanvases.forEach((node, i) => {
    const live = liveCanvases[i];
    const isBackdrop = live?.classList.contains('wp-gl');
    const data = isBackdrop ? shots.backdrop : shots.slabs;
    if (isBackdrop && transparent) { node.remove(); return; }  // it's a background
    if (!data) { node.remove(); return; }
    const img = doc.createElement('img');
    img.setAttribute('src', data);
    img.setAttribute('class', node.getAttribute('class') || '');
    img.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;object-fit:fill');
    node.replaceWith(img);
  });

  // 2. Inline every image the rasteriser would otherwise skip.
  for (const img of clone.querySelectorAll('img')) {
    const src = img.getAttribute('src') || '';
    if (/^data:/.test(src)) continue;
    const data = await toDataUri(new URL(src, doc.baseURI || location.href).href);
    if (data) img.setAttribute('src', data);
    else { img.remove(); missing++; }
  }

  // 3. Same for inline background images (avatars carry theirs that way).
  for (const node of clone.querySelectorAll('[style*="background-image"]')) {
    const style = node.getAttribute('style') || '';
    const match = /background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/.exec(style);
    if (!match || /^data:/.test(match[2])) continue;
    const data = await toDataUri(match[2]);
    if (data) node.setAttribute('style', style.replace(match[2], data));
    else { node.setAttribute('style', style.replace(match[0], '')); missing++; }
  }

  // 4. The component's own stylesheet, with any hosted url() inlined too.
  let css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  for (const m of [...css.matchAll(/url\((['"]?)(https?:\/\/[^'")]+)\1\)/g)]) {
    const data = await toDataUri(m[2]);
    if (data) css = css.split(m[2]).join(data);
    else missing++;
  }
  if (transparent) {
    // Drop the stage's own background; the phones keep theirs.
    css += `\n#${root.id} { background: none !important; }`;
  }

  const fontCss = await embedFonts(store.get());

  const html = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}">` +
    `<g transform="scale(${scale})">` +
    `<foreignObject x="0" y="0" width="${w}" height="${h}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml"><style>${fontCss}\n${css}</style>${html}</div>` +
    `</foreignObject></g></svg>`;

  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('The browser could not rasterise the component.'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!transparent) {
    ctx.fillStyle = getComputedStyle(root).backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  return { canvas, missing, w: canvas.width, h: canvas.height };
}

function sizeLabel() {
  try {
    const rect = previewParts().root.getBoundingClientRect();
    return `${Math.round(rect.width) * settings.scale} × ${Math.round(rect.height) * settings.scale} px`;
  } catch {
    return '—';
  }
}

function refresh() {
  $('#png-size').textContent = sizeLabel();
}

export function initPngExport() {
  const modal = $('#png-modal');

  $('#btn-png').addEventListener('click', () => {
    modal.hidden = false;
    $('#png-status').textContent = '';
    refresh();
  });
  $('#png-close').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
  });

  $('#png-scale').addEventListener('change', (e) => {
    settings.scale = parseInt(e.target.value, 10) || 1;
    refresh();
  });
  $('#png-transparent').addEventListener('change', (e) => {
    settings.transparent = e.target.checked;
  });

  $('#png-download').addEventListener('click', async () => {
    const btn = $('#png-download');
    const status = $('#png-status');
    btn.disabled = true;
    status.textContent = 'Rendering…';
    try {
      const { canvas, missing, w, h } = await buildCanvas(settings);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed.'))), 'image/png');
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(store.get().name)}${settings.transparent ? '-transparent' : ''}@${settings.scale}x.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = missing
        ? `Saved ${w} × ${h}. ${missing} hosted image${missing === 1 ? '' : 's'} could not be read across origins and ${missing === 1 ? 'was' : 'were'} left out — upload ${missing === 1 ? 'it' : 'them'} in the inspector instead so ${missing === 1 ? 'it is' : 'they are'} inlined.`
        : `Saved ${w} × ${h}.`;
    } catch (err) {
      status.textContent = `Could not export: ${err.message}`;
    } finally {
      btn.disabled = false;
    }
  });
}
