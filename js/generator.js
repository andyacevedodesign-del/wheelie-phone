// Code generation. The preview iframe and the export run the *same* output,
// so what you see in the canvas is exactly what you paste into your page.

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function slugify(name) {
  const base = String(name || 'wheelie')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'wheelie';
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const num = (v, fallback = 0) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : fallback);

// Hex to the 0..1 vec3 the backdrop shader wants.
function hexToVec(hex) {
  const { r, g, b } = hexToRgb(hex);
  return [+(r / 255).toFixed(4), +(g / 255).toFixed(4), +(b / 255).toFixed(4)];
}

// ---------------------------------------------------------------------------
// Icons — inline SVG so an export needs no icon font or sprite sheet.

const ICONS = {
  hash: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M7.5 2 6.8 6H3v2h3.4l-.6 4H2v2h3.5L4.8 18h2l.7-4h4l-.7 4h2l.7-4H17v-2h-3.4l.6-4H18V6h-3.5l.7-4h-2l-.7 4h-4l.7-4h-2Zm.2 6h4l-.6 4h-4l.6-4Z"/></svg>',
  lock: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 1a4 4 0 0 0-4 4v2H5.5A1.5 1.5 0 0 0 4 8.5v8A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 7H14V5a4 4 0 0 0-4-4Zm0 2a2 2 0 0 1 2 2v2H8V5a2 2 0 0 1 2-2Z"/></svg>',
  back: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12.5 4 6.5 10l6 6"/></svg>',
  headphones: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3.5 12V9.5a6.5 6.5 0 0 1 13 0V12"/><rect x="2" y="11" width="4" height="6" rx="2" fill="currentColor"/><rect x="14" y="11" width="4" height="6" rx="2" fill="currentColor"/></svg>',
  mic: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7.5" y="2" width="5" height="10" rx="2.5" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v3"/></svg>',
  plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M10 4.5v11M4.5 10h11"/></svg>',
  compose: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M14.2 2.8a1.8 1.8 0 0 1 2.5 2.5L8.3 13.7l-3.3.8.8-3.3 8.4-8.4Z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M3 17h14"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" d="M6.5 4.5v11l9-5.5-9-5.5Z"/></svg>',
  thread: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M3 4h14v9H8l-5 4V4Z"/></svg>',
  cellular: '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>',
  wifi: '<svg viewBox="0 0 16 12" aria-hidden="true"><path fill="currentColor" d="M8 11.2 5.9 8.9a3 3 0 0 1 4.2 0L8 11.2Zm-4-4.3L2.6 5.4a7.6 7.6 0 0 1 10.8 0L12 6.9a5.6 5.6 0 0 0-8 0Zm-2.6-3L0 2.5a10.9 10.9 0 0 1 16 0l-1.4 1.4a8.9 8.9 0 0 0-13.2 0Z"/></svg>',
  battery: '<svg viewBox="0 0 26 12" aria-hidden="true"><rect x="0.6" y="0.6" width="21" height="10.8" rx="3" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/><rect x="2.2" y="2.2" width="17.8" height="7.6" rx="2" fill="currentColor"/><path d="M23.4 4.2c1 .3 1.6 1 1.6 1.8s-.6 1.5-1.6 1.8V4.2Z" fill="currentColor" fill-opacity=".45"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M15 5 8 12l7 7"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/></svg>',
};

const icon = (name, cls = '') => (ICONS[name] ? `<span class="wp-i ${cls}">${ICONS[name]}</span>` : '');

// ---------------------------------------------------------------------------
// Inline text markup: **bold**, @mentions, and line breaks.

function inlineText(text) {
  const lines = String(text ?? '').split('\n');
  return lines
    .map((line) => {
      let html = esc(line);
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/(^|[^\w@])@([A-Za-z0-9._-]+(?: [A-Z][A-Za-z0-9._-]*)?)/g, '$1<span class="wp-mention">@$2</span>');
      return html || '&nbsp;';
    })
    .join('<br>');
}

function avatarHtml(m) {
  const color = m.avatarColor || '#4a154b';
  const src = String(m.avatar || '').trim();
  if (src && /^(https?:|data:|\.|\/)/.test(src)) {
    return `<span class="wp-avatar" style="background-image:url(${esc(src)})"></span>`;
  }
  if (src) return `<span class="wp-avatar wp-avatar-emoji" style="background:${esc(color)}">${esc(src)}</span>`;
  const initial = String(m.name || '?').trim().charAt(0).toUpperCase();
  return `<span class="wp-avatar wp-avatar-initial" style="background:${esc(color)}">${esc(initial)}</span>`;
}

function reactionHtml(reactions) {
  const items = String(reactions || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!items.length) return '';
  const pills = items.map((r) => `<span class="wp-reaction">${esc(r)}</span>`).join('');
  return `<div class="wp-reactions">${pills}<span class="wp-reaction wp-reaction-add">☺</span></div>`;
}

function messageHtml(m) {
  if (m.kind === 'divider') {
    return `<div class="wp-divider${m.unread ? ' wp-divider-new' : ''}">
        <span class="wp-divider-label">${esc(m.text || '')}</span>
        ${m.unread ? '<span class="wp-divider-new-tag">NEW</span>' : ''}
      </div>`;
  }

  if (m.kind === 'system') {
    return `<div class="wp-sys">
        <span class="wp-sys-icon">${ICONS[m.icon] || ICONS.headphones}</span>
        <span class="wp-sys-body">
          <span class="wp-sys-title">${esc(m.text || '')}</span>
          ${m.sub ? `<span class="wp-sys-sub">${inlineText(m.sub)}</span>` : ''}
        </span>
      </div>`;
  }

  const badge = m.badge ? `<span class="wp-badge">${esc(m.badge)}</span>` : '';
  const time = m.time ? `<span class="wp-time-stamp">${esc(m.time)}</span>` : '';
  const head = m.name
    ? `<div class="wp-msg-head"><span class="wp-msg-name">${esc(m.name)}</span>${badge}${time}</div>`
    : '';
  const image = m.image
    ? `<img class="wp-msg-image" src="${esc(m.image)}" alt="${esc(m.name || 'Attachment')} attachment" loading="lazy">`
    : '';
  const card = m.cardTitle
    ? `<a class="wp-card" href="#" onclick="return false">
        <span class="wp-card-icon"></span>
        <span class="wp-card-body">
          <span class="wp-card-title">${esc(m.cardTitle)}</span>
          ${m.cardSub ? `<span class="wp-card-sub">${esc(m.cardSub)}</span>` : ''}
        </span>
      </a>`
    : '';
  const replies = num(m.replies) > 0
    ? `<div class="wp-replies">
        <span class="wp-reply-avatars">${avatarHtml(m)}</span>
        <span class="wp-reply-count">${num(m.replies)} ${num(m.replies) === 1 ? 'reply' : 'replies'}</span>
      </div>`
    : '';

  return `<div class="wp-msg${m.name ? '' : ' wp-msg-cont'}">
      <div class="wp-msg-avatar">${m.name ? avatarHtml(m) : ''}</div>
      <div class="wp-msg-body">
        ${head}
        <div class="wp-msg-text">${inlineText(m.text)}</div>
        ${image}
        ${card}
        ${replies}
        ${reactionHtml(m.reactions)}
      </div>
    </div>`;
}

