// Builder UI: the left panel (screens + messages) and the right inspector.

import { store, makePhone, makeMessage, uid } from './state.js';

export const selection = { phoneId: null, messageId: null };

const openGroups = new Set(['group-message', 'group-screen', 'group-wheel', 'group-offstage']);

const $ = (sel, root = document) => root.querySelector(sel);

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const child of children) if (child) node.appendChild(child);
  return node;
};

// Accessors — every field reads and writes through one of these.
const pathAcc = (path) => ({ get: () => store.getPath(path), set: (v) => store.setPath(path, v) });
// For controls that decide which *other* fields exist: 'structure' rebuilds
// the inspector, so the fields they gate appear straight away.
const gateAcc = (obj, key) => objAcc(obj, key, 'structure');
const objAcc = (obj, key, kind = 'prop') => ({
  get: () => obj[key],
  set: (v) => { obj[key] = v; store.emit(kind); },
});

function ensureSelection() {
  const project = store.get();
  if (!store.findPhone(selection.phoneId)) {
    selection.phoneId = project.phones[0]?.id ?? null;
    selection.messageId = null;
  }
  if (selection.messageId && !store.findMessage(selection.phoneId, selection.messageId)) {
    selection.messageId = null;
  }
}

const selectedPhone = () => store.findPhone(selection.phoneId) || store.get().phones[0];
const selectedMessage = () => store.findMessage(selection.phoneId, selection.messageId);

// ---------------------------------------------------------------------------
// Field helpers

function field(labelText, inputEl, hint) {
  return el('div', { class: 'field' }, [
    labelText ? el('label', { text: labelText }) : null,
    inputEl,
    hint ? el('p', { class: 'hint', text: hint }) : null,
  ]);
}

function textField(label, acc, { textarea = false, mono = false, placeholder = '', hint = '' } = {}) {
  const input = el(textarea ? 'textarea' : 'input', {
    placeholder,
    oninput: (e) => acc.set(e.target.value),
  });
  if (!textarea) input.type = 'text';
  input.value = acc.get() ?? '';
  if (mono) input.style.fontFamily = 'monospace';
  return field(label, input, hint);
}

function numberField(label, acc, { min = 0, max = 9999, step = 1 } = {}) {
  const input = el('input', {
    type: 'number', min, max, step,
    oninput: (e) => acc.set(parseFloat(e.target.value) || 0),
  });
  input.value = acc.get() ?? 0;
  return field(label, input);
}

function rangeField(label, acc, { min = 0, max = 1, step = 0.01, unit = '' } = {}) {
  const valueEl = el('span', { class: 'range-value', text: `${acc.get()}${unit}` });
  const input = el('input', {
    type: 'range', min, max, step,
    oninput: (e) => {
      const v = parseFloat(e.target.value);
      acc.set(v);
      valueEl.textContent = `${v}${unit}`;
    },
  });
  input.value = acc.get() ?? 0;
  return field(label, el('div', { class: 'range-row' }, [input, valueEl]));
}

function colorField(label, acc) {
  const swatch = el('input', { type: 'color', oninput: (e) => { acc.set(e.target.value); text.value = e.target.value; } });
  swatch.value = acc.get() || '#000000';
  const text = el('input', { type: 'text', oninput: (e) => { acc.set(e.target.value); swatch.value = e.target.value; } });
  text.value = acc.get() || '';
  text.style.fontFamily = 'monospace';
  return field(label, el('div', { class: 'color-row' }, [swatch, text]));
}

function selectField(label, acc, options) {
  const sel = el('select', { onchange: (e) => acc.set(e.target.value) });
  for (const [value, text] of options) sel.appendChild(el('option', { value, text }));
  sel.value = acc.get();
  return field(label, sel);
}

function checkField(label, acc) {
  const input = el('input', { type: 'checkbox', onchange: (e) => acc.set(e.target.checked) });
  input.checked = !!acc.get();
  const id = uid('chk');
  input.id = id;
  return el('div', { class: 'field-inline' }, [input, el('label', { for: id, text: label })]);
}

