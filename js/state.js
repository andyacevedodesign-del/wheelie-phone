// Project state: defaults, the demo project, and a tiny pub/sub store.
// Mirrors Tab Guru's model so the two builders feel like one family of tools.

let nextId = 1;
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

// ---------------------------------------------------------------------------
// Factories

export function makeMessage(kind = 'message') {
  switch (kind) {
    case 'system':
      return { id: uid('m'), kind, name: '', avatar: '', avatarColor: '#616061', badge: '', time: '',
        text: 'A huddle happened', sub: 'You and Dr. Hasan were in the huddle for 5m.',
        image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: 'headphones' };
    case 'divider':
      return { id: uid('m'), kind, name: '', avatar: '', avatarColor: '', badge: '', time: '',
        text: 'Today', sub: '', image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: '', unread: true };
    default:
      return { id: uid('m'), kind: 'message', name: 'Carmen', avatar: '', avatarColor: '#4a154b', badge: '', time: '8:20 AM',
        text: 'Team, how can we help with this one?', sub: '', image: '', replies: 0, reactions: '',
        cardTitle: '', cardSub: '', icon: '' };
  }
}

// A stand-in for the off-stage card until a real photo is dropped in.
function stillPlaceholder(label, from, to) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">'
    + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`
    + '<rect width="300" height="300" fill="url(#g)"/>'
    + `<text x="150" y="142" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle" opacity=".9">${label}</text>`
    + '<text x="150" y="178" font-family="Helvetica,Arial,sans-serif" font-size="19" fill="#fff" text-anchor="middle" opacity=".65">Drop a photo here</text>'
    + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

export function makePhone(label = 'New screen') {
  return {
    id: uid('p'),
    label,
    // What this phone becomes when it isn't the one out front — only used
    // when the wheel's off-stage mode is set to image cards.
    offstage: { src: stillPlaceholder(label, '#8a20d8', '#ff9ad5'), alt: '', y: 0, scale: 1 },
    screen: {
      theme: 'light',
      bg: '#ffffff',
      tintFrom: '#ffffff',
      tintTo: '#d8c4f5',
      tintOpacity: 0.9,
      offset: 0,
      header: { icon: 'hash', title: 'new-channel', meta: '128 members', back: true, headphones: true },
      cta: { enabled: false, label: 'Support Agent', color: '#007a5a', textColor: '#ffffff', icon: 'play', compose: true },
      composer: { enabled: true, text: 'Message new-channel', mic: true },
      messages: [makeMessage('message')],
    },
  };
}

// ---------------------------------------------------------------------------
// Demo project — the three-phone lineup: retail ops, frontline support,
// and a private patient channel, like a Slack mobile campaign shot.

