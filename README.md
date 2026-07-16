# Owner hub — clickable prototype

A static HTML prototype of the Immoweb owner hub / property estimation flow, rebuilt
from the Figma designs. No build step, no dependencies — three files and a `vercel.json`.

```
index.html    all screens, as sections
styles.css    design tokens + components
app.js        router + interactions
vercel.json   headers + clean URLs
```

## Run locally

Any static server works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` directly via `file://` also works.

## Deploy

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Owner hub prototype"
   git branch -M main
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```

2. **Import into Vercel** — vercel.com → *Add New… → Project* → pick the repo.
   Framework preset: **Other**. Leave build command and output directory empty.
   Vercel serves the repo root as-is. Every push to `main` redeploys.

3. **Custom domain** — Project → *Settings → Domains* → add your domain, then at
   your registrar either:
   - point an `A` record for the apex to `76.76.21.21`, or
   - point a `CNAME` for a subdomain (e.g. `proto.yourdomain.com`) to `cname.vercel-dns.com`.

   TLS is issued automatically once DNS resolves.

## Deep links

Every screen has a hash route, so you can share a single screen:

```
/#estimation        My estimation (full)
/#preview           Estimation preview (locked)
/#refine-hub        Get a sharper estimate
/#basics-condition  Refine › Basics › condition
```

The full list is in the **Jump to** dropdown, bottom-left on desktop.

## How it's put together

**One screen visible at a time.** Each screen is a `<section class="screen">` inside the
`.device` frame; `app.js` toggles `.is-active`. No page reloads, so the sticky bars never
flash or re-render.

**Sticky bars are structural, not `position: fixed`.** Each screen is a flex column of
`header → .scroll → footer`. The scroll area is the only thing that scrolls, so:

- the **bottom nav** (Home / Search / Saves / My immo / Profile) stays pinned on the
  My immo screens,
- the wizard's **Back / Next footer** stays pinned on every refine step,
- the grey app header stays pinned at the top.

This also means iOS URL-bar resize can't detach the bars, which `position: fixed` suffers from.

**The bottom nav is defined once** (`NAV` in `app.js`) and injected into any screen carrying
`data-nav-bar`. Add a screen to the tab bar by giving it `data-nav="<id>"` and an empty
`<nav class="bottom-nav" data-nav-bar></nav>`.

**State, not duplicate screens.** The Figma export contains ~50 PNGs, but many are state
variants of the same screen (empty vs filled, locked vs unlocked, section not-started vs
completed). Those are handled by JS state rather than 50 copies of the markup — 22 real screens.

**The estimate moves as you refine.** Completing a refine section tightens the range
(€453 000 → €472 000 → €491 000), swaps the navy card's copy to "Estimate refined with last
property details", and flips the section badge to Completed — matching the design variants.

## Things to know

- **Font.** The Figma file uses Immoweb's brand face; the PDF ships it as outlines so it
  couldn't be extracted. The prototype loads **Plus Jakarta Sans** as the closest free match.
  Swap it by changing `--font` in `styles.css` (one place, everything follows).
- **Maps and the agent logos are placeholders.** Inline SVG stands in for the Figma map
  screenshots. Drop in a Mapbox/Google static image when you have a key.
- **iOS keyboards and status bars from the designs are not rendered** — those were Figma
  mockups of OS chrome. Real inputs open the real keyboard.
- **The `.proto-bar` jump menu is prototype scaffolding.** Delete that block from
  `index.html` (and `initJump` in `app.js`) before any dev handoff.