// Image source: paste a URL, or upload a file (inlined as a data URI so the
// export stays self-contained). Large files should stay hosted.
function imageField(label, acc, { maxMB = 2 } = {}) {
  const input = el('input', { type: 'text', placeholder: 'https://… or upload', oninput: (e) => acc.set(e.target.value) });
  input.value = acc.get() ?? '';
  input.style.fontFamily = 'monospace';
  const file = el('input', { type: 'file', accept: 'image/*' });
  file.hidden = true;
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    file.value = '';
    if (!f) return;
    if (f.size > maxMB * 1024 * 1024) {
      alert(`That file is over ${maxMB} MB. Uploads are inlined into the export as base64, which would make it huge — host large files and paste the URL instead.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { input.value = reader.result; acc.set(reader.result); };
    reader.readAsDataURL(f);
  });
  const upload = el('button', { class: 'btn subtle', text: 'Upload', onclick: () => file.click() });
  const clear = el('button', { class: 'btn ghost', text: '✕', title: 'Clear', onclick: () => { input.value = ''; acc.set(''); } });
  return field(label, el('div', {}, [input, el('div', { class: 'row gap' }, [upload, clear]), file]));
}

function row(children) {
  return el('div', { class: 'field-row' }, children);
}

function group(key, title, children, { open = false } = {}) {
  const details = el('details', { class: 'group' });
  details.open = openGroups.has(key) || open;
  details.addEventListener('toggle', () => {
    if (details.open) openGroups.add(key);
    else openGroups.delete(key);
  });
  details.appendChild(el('summary', { text: title }));
  const body = el('div', { class: 'group-body' }, children.filter(Boolean));
  details.appendChild(body);
  return details;
}

// ---------------------------------------------------------------------------
// Left panel — screens and their messages

function listRow({ label, sub, selected, onSelect, onUp, onDown, onDupe, onDelete, canDelete = true }) {
  return el('div', { class: `list-row${selected ? ' selected' : ''}`, onclick: onSelect }, [
    el('div', { class: 'list-row-main' }, [
      el('span', { class: 'list-row-label', text: label }),
      sub ? el('span', { class: 'list-row-sub', text: sub }) : null,
    ]),
    el('div', { class: 'list-row-actions' }, [
      onUp ? el('button', { class: 'icon-btn', title: 'Move up', text: '↑', onclick: (e) => { e.stopPropagation(); onUp(); } }) : null,
      onDown ? el('button', { class: 'icon-btn', title: 'Move down', text: '↓', onclick: (e) => { e.stopPropagation(); onDown(); } }) : null,
      onDupe ? el('button', { class: 'icon-btn', title: 'Duplicate', text: '⧉', onclick: (e) => { e.stopPropagation(); onDupe(); } }) : null,
      onDelete ? el('button', { class: 'icon-btn danger', title: canDelete ? 'Delete' : 'Keep at least one', text: '✕', disabled: !canDelete, onclick: (e) => { e.stopPropagation(); if (canDelete) onDelete(); } }) : null,
    ]),
  ]);
}

function move(arr, from, to) {
  if (to < 0 || to >= arr.length) return;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  store.emit('structure');
}

const cloneWithIds = (phone) => {
  const copy = JSON.parse(JSON.stringify(phone));
  copy.id = uid('p');
  copy.label = `${phone.label} copy`;
  copy.screen.messages.forEach((m) => { m.id = uid('m'); });
  return copy;
};

function renderPhoneList() {
  const host = $('#phone-list');
  host.innerHTML = '';
  const phones = store.get().phones;
  phones.forEach((phone, i) => {
    host.appendChild(listRow({
      label: phone.label || `Screen ${i + 1}`,
      sub: `${phone.screen.messages.length} message${phone.screen.messages.length === 1 ? '' : 's'}`,
      selected: phone.id === selection.phoneId,
      onSelect: () => {
        selection.phoneId = phone.id;
        selection.messageId = null;
        rerender();
        document.dispatchEvent(new CustomEvent('wp:phone-selected', { detail: { index: i } }));
      },
      onUp: i > 0 ? () => move(phones, i, i - 1) : null,
      onDown: i < phones.length - 1 ? () => move(phones, i, i + 1) : null,
      onDupe: () => {
        phones.splice(i + 1, 0, cloneWithIds(phone));
        selection.phoneId = phones[i + 1].id;
        store.emit('structure');
      },
      onDelete: () => {
        phones.splice(i, 1);
        if (selection.phoneId === phone.id) selection.phoneId = phones[0]?.id ?? null;
        store.emit('structure');
      },
      canDelete: phones.length > 1,
    }));
  });
}

function messageSummary(m) {
  if (m.kind === 'divider') return `— ${m.text || 'Divider'} —`;
  if (m.kind === 'system') return m.text || 'System notice';
  const text = String(m.text || '').replace(/\*\*/g, '').split('\n')[0];
  return m.name ? `${m.name}: ${text}` : text;
}

function renderMessageList() {
  const phone = selectedPhone();
  $('#messages-phone-label').textContent = phone ? `· ${phone.label}` : '';
  const host = $('#message-list');
  host.innerHTML = '';
  if (!phone) return;
  const items = phone.screen.messages;
  items.forEach((m, i) => {
    host.appendChild(listRow({
      label: messageSummary(m),
      sub: m.kind === 'message' ? m.time : m.kind,
      selected: m.id === selection.messageId,
      onSelect: () => { selection.messageId = m.id; rerender(); },
      onUp: i > 0 ? () => move(items, i, i - 1) : null,
      onDown: i < items.length - 1 ? () => move(items, i, i + 1) : null,
      onDupe: () => {
        const copy = JSON.parse(JSON.stringify(m));
        copy.id = uid('m');
        items.splice(i + 1, 0, copy);
        selection.messageId = copy.id;
        store.emit('structure');
      },
      onDelete: () => {
        items.splice(i, 1);
        if (selection.messageId === m.id) selection.messageId = null;
        store.emit('structure');
      },
    }));
  });
}

// ---------------------------------------------------------------------------
// Inspector

function messageGroup() {
  const m = selectedMessage();
  if (!m) return null;
  const acc = (key) => objAcc(m, key);
  const structAcc = (key) => objAcc(m, key, 'structure');

  if (m.kind === 'divider') {
    return group('group-message', 'Divider', [
      textField('Label', structAcc('text'), { placeholder: 'Today' }),
      checkField('Show the red NEW marker', acc('unread')),
    ], { open: true });
  }

  if (m.kind === 'system') {
    return group('group-message', 'System notice', [
      textField('Title', structAcc('text'), { placeholder: 'A huddle happened' }),
      textField('Detail', acc('sub'), { textarea: true }),
      selectField('Icon', acc('icon'), [['headphones', 'Headphones'], ['thread', 'Thread'], ['plus', 'Plus'], ['play', 'Play']]),
    ], { open: true });
  }

  return group('group-message', 'Message', [
    row([
      textField('Name', structAcc('name'), { placeholder: 'Carmen' }),
      textField('Time', acc('time'), { placeholder: '9:41 AM' }),
    ]),
    textField('Text', structAcc('text'), {
      textarea: true,
      hint: 'Markup: **bold**, @mention, and line breaks.',
    }),
    row([
      selectField('Badge', acc('badge'), [['', 'None'], ['APP', 'APP'], ['WORKFLOW', 'WORKFLOW'], ['BOT', 'BOT']]),
      textField('Avatar emoji', acc('avatar'), { placeholder: '🐻 or a URL' }),
    ]),
    colorField('Avatar color', acc('avatarColor')),
    imageField('Attached image', acc('image')),
    row([
      numberField('Thread replies', acc('replies'), { min: 0, max: 999 }),
      textField('Reactions', acc('reactions'), { placeholder: '👀 7, 🎉 35' }),
    ]),
    row([
      textField('Card title', acc('cardTitle'), { placeholder: 'Canvas name' }),
      textField('Card subtitle', acc('cardSub'), { placeholder: 'Canvas' }),
    ]),
  ], { open: true });
}

function screenGroup() {
  const phone = selectedPhone();
  if (!phone) return null;
  const s = phone.screen;
  const acc = (key) => objAcc(s, key);
  const head = (key) => objAcc(s.header, key);
  const cta = (key) => objAcc(s.cta, key);
  const composer = (key) => objAcc(s.composer, key);
  const gateIn = gateAcc;

  const offMode = store.get().carousel.offstage.mode === 'image';
  const still = (key) => objAcc(phone.offstage, key);

  return group('group-screen', `Screen · ${phone.label}`, [
    textField('Screen name (builder + aria label)', objAcc(phone, 'label', 'structure')),
    el('h4', { class: 'sub-head', text: 'Off-stage card' }),
    imageField(offMode ? 'Image shown when this phone spins away' : 'Image for when off-stage cards are on', still('src')),
    offMode ? textField('Alt text', still('alt'), { placeholder: phone.label }) : null,
    offMode ? row([
      numberField('Nudge Y (px)', still('y'), { min: -400, max: 400, step: 2 }),
      rangeField('Size', still('scale'), { min: 0.3, max: 2, step: 0.02, unit: '×' }),
    ]) : null,
    !offMode ? el('p', { class: 'hint', text: 'Turn on Off-stage cards below to use it.' }) : null,
    el('h4', { class: 'sub-head', text: 'Screen' }),
    row([
      selectField('Theme', acc('theme'), [['light', 'Light'], ['dark', 'Dark']]),
      colorField('Screen bg', acc('bg')),
    ]),
    row([
      colorField('Tint top', acc('tintFrom')),
      colorField('Tint bottom', acc('tintTo')),
    ]),
    rangeField('Tint strength', acc('tintOpacity'), { min: 0, max: 1, step: 0.05 }),
    numberField('Feed nudge (px — negative crops more off the top)', acc('offset'), { min: -2000, max: 500, step: 10 }),
    el('h4', { class: 'sub-head', text: 'Header' }),
    row([
      selectField('Icon', head('icon'), [['hash', '# channel'], ['lock', '🔒 private'], ['none', 'None']]),
      textField('Title', head('title')),
    ]),
    textField('Meta line', head('meta'), { placeholder: '832 members • 4 tabs' }),
    row([checkField('Back chevron', head('back')), checkField('Huddle button', head('headphones'))]),
    el('h4', { class: 'sub-head', text: 'Bottom bar' }),
    checkField('Call-to-action button (replaces the composer)', gateIn(s.cta, 'enabled')),
    s.cta.enabled ? textField('Button label', cta('label')) : null,
    s.cta.enabled ? row([colorField('Button color', cta('color')), colorField('Label color', cta('textColor'))]) : null,
    s.cta.enabled ? row([
      selectField('Button icon', cta('icon'), [['play', 'Play'], ['plus', 'Plus'], ['thread', 'Thread'], ['none', 'None']]),
      checkField('Compose circle', cta('compose')),
    ]) : null,
    !s.cta.enabled ? checkField('Show composer', gateIn(s.composer, 'enabled')) : null,
    !s.cta.enabled && s.composer.enabled ? textField('Composer placeholder', composer('text')) : null,
    !s.cta.enabled && s.composer.enabled ? checkField('Mic icon', composer('mic')) : null,
  ], { open: true });
}

function wheelGroup() {
  const c = store.get().carousel;
  const acc = (key) => objAcc(c, key);
  const gate = (key) => gateAcc(c, key);
  return group('group-wheel', 'Wheel', [
    selectField('3D engine', acc('renderer'), [
      ['three', 'three.js scene (WebGL camera + CSS3D)'],
      ['css', 'CSS 3D transforms (lightest)'],
    ]),
    selectField('Phones face', acc('facing'), [['billboard', 'The viewer (flat lineup)'], ['ring', 'Outward (true 3D ring)']]),
    row([
      numberField('Radius (px)', acc('radius'), { min: 80, max: 1200, step: 10 }),
      numberField('Perspective (px)', acc('perspective'), { min: 300, max: 5000, step: 50 }),
    ]),
    row([
      rangeField('Spread across', acc('spreadX'), { min: 0.1, max: 3, step: 0.05, unit: '\u00d7' }),
      rangeField('Spread back', acc('spreadZ'), { min: 0.1, max: 3, step: 0.05, unit: '\u00d7' }),
    ]),
    el('p', { class: 'hint', text: 'Radius sets the ring; these stretch it into an ellipse. Push \u201cSpread across\u201d up to pull the phones apart sideways without sending them further back \u2014 and \u201cSpread back\u201d down to flatten the whole wheel towards a lineup.' }),
    row([
      numberField('Ring tilt (deg)', acc('tilt'), { min: -45, max: 45 }),
      numberField('Back phones drop (px)', acc('yArc'), { min: -200, max: 200, step: 2 }),
    ]),
    row([
      rangeField('Back scale', acc('minScale'), { min: 0.3, max: 1, step: 0.02 }),
      rangeField('Back opacity', acc('minOpacity'), { min: 0, max: 1, step: 0.02 }),
    ]),
    row([
      numberField('Back blur (px)', acc('maxBlur'), { min: 0, max: 20, step: 0.5 }),
      numberField('Front lift (px)', acc('frontLift'), { min: -100, max: 100, step: 2 }),
    ]),
    el('h4', { class: 'sub-head', text: 'Grab & spin' }),
    checkField('Draggable', acc('drag')),
    checkField('Throw with inertia', acc('inertia')),
    checkField('Snap to the nearest phone', acc('snap')),
    numberField('Drag distance per phone (px)', acc('dragStepPx'), { min: 40, max: 800, step: 10 }),
    row([checkField('Mouse wheel', acc('wheel')), checkField('Arrow keys', acc('keyboard'))]),
    row([checkField('Click a phone to bring it forward', acc('clickToFront'))]),
    row([checkField('Arrow buttons', acc('arrows')), checkField('Dots', acc('dots'))]),
    el('h4', { class: 'sub-head', text: 'Motion' }),
    row([
      rangeField('Move duration', acc('duration'), { min: 0.1, max: 3, step: 0.05, unit: 's' }),
      selectField('Ease', acc('ease'), [
        ['power3.out', 'power3.out'], ['power2.out', 'power2.out'], ['power4.out', 'power4.out'],
        ['back.out(1.4)', 'back.out'], ['elastic.out(1, 0.6)', 'elastic.out'], ['expo.out', 'expo.out'], ['none', 'none'],
      ]),
    ]),
    row([
      selectField('Entrance', acc('entrance'), [['spin', 'Spin in'], ['rise', 'Rise + pop'], ['fade', 'Fade'], ['none', 'None']]),
      rangeField('Entrance time', acc('entranceDuration'), { min: 0.2, max: 4, step: 0.1, unit: 's' }),
    ]),
    checkField('Spin on its own until someone grabs it', gate('autoSpin')),
    c.autoSpin ? row([
      numberField('Speed (deg/sec)', acc('autoSpinSpeed'), { min: 1, max: 90 }),
      numberField('Resume after (s)', acc('autoResume'), { min: 0, max: 60 }),
    ]) : null,
  ]);
}

function offstageGroup() {
  const off = store.get().carousel.offstage;
  const acc = (key) => objAcc(off, key, 'structure');
  return group('group-offstage', 'Off-stage cards', [
    selectField('Phones that aren\u2019t out front show as', acc('mode'), [
      ['phone', 'The phone, all the way round'],
      ['image', 'An image card that cross-fades'],
    ]),
    off.mode === 'image' ? selectField('Transition', acc('style'), [
      ['fade', 'Cross-fade'],
      ['morph', 'Morph \u2014 the phone shrinks into the card'],
      ['flip', 'Flip \u2014 two sides of one card'],
      ['swap', 'Hard swap'],
    ]) : null,
    off.mode === 'image' ? row([
      numberField('Card width (px)', acc('width'), { min: 40, max: 600, step: 5 }),
      numberField('Aspect (h \u00f7 w)', acc('aspect'), { min: 0.4, max: 2.5, step: 0.05 }),
    ]) : null,
    off.mode === 'image' ? row([
      numberField('Corner radius', acc('radius'), { min: 0, max: 80 }),
      checkField('Card shadow', acc('shadow')),
    ]) : null,
    off.mode === 'image' ? rangeField('Card holds until', objAcc(off, 'from'), { min: 0, max: 0.9, step: 0.01 }) : null,
    off.mode === 'image' ? rangeField('Phone fully back by', objAcc(off, 'to'), { min: 0.1, max: 1, step: 0.01 }) : null,
    off.mode === 'image' ? el('p', { class: 'hint', text: 'Both are front-ness: 1 is dead centre, 0 is the far side of the wheel. Each screen sets its own image in the Screen section.' }) : null,
  ]);
}

function tiltGroup() {
  const c = store.get().carousel;
  const iso = (key) => objAcc(c.iso, key, 'structure');
  const ex = (key) => objAcc(c.extrude, key, 'structure');
  const isThree = c.renderer === 'three';
  return group('group-iso', 'Tilt & extrusion', [
    checkField('Isometric tilt on the devices off to the sides', iso('enabled')),
    c.iso.enabled ? row([
      numberField('Turn Y (deg)', iso('y'), { min: -80, max: 80 }),
      numberField('Pitch X (deg)', iso('x'), { min: -60, max: 60 }),
    ]) : null,
    c.iso.enabled ? row([
      numberField('Roll Z (deg)', iso('z'), { min: -45, max: 45 }),
      rangeField('Front keeps', iso('front'), { min: 0, max: 1, step: 0.05, unit: '\u00d7' }),
    ]) : null,
    c.iso.enabled ? checkField('Mirror the left side', iso('mirror')) : null,
    c.iso.enabled ? el('p', { class: 'hint', text: 'The tilt ramps in as a device leaves the front. \u201cFront keeps\u201d is how much of it the centre device holds on to \u2014 0 keeps it flat and readable.' }) : null,
    el('h4', { class: 'sub-head', text: 'Extrusion (WebGL)' }),
    isThree ? checkField('Give the devices real thickness', ex('enabled')) : null,
    isThree && c.extrude.enabled ? row([
      numberField('Depth (px)', ex('depth'), { min: 1, max: 200 }),
      rangeField('Front share', ex('frontDepth'), { min: 0, max: 1, step: 0.05, unit: '\u00d7' }),
    ]) : null,
    isThree && c.extrude.enabled ? row([
      colorField('Body', ex('color')),
      colorField('Shadow tint', ex('edge')),
    ]) : null,
    isThree && c.extrude.enabled ? rangeField('Opacity', ex('opacity'), { min: 0.1, max: 1, step: 0.05 }) : null,
    isThree && c.extrude.enabled ? el('p', { class: 'hint', text: 'Slabs render in WebGL behind the screens and share the 3D scene\u2019s camera, so the thickness only shows where a device is turned \u2014 pair it with the tilt above.' }) : null,
    !isThree ? el('p', { class: 'hint', text: 'Extrusion needs the three.js engine (Wheel \u2192 3D engine) \u2014 it shares that scene\u2019s camera.' }) : null,
  ]);
}

function webglGroup() {
  const w = store.get().stage.webgl;
  const acc = (key) => objAcc(w, key);
  const gate = (key) => gateAcc(w, key);
  return group('group-webgl', 'WebGL backdrop', [
    checkField('Animated shader backdrop', gate('enabled')),
    w.enabled ? selectField('Preset', acc('preset'), [['mesh', 'Mesh gradient'], ['aurora', 'Aurora bands']]) : null,
    w.enabled ? colorField('Base', acc('base')) : null,
    w.enabled ? row([colorField('Blob 1', acc('c1')), colorField('Blob 2', acc('c2'))]) : null,
    w.enabled ? row([colorField('Blob 3', acc('c3')), colorField('Blob 4', acc('c4'))]) : null,
    w.enabled ? row([
      rangeField('Drift speed', acc('speed'), { min: 0, max: 3, step: 0.05, unit: '×' }),
      rangeField('Grain', acc('grain'), { min: 0, max: 0.3, step: 0.01 }),
    ]) : null,
    w.enabled ? checkField('React to the spin', acc('reactive')) : null,
  ]);
}

function phoneFrameGroup() {
  const d = store.get().phone;
  const acc = (key) => objAcc(d, key);
  const gate = (key) => gateAcc(d, key);
  return group('group-frame', 'Phone frame', [
    row([
      numberField('Width (px)', acc('width'), { min: 120, max: 600, step: 5 }),
      numberField('Aspect (h ÷ w)', acc('aspect'), { min: 1.2, max: 3, step: 0.01 }),
    ]),
    row([
      numberField('Corner radius', acc('radius'), { min: 0, max: 90 }),
      numberField('Bezel width', acc('frameWidth'), { min: 0, max: 40 }),
    ]),
    colorField('Bezel color', acc('frameColor')),
    row([checkField('Dynamic island', acc('island')), checkField('Status bar', acc('statusBar'))]),
    textField('Status bar time', acc('time')),
    checkField('Drop shadow', gate('shadow')),
    d.shadow ? colorField('Shadow color', acc('shadowColor')) : null,
    d.shadow ? rangeField('Shadow strength', acc('shadowOpacity'), { min: 0, max: 1, step: 0.05 }) : null,
  ]);
}

function stageGroup() {
  const st = store.get().stage;
  const acc = (key) => objAcc(st, key);
  const gate = (key) => gateAcc(st, key);
  return group('group-stage', 'Stage', [
    selectField('Background', gate('bgType'), [
      ['gradient', 'Gradient'],
      ['color', 'Solid color'],
      ['image', 'Image'],
      ['none', 'None \u2014 transparent'],
    ]),
    st.bgType === 'none' && store.get().stage.webgl.enabled
      ? el('p', { class: 'hint', text: 'The WebGL backdrop is a separate layer and still paints behind the wheel \u2014 turn it off below for a fully transparent component.' })
      : null,
    st.bgType === 'none' && !store.get().stage.webgl.enabled
      ? el('p', { class: 'hint', text: 'Nothing is painted behind the wheel: the component takes whatever background the page it sits on has.' })
      : null,
    st.bgType === 'gradient' ? row([colorField('From', acc('gradFrom')), colorField('To', acc('gradTo'))]) : null,
    st.bgType === 'gradient' ? numberField('Gradient angle', acc('gradAngle'), { min: 0, max: 360, step: 5 }) : null,
    st.bgType !== 'gradient' ? colorField('Color', acc('bgColor')) : null,
    st.bgType === 'image' ? imageField('Background image', acc('bgImage')) : null,
    row([
      numberField('Stage height (px)', acc('height'), { min: 200, max: 1600, step: 10 }),
      numberField('Vertical padding', acc('padY'), { min: 0, max: 200, step: 4 }),
    ]),
    row([
      numberField('Max width (px)', acc('maxWidth'), { min: 320, max: 2400, step: 20 }),
      numberField('Mobile breakpoint', acc('mobilePx'), { min: 320, max: 1400, step: 10 }),
    ]),
  ]);
}

function themeGroup() {
  const t = store.get().theme;
  const acc = (key) => objAcc(t, key);
  return group('group-theme', 'Theme', [
    textField('Font stack', acc('fontFamily'), { mono: true }),
    checkField('Load Lato from Google Fonts (Slack’s face)', acc('loadLato')),
    row([colorField('Accent', acc('accent')), colorField('Link / mention', acc('linkColor'))]),
  ]);
}

function renderInspector() {
  const host = $('#inspector');
  host.innerHTML = '';
  const groups = [messageGroup(), screenGroup(), wheelGroup(), offstageGroup(), tiltGroup(), phoneFrameGroup(), stageGroup(), webglGroup(), themeGroup()];
  for (const g of groups) if (g) host.appendChild(g);
}

// ---------------------------------------------------------------------------

export function rerender() {
  ensureSelection();
  renderPhoneList();
  renderMessageList();
  renderInspector();
}

// Value-only edits don't need the inspector rebuilt — just the summaries.
export function refreshSummaries() {
  renderPhoneList();
  renderMessageList();
}

export function initUI() {
  $('#btn-add-phone').addEventListener('click', () => {
    const phones = store.get().phones;
    const phone = makePhone(`Screen ${phones.length + 1}`);
    phones.push(phone);
    selection.phoneId = phone.id;
    selection.messageId = null;
    store.emit('structure');
  });

  document.querySelectorAll('[data-add-message]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const phone = selectedPhone();
      if (!phone) return;
      const m = makeMessage(btn.getAttribute('data-add-message'));
      phone.screen.messages.push(m);
      selection.messageId = m.id;
      store.emit('structure');
    });
  });
}
