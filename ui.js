/* ==========================================================================
   ui.js — reusable rendering helpers.
   Every helper returns an HTML string. Screens compose these rather than
   hand-writing markup, so the header / nav / action bar / cards / fields /
   counters / progress / estimate card exist in exactly one place each.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- escaping --------------------------------------------------------- */
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---- Belgian number / currency formatting -----------------------------
     € 453.000 — dot as thousands separator, comma as decimal.             */
  const nlNum = n => new Intl.NumberFormat('nl-BE').format(n);
  const euro  = n => '€ ' + nlNum(n);

  /* ---- icon ------------------------------------------------------------- */
  function icon(id, cls) {
    return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
  }

  /* ======================================================================
     Header — the compact mobile header.
     variant: 'app'   grey bar with centred title (Mijn Immo, Mijn schatting)
              'sheet' modal sheet header with grab handle (Schat je woning)
              'plain' white bar carrying only a back arrow / Opslaan en afsluiten
     ====================================================================== */
  function header(opts) {
    const o = opts || {};
    const left = o.back
      ? `<button type="button" class="icon-btn" data-act="${esc(o.back)}" aria-label="Terug">${icon('i-back')}</button>`
      : o.close
        ? `<button type="button" class="icon-btn" data-act="${esc(o.close)}" aria-label="Sluiten">${icon('i-close')}</button>`
        : '';

    const right = (o.actions || []).map(a =>
      a.disabled
        ? `<span class="icon-btn is-disabled" aria-disabled="true" title="${esc(a.label)}">${icon(a.icon)}</span>`
        : `<button type="button" class="icon-btn" data-act="${esc(a.act)}" aria-label="${esc(a.label)}">${icon(a.icon)}</button>`
    ).join('');

    if (o.variant === 'sheet') {
      return `<header class="hdr hdr--sheet">
        <span class="hdr__grab" aria-hidden="true"></span>
        <div class="hdr__left">${left}</div>
        <h1 class="hdr__title">${esc(o.title || '')}</h1>
        <div class="hdr__right">${right}</div>
      </header>`;
    }
    if (o.variant === 'plain') {
      return `<header class="hdr hdr--plain">
        <div class="hdr__left">${o.saveExit
          ? `<button type="button" class="save-exit" data-act="${esc(o.saveExit)}">${icon('i-close', 'ic--sm')} Opslaan en afsluiten</button>`
          : left}</div>
      </header>`;
    }
    return `<header class="hdr hdr--app">
      <div class="hdr__left">${left}</div>
      <h1 class="hdr__title">${esc(o.title || '')}</h1>
      <div class="hdr__right">${right}</div>
    </header>`;
  }

  /* ======================================================================
     Bottom navigation. Rendered from DATA.NAV; only "Mijn Immo" is active.
     Inert items get aria-disabled and never route anywhere.
     ====================================================================== */
  function bottomNav() {
    const items = global.DATA.NAV.map(n => n.active
      ? `<button type="button" class="nav-item is-current" data-act="nav-myimmo" aria-current="page">
           ${icon(n.icon, 'ic--sm nav-item__icon')}<span>${esc(n.label)}</span>
         </button>`
      : `<span class="nav-item is-inert" aria-disabled="true" title="Niet beschikbaar in dit prototype">
           ${icon(n.icon, 'ic--sm nav-item__icon')}<span>${esc(n.label)}</span>
         </span>`
    ).join('');
    return `<nav class="bottom-nav" aria-label="Hoofdnavigatie">${items}</nav>`;
  }

  /* ======================================================================
     Sticky action bar at the bottom of a screen.
     Optionally carries a progress indicator along its top edge.
     ====================================================================== */
  function actionBar(opts) {
    const o = opts || {};
    const progress = typeof o.progress === 'number'
      ? progressBar(o.progress)
      : '';
    const back = o.back
      ? `<button type="button" class="btn-back" data-act="${esc(o.back)}">${icon('i-back', 'ic--sm')} Terug</button>`
      : '';
    const buttons = (o.buttons || []).map(b => button(b)).join('');
    const cls = 'action-bar' + (o.back ? '' : ' action-bar--end') + (o.stack ? ' action-bar--stack' : '');
    return `<div class="${cls}">${progress}${back}<div class="action-bar__main">${buttons}</div></div>`;
  }

  /* ======================================================================
     Progress indicator (0-100).
     ====================================================================== */
  function progressBar(pct) {
    const v = Math.max(0, Math.min(100, Math.round(pct)));
    return `<div class="progress" role="progressbar" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"
                 aria-label="Voortgang van dit onderdeel">
      <div class="progress__bar" style="width:${v}%"></div>
    </div>`;
  }

  /* ======================================================================
     Button. `disabled: true` renders a real disabled button with a visible
     disabled state and aria-disabled, per the prompt.
     ====================================================================== */
  function button(o) {
    const cls = ['btn', 'btn--' + (o.variant || 'primary')];
    if (o.block) cls.push('btn--block');
    if (o.small) cls.push('btn--sm');
    const lock = o.lock ? ' ' + icon('i-lock', 'ic--sm') : '';
    const lead = o.icon ? icon(o.icon, 'ic--sm') + ' ' : '';

    // "inert" = looks real, but the wireframes give it no destination.
    // It never carries data-act, so it can never route anywhere.
    if (o.inert) {
      return `<button type="button" class="${cls.join(' ')} is-inert" aria-disabled="true"
        title="Niet beschikbaar in dit prototype">${lead}${esc(o.label)}${lock}</button>`;
    }

    // Note: data-act is always present, including while disabled. Disabling is
    // a *state* (required info missing), not a change of destination — and the
    // click handler ignores disabled elements anyway. Keeping the attribute
    // lets the gate refresh in app.js re-enable a button without a re-render.
    return `<button type="button" class="${cls.join(' ')}" data-act="${esc(o.act)}"
      ${o.value ? `data-value="${esc(o.value)}"` : ''}
      ${o.disabled ? 'disabled aria-disabled="true"' : ''}
      ${o.disabled && o.title ? `title="${esc(o.title)}"` : ''}>${lead}${esc(o.label)}${lock}</button>`;
  }

  /* ======================================================================
     Selection cards.
     radioCard  — one-of-many, big card with icon + title + description
     tile       — one-of-many, compact tile (property type / kind / facades)
     checkRow   — many-of-many checkbox row
     ====================================================================== */
  function radioCard(o) {
    return `<button type="button" role="radio" aria-checked="${o.selected ? 'true' : 'false'}"
      class="choice${o.selected ? ' is-selected' : ''}" data-act="${esc(o.act)}" data-value="${esc(o.value)}">
      <span class="choice__icon">${icon(o.icon || 'i-dots', 'ic--sm')}</span>
      <span class="choice__text">
        <span class="choice__title">${esc(o.label)}</span>
        ${o.sub ? `<span class="choice__sub">${esc(o.sub)}</span>` : ''}
      </span>
      <span class="choice__mark" aria-hidden="true">${icon('i-check', 'ic--xs')}</span>
    </button>`;
  }

  function radioGroup(o) {
    return `<div class="stack" role="radiogroup" aria-label="${esc(o.label)}">
      ${o.options.map(opt => radioCard({
        act: o.act, value: opt.value, label: opt.label, sub: opt.sub,
        icon: opt.icon, selected: o.selected === opt.value
      })).join('')}
    </div>`;
  }

  // Options without a meaningful icon (e.g. "3 gevels") render text-only
  // rather than falling back to a filler glyph.
  function tile(o) {
    return `<button type="button" role="radio" aria-checked="${o.selected ? 'true' : 'false'}"
      class="tile${o.stacked ? ' tile--stacked' : ''}${o.selected ? ' is-selected' : ''}${o.icon ? '' : ' tile--text'}"
      data-act="${esc(o.act)}" data-value="${esc(o.value)}">
      ${o.icon ? icon(o.icon, o.stacked ? '' : 'ic--sm') : ''}
      <span>${esc(o.label)}</span>
    </button>`;
  }

  function tileGroup(o) {
    return `<div class="tile-grid" role="radiogroup" aria-label="${esc(o.label)}">
      ${o.options.map(opt => tile({
        act: o.act, value: opt.value, label: opt.label, icon: opt.icon,
        stacked: o.stacked, selected: o.selected === opt.value
      })).join('')}
    </div>`;
  }

  function checkRow(o) {
    return `<button type="button" role="checkbox" aria-checked="${o.checked ? 'true' : 'false'}"
      class="check${o.checked ? ' is-checked' : ''}" data-act="${esc(o.act)}" data-value="${esc(o.value)}">
      <span class="box" aria-hidden="true">${icon('i-check', 'ic--xs')}</span>
      ${o.icon ? `<span class="check__icon">${icon(o.icon, 'ic--sm')}</span>` : ''}
      <span>${esc(o.label)}</span>
    </button>`;
  }

  /* ======================================================================
     Form fields.
     ====================================================================== */
  let uid = 0;
  const nextId = () => 'f' + (++uid);

  function field(o) {
    const id = o.id || nextId();
    const suffix = o.suffix ? `<span class="field__suffix" aria-hidden="true">${esc(o.suffix)}</span>` : '';
    return `<div class="field${o.suffix ? ' field--suffix' : ''}">
      <label class="field__label" for="${id}">${esc(o.label)}${o.optional ? ' <span class="field__opt">(optioneel)</span>' : ''}</label>
      <input class="input" id="${id}" name="${esc(o.name || id)}"
        type="${o.type || 'text'}"
        ${o.inputmode ? `inputmode="${o.inputmode}"` : ''}
        ${o.autocomplete ? `autocomplete="${o.autocomplete}"` : ''}
        ${o.placeholder ? `placeholder="${esc(o.placeholder)}"` : ''}
        ${o.value ? `value="${esc(o.value)}"` : ''}
        ${o.readonly ? 'readonly' : ''}
        data-model="${esc(o.model || '')}">
      ${suffix}
      ${o.help ? `<p class="field__help">${esc(o.help)}</p>` : ''}
    </div>`;
  }

  function selectField(o) {
    const id = o.id || nextId();
    const opts = ['<option value="">Maak een keuze</option>']
      .concat(o.options.map(v => {
        const val = typeof v === 'string' ? v : v.value;
        const lab = typeof v === 'string' ? v : v.label;
        return `<option value="${esc(val)}"${o.value === val ? ' selected' : ''}>${esc(lab)}</option>`;
      })).join('');
    return `<div class="field">
      <label class="field__label" for="${id}">${esc(o.label)}</label>
      <select class="select${o.value ? '' : ' is-placeholder'}" id="${id}" data-model="${esc(o.model || '')}">${opts}</select>
    </div>`;
  }

  /* A faux select that opens a bottom sheet — matches the wireframes for
     "Energieprestatie" and "Type verwarming". */
  function sheetSelect(o) {
    return `<button type="button" class="select-trigger${o.value ? '' : ' is-placeholder'}"
      data-act="${esc(o.act)}" aria-haspopup="dialog">
      <span>${esc(o.value || 'Maak een keuze')}</span>
      ${icon('i-chevron-down', 'ic--sm')}
    </button>`;
  }

  function passwordField(o) {
    const id = o.id || nextId();
    return `<div class="field">
      <label class="field__label" for="${id}">${esc(o.label)}</label>
      <div class="pw">
        <input class="input" id="${id}" type="password" autocomplete="new-password"
          ${o.placeholder ? `placeholder="${esc(o.placeholder)}"` : ''}
          ${o.value ? `value="${esc(o.value)}"` : ''}
          data-model="${esc(o.model || '')}">
        <button type="button" class="pw__eye" data-act="toggle-pw" data-value="${id}"
          aria-label="Toon of verberg wachtwoord">${icon('i-eye', 'ic--sm')}</button>
      </div>
      ${o.error ? `<p class="field__error">${esc(o.error)}</p>` : ''}
    </div>`;
  }

  /* ======================================================================
     Counter (Kamers / Slaapkamers / ...). Minimum is 0; the value is always
     visible as text, never colour-only.
     ====================================================================== */
  function counter(o) {
    return `<div class="counter-row">
      <span class="counter-row__label">
        ${esc(o.label)}
        ${o.info ? `<span class="hint" title="${esc(o.info)}">${icon('i-info', 'ic--xs')}</span>` : ''}
      </span>
      <div class="counter" role="group" aria-label="${esc(o.label)}">
        <button type="button" data-act="${esc(o.act)}" data-value="${esc(o.name)}:-1"
          aria-label="${esc(o.label)}: één minder" ${o.value <= (o.min || 0) ? 'disabled aria-disabled="true"' : ''}>
          ${icon('i-minus', 'ic--sm')}
        </button>
        <output aria-live="off">${o.value == null ? '–' : o.value}</output>
        <button type="button" data-act="${esc(o.act)}" data-value="${esc(o.name)}:1"
          aria-label="${esc(o.label)}: één meer">${icon('i-plus', 'ic--sm')}</button>
      </div>
    </div>`;
  }

  /* ======================================================================
     Estimate card — the dark hero. Handles three states:
       locked   : range hidden behind lock chips, CTA leads to account
       plain    : full range, "Wil je een nauwkeurigere schatting?"
       refined  : full range, "Schatting verfijnd met je laatste gegevens"
     ====================================================================== */
  function estimateCard(o) {
    const e = o.estimate;
    const range = o.locked
      ? `<span class="lock-chip">${icon('i-lock', 'ic--sm')}</span>
         <span class="est__dash">—</span>
         <span class="est__mid">${euro(e.mid)}</span>
         <span class="est__dash">—</span>
         <span class="lock-chip">${icon('i-lock', 'ic--sm')}</span>`
      : `<span class="est__side"><b>${euro(e.low)}</b><span>Laag</span></span>
         <span class="est__dash">—</span>
         <span class="est__mid">${euro(e.mid)}</span>
         <span class="est__dash">—</span>
         <span class="est__side"><b>${euro(e.high)}</b><span>Hoog</span></span>`;

    let foot;
    if (o.state === 'refined') {
      foot = `<p class="est__refined">${icon('i-check-circle', 'ic--sm')}
        <span>Schatting verfijnd met je laatste gegevens.<br>Laatste update 3 juli.</span></p>
        ${button({ label: 'Verfijn mijn schatting', variant: 'soft-dark', small: true, act: 'go:estimate-section-overview' })}`;
    } else if (o.locked) {
      foot = `<p class="est__q">Wil je een nauwkeurigere schatting?</p>
        <p class="est__body">Maak een gratis account om de gegevens van je woning te verfijnen en de marge hierboven te verkleinen. Je ziet ook precies hoe we tot dit bedrag komen.</p>
        ${button({ label: 'Verfijn mijn schatting', variant: 'soft-dark', small: true, act: 'go:account-benefits', lock: true })}`;
    } else {
      foot = `<p class="est__q">Wil je een nauwkeurigere schatting?</p>
        <p class="est__body">Hoe meer we over je woning weten, hoe scherper je schatting. Vul je gegevens aan of pas ze aan om de marge hierboven te verfijnen.</p>
        ${button({ label: 'Verfijn mijn schatting', variant: 'soft-dark', small: true, act: 'go:estimate-section-overview' })}`;
    }

    return `<section class="est">
      <h2 class="est__label">Geschatte waarde van je woning</h2>
      <div class="est__row">${range}</div>
      <p class="est__rent">Geschatte huur: ${euro(e.rent)}/maand</p>
      ${o.locked ? '' : `<button type="button" class="est__link is-inert" aria-disabled="true"
          title="Niet beschikbaar in dit prototype">Hoe we onze schattingen berekenen en beoordelen ${icon('i-chevron-right', 'ic--xs')}</button>`}
      <hr class="est__hr">
      ${foot}
    </section>`;
  }

  /* ======================================================================
     Address line shown under the header on the estimate screens.
     ====================================================================== */
  function addressLine(meta) {
    const P = global.DATA.PROPERTY;
    return `<div class="addr-line">
      ${icon('i-pin', 'ic--sm')}
      <span>
        <span class="addr-line__street">${esc(P.short)}</span>
        <span class="addr-line__meta">${esc(meta)}</span>
      </span>
    </div>`;
  }

  /* ======================================================================
     Status badge for the refine sections.
     Uses an icon + text, never colour alone.
     ====================================================================== */
  function statusBadge(status) {
    if (status === 'done') {
      return `<span class="badge badge--done">${icon('i-check-circle', 'ic--xs')} Voltooid</span>`;
    }
    if (status === 'progress') {
      return `<span class="badge badge--progress"><span class="badge__dot"></span> Bezig</span>`;
    }
    return `<span class="badge"><span class="badge__dot"></span> Nog niet gestart</span>`;
  }

  /* ======================================================================
     Price-trend chart — inline SVG, no chart library, no network.
     ====================================================================== */
  function trendChart(locked) {
    const M = global.DATA.MARKET;
    const W = 330, H = 190, padL = 44, padR = 8, padT = 12, padB = 26;
    const min = 410, max = 500;
    const x = i => padL + (i / (M.trendPoints.length - 1)) * (W - padL - padR);
    const y = v => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
    const grid = [500, 470, 450, 430, 410].map(v =>
      `<line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="#E5E8F0"/>
       <text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" font-size="9" fill="#63697B">${v}k</text>`).join('');
    const line = M.trendPoints.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
    const dots = M.trendPoints.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="#133dbd"/>`).join('');
    const labels = M.trendLabels.map((l, i) =>
      `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="8" fill="#63697B">${esc(l)}</text>`).join('');
    return `<svg class="chart${locked ? ' is-locked' : ''}" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="Prijstrend van de laatste twaalf maanden">
      ${grid}<path d="${line}" fill="none" stroke="#133dbd" stroke-width="2" stroke-linejoin="round"/>${dots}${labels}
    </svg>`;
  }

  /* ======================================================================
     Static map illustration — a drawing, not a map API.
     ====================================================================== */
  function mapIllustration(opts) {
    const o = opts || {};
    const pins = o.activity
      ? `<g fill="#133dbd">
           ${[[90, 40], [185, 34], [215, 58], [130, 78], [285, 62], [215, 98]].map(([px, py]) =>
             `<path d="M${px} ${py}a9 9 0 0 0-9 9c0 7 9 17 9 17s9-10 9-17a9 9 0 0 0-9-9Z"/>`).join('')}
         </g>`
      : `<g transform="translate(158,72)" fill="#133dbd">
           <path d="M12 0a12 12 0 0 0-12 12c0 9 12 22 12 22s12-13 12-22A12 12 0 0 0 12 0Z"/>
           <circle cx="12" cy="12" r="4.5" fill="#fff"/>
         </g>`;
    return `<svg class="map${o.locked ? ' is-locked' : ''}" viewBox="0 0 340 ${o.h || 170}" role="img"
      aria-label="${o.activity ? 'Illustratie van de marktactiviteit in de buurt' : 'Kaartillustratie van de gekozen woning'}">
      <rect width="340" height="${o.h || 170}" fill="#F2F3F6"/>
      <g stroke="#DDE0E7" stroke-width="7" fill="none">
        <path d="M-10 40 L 350 70"/><path d="M90 -10 L 120 190"/><path d="M-10 130 L 350 112"/>
      </g>
      <g stroke="#fff" stroke-width="2.5" fill="none">
        <path d="M-10 40 L 350 70"/><path d="M90 -10 L 120 190"/><path d="M-10 130 L 350 112"/>
      </g>
      <g fill="#D7DAE3">
        <rect x="20" y="88" width="44" height="28" rx="2"/><rect x="170" y="20" width="48" height="26" rx="2"/>
        <rect x="240" y="120" width="56" height="30" rx="2"/><rect x="196" y="82" width="36" height="22" rx="2"/>
      </g>
      ${pins}
    </svg>`;
  }

  /* ======================================================================
     Sponsored agent cards.
     ====================================================================== */
  function agentCards() {
    return `<div class="agents">${global.DATA.AGENTS.map(a => `
      <div class="agent">
        <div class="agent__logo" aria-hidden="true"></div>
        <p class="agent__name">${esc(a.name)}</p>
        <p class="agent__meta">${esc(a.meta)}</p>
        <p class="agent__meta">${esc(a.count)}</p>
      </div>`).join('')}</div>`;
  }

  /* ======================================================================
     Toggle switch.
     ====================================================================== */
  function toggle(o) {
    return `<div class="toggle-row">
      <div>
        <p class="toggle-row__title">${esc(o.title)}</p>
        <p class="toggle-row__body">${esc(o.body)}</p>
      </div>
      <button type="button" class="switch${o.on ? ' is-on' : ''}" role="switch"
        aria-checked="${o.on ? 'true' : 'false'}" data-act="${esc(o.act)}" data-value="${esc(o.name)}">
        <span class="sr-only">${esc(o.title)}</span>
      </button>
    </div>`;
  }

  global.UI = {
    esc, euro, nlNum, icon, header, bottomNav, actionBar, progressBar, button,
    radioCard, radioGroup, tile, tileGroup, checkRow, field, selectField,
    sheetSelect, passwordField, counter, estimateCard, addressLine, statusBadge,
    trendChart, mapIllustration, agentCards, toggle
  };
})(window);
