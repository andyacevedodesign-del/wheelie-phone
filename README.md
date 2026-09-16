# 📱 Wheelie Phone

A visual builder for a **spinnable wheel of phones** — line up mobile screens on a
3D carousel, grab it and spin, and **export clean code**. Same idea as
[Tab Guru](https://github.com/andyacevedodesign-del/tab-guru), pointed at mobile:
where Tab Guru builds a tabbed feature panel, Wheelie Phone builds the
"here are our apps' screens" hero — a ring of phones you can throw with your
thumb, each one a real Slack-style mobile conversation.

No hosting, no build step, no lock-in. What you export is a self-contained
snippet you paste into any page.

## What it does

- **A wheel of phones** — every screen is a phone on a circle. Drag it, throw it,
  flick it with the wheel, arrow-key it, or click a phone at the side to spin it
  to the front. It snaps to the nearest phone when you let go.
- **Real 3D, two engines**
  - **three.js** (default) — a genuine 3D scene: a perspective camera, a ring
    `Group`, and `CSS3DRenderer`, so the wheel has true perspective while every
    screen stays live, selectable, accessible DOM instead of a baked texture.
  - **CSS 3D transforms** — the lightweight option, and the automatic fallback
    if three.js can't load.
- **A WebGL shader backdrop** — an animated mesh-gradient (or aurora) written in
  raw GLSL, no library. Four colour blobs drift behind the wheel and can lean
  with the spin. Falls back to the CSS gradient if the browser gives no context.
- **GSAP everywhere** — [Draggable](https://gsap.com/docs/v3/Plugins/Draggable/)
  plus [InertiaPlugin](https://gsap.com/docs/v3/Plugins/InertiaPlugin/) do the
  grab-and-throw with momentum and snap; GSAP tweens drive the programmatic
  spins, the entrance (spin-in / rise / fade), and the optional idle auto-spin
  that pauses the moment someone grabs the wheel.
- **Slack-style mobile screens** — status bar, dynamic island, channel header
  (`#` or 🔒 with a member/tab meta line), messages with avatars, `APP` /
  `WORKFLOW` badges, `**bold**` and `@mention` markup, image attachments, canvas
  cards, thread reply counts, reaction pills, day dividers with the red **NEW**
  marker, huddle notices, a composer, or a big call-to-action button.
- **Per-screen tinting** — each phone gets its own gradient wash (the pink,
  green and lilac screens in the Slack campaign look), light or dark.
- **Screens are authored at 390px** — the real iPhone logical width — then scaled
  into the frame, so every type size is a true mobile type size.
- **Accessible output** — `aria-roledescription="carousel"`, per-screen labels, a
  polite live region announcing the front screen, focusable stage with
  Arrow/Home/End keys, and `prefers-reduced-motion` support (no auto-spin, no
  entrance, instant moves).

## Running the builder

It's a static app — any static file server works:

```bash
npx serve .            # or:
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Refreshing always resets to the demo project. Use **Save** / **Import** in the
top bar to download or restore a `.wheelie.json` project file — that's how you
keep work across sessions and share setups with teammates.

## Deploying the builder to Vercel

It's a static site — no build step, no `package.json`, nothing to install. The
repo ships a `vercel.json` that turns framework detection off, serves the repo
root, and sends `must-revalidate` on HTML/CSS/JS so a new deploy is never served
from a stale cache (the filenames aren't content-hashed).

**Git import (recommended — you get a deploy on every push, plus preview URLs):**

1. [vercel.com/new](https://vercel.com/new) → *Import Git Repository* →
   `andyacevedodesign-del/wheelie-phone`.
2. Leave everything alone. Framework Preset: **Other**. Build Command, Output
   Directory and Install Command all stay empty — `vercel.json` covers them.
3. **Deploy.**

Vercel builds the repo's default branch as production and gives every other
branch a preview URL.

**Vercel CLI, from the repo root:**

```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production
```

Answer *no* to "Want to modify these settings?" — the defaults plus
`vercel.json` are already right.

You're deploying the **builder tool** for your team to use. The carousels it
produces don't need Vercel — they're exported as embeddable code you paste
wherever the component lives.

## Using the export

Click **Export code** in the top bar:

| Tab | What you get |
|---|---|
| **Embed snippet** | One block of HTML + scoped CSS + GSAP script tags + runtime JS. Paste into a Webflow Embed element or any CMS "custom HTML" block. |
| **Standalone HTML** | A complete page — open it in a browser or hand it off as a demo. |
| **HTML / CSS / JS** | The three parts separately, if you prefer to place them in different files. |

The CSS is scoped under the component's ID (derived from your project name), so
it won't fight the host page's styles. Two carousels on one page need two
different project names so their IDs differ.

**What the export loads:** GSAP core from jsDelivr, plus Draggable and
InertiaPlugin when dragging and inertia are on (every GSAP plugin is free since
3.13). three.js is fetched by the runtime itself via dynamic `import()` from
jsDelivr's `/+esm` endpoint — no import map to collide with the host page — and
only when the three.js engine is selected. If any of that fails the wheel drops
to CSS 3D transforms and keeps working.

## Controls the visitor gets

| Input | What happens |
|---|---|
| Drag / swipe | Spins the wheel, with inertia on release |
| Click a side phone | Spins it to the front |
| Mouse wheel / trackpad | Steps one phone |
| ← → | Steps one phone (Home / End jump to the ends) |
| Dots | Jump to a screen |

## Project structure

```
index.html        The builder shell
builder.css       Builder UI styles (dark editor chrome)
js/state.js       Project model, demo project, pub/sub store
js/generator.js   HTML/CSS/JS generation — preview and export share it
js/ui.js          Left panel (screens + messages) and the inspector
js/export.js      Export modal: copy/download in every format
js/main.js        Bootstrapping, preview iframe, top bar
vercel.json       Vercel static-deploy config
```

The preview iframe runs the *exact* code the export produces, so the canvas is
never lying to you.

## The runtime, in one paragraph

Everything is driven by a single number: `state.angle`. `render()` walks the
phones, and for phone `i` at `i * step + angle` computes its position on the
circle, how far forward it is (`t`, 1 at the front, 0 at the back), and from
that its scale, opacity and blur. A *placer* then applies that — either into a
three.js `CSS3DObject` or straight onto a CSS transform. Drag, inertia, tweens,
keys and auto-spin all do the same thing: move `angle` and call `render()`.
