// Bootstraps the builder: preview iframe, top bar, and state wiring.

import { store } from './state.js';
import { standaloneDoc, slugify } from './generator.js';
import { initUI, rerender, refreshSummaries, selection } from './ui.js';
import { initExport, downloadText } from './export.js';
import { initPngExport } from './png.js';

const $ = (sel) => document.querySelector(sel);

let previewBg = '#101014';
let previewAnims = true;
let debounceTimer = null;

function selectedPhoneIndex() {
  const idx = store.get().phones.findIndex((p) => p.id === selection.phoneId);
  return idx < 0 ? 0 : idx;
}

function updatePreview() {
  $('#preview').srcdoc = standaloneDoc(store.get(), {
    preview: true,
    bodyBg: previewBg,
    disableAnims: !previewAnims,
    activePhone: selectedPhoneIndex(),
  });
}

function schedulePreview() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updatePreview, 300);
}

function initTopbar() {
  const nameInput = $('#project-name');
  nameInput.value = store.get().name;
  nameInput.addEventListener('input', (e) => {
    store.get().name = e.target.value;
    store.emit('prop');
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Reset to the demo project? Your current work will be replaced (save it as JSON first if you want to keep it).')) return;
    store.reset();
    nameInput.value = store.get().name;
  });

  $('#btn-save-json').addEventListener('click', () => {
    downloadText(`${slugify(store.get().name)}.wheelie.json`, JSON.stringify(store.get(), null, 2), 'application/json');
  });

  $('#btn-import').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.phones)) throw new Error('Not a Wheelie Phone project file.');
      store.replace(parsed);
      nameInput.value = store.get().name;
    } catch (err) {
      alert(`Could not import that file: ${err.message}`);
    }
    e.target.value = '';
  });
}

function initStage() {
  $('#stage-width').addEventListener('change', (e) => {
    $('#preview').style.maxWidth = e.target.value;
  });

  const bgPreset = $('#stage-bg-preset');
  const bgCustom = $('#stage-bg');
  bgPreset.addEventListener('change', () => {
    previewBg = bgPreset.value === 'custom' ? bgCustom.value : bgPreset.value;
    updatePreview();
  });
  bgCustom.addEventListener('input', () => {
    bgPreset.value = 'custom';
    previewBg = bgCustom.value;
    schedulePreview();
  });

  $('#toggle-anims').addEventListener('change', (e) => {
    previewAnims = e.target.checked;
    $('#btn-replay').disabled = !previewAnims;
    updatePreview();
  });

  $('#btn-replay').addEventListener('click', () => {
    $('#preview').contentWindow?.WheeliePhone?.replay();
  });

  $('#btn-spin-prev').addEventListener('click', () => $('#preview').contentWindow?.WheeliePhone?.prev());
  $('#btn-spin-next').addEventListener('click', () => $('#preview').contentWindow?.WheeliePhone?.next());

  // Presentation mode: chrome hidden, canvas full-bleed, Esc or the pill exits.
  const setPreviewMode = (on) => {
    document.body.classList.toggle('preview-mode', on);
    if (on) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      updatePreview(); // replay the entrance for the demo
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };
  $('#btn-preview').addEventListener('click', () => setPreviewMode(true));
  $('#preview-exit').addEventListener('click', () => setPreviewMode(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('preview-mode')) setPreviewMode(false);
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) document.body.classList.remove('preview-mode');
  });

  // Left panel → spin the canvas to that phone, without reloading the iframe.
  document.addEventListener('wp:phone-selected', (e) => {
    $('#preview').contentWindow?.WheeliePhone?.select(e.detail.index);
  });

  // Canvas → update the builder's selected phone, without reloading the iframe.
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'wp-escape') {
      document.body.classList.remove('preview-mode');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      return;
    }
    if (e.data?.type !== 'wp-phone-clicked') return;
    const phone = store.get().phones[e.data.index];
    if (!phone || phone.id === selection.phoneId) return;
    selection.phoneId = phone.id;
    selection.messageId = null;
    rerender();
  });
}

function boot() {
  initTopbar();
  initStage();
  initUI();
  initExport();
  initPngExport();

  store.subscribe((_project, kind) => {
    if (kind === 'structure') rerender();
    else refreshSummaries();
    schedulePreview();
  });

  rerender();
  updatePreview();
}

boot();
