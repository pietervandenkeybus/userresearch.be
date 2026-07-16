# Immoweb Owner Hub — clickable prototype

A static, low-fidelity prototype of the Immoweb Owner Hub and its property-estimation
onboarding flow, built from **Owner Hub Logic Proto.pdf**. Interface language is
Dutch (Belgium), informal *je/jouw*.

No build step, no backend, no external APIs, no map API, no webfonts. Open it and it works —
including fully offline.

```
index.html    shell + inline SVG icon sprite
styles.css    low-fidelity Immoweb-inspired styling
ui.js         reusable render helpers (header, nav, action bar, cards, fields, counters, …)
data.js       all Dutch copy and mock values, in one place
screens.js    one render function per screen
app.js        state, hash router, actions, validation, localStorage
```

## Running it

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000     # → http://localhost:8000
```

Designed for a ~390 px mobile viewport, centred on a neutral desktop background.
Everything works with mouse and physical keyboard — there are no swipe-only
interactions and no simulated on-screen keyboard.

## Resetting

Three ways, all documented and all outside the Immoweb interface:

- the **“Prototype opnieuw starten”** button in the grey bar above the phone
- the URL parameter **`?reset=true`**

Reset clears localStorage, the fake account and the saved property, and returns to
the empty Owner Hub.

## Starting at a specific state

Use the **Startscherm** dropdown in the grey bar, or the `?start=` parameter:

| URL | State |
|---|---|
| `?start=owner-hub-empty` | Empty Owner Hub |
| `?start=address-search` | Estimation flow, at the address step |
| `?start=estimate-result-locked` | Locked estimate result |
| `?start=owner-hub-property` | Owner Hub with the property registered |
| `?start=estimate-section-overview` | Detailed-estimation overview |
| `?start=estimate-result-refined` | Refined estimate (€ 491.000) |

`?start=` seeds the minimum state each entry point needs. Any screen id also works as a
hash route, e.g. `#interior-amenities`.

## How state is stored

One central object in `app.js`, mirrored to `localStorage` under
`immoweb-owner-hub-proto` on every change. It holds the current screen, previous-screen
history, sign-in status, account details, the selected address, property facts, the
initial and refined estimates, the selling intention, completed sections, every form
answer and the notification preferences. Refreshing the page restores exactly where you
were.

## The two branches — the important bit

The PDF contains **two rows of wireframes. They are not duplicates.** They are two
branches of the same flow, and the prototype reproduces both:

| | **Row 1** — entered via “Voeg je woning toe” or “+” | **Row 2** — entered via “Schatten” |
|---|---|---|
| `state.claimed` | `true` | `false` |
| Owner Hub, “Mijn woning” | holds the property card | keeps its empty state |
| Owner Hub, “Schattingen” | shows the “Schat je woning gratis” CTA | holds the property card |
| Refined result, footer | **only** “Plaats op Immoweb” | “Plaats op Immoweb” **and** “Claim deze woning” |

In row 2, “Claim deze woning” is the one route that moves the property into “Mijn woning”,
which is exactly where the PDF’s extra bottom-right Owner Hub screen comes from.

## Account gating

Before the account exists, the estimate result keeps the indicated areas locked: the low
and high ends of the range, the market statistics, the price-trend chart and the
market-activity map. They stay visible but blurred, behind a lock icon.

Per the sticky note on the board — *“Areas intentionally shown as locked to entice user to
click on them to make an account”* — every one of those locked areas is clickable and
leads to the account-benefits screen, as do “Verfijn mijn schatting” and
“Bekijk alle inzichten”. That is five separate routes into account creation, matching the
five arrows in the PDF.

## Intentionally disabled

The wireframes give these no destination, so they are inert: visible for realism, marked
`aria-disabled`, and they route nowhere.

- Bottom navigation: **Home, Zoeken, Favorieten, Profiel** (only **Mijn Immo** works)
- **Vind een kantoor in de buurt**
- **Plaats een zoekertje** / “Aanmaken”
- **Vertrouw je verkoop toe aan een expert**
- **Download het volledige rapport**
- **Verwijder deze schatting**
- **Plaats op Immoweb**
- **Gebruik mijn huidige locatie**
- The notifications bell and the share icon
- **Hoe we onze schattingen berekenen en beoordelen**
- **Opnieuw versturen** on the SMS-code screen

Separately, primary actions are *disabled* — a different thing — while required
information is missing. That is a state, not a dead end: fill the fields and the button
activates.

## Deterministic values

Nothing is randomised.

| | |
|---|---|
| Initial estimate | € 453.000 (range € 440.000 – € 465.000) |
| After one section | € 472.000 |
| Refined estimate | € 491.000 (range € 478.000 – € 501.000) |
| Nearby average | € 442.500 |
| 12-month price trend | +6,4% |
| Demand | Hoog |
| Days on market | 28 dagen |
| Example property | Statiestraat 15, 2000 Antwerpen, Vlaanderen |

Currency is formatted Belgian-style via `Intl.NumberFormat('nl-BE')` → `€ 453.000`.

## Deviations from the suggested screen list, and why

- **`energy-features` is not a separate screen.** The PDF keeps heating type and the extra
  energy features on one screen: picking a heating type reveals the checklist below it.
  The id still resolves, as an alias of `energy-heating`.
- **`estimate-result-refined` is the same screen as `estimate-detail`.** Refined is a
  *state* of that screen, not a different screen. Both ids work as routes; `?start=` seeds
  the refined variant.
- **`address-results` is the same screen as `address-search`** — suggestions appear in
  place as you type, which is what the wireframes show.
- **Immoweb blue.** The wireframes use `#000924` throughout for primary actions, so that
  is what `--blue` is set to. Change it in one place in `styles.css` if the brand value
  differs.

## Simulated

All estimates, market data, agencies, accounts and SMS codes are fake and hard-coded.
No SMS is sent, no request leaves the page, and nothing is transmitted or stored
externally. The only persistence is your own browser's localStorage.