function screenHtml(phone, project) {
  const s = phone.screen;
  const d = project.phone;
  const head = `<header class="wp-head">
      ${s.header.back ? `<button class="wp-head-back" type="button" aria-label="Back">${ICONS.back}</button>` : '<span class="wp-head-spacer"></span>'}
      <span class="wp-head-title">
        <span class="wp-head-name">${s.header.icon !== 'none' ? icon(s.header.icon, 'wp-head-icon') : ''}${esc(s.header.title || '')}</span>
        ${s.header.meta ? `<span class="wp-head-meta">${esc(s.header.meta)}</span>` : ''}
      </span>
      ${s.header.headphones ? `<button class="wp-head-huddle" type="button" aria-label="Start a huddle">${ICONS.headphones}</button>` : '<span class="wp-head-spacer"></span>'}
    </header>`;

  const foot = s.cta.enabled
    ? `<footer class="wp-foot wp-foot-cta">
        <button class="wp-cta" type="button" style="background:${esc(s.cta.color)};color:${esc(s.cta.textColor)}">
          ${s.cta.icon !== 'none' ? ICONS[s.cta.icon] || ICONS.play : ''}<span>${esc(s.cta.label)}</span>
        </button>
        ${s.cta.compose ? `<button class="wp-compose" type="button" aria-label="New message">${ICONS.compose}</button>` : ''}
      </footer>`
    : s.composer.enabled
      ? `<footer class="wp-foot wp-foot-composer">
          <div class="wp-composer">
            <span class="wp-composer-plus">${ICONS.plus}</span>
            <span class="wp-composer-text">${esc(s.composer.text || '')}</span>
            ${s.composer.mic ? `<span class="wp-composer-mic">${ICONS.mic}</span>` : ''}
          </div>
        </footer>`
      : '';

  const statusBar = d.statusBar
    ? `<div class="wp-statusbar">
        <span class="wp-statusbar-time">${esc(d.time)}</span>
        <span class="wp-statusbar-icons">${ICONS.cellular}${ICONS.wifi}${ICONS.battery}</span>
      </div>`
    : '';

  const tint = `<span class="wp-tint" style="background:linear-gradient(180deg, ${esc(s.tintFrom)} 0%, ${esc(s.tintTo)} 100%);opacity:${num(s.tintOpacity, 1)}"></span>`;
  const messages = s.messages.map(messageHtml).join('\n');

  return `<div class="wp-screen${s.theme === 'dark' ? ' wp-screen-dark' : ''}" style="background:${esc(s.bg)}">
      ${tint}
      <div class="wp-screen-content">
        ${statusBar}
        ${d.island ? '<span class="wp-island"></span>' : ''}
        ${head}
        <div class="wp-feed"><div class="wp-feed-inner" style="margin-top:${num(s.offset, 0)}px">${messages}</div></div>
        ${foot}
      </div>
    </div>`;
}

function phoneHtml(phone, index, project) {
  const off = project.carousel.offstage;
  const src = String(phone.offstage?.src || '').trim();
  // A phone only gets a card if the wheel is in image mode and it has one;
  // otherwise it stays a phone the whole way round.
  const still = off.mode === 'image' && src
    ? `<div class="wp-still" style="${stillStyle(phone, off)}">
          <img src="${esc(src)}" alt="${esc(phone.offstage.alt || phone.label)}" loading="lazy" draggable="false">
        </div>`
    : '';

  return `<article class="wp-phone" data-wp-index="${index}" aria-roledescription="slide" aria-label="${esc(phone.label)}">
      <div class="wp-phone-inner">
        <div class="wp-face">
          <div class="wp-device">${screenHtml(phone, project)}</div>
        </div>
        ${still}
      </div>
    </article>`;
}

// Per-card size and drift, so a row of cards doesn't read as a tidy grid.
function stillStyle(phone, off) {
  const w = Math.round(num(off.width, 150) * num(phone.offstage.scale, 1));
  const h = Math.round(w * num(off.aspect, 1));
  const y = num(phone.offstage.y, 0);
  return `width:${w}px;height:${h}px;margin:${Math.round(-h / 2 + y)}px 0 0 ${Math.round(-w / 2)}px;border-radius:${num(off.radius, 14)}px`;
}

export function componentHtml(project, opts = {}) {
  const id = opts.id || `wp-${slugify(project.name)}`;
  const c = project.carousel;
  const phones = project.phones.map((p, i) => phoneHtml(p, i, project)).join('\n');

  const dots = c.dots
    ? `<div class="wp-dots" role="tablist" aria-label="Choose a screen">${project.phones
        .map((p, i) => `<button class="wp-dot" type="button" role="tab" data-wp-goto="${i}" aria-label="${esc(p.label)}"><span></span></button>`)
        .join('')}</div>`
    : '';

  const arrows = c.arrows
    ? `<button class="wp-arrow wp-arrow-prev" type="button" aria-label="Previous screen">${ICONS.arrowLeft}</button>
       <button class="wp-arrow wp-arrow-next" type="button" aria-label="Next screen">${ICONS.arrowRight}</button>`
    : '';

  const gl = project.stage.webgl.enabled
    ? '<canvas class="wp-gl" aria-hidden="true"></canvas>'
    : '';

  const slabs = c.renderer === 'three' && c.extrude.enabled
    ? '<canvas class="wp-slabs" aria-hidden="true"></canvas>'
    : '';

  return `<div class="wheelie-phone${c.renderer === 'three' ? ' wp-three' : ''}" id="${id}">
  ${gl}
  <div class="wp-stage" tabindex="0" role="group" aria-roledescription="carousel" aria-label="${esc(project.name)}">
    ${slabs}
    <div class="wp-ring">
${phones}
    </div>
    <p class="wp-live" aria-live="polite"></p>
  </div>
  ${arrows}
  ${dots}
</div>`;
}

// ---------------------------------------------------------------------------
// CSS — everything is scoped under the component id so it can't leak.