function demoPhones() {
  return [
    {
      id: uid('p'),
      label: 'Retail ops',
      offstage: { src: stillPlaceholder('Retail ops', '#d8446b', '#ffb199'), alt: '', y: 26, scale: 0.88 },
      screen: {
        theme: 'light',
        bg: '#ffffff',
        tintFrom: '#ffffff',
        tintTo: '#ffffff',
        tintOpacity: 1,
        offset: 0,
        header: { icon: 'hash', title: 'broadcast-stores', meta: '432 members • 6 tabs', back: true, headphones: true },
        cta: { enabled: false, label: '', color: '#007a5a', textColor: '#ffffff', icon: 'play', compose: true },
        composer: { enabled: true, text: 'Message broadcast-stores', mic: true },
        messages: [
          { id: uid('m'), kind: 'message', name: 'Matt', avatar: '', avatarColor: '#2f6f8f', badge: '', time: '10:21 AM',
            text: 'POS systems will be down for scheduled maintenance tonight from 11pm to 1am ET. Use manual backup procedures during this window. Support is on standby at extension 4400.',
            sub: '', image: '', replies: 0, reactions: '👀 7', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'divider', text: 'Yesterday', unread: false,
            name: '', avatar: '', avatarColor: '', badge: '', time: '', sub: '', image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'Lisa', avatar: '', avatarColor: '#9c5b8a', badge: '', time: '2:34 PM',
            text: 'Congrats to the Denver store team for hitting this month’s sales goal early! Great work all around.',
            sub: '', image: '', replies: 0, reactions: '🎉 35', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'divider', text: 'Today', unread: true,
            name: '', avatar: '', avatarColor: '', badge: '', time: '', sub: '', image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'New In-Store Promo', avatar: '', avatarColor: '#e01e5a', badge: 'APP', time: '7:20 AM',
            text: '📣 **@channel** New Promo: "Fall Layers Event" Through 11/20\n\n30% off Fleece & Flannel. Please set up endcap displays before opening today.\n\n**Questions?** Ask below. 🍁',
            sub: '', image: '', replies: 0, reactions: '', cardTitle: 'Fall Layers Event | Endcap Guide', cardSub: 'Canvas', icon: '' },
        ],
      },
    },
    {
      id: uid('p'),
      label: 'Frontline support',
      offstage: { src: stillPlaceholder('Frontline support', '#7a2fd8', '#c98bff'), alt: '', y: -18, scale: 1 },
      screen: {
        theme: 'light',
        bg: '#ffffff',
        tintFrom: '#ffffff',
        tintTo: '#ffffff',
        tintOpacity: 1,
        offset: 0,
        header: { icon: 'hash', title: 'frontline-support', meta: '832 members • 4 tabs', back: false, headphones: true },
        cta: { enabled: true, label: 'Support Agent', color: '#007a5a', textColor: '#ffffff', icon: 'play', compose: true },
        composer: { enabled: false, text: '', mic: true },
        messages: [
          { id: uid('m'), kind: 'message', name: 'Support Agent', avatar: '🐻', avatarColor: '#1d9bd1', badge: 'WORKFLOW', time: '10:41 PM',
            text: '**@david** has **requested support:**\nThe transaction is failing with the register.\n\nPlease review the thread for next steps.',
            sub: '', image: '', replies: 2, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'Support Agent', avatar: '🐻', avatarColor: '#1d9bd1', badge: 'WORKFLOW', time: '10:41 PM',
            text: '**@Jennifer** has **requested support:\nrouter is blinking red and internet** intermittent. see attached photo\n\nPlease review the thread for next steps.',
            sub: '', image: 'https://placehold.co/640x420/4b5563/e5e7eb/png?text=Photo', replies: 2, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'Support Agent', avatar: '🐻', avatarColor: '#1d9bd1', badge: 'WORKFLOW', time: '10:41 PM',
            text: '**@Lee Hao** has **requested support:**\nConveyor belt 4 is drifting off track, running rough.\n\nPlease review the thread for next steps.',
            sub: '', image: '', replies: 1, reactions: '', cardTitle: '', cardSub: '', icon: '' },
        ],
      },
    },
    {
      id: uid('p'),
      label: 'Patient channel',
      offstage: { src: stillPlaceholder('Patient channel', '#1f8f6a', '#9be2b6'), alt: '', y: 34, scale: 0.94 },
      screen: {
        theme: 'light',
        bg: '#ffffff',
        tintFrom: '#ffffff',
        tintTo: '#ffffff',
        tintOpacity: 1,
        offset: 0,
        header: { icon: 'lock', title: 'Patient - Marcos Lopez', meta: '9 members • 2 tabs', back: true, headphones: true },
        cta: { enabled: false, label: '', color: '#007a5a', textColor: '#ffffff', icon: 'play', compose: true },
        composer: { enabled: true, text: 'Message Patient - Marcos Lopez', mic: true },
        messages: [
          { id: uid('m'), kind: 'message', name: 'Carmen', avatar: '', avatarColor: '#7c3aed', badge: '', time: '8:20 AM',
            text: 'Team, Mr. Lopez is having trouble maneuvering his walker in his home. How can we help him?',
            sub: '', image: '', replies: 0, reactions: '👍 2', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'Dr. Hasan', avatar: '', avatarColor: '#2f6f8f', badge: '', time: '8:20 AM',
            text: 'Hi **@Carmen**, let’s hop on a huddle to discuss a plan.',
            sub: '', image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'system', name: '', avatar: '', avatarColor: '#616061', badge: '', time: '8:25 AM',
            text: 'A huddle happened', sub: 'You and Dr. Hasan were in the huddle for 5m.',
            image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: 'headphones' },
          { id: uid('m'), kind: 'message', name: 'Dr. Hasan', avatar: '', avatarColor: '#2f6f8f', badge: '', time: '8:20 AM',
            text: 'Thanks, **@Carmen**. As discussed, please request a replacement walker for Mr. Lopez.',
            sub: '', image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'Patient Operations', avatar: '', avatarColor: '#b5651d', badge: 'APP', time: '8:20 AM',
            text: 'Delivery for new equipment confirmed for tomorrow at 9:00 AM.',
            sub: '', image: '', replies: 0, reactions: '', cardTitle: '', cardSub: '', icon: '' },
          { id: uid('m'), kind: 'message', name: 'Carmen', avatar: '', avatarColor: '#7c3aed', badge: '', time: '8:20 AM',
            text: 'Thanks, Dr. Hasan! Mr. Lopez appreciates the quick support.',
            sub: '', image: '', replies: 0, reactions: '👏 1', cardTitle: '', cardSub: '', icon: '' },
        ],
      },
    },
  ];
}

