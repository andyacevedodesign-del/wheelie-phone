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
- **Spacing you control separately from depth** — radius sets the ring, then
  *Spread across* and *Spread back* stretch it into an ellipse. Push the phones
  apart sideways without sending them further away, or flatten the wheel toward
  a flat lineup while keeping the gaps.
- **Off-stage cards (a toggle)** — phones that aren't out front can hand over to
  a flat image card, so the wheel reads as one live phone flanked by photos,
  then become a phone again as they spin forward. Each screen picks its own
  image (URL or upload), with a size and a vertical nudge so a row of cards
  doesn't line up like a grid. Off by default: leave it and every phone stays a
  phone the whole way round. Four ways to make the hand-over:
  - **Cross-fade** — the two faces dissolve into each other.
  - **Morph** — the phone shrinks to the card's footprint on its way out while
    the card grows from it, so one *becomes* the other.
  - **Flip** — two sides of one card, turned on Y.
  - **Hard swap** — a clean cut at the midpoint.
- **Isometric tilt** — the devices off to the sides turn away from the viewer,
  mirrored left and right, ramping in as each one leaves the front. Turn, pitch
  and roll are yours to set, and *Front keeps* decides how much of the tilt the
  centre device holds on to (0 keeps the one you're meant to read flat on).
- **WebGL extrusion** — real thickness. Each device gets a rounded-rectangle
  prism extruded in three.js and rendered behind the DOM screens with the same
  camera, so a tilted phone shows its side wall and the screen stays live text.
  Depth ramps with distance from the front (the centre device can stay thin),
  and the slab tracks whichever face is showing, card or phone. Needs the
  three.js engine — it shares that scene's camera.
- **Real 3D, two engines**
  - **three.js** (default) — a genuine 3D scene: a perspective camera, a ring
    `Group`, and `CSS3DRenderer`, so the wheel has true perspective while every
    screen stays live, selectable, accessible DOM instead of a baked texture.
  - **CSS 3D transforms** — the lightweight option, and the automatic fallback
    if three.js can't load.
- **Background, or none at all** — the stage takes a gradient, a solid colour, an
  image, or **None**, which paints nothing: the component sits on whatever the
  host page has behind it and exports over transparency. The builder's
  *Checkerboard* page background makes that easy to check.
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

## Exporting a PNG

**Export PNG** in the top bar saves the wheel exactly as the canvas has it right
now — the screen that's out front, the spin, the tilt, the off-stage cards and
the WebGL thickness — at 1×, 2× or 3×, with a **transparent background** by
default (it drops the stage colour and the shader backdrop; the phones keep
their own).

It works by serialising the component into an `<svg><foreignObject>` and letting
the browser rasterise it with its own engine, because the usual DOM-to-canvas
libraries flatten 3D transforms and this whole thing is 3D transforms. Two
things a DOM clone can't carry are patched in first: canvas pixels (the runtime
re-draws each WebGL layer and hands back a still — the drawing buffer is cleared
on composite, so it has to draw and read back without yielding), and anything
loaded over the network, since an SVG rendered as an image won't fetch external
resources. Images, CSS `url()`s and the Lato webfont are fetched and inlined as
data URIs first.

Measured against a live screenshot of the same scene, both engines come back at
0.4–0.9 mean channel difference out of 255, with ~0.1% of pixels off by more
than 40 — that's antialiasing, not layout.

Two things to know:

- **Hosted images need CORS.** Anything the browser can't read across origins is
  left out of the PNG and the status line says how many — upload those images in
  the inspector instead and they're inlined from the start.
- **Lato is embedded best-effort.** If Google Fonts can't be reached the export
  still saves, in the fallback sans.

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

With off-stage cards on, clicking a card spins that screen forward and the card
becomes the phone on the way in. The hand-over window is yours to set — *Card
holds until* / *Phone fully back by*, both measured in front-ness, where 1 is
dead centre of the wheel. Widen it (drop *Card holds until* toward 0) to stretch
a morph across more of the spin; narrow it for a snappier swap.

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

## Layers, front to back

A phone is a stack, and each layer is doing a different job:

| Layer | What it is |
|---|---|
| The screen | Live DOM — real text, real markup, selectable and readable by a screen reader |
| The card | A flat `<img>` that the phone hands over to off-stage |
| The slab | A three.js prism in WebGL, behind the screens, giving the device thickness |
| The backdrop | A full-stage GLSL shader — drifting mesh gradient or aurora |

Both engines place phones from the same ellipse, point for point — the three.js
scene positions each device per frame rather than spinning a group, because
rotating a group would turn the ellipse instead of travelling along it. The
camera moves with the depth spread so the front device keeps its size.

The slab renders behind the whole CSS3D layer, which is what makes the rim show
*around* each device rather than over it. The trade-off: it can't interleave
with a device that sits in front of it in the scene, so if you push the radius
in far enough for devices to overlap, a slab can read as behind a neighbour it
should be in front of. Widen the radius or thin the depth if you see it.

## The runtime, in one paragraph

Everything is driven by a single number: `state.angle`. `render()` walks the
phones, and for phone `i` at `i * step + angle` computes its position on the
circle, how far forward it is (`t`, 1 at the front, 0 at the back), and from
that its scale, opacity and blur. A *placer* then applies that — either into a
three.js `CSS3DObject` or straight onto a CSS transform. Drag, inertia, tweens,
keys and auto-spin all do the same thing: move `angle` and call `render()`.