export function componentCss(project, opts = {}) {
  const id = opts.id || `wp-${slugify(project.name)}`;
  const S = `#${id}`;
  const t = project.theme;
  const st = project.stage;
  const c = project.carousel;
  const d = project.phone;

  const frameW = num(d.frameWidth, 9);
  const outerW = num(d.width, 300);
  const outerH = Math.round(outerW * num(d.aspect, 2.06));
  const innerW = outerW - frameW * 2;
  const innerH = outerH - frameW * 2;
  const scale = innerW / 390; // screens are authored at a 390px logical width
  const logicalH = Math.round(innerH / scale);

  const stageBg =
    st.bgType === 'image' && st.bgImage
      ? `url("${st.bgImage}") center/cover no-repeat, ${st.bgColor}`
      : st.bgType === 'gradient'
        ? `linear-gradient(${num(st.gradAngle, 155)}deg, ${st.gradFrom}, ${st.gradTo})`
        : st.bgColor;

  const deviceShadow = d.shadow
    ? `box-shadow: 0 30px 70px -20px ${rgba(d.shadowColor, num(d.shadowOpacity, 0.35))}, 0 8px 24px ${rgba(d.shadowColor, num(d.shadowOpacity, 0.35) * 0.5)};`
    : '';

  return `${S} {
  --wp-accent: ${t.accent};
  --wp-link: ${t.linkColor};
  --wp-phone-w: ${outerW}px;
  --wp-phone-h: ${outerH}px;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  max-width: ${num(st.maxWidth, 1200)}px;
  margin: 0 auto;
  padding: ${num(st.padY, 40)}px 0;
  background: ${stageBg};
  font-family: ${t.fontFamily};
  overflow: hidden;
}
${S} *, ${S} *::before, ${S} *::after { box-sizing: border-box; }

${S} .wp-stage {
  position: relative;
  height: ${num(st.height, 760)}px;
  perspective: ${num(c.perspective, 1800)}px;
  perspective-origin: 50% 50%;
  outline: none;
  touch-action: pan-y;
  cursor: ${c.drag ? 'grab' : 'default'};
}
${S} .wp-stage.wp-grabbing { cursor: grabbing; }
${S} .wp-stage:focus-visible { outline: 2px solid ${rgba(t.accent, 0.9)}; outline-offset: 4px; border-radius: 16px; }

${S} .wp-gl {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
}
${S} .wp-stage, ${S} .wp-dots, ${S} .wp-arrow { position: relative; z-index: 1; }
${S} .wp-arrow { position: absolute; }

${S} .wp-ring {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateX(${num(c.tilt, 0)}deg);
}

/* three.js drives the phones instead: CSS3DRenderer owns their transforms. */
${S}.wp-three .wp-ring { display: none; }
${S} .wp-css3d { position: absolute; inset: 0; overflow: hidden; z-index: 1; }
/* The extrusion renders behind the DOM screens, so the slab shows only as a
   rim around each device — which is exactly what reads as thickness. */
${S} .wp-slabs { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
${S}.wp-three .wp-phone { top: auto; left: auto; margin: 0; }

${S} .wp-phone {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--wp-phone-w);
  height: var(--wp-phone-h);
  margin: calc(var(--wp-phone-h) / -2) 0 0 calc(var(--wp-phone-w) / -2);
  transform-style: preserve-3d;
  will-change: transform, opacity;
}
${S} .wp-phone-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
${S} .wp-face { width: 100%; height: 100%; transform-origin: 50% 50%; ${c.offstage.style === 'flip' ? 'backface-visibility: hidden;' : ''} }

/* The off-stage card: a flat still that cross-fades with the phone. */
${S} .wp-still {
  position: absolute;
  top: 50%;
  left: 50%;
  overflow: hidden;
  background: ${rgba(t.accent, 0.25)};
  ${c.offstage.shadow ? `box-shadow: 0 18px 40px -12px ${rgba(d.shadowColor, 0.45)};` : ''}
  pointer-events: none;
}
${S} .wp-still img { display: block; width: 100%; height: 100%; object-fit: cover; }
${S} .wp-still { transform-origin: 50% 50%; ${c.offstage.style === 'flip' ? 'backface-visibility: hidden;' : ''} }
${S} .wp-phone.is-front { cursor: default; }
${S} .wp-phone:not(.is-front) { cursor: ${c.clickToFront ? 'pointer' : 'default'}; }

${S} .wp-device {
  position: relative;
  width: 100%;
  height: 100%;
  padding: ${frameW}px;
  background: ${d.frameColor};
  border-radius: ${num(d.radius, 46)}px;
  ${deviceShadow}
}

${S} .wp-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: ${Math.max(num(d.radius, 46) - frameW, 6)}px;
  overflow: hidden;
  isolation: isolate;
}
${S} .wp-tint { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

/* The screen is authored at 390px wide (iPhone logical width) and scaled to
   fit the frame, so every type size below is a real mobile type size. */
${S} .wp-screen-content {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 390px;
  height: ${logicalH}px;
  transform: scale(${scale.toFixed(4)});
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  color: #1d1c1d;
  font-size: 15px;
  line-height: 1.34;
}

${S} .wp-i { display: inline-flex; }
${S} .wp-i svg, ${S} .wp-screen-content svg { width: 1em; height: 1em; display: block; }

/* ---- Status bar ---- */
${S} .wp-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 26px 6px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  flex: none;
}
${S} .wp-statusbar-icons { display: inline-flex; align-items: center; gap: 5px; }
${S} .wp-statusbar-icons svg { width: auto; height: 11px; }
${S} .wp-island {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 118px;
  height: 34px;
  border-radius: 999px;
  background: #000;
  z-index: 3;
}

/* ---- Channel header ---- */
${S} .wp-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 12px;
  flex: none;
}
${S} .wp-head-back, ${S} .wp-head-huddle {
  border: 0;
  background: transparent;
  color: #1d1c1d;
  font-size: 20px;
  padding: 0;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
${S} .wp-head-huddle { font-size: 22px; }
${S} .wp-head-spacer { width: 24px; flex: none; }
${S} .wp-head-title { flex: 1; min-width: 0; text-align: center; display: block; }
${S} .wp-head-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-weight: 900;
  font-size: 16px;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
${S} .wp-head-icon { font-size: 15px; opacity: 0.9; }
${S} .wp-head-meta { display: block; font-size: 12px; color: #616061; margin-top: 1px; }

/* ---- Feed ---- */
/* A chat sits on the bottom: the newest message is above the composer and
   older ones run off the top, exactly like a real screenshot. */
${S} .wp-feed { flex: 1; min-height: 0; overflow: hidden; padding: 0 16px; position: relative; display: flex; flex-direction: column; justify-content: flex-end; }
${S} .wp-feed-inner { display: flex; flex-direction: column; gap: 16px; }

${S} .wp-msg { display: grid; grid-template-columns: 36px 1fr; gap: 9px; align-items: start; }
${S} .wp-msg-cont { gap: 9px; }
${S} .wp-msg-avatar { width: 36px; }
${S} .wp-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background-size: cover;
  background-position: center;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  overflow: hidden;
}
${S} .wp-msg-head { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-bottom: 1px; }
${S} .wp-msg-name { font-weight: 900; font-size: 15px; letter-spacing: -0.01em; }
${S} .wp-badge {
  background: #e8e8e8;
  color: #616061;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 1px 4px;
  text-transform: uppercase;
}
${S} .wp-time-stamp { color: #616061; font-size: 12px; }
${S} .wp-msg-text { font-size: 15px; line-height: 1.38; overflow-wrap: anywhere; }
${S} .wp-msg-text strong { font-weight: 900; }
${S} .wp-mention { color: var(--wp-link); background: ${rgba(t.linkColor, 0.1)}; border-radius: 3px; padding: 0 2px; font-weight: 700; }
${S} .wp-msg-image { display: block; width: 100%; border-radius: 10px; margin-top: 8px; border: 1px solid rgba(0,0,0,.09); }

${S} .wp-card {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid rgba(0,0,0,.14);
  border-radius: 10px;
  background: rgba(255,255,255,.75);
  text-decoration: none;
  color: inherit;
}
${S} .wp-card-icon { width: 26px; height: 26px; border-radius: 6px; background: var(--wp-link); flex: none; }
${S} .wp-card-title { display: block; font-weight: 800; font-size: 13px; color: var(--wp-link); }
${S} .wp-card-sub { display: block; font-size: 11px; color: #616061; }

${S} .wp-replies { display: flex; align-items: center; gap: 7px; margin-top: 7px; }
${S} .wp-reply-avatars .wp-avatar { width: 22px; height: 22px; border-radius: 6px; font-size: 11px; }
${S} .wp-reply-count { color: var(--wp-link); font-size: 13px; font-weight: 800; }

${S} .wp-reactions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
${S} .wp-reaction {
  border: 1px solid rgba(0,0,0,.14);
  background: rgba(255,255,255,.7);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  color: #1d1c1d;
}
${S} .wp-reaction-add { color: #616061; }

${S} .wp-divider { display: flex; align-items: center; gap: 8px; }
${S} .wp-divider::before, ${S} .wp-divider::after { content: ""; height: 1px; background: rgba(0,0,0,.12); flex: 1; }
${S} .wp-divider-label { font-size: 12px; font-weight: 800; color: #616061; }
${S} .wp-divider-new::before, ${S} .wp-divider-new::after { background: rgba(224,30,90,.4); }
${S} .wp-divider-new .wp-divider-label { color: #1d1c1d; }
${S} .wp-divider-new-tag { color: #e01e5a; font-size: 11px; font-weight: 900; letter-spacing: .04em; }

${S} .wp-sys { display: grid; grid-template-columns: 36px 1fr; gap: 9px; align-items: start; color: #616061; }
${S} .wp-sys-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9px; background: rgba(0,0,0,.06); font-size: 18px; }
${S} .wp-sys-title { display: block; font-weight: 800; font-size: 14px; color: #1d1c1d; }
${S} .wp-sys-sub { display: block; font-size: 13px; }

/* ---- Footer: call to action or composer ---- */
${S} .wp-foot { flex: none; padding: 10px 14px 20px; display: flex; align-items: center; gap: 10px; }
${S} .wp-cta {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}
${S} .wp-cta svg { width: 17px; height: 17px; }
${S} .wp-compose {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,.18);
  background: rgba(255,255,255,.8);
  color: #1d1c1d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
}
${S} .wp-composer {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #616061;
  font-size: 15px;
  padding: 4px 2px;
}
${S} .wp-composer-plus { font-size: 20px; }
${S} .wp-composer-text { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
${S} .wp-composer-mic { font-size: 18px; }

/* ---- Dark screens ---- */
${S} .wp-screen-dark .wp-screen-content { color: #e8e8e8; }
${S} .wp-screen-dark .wp-head-back, ${S} .wp-screen-dark .wp-head-huddle, ${S} .wp-screen-dark .wp-sys-title { color: #e8e8e8; }
${S} .wp-screen-dark .wp-head-meta, ${S} .wp-screen-dark .wp-time-stamp, ${S} .wp-screen-dark .wp-sys, ${S} .wp-screen-dark .wp-composer { color: #a8a5a8; }
${S} .wp-screen-dark .wp-badge { background: rgba(255,255,255,.14); color: #d8d5d8; }
${S} .wp-screen-dark .wp-msg-image, ${S} .wp-screen-dark .wp-card, ${S} .wp-screen-dark .wp-reaction { border-color: rgba(255,255,255,.18); }
${S} .wp-screen-dark .wp-card, ${S} .wp-screen-dark .wp-reaction { background: rgba(255,255,255,.08); color: #e8e8e8; }
${S} .wp-screen-dark .wp-divider::before, ${S} .wp-screen-dark .wp-divider::after { background: rgba(255,255,255,.18); }
${S} .wp-screen-dark .wp-sys-icon { background: rgba(255,255,255,.1); }
${S} .wp-screen-dark .wp-compose { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.2); color: #e8e8e8; }

/* ---- Controls ---- */
${S} .wp-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.35);
  background: rgba(0,0,0,.22);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  transition: background .2s ease, transform .2s ease;
}
${S} .wp-arrow:hover { background: rgba(0,0,0,.4); }
${S} .wp-arrow:active { transform: translateY(-50%) scale(.94); }
${S} .wp-arrow svg { width: 22px; height: 22px; }
${S} .wp-arrow-prev { left: 18px; }
${S} .wp-arrow-next { right: 18px; }

${S} .wp-dots { display: flex; justify-content: center; gap: 9px; margin-top: 18px; }
${S} .wp-dot { border: 0; background: transparent; padding: 6px; cursor: pointer; line-height: 0; }
${S} .wp-dot span {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.45);
  transition: width .3s ease, background .3s ease;
}
${S} .wp-dot[aria-selected="true"] span { width: 26px; background: #fff; }

${S} .wp-live {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  margin: 0;
}

@media (max-width: ${num(st.mobilePx, 640)}px) {
  ${S} .wp-stage { height: ${Math.round(num(st.height, 760) * 0.78)}px; }
  ${S} .wp-arrow { width: 38px; height: 38px; }
  ${S} .wp-arrow-prev { left: 8px; }
  ${S} .wp-arrow-next { right: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  ${S} .wp-phone { transition: none !important; }
}`;
}