export function defaultProject() {
  return {
    name: 'Slack Mobile Carousel',
    theme: {
      fontFamily: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      loadLato: true,
      accent: '#611f69',
      linkColor: '#1264a3',
    },
    // The scene the wheel sits in.
    stage: {
      bgType: 'gradient', // color | gradient | image
      bgColor: '#7b2ff7',
      gradFrom: '#8a20d8',
      gradTo: '#c13ae0',
      gradAngle: 155,
      bgImage: '',
      height: 760,
      padY: 40,
      maxWidth: 1200,
      mobilePx: 640,
      // WebGL backdrop: an animated mesh-gradient shader behind the wheel.
      // Raw WebGL, no library — and it falls back to the CSS background
      // above if the browser can't give us a context.
      webgl: {
        enabled: true,
        preset: 'mesh', // mesh (drifting colour blobs) | aurora (banded flow)
        base: '#4c0f96',
        c1: '#8a20d8',
        c2: '#d14ae8',
        c3: '#5b1fb8',
        c4: '#ff9ad5',
        speed: 1,
        grain: 0.05,
        reactive: true, // the shader leans with the spin
      },
    },
    // How the wheel of phones behaves.
    carousel: {
      // three — a real three.js scene (perspective camera + CSS3DRenderer),
      // so the wheel is true 3D while every screen stays live DOM.
      // css   — CSS 3D transforms; also the automatic fallback.
      renderer: 'three',
      radius: 330,
      perspective: 1800,
      facing: 'billboard', // billboard (phones face you) | ring (true cylinder)
      tilt: 0,
      yArc: 26,
      minScale: 0.74,
      minOpacity: 0.62,
      maxBlur: 2,
      frontLift: 14,
      dragStepPx: 220,
      drag: true,
      inertia: true,
      snap: true,
      wheel: true,
      keyboard: true,
      clickToFront: true,
      arrows: true,
      dots: true,
      duration: 0.9,
      ease: 'power3.out',
      entrance: 'spin', // spin | rise | fade | none
      entranceDuration: 1.4,
      autoSpin: false,
      autoSpinSpeed: 8,
      autoResume: 4,
      // Off-stage phones can stay phones, or cross-fade into a flat image
      // card — the flanking photos in a Slack campaign shot.
      offstage: {
        mode: 'phone', // phone | image
        style: 'fade', // fade | morph (phone shrinks into the card) | flip | swap
        width: 170,
        aspect: 1,
        radius: 14,
        shadow: true,
        from: 0.45, // below this front-ness the card is fully shown
        to: 0.92,   // above it the phone is fully shown
      },
      // Isometric tilt: the devices off to the sides turn away from the
      // viewer, mirrored left and right, ramping in as they leave the front.
      iso: {
        enabled: false,
        x: 6,      // pitch, degrees
        y: 26,     // turn, degrees — the isometric one
        z: 0,      // roll, degrees
        mirror: true, // the left side turns the opposite way
        front: 0,  // how much of the tilt the front device keeps (0..1)
      },
      // Real thickness, rendered in WebGL behind the DOM screens.
      // Needs the three.js engine — it shares that scene's camera.
      extrude: {
        enabled: false,
        depth: 26,
        frontDepth: 0.3, // the front device's share of the depth (0..1)
        color: '#e9e4f0',
        edge: '#3b1259',
        opacity: 1,
      },
    },
    // The shared phone frame.
    phone: {
      width: 300,
      aspect: 2.06,
      radius: 46,
      frameColor: '#ffffff',
      frameWidth: 9,
      island: true,
      statusBar: true,
      time: '9:41',
      shadow: true,
      shadowColor: '#2a0b3d',
      shadowOpacity: 0.35,
    },
    phones: demoPhones(),
  };
}

