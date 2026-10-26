# Immoweb Seeker Day 2 prototypes

Two clickable concept prototypes for user research sessions. Static site, no build step.
Not live Immoweb features. Sample data only, nothing is sent or stored.

## Structure
- `/` start page with links per prototype and language
- `/cdp/nl/`, `/cdp/fr/`, `/cdp/en/` listing detail page (designs as images, tap areas on top, NL and FR drawn as text overlays)
- `/hub/nl/`, `/hub/fr/`, `/hub/en/` collaboration hub (HTML, translated at runtime from `hub/i18n.js`)

## Deploy on Vercel
1. Push this folder to a GitHub repository.
2. In Vercel: Add New Project, import the repository. Framework preset: Other. No build command. Output directory: `.` (root).
3. Settings, Domains: add your domain.
4. Recommended: Settings, Deployment Protection, turn on password protection so the site is not public.

Every push to the main branch redeploys.

## On the test phones
Open the language link in Safari or Chrome, then Add to Home Screen. Bookmark one link per language per prototype.

## For the moderator
- Hub: restart and other shortcuts are in the Profile tab, in the purple TEST blocks. Adding `#shared` to the URL opens the shared list directly.
- CDP: `?debug` after the URL shows the tap areas.

## Updating
- Hub texts: edit `hub/i18n.js` (English, Dutch, French per line).
- CDP screens: replace the PNGs in `cdp/img/`. CDP translations: `cdp/translations.py` (main page) and `cdp/sheets_i18n.py` (the sheets) regenerate `cdp/ov.json`; paste it into `cdp/index.html` where `const OV` is defined.