// ---------------------------------------------------------------------------
// Runtime — one angle value drives the whole wheel.
//
// Two placement engines share that math:
//   • three  — a real three.js scene: perspective camera, a ring Group, and
//              CSS3DRenderer so each phone screen stays live, crisp DOM.
//   • css    — CSS 3D transforms, used when three.js can't load (and as the
//              lightweight option). Everything still works without GSAP.
// Behind them sits an optional WebGL shader backdrop (raw GL, no library).

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';

export function componentJs(project, opts = {}) {
  const id = opts.id || `wp-${slugify(project.name)}`;
  const c = project.carousel;
  const w = project.stage.webgl;
  const cfg = {
    renderer: c.renderer === 'three' ? 'three' : 'css',
    radius: num(c.radius, 330),
    facing: c.facing === 'ring' ? 'ring' : 'billboard',
    perspective: num(c.perspective, 1800),
    tilt: num(c.tilt, 0),
    yArc: num(c.yArc, 0),
    minScale: num(c.minScale, 0.74),
    minOpacity: num(c.minOpacity, 0.62),
    maxBlur: num(c.maxBlur, 0),
    frontLift: num(c.frontLift, 0),
    dragStepPx: Math.max(num(c.dragStepPx, 220), 40),
    drag: !!c.drag,
    inertia: !!c.inertia,
    snap: !!c.snap,
    wheel: !!c.wheel,
    keyboard: !!c.keyboard,
    clickToFront: !!c.clickToFront,
    duration: num(c.duration, 0.9),
    ease: c.ease || 'power3.out',
    entrance: opts.disableAnims ? 'none' : c.entrance || 'none',
    entranceDuration: num(c.entranceDuration, 1.4),
    autoSpin: opts.disableAnims ? false : !!c.autoSpin,
    autoSpinSpeed: num(c.autoSpinSpeed, 8),
    autoResume: num(c.autoResume, 4),
    start: num(opts.activePhone, 0),
    preview: !!opts.preview,
    offstage: c.offstage.mode === 'image'
      ? {
          from: num(c.offstage.from, 0.45),
          to: num(c.offstage.to, 0.92),
          style: c.offstage.style || 'fade',
          // How far the phone has to shrink to land on the card, for morph.
          shrink: +(num(c.offstage.width, 170) / Math.max(num(project.phone.width, 300), 1)).toFixed(4),
        }
      : null,
    extrude: c.renderer === 'three' && c.extrude.enabled
      ? {
          depth: num(c.extrude.depth, 26),
          frontDepth: num(c.extrude.frontDepth, 0.3),
          color: c.extrude.color,
          edge: c.extrude.edge,
          opacity: num(c.extrude.opacity, 1),
          // Pulled in from the phone frame and the cards so a slab can track
          // whichever face is currently showing.
          phoneW: num(project.phone.width, 300),
          phoneH: Math.round(num(project.phone.width, 300) * num(project.phone.aspect, 2.06)),
          phoneR: num(project.phone.radius, 46),
          cardR: num(c.offstage.radius, 14),
          cards: c.offstage.mode === 'image',
          cardSizes: project.phones.map((p) => {
            const w = num(c.offstage.width, 170) * num(p.offstage.scale, 1);
            return {
              w: Math.round(w),
              h: Math.round(w * num(c.offstage.aspect, 1)),
              y: num(p.offstage.y, 0),
              on: !!String(p.offstage.src || '').trim(),
            };
          }),
        }
      : null,
    iso: c.iso.enabled
      ? { x: num(c.iso.x, 0), y: num(c.iso.y, 0), z: num(c.iso.z, 0), mirror: !!c.iso.mirror, front: num(c.iso.front, 0) }
      : null,
    three: THREE_CDN,
    gl: w.enabled
      ? {
          mode: w.preset === 'aurora' ? 1 : 0,
          speed: num(w.speed, 1),
          grain: num(w.grain, 0.05),
          reactive: !!w.reactive,
          still: !!opts.disableAnims,
          base: hexToVec(w.base),
          colors: [hexToVec(w.c1), hexToVec(w.c2), hexToVec(w.c3), hexToVec(w.c4)],
        }
      : null,
  };

  return `(function () {
  var root = document.getElementById(${JSON.stringify(id)});
  if (!root) return;

  var CFG = ${JSON.stringify(cfg)};
  var DEG = Math.PI / 180;
  var stage = root.querySelector('.wp-stage');
  var phones = Array.prototype.slice.call(root.querySelectorAll('.wp-phone'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.wp-dot'));
  var live = root.querySelector('.wp-live');
  var n = phones.length;
  if (!n || !stage) return;

  var step = 360 / n;
  var state = { angle: -CFG.start * step };
  var active = ((CFG.start % n) + n) % n;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined';
  var hasDraggable = hasGsap && typeof Draggable !== 'undefined';
  var hasInertia = hasGsap && typeof InertiaPlugin !== 'undefined';
  if (hasDraggable) gsap.registerPlugin(Draggable);
  if (hasInertia) gsap.registerPlugin(InertiaPlugin);

  var spinVel = 0;       // smoothed angular velocity, fed to the shader
  var lastAngle = state.angle;

  // ---- Placement: CSS 3D transforms (default and fallback) ------------------
  var cssPlacer = {
    set: function (i, p) {
      var el = phones[i];
      var tr = 'translate3d(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,' + p.z.toFixed(2) + 'px)';
      if (CFG.facing === 'ring') tr += ' rotateY(' + p.deg.toFixed(2) + 'deg)';
      if (p.iso) {
        tr += ' rotateX(' + p.iso.x.toFixed(2) + 'deg) rotateY(' + p.iso.y.toFixed(2) + 'deg) rotateZ(' + p.iso.z.toFixed(2) + 'deg)';
      }
      tr += ' scale(' + p.scale.toFixed(4) + ')';
      el.style.transform = tr;
      el.style.opacity = p.opacity.toFixed(3);
      el.style.zIndex = String(Math.round(p.t * 100));
      if (CFG.maxBlur > 0) el.style.filter = p.blur > 0.05 ? 'blur(' + p.blur.toFixed(2) + 'px)' : 'none';
    },
    after: function () {},
    resize: function () {},
  };
  var placer = cssPlacer;

  var faces = phones.map(function (el) {
    return { device: el.querySelector('.wp-face'), still: el.querySelector('.wp-still') };
  });

  // Hand the phone over to its card as it leaves the front. The card stays
  // crisp and un-dimmed — the depth cues move onto the phone face instead,
  // so the element itself can keep full opacity.
  function paintFaces(i, p) {
    var f = faces[i];
    if (!CFG.offstage || !f.still) return;
    var k = (p.t - CFG.offstage.from) / Math.max(CFG.offstage.to - CFG.offstage.from, 0.001);
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    k = k * k * (3 - 2 * k);                       // smoothstep
    p.k = k;
    var style = CFG.offstage.style;

    if (style === 'morph') {
      // The phone shrinks to the card's footprint on its way out, while the
      // card comes up from that same footprint — so one becomes the other.
      var shrink = CFG.offstage.shrink;
      f.device.style.transform = 'scale(' + (shrink + (1 - shrink) * k).toFixed(4) + ')';
      f.still.style.transform = 'scale(' + (1 + (1 / Math.max(shrink, 0.01) - 1) * k).toFixed(4) + ')';
      f.device.style.opacity = (k * p.opacity).toFixed(3);
      f.still.style.opacity = (1 - k).toFixed(3);
    } else if (style === 'flip') {
      // Two sides of one card: backface-visibility does the hiding.
      f.device.style.transform = 'rotateY(' + ((1 - k) * 180).toFixed(2) + 'deg)';
      f.still.style.transform = 'rotateY(' + (k * 180).toFixed(2) + 'deg)';
      f.device.style.opacity = p.opacity.toFixed(3);
      f.still.style.opacity = '1';
    } else if (style === 'swap') {
      var front = k > 0.5;
      f.device.style.opacity = front ? p.opacity.toFixed(3) : '0';
      f.still.style.opacity = front ? '0' : '1';
    } else {
      f.device.style.opacity = (k * p.opacity).toFixed(3);
      f.still.style.opacity = (1 - k).toFixed(3);
    }

    if (CFG.maxBlur > 0) f.device.style.filter = p.blur > 0.05 ? 'blur(' + p.blur.toFixed(2) + 'px)' : 'none';
    p.opacity = 1;                                 // the element itself stays solid
    p.blur = 0;
  }

  // Isometric tilt, mirrored either side of the front and ramped by depth.
  function isoFor(p) {
    if (!CFG.iso) return null;
    var ramp = CFG.iso.front + (1 - CFG.iso.front) * (1 - p.t);
    var side = Math.sin(p.deg * DEG) >= 0 ? 1 : -1;   // right of centre is +1
    var m = CFG.iso.mirror ? side : 1;
    return { x: CFG.iso.x * ramp, y: -CFG.iso.y * ramp * m, z: CFG.iso.z * ramp * m };
  }

  // ---- The one piece of maths everything shares -----------------------------
  function render() {
    placer.before && placer.before();
    for (var i = 0; i < n; i++) {
      var deg = i * step + state.angle;
      var rad = deg * DEG;
      var cos = Math.cos(rad);
      var sin = Math.sin(rad);
      var t = (cos + 1) / 2;                   // 1 at the front, 0 at the back
      var p = {
        i: i,
        deg: deg,
        localDeg: i * step,
        t: t,
        x: sin * CFG.radius,
        y: (1 - t) * CFG.yArc - t * CFG.frontLift,
        z: cos * CFG.radius - CFG.radius,      // front phone sits at z = 0
        lx: Math.sin(i * step * DEG) * CFG.radius,
        lz: Math.cos(i * step * DEG) * CFG.radius,
        scale: CFG.minScale + (1 - CFG.minScale) * t,
        opacity: CFG.minOpacity + (1 - CFG.minOpacity) * t,
        blur: CFG.maxBlur * (1 - t),
      };
      paintFaces(i, p);
      p.iso = isoFor(p);
      placer.set(i, p);
    }
    placer.after();
    spinVel = spinVel * 0.82 + (state.angle - lastAngle) * 0.18;
    lastAngle = state.angle;
    syncActive();
  }

  function indexFromAngle() {
    var i = Math.round(-state.angle / step) % n;
    return ((i % n) + n) % n;
  }

  function syncActive() {
    var i = indexFromAngle();
    if (i === active) return;
    active = i;
    for (var d = 0; d < dots.length; d++) dots[d].setAttribute('aria-selected', d === active ? 'true' : 'false');
    for (var p = 0; p < n; p++) phones[p].classList.toggle('is-front', p === active);
    if (live) live.textContent = phones[active].getAttribute('aria-label') || ('Screen ' + (active + 1));
  }

  function shortest(from, to) {
    var d = (to - from) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return from + d;
  }

  function goTo(i, immediate) {
    var target = shortest(state.angle, -(((i % n) + n) % n) * step);
    if (hasGsap) gsap.killTweensOf(state);
    if (immediate || reduce || !hasGsap) {
      state.angle = target;
      render();
      return;
    }
    gsap.to(state, { angle: target, duration: CFG.duration, ease: CFG.ease, onUpdate: render });
  }

  function nudge(dir) { goTo(indexFromAngle() + dir); }

  // ---- Auto spin ------------------------------------------------------------
  var spinning = false;
  var resumeTimer = null;
  function spinTick() {
    state.angle += CFG.autoSpinSpeed * gsap.ticker.deltaRatio(60) / 60;
    render();
  }
  function startSpin() {
    if (spinning || !CFG.autoSpin || reduce || !hasGsap) return;
    spinning = true;
    gsap.ticker.add(spinTick);
  }
  function stopSpin(resume) {
    if (spinning) { gsap.ticker.remove(spinTick); spinning = false; }
    clearTimeout(resumeTimer);
    if (resume && CFG.autoSpin && !reduce && hasGsap) resumeTimer = setTimeout(startSpin, CFG.autoResume * 1000);
  }

  function settle() {
    if (!CFG.snap) { syncActive(); return; }
    goTo(indexFromAngle());
  }

  // ---- Grab and spin --------------------------------------------------------
  var dragged = false;
  if (CFG.drag && hasDraggable) {
    var proxy = document.createElement('div');
    var pressX = 0;
    var pressAngle = 0;
    var perPx = step / CFG.dragStepPx;

    Draggable.create(proxy, {
      type: 'x',
      trigger: stage,
      allowNativeTouchScrolling: true,
      inertia: CFG.inertia && hasInertia,
      dragResistance: 0,
      snap: CFG.snap && CFG.inertia && hasInertia
        ? { x: function (v) { return pressX + Math.round((v - pressX) / CFG.dragStepPx) * CFG.dragStepPx; } }
        : false,
      onPress: function () {
        dragged = false;
        pressX = this.x;
        pressAngle = state.angle;
        gsap.killTweensOf(state);
        stopSpin(false);
        stage.classList.add('wp-grabbing');
      },
      onDrag: function () {
        dragged = true;
        state.angle = pressAngle + (this.x - pressX) * perPx;
        render();
      },
      onThrowUpdate: function () {
        state.angle = pressAngle + (this.x - pressX) * perPx;
        render();
      },
      onRelease: function () {
        stage.classList.remove('wp-grabbing');
        if (!this.isThrowing) { settle(); stopSpin(true); }
      },
      onThrowComplete: function () { settle(); stopSpin(true); },
    });
  }

  phones.forEach(function (el, i) {
    el.addEventListener('click', function () {
      if (dragged) { dragged = false; return; }
      if (CFG.preview && window.parent !== window) {
        window.parent.postMessage({ type: 'wp-phone-clicked', index: i }, '*');
      }
      if (!CFG.clickToFront || i === indexFromAngle()) return;
      stopSpin(true);
      goTo(i);
    });
  });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      stopSpin(true);
      goTo(parseInt(dot.getAttribute('data-wp-goto'), 10) || 0);
    });
  });

  var prev = root.querySelector('.wp-arrow-prev');
  var next = root.querySelector('.wp-arrow-next');
  if (prev) prev.addEventListener('click', function () { stopSpin(true); nudge(-1); });
  if (next) next.addEventListener('click', function () { stopSpin(true); nudge(1); });

  if (CFG.keyboard) {
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); stopSpin(true); nudge(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stopSpin(true); nudge(1); }
      else if (e.key === 'Home') { e.preventDefault(); stopSpin(true); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); stopSpin(true); goTo(n - 1); }
      else if (e.key === 'Escape' && CFG.preview && window.parent !== window) {
        window.parent.postMessage({ type: 'wp-escape' }, '*');
      }
    });
  }

  if (CFG.wheel) {
    var wheelLock = false;
    stage.addEventListener('wheel', function (e) {
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 8 || wheelLock) return;
      e.preventDefault();
      wheelLock = true;
      stopSpin(true);
      nudge(delta > 0 ? 1 : -1);
      setTimeout(function () { wheelLock = false; }, 420);
    }, { passive: false });
  }

  // ---- Entrance -------------------------------------------------------------
  function entrance() {
    var inners = root.querySelectorAll('.wp-phone-inner');
    if (!hasGsap) { render(); return; }
    gsap.killTweensOf(state);
    if (CFG.entrance === 'none' || reduce) { gsap.set(inners, { clearProps: 'all' }); render(); return; }
    render();
    if (CFG.entrance === 'spin') {
      gsap.set(inners, { opacity: 1, y: 0, scale: 1 });
      gsap.fromTo(state, { angle: state.angle - 260 }, {
        angle: state.angle, duration: CFG.entranceDuration, ease: 'power3.out', onUpdate: render,
      });
      gsap.from(inners, { opacity: 0, duration: CFG.entranceDuration * 0.5, stagger: 0.08, ease: 'power2.out' });
    } else if (CFG.entrance === 'rise') {
      gsap.fromTo(inners, { opacity: 0, y: 70, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: CFG.entranceDuration * 0.7, stagger: 0.09, ease: 'back.out(1.4)' });
    } else {
      gsap.fromTo(inners, { opacity: 0 }, { opacity: 1, duration: CFG.entranceDuration * 0.6, stagger: 0.08 });
    }
  }

  // ---- WebGL backdrop (raw GL — no library, no build step) ------------------
  var glCanvas = root.querySelector('.wp-gl');
  var glCtx = null;
  var glPaused = false;
  function initGL() {
    if (!CFG.gl || !glCanvas) return;
    var gl = null;
    try {
      gl = glCanvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
        || glCanvas.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) { glCanvas.style.display = 'none'; return; }   // the CSS background still shows
    glCtx = gl;

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 uRes;uniform float uTime;uniform float uSpin;uniform float uMode;uniform float uGrain;',
      'uniform vec3 uBase;uniform vec3 uA;uniform vec3 uB;uniform vec3 uC;uniform vec3 uD;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float w8(vec2 q,vec2 c){vec2 d=q-c;return 1.0/(dot(d,d)+0.055);}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/uRes;',
      ' float ar=uRes.x/max(uRes.y,1.0);',
      ' vec2 q=vec2(uv.x*ar,uv.y);',
      ' float t=uTime;float s=uSpin;',
      ' vec2 c1=vec2(0.30*ar+0.17*sin(t*0.31+s),0.74+0.12*cos(t*0.27));',
      ' vec2 c2=vec2(0.74*ar+0.15*cos(t*0.23-s),0.32+0.15*sin(t*0.19));',
      ' vec2 c3=vec2(0.52*ar+0.21*sin(t*0.17+1.7+s*0.5),0.16+0.11*cos(t*0.29));',
      ' vec2 c4=vec2(0.16*ar+0.13*cos(t*0.13+2.4),0.26+0.14*sin(t*0.21-s*0.3));',
      ' float w1=w8(q,c1),w2=w8(q,c2),w3=w8(q,c3),w4=w8(q,c4);',
      ' vec3 col=(uA*w1+uB*w2+uC*w3+uD*w4)/(w1+w2+w3+w4);',
      ' if(uMode>0.5){float band=sin(q.y*5.5+sin(q.x*3.0+t*0.4)*1.3+t*0.25);col=mix(col,uBase,0.30+0.32*band);}',
      ' col=mix(uBase,col,0.94);',
      ' float v=smoothstep(1.35,0.20,length((uv-0.5)*vec2(1.15,1.4))*1.6);',
      ' col*=0.78+0.22*v;',
      ' col+=(hash(gl_FragCoord.xy+fract(t)*13.0)-0.5)*uGrain;',
      ' gl_FragColor=vec4(col,1.0);',
      '}',
    ].join('\\n');

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    }
    var v = compile(gl.VERTEX_SHADER, vs);
    var f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) { glCanvas.style.display = 'none'; glCtx = null; return; }
    var prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { glCanvas.style.display = 'none'; glCtx = null; return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes', 'uTime', 'uSpin', 'uMode', 'uGrain', 'uBase', 'uA', 'uB', 'uC', 'uD'].forEach(function (name) {
      U[name] = gl.getUniformLocation(prog, name);
    });
    gl.uniform1f(U.uMode, CFG.gl.mode);
    gl.uniform1f(U.uGrain, CFG.gl.grain);
    gl.uniform3fv(U.uBase, CFG.gl.base);
    gl.uniform3fv(U.uA, CFG.gl.colors[0]);
    gl.uniform3fv(U.uB, CFG.gl.colors[1]);
    gl.uniform3fv(U.uC, CFG.gl.colors[2]);
    gl.uniform3fv(U.uD, CFG.gl.colors[3]);

    function sizeGL() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(root.clientWidth, 1);
      var h = Math.max(root.clientHeight, 1);
      glCanvas.width = Math.round(w * dpr);
      glCanvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.uniform2f(U.uRes, glCanvas.width, glCanvas.height);
    }
    sizeGL();
    glCtx.wpResize = sizeGL;

    var t0 = (window.performance || Date).now();
    var still = CFG.gl.still || reduce;
    function frame() {
      if (!glCtx) return;
      if (!glPaused) {
        var time = ((window.performance || Date).now() - t0) / 1000 * CFG.gl.speed;
        gl.uniform1f(U.uTime, still ? 4.2 : time);
        gl.uniform1f(U.uSpin, CFG.gl.reactive ? Math.max(-3, Math.min(3, spinVel * 0.08)) : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (still) return;
      requestAnimationFrame(frame);
    }
    frame();
  }

  // ---- three.js placement: a real 3D scene, with live DOM screens -----------
  var dynImport = null;
  try { dynImport = new Function('u', 'return import(u);'); } catch (e) { dynImport = null; }

  function initThree(done) {
    if (CFG.renderer !== 'three' || !dynImport || !window.Promise) { done(); return; }
    var loaded = false;
    var give_up = setTimeout(function () { if (!loaded) fallback(); }, 8000);
    function fallback() {
      clearTimeout(give_up);
      root.classList.remove('wp-three');
      done();
    }
    Promise.all([
      dynImport(CFG.three + '/+esm'),
      dynImport(CFG.three + '/examples/jsm/renderers/CSS3DRenderer.js/+esm'),
    ]).then(function (mods) {
      loaded = true;
      clearTimeout(give_up);
      var THREE = mods[0];
      var CSS3D = mods[1];
      var w = Math.max(stage.clientWidth, 1);
      var h = Math.max(stage.clientHeight, 1);

      // Match the CSS perspective exactly so both engines frame the wheel alike.
      var fov = 2 * Math.atan((h / 2) / CFG.perspective) * 180 / Math.PI;
      var camera = new THREE.PerspectiveCamera(fov, w / h, 1, 20000);
      camera.position.set(0, 0, CFG.perspective + CFG.radius);

      var scene = new THREE.Scene();
      var ring = new THREE.Group();
      ring.rotation.x = CFG.tilt * DEG;
      scene.add(ring);

      var cssRenderer = new CSS3D.CSS3DRenderer();
      cssRenderer.setSize(w, h);
      cssRenderer.domElement.className = 'wp-css3d';
      stage.appendChild(cssRenderer.domElement);

      var isoEuler = new THREE.Euler();
      var isoQuat = new THREE.Quaternion();
      var objects = phones.map(function (el) {
        var o = new CSS3D.CSS3DObject(el);
        ring.add(o);
        return o;
      });

      // ---- WebGL extrusion: one slab per phone, same camera as the CSS3D
      // layer, so a tilted device shows real thickness down its side.
      var gl3 = null;
      if (CFG.extrude) {
        var canvas = root.querySelector('.wp-slabs');
        if (canvas) {
          try {
            var glRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
            glRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            glRenderer.setSize(w, h);
            glRenderer.setClearAlpha(0);

            var glScene = new THREE.Scene();
            glScene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color(CFG.extrude.edge), 1.25));
            var key = new THREE.DirectionalLight(0xffffff, 1.5);
            key.position.set(-0.6, 0.9, 1);
            glScene.add(key);

            var ringGL = new THREE.Group();
            glScene.add(ringGL);

            // A rounded-rectangle prism, so the slab matches the device's
            // silhouette exactly and no corner pokes out past the screen.
            // Extruded one unit deep and scaled in Z, which stays exact
            // because the side walls are straight.
            function prism(pw, ph, r) {
              var x = -pw / 2;
              var y = -ph / 2;
              var rr = Math.max(Math.min(r, Math.min(pw, ph) / 2 - 0.01), 0.01);
              var sh = new THREE.Shape();
              sh.moveTo(x + rr, y);
              sh.lineTo(x + pw - rr, y);
              sh.quadraticCurveTo(x + pw, y, x + pw, y + rr);
              sh.lineTo(x + pw, y + ph - rr);
              sh.quadraticCurveTo(x + pw, y + ph, x + pw - rr, y + ph);
              sh.lineTo(x + rr, y + ph);
              sh.quadraticCurveTo(x, y + ph, x, y + ph - rr);
              sh.lineTo(x, y + rr);
              sh.quadraticCurveTo(x, y, x + rr, y);
              return new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 8 });
            }

            var blend = CFG.extrude.opacity < 1 || CFG.extrude.cards;
            function slabMat() {
              return new THREE.MeshStandardMaterial({
                color: new THREE.Color(CFG.extrude.color),
                roughness: 0.55,
                metalness: 0.05,
                transparent: blend,
                opacity: CFG.extrude.opacity,
                depthWrite: !blend,
              });
            }

            var phoneGeo = prism(CFG.extrude.phoneW, CFG.extrude.phoneH, CFG.extrude.phoneR);
            var slabs = phones.map(function (el, i) {
              var holder = new THREE.Group();
              var mat = slabMat();
              var phoneMesh = new THREE.Mesh(phoneGeo, mat);
              holder.add(phoneMesh);
              var cardMesh = null;
              var cardMat = null;
              var cs = CFG.extrude.cards ? CFG.extrude.cardSizes[i] : null;
              if (cs && cs.on) {
                cardMat = slabMat();
                cardMesh = new THREE.Mesh(prism(cs.w, cs.h, CFG.extrude.cardR), cardMat);
                cardMesh.position.y = -cs.y;          // CSS nudges down, three is y-up
                holder.add(cardMesh);
              }
              ringGL.add(holder);
              return { holder: holder, phoneMesh: phoneMesh, mat: mat, cardMesh: cardMesh, cardMat: cardMat };
            });
            gl3 = { renderer: glRenderer, scene: glScene, ring: ringGL, slabs: slabs };
          } catch (e) { gl3 = null; }
        }
      }

      function placeSlab(i, p, o) {
        if (!gl3) return;
        var s = gl3.slabs[i];
        var k = s.cardMesh ? (p.k == null ? 1 : p.k) : 1;
        var style = CFG.offstage ? CFG.offstage.style : 'fade';
        var depth = CFG.extrude.depth * (CFG.extrude.frontDepth + (1 - CFG.extrude.frontDepth) * (1 - p.t));

        s.holder.position.copy(o.position);
        s.holder.quaternion.copy(o.quaternion);
        s.holder.scale.copy(o.scale);

        var faceScale = 1;
        var cardScale = 1;
        var faceAlpha = 1;
        var cardAlpha = 0;
        if (s.cardMesh) {
          if (style === 'morph') {
            var sh = CFG.offstage.shrink;
            faceScale = sh + (1 - sh) * k;
            cardScale = 1 + (1 / Math.max(sh, 0.01) - 1) * k;
            faceAlpha = k;
            cardAlpha = 1 - k;
          } else if (style === 'flip' || style === 'swap') {
            // Hand over at the midpoint, where a flipping card is edge-on.
            faceAlpha = k > 0.5 ? 1 : 0;
            cardAlpha = k > 0.5 ? 0 : 1;
            if (style === 'flip') {
              s.phoneMesh.rotation.y = (1 - k) * Math.PI;
              s.cardMesh.rotation.y = k * Math.PI;
            }
          } else {
            faceAlpha = k;
            cardAlpha = 1 - k;
          }
        } else {
          faceAlpha = p.opacity;
        }

        s.phoneMesh.scale.set(faceScale, faceScale, depth);
        s.phoneMesh.position.z = -depth;          // sits behind the screen
        s.phoneMesh.visible = faceAlpha > 0.01;
        s.mat.opacity = CFG.extrude.opacity * faceAlpha;
        if (s.cardMesh) {
          s.cardMesh.scale.set(cardScale, cardScale, depth);
          s.cardMesh.position.z = -depth;
          s.cardMesh.visible = cardAlpha > 0.01;
          s.cardMat.opacity = CFG.extrude.opacity * cardAlpha;
        }
      }

      placer = {
        before: function () {
          ring.rotation.y = state.angle * DEG;
          if (gl3) gl3.ring.rotation.copy(ring.rotation);
        },
        set: function (i, p) {
          var o = objects[i];
          o.position.set(p.lx, p.y, p.lz);
          o.scale.setScalar(p.scale);
          if (CFG.facing === 'billboard') o.quaternion.copy(ring.quaternion).invert();
          else o.rotation.set(0, p.localDeg * DEG, 0);
          if (p.iso) {
            isoEuler.set(p.iso.x * DEG, p.iso.y * DEG, p.iso.z * DEG);
            o.quaternion.multiply(isoQuat.setFromEuler(isoEuler));
          }
          var el = phones[i];
          el.style.opacity = p.opacity.toFixed(3);
          if (CFG.maxBlur > 0) el.style.filter = p.blur > 0.05 ? 'blur(' + p.blur.toFixed(2) + 'px)' : 'none';
          placeSlab(i, p, o);
        },
        after: function () {
          cssRenderer.render(scene, camera);
          if (gl3) gl3.renderer.render(gl3.scene, camera);
        },
        resize: function () {
          var w2 = Math.max(stage.clientWidth, 1);
          var h2 = Math.max(stage.clientHeight, 1);
          camera.fov = 2 * Math.atan((h2 / 2) / CFG.perspective) * 180 / Math.PI;
          camera.aspect = w2 / h2;
          camera.updateProjectionMatrix();
          cssRenderer.setSize(w2, h2);
          if (gl3) gl3.renderer.setSize(w2, h2);
        },
      };
      done();
    }).catch(fallback);
  }

  // ---- Boot -----------------------------------------------------------------
  function start() {
    render();
    for (var d0 = 0; d0 < dots.length; d0++) dots[d0].setAttribute('aria-selected', d0 === active ? 'true' : 'false');
    phones[active].classList.add('is-front');
    initGL();

    if ('IntersectionObserver' in window) {
      var seen = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          glPaused = !entry.isIntersecting;
          if (!entry.isIntersecting || seen) return;
          seen = true;
          entrance();
          startSpin();
        });
      }, { threshold: 0.15 });
      io.observe(root);
    } else {
      entrance();
      startSpin();
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        placer.resize();
        if (glCtx && glCtx.wpResize) glCtx.wpResize();
        render();
      }, 150);
    });
  }

  initThree(start);

  var api = {
    select: function (i) { stopSpin(true); goTo(i); },
    next: function () { stopSpin(true); nudge(1); },
    prev: function () { stopSpin(true); nudge(-1); },
    replay: function () { stopSpin(false); entrance(); startSpin(); },
    index: function () { return indexFromAngle(); },
  };
  root.wheeliePhone = api;
  window.WheeliePhone = api;
})();`;
}