// ---------------------------------------------------------------------------
// Normalizing keeps older saved files working as the model grows.

function normalize(project) {
  const base = defaultProject();
  project = { ...base, ...project };
  project.theme = { ...base.theme, ...(project.theme || {}) };
  project.stage = { ...base.stage, ...(project.stage || {}) };
  project.stage.webgl = { ...base.stage.webgl, ...(project.stage.webgl || {}) };
  project.carousel = { ...base.carousel, ...(project.carousel || {}) };
  project.carousel.offstage = { ...base.carousel.offstage, ...(project.carousel.offstage || {}) };
  project.carousel.iso = { ...base.carousel.iso, ...(project.carousel.iso || {}) };
  project.carousel.extrude = { ...base.carousel.extrude, ...(project.carousel.extrude || {}) };
  project.phone = { ...base.phone, ...(project.phone || {}) };
  if (!Array.isArray(project.phones) || !project.phones.length) project.phones = base.phones;
  const blankPhone = makePhone();
  for (const p of project.phones) {
    p.id ??= uid('p');
    p.label ??= 'Screen';
    p.offstage = { ...blankPhone.offstage, ...(p.offstage || {}) };
    p.screen = { ...blankPhone.screen, ...(p.screen || {}) };
    p.screen.header = { ...blankPhone.screen.header, ...(p.screen.header || {}) };
    p.screen.cta = { ...blankPhone.screen.cta, ...(p.screen.cta || {}) };
    p.screen.composer = { ...blankPhone.screen.composer, ...(p.screen.composer || {}) };
    if (!Array.isArray(p.screen.messages)) p.screen.messages = [];
    for (const m of p.screen.messages) {
      m.id ??= uid('m');
      m.kind ??= 'message';
      m.name ??= '';
      m.avatar ??= '';
      m.avatarColor ??= '#4a154b';
      m.badge ??= '';
      m.time ??= '';
      m.text ??= '';
      m.sub ??= '';
      m.image ??= '';
      m.replies ??= 0;
      m.reactions ??= '';
      m.cardTitle ??= '';
      m.cardSub ??= '';
      m.icon ??= '';
      m.unread ??= false;
    }
  }
  return project;
}

// ---------------------------------------------------------------------------
// Store — refreshing always starts from the demo; Save / Import keeps work.

let project = defaultProject();
const listeners = new Set();

export const store = {
  get: () => project,

  // kind: 'prop' (value edit) or 'structure' (phones/messages added, removed,
  // reordered, replaced) — structure triggers a full panel rerender.
  emit(kind = 'prop') {
    listeners.forEach((fn) => fn(project, kind));
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  replace(newProject) {
    project = normalize(newProject);
    this.emit('structure');
  },

  reset() {
    this.replace(defaultProject());
  },

  setPath(path, value) {
    const parts = path.split('.');
    let obj = project;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
    this.emit('prop');
  },

  getPath(path) {
    return path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), project);
  },

  findPhone(phoneId) {
    return project.phones.find((p) => p.id === phoneId);
  },

  findMessage(phoneId, messageId) {
    const phone = this.findPhone(phoneId);
    return phone ? phone.screen.messages.find((m) => m.id === messageId) : undefined;
  },
};