// ---------------------------------------------------------------------------
// Assembly

const LATO_URL = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap';

export function fontLinkTags(project) {
  if (!project.theme.loadLato) return '';
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${LATO_URL}" media="print" onload="this.media='all'">`;
}

export function gsapScriptTags(project) {
  const tags = ['<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>'];
  if (project.carousel.drag) {
    tags.push('<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Draggable.min.js"></script>');
    if (project.carousel.inertia) {
      tags.push('<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/InertiaPlugin.min.js"></script>');
    }
  }
  return tags.join('\n');
}

export function generate(project, opts = {}) {
  const id = opts.id || `wp-${slugify(project.name)}`;
  const o = { ...opts, id };
  const html = componentHtml(project, o);
  const css = componentCss(project, o);
  const js = componentJs(project, o);
  const embed = `${fontLinkTags(project)}
<style>
${css}
</style>

${html}

${gsapScriptTags(project)}
<script>
${js}
</script>`;
  return { id, html, css, js, embed };
}

export function standaloneDoc(project, opts = {}) {
  const { embed } = generate(project, opts);
  const pageBg = opts.bodyBg || '#101014';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(project.name)}</title>
<style>
  html, body { margin: 0; padding: 0; background: ${pageBg}; }
  body { min-height: 100%; display: flex; align-items: center; justify-content: center; }
  .wp-host { width: 100%; }
</style>
</head>
<body>
<div class="wp-host">
${embed}
</div>
</body>
</html>`;
}
