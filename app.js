/* ==========================================================================
   Owner hub prototype — router + interactions
   No dependencies. Everything is driven by data-* attributes in index.html.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ------------------------------------------------------------------
     Screen registry — label is what shows in the "Jump to" helper
     ------------------------------------------------------------------ */
  const SCREENS = [
    ['s-myimmo',                 'My immo — empty'],
    ['s-myimmo-valuation',       'My immo — with valuation'],
    ['s-address',                'Location — address search'],
    ['s-address-confirm',        'Location — map preview'],
    ['s-property-summary',       'Location — property summary'],
    ['s-collect-email',          'Collect e-mail'],
    ['s-preview',                'Estimation — preview (locked)'],
    ['s-upsell',                 'One free account'],
    ['s-signup-name',            'Create account — your details'],
    ['s-signup-password',        'Create account — password'],
    ['s-signup-phone',           'Create account — phone'],
    ['s-signup-otp',             'Create account — 2FA'],
    ['s-estimation',             'My estimation — full'],
    ['s-refine-hub',             'Refine — hub'],
    ['s-basics-type',            'Refine › Basics — type'],
    ['s-basics-characteristics', 'Refine › Basics — characteristics'],
    ['s-basics-condition',       'Refine › Basics — condition'],
    ['s-interior-rooms',         'Refine › Interior — rooms'],
    ['s-interior-view',          'Refine › Interior — view'],
    ['s-interior-amenities',     'Refine › Interior — amenities'],
    ['s-energy-performance',     'Refine › Energy — EPC'],
    ['s-energy-heating',         'Refine › Energy — heating']
  ];

  /* ------------------------------------------------------------------
     App state
     ------------------------------------------------------------------ */
  const state = {
    signedIn: false,
    sections: { basics: 'todo', interior: 'todo', energy: 'todo' },
    // The estimate tightens as sections get completed — matching the
    // €453 000 → €472 000 → €491 000 progression in the designs.
    estimates: [
      { mid: '453 000', low: '440 000', high: '465 000', rent: '1.300' },
      { mid: '472 000', low: '460 000', high: '484 000', rent: '1.450' },
      { mid: '491 000', low: '478 000', high: '501 000', rent: '1.600' }
    ]
  };

  /* ------------------------------------------------------------------
     Router
     ------------------------------------------------------------------ */
  function go(id, opts) {
    const next = document.getElementById(id);
    if (!next) { console.warn('[proto] no screen:', id); return; }

    $$('.screen.is-active').forEach(s => s.classList.remove('is-active'));
    next.classList.add('is-active');
    $$('.scroll', next).forEach(s => { s.scrollTop = 0; });

    if (!opts || !opts.silent) {
      history.replaceState(null, '', '#' + id.replace(/^s-/, ''));
    }
    const jump = $('#proto-jump');
    if (jump) jump.value = id;

    closeOverlay();
    render();
  }

  /* ------------------------------------------------------------------
     Bottom nav — one definition, injected into every screen that has it.
     Sticky by construction: it is a flex sibling of .scroll, so it never
     scrolls away and never re-renders between tabs.
     ------------------------------------------------------------------ */
  const NAV = [
    { id: 'home',    label: 'Home',    icon: 'i-home',   target: null },
    { id: 'search',  label: 'Search',  icon: 'i-search', target: null },
    { id: 'saves',   label: 'Saves',   icon: 'i-heart',  target: null },
    { id: 'myimmo',  label: 'My immo', icon: 'i-key',    target: 'myimmo' },
    { id: 'profile', label: 'Profile', icon: 'i-user',   target: null }
  ];

  function buildNav() {
    $$('[data-nav-bar]').forEach(bar => {
      const active = bar.closest('.screen').dataset.nav;
      bar.innerHTML = NAV.map(n => `
        <button class="nav-item${n.id === active ? ' is-active' : ''}"
                data-nav-to="${n.id}"
                ${n.id === active ? 'aria-current="page"' : ''}>
          <svg class="ic ic--sm" viewBox="0 0 24 24"${n.id === 'myimmo' ? ' style="fill:currentColor;stroke-width:1.4"' : ''}>
            <use href="#${n.icon}"/>
          </svg>
          <span>${n.label}</span>
        </button>`).join('');
    });
  }

  /* ------------------------------------------------------------------
     Sponsored agent cards — same list on preview + full estimation
     ------------------------------------------------------------------ */
  const AGENTS = [
    ['Belvil.immo',   '4700 Eupen • 3km away',   '12 properties for sale'],
    ['TB Imomobiliere', '4900 Spa • 6km away',   '23 properties for sale'],
    ['Sunset Estate', 'Ixelles 700 • 32km away', '125 properties for sale']
  ];

  function buildAgents() {
    $$('[data-agents]').forEach(el => {
      el.innerHTML = AGENTS.map(([name, meta1, meta2]) => `
        <div class="agent">
          <div class="agent__logo"></div>
          <div class="agent__name">${name}</div>
          <div class="agent__meta">${meta1}</div>
          <div class="agent__meta">${meta2}</div>
        </div>`).join('');
    });
  }

  /* ------------------------------------------------------------------
     Price trend chart (Market overview)
     ------------------------------------------------------------------ */
  const TREND = [412, 430, 437, 452, 461, 471, 476];
  const TREND_LABELS = ["Jun '24", "Aug '24", "Oct '24", "Dec '24", "Feb '25", "Apr '25", "Jun '25"];

  function buildCharts() {
    $$('[data-chart="trend"]').forEach(el => {
      const W = 330, H = 190, padL = 42, padR = 8, padT = 12, padB = 26;
      const min = 410, max = 500;
      const x = i => padL + (i / (TREND.length - 1)) * (W - padL - padR);
      const y = v => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

      const grid = [500, 470, 450, 430, 410].map(v => `
        <line x1="${padL}" y1="${y(v)}" x2="${W - padR}" y2="${y(v)}" stroke="#E5E8F0"/>
        <text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" font-size="9" fill="#63697B">${v}k</text>`).join('');

      const line = TREND.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
      const dots = TREND.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="#000924"/>`).join('');
      const labels = TREND_LABELS.map((l, i) =>
        `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="8.5" fill="#63697B">${l}</text>`).join('');

      el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Price trend">
        ${grid}
        <path d="${line}" fill="none" stroke="#000924" stroke-width="2" stroke-linejoin="round"/>
        ${dots}${labels}
      </svg>`;
      if (el.dataset.locked) el.firstChild.classList.add('locked');
    });
  }

  /* ------------------------------------------------------------------
     Bottom-sheet pickers
     ------------------------------------------------------------------ */
  const SHEETS = {
    heating: { title: 'Heating type', options: ['Carbon', 'Electric', 'Gas', 'Fuel oil', 'Wood', 'Pallet', 'Solar'] },
    epc:     { title: 'Energy performance', options: ['A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] }
  };

  let sheetTrigger = null;

  function openSheet(key, trigger) {
    const cfg = SHEETS[key];
    if (!cfg) return;
    sheetTrigger = trigger;
    $('#sheet-title').textContent = cfg.title;
    $('#sheet-list').innerHTML = cfg.options
      .map(o => `<button class="sheet__option" data-sheet-value="${o}">${o}</button>`).join('');
    $('#overlay').classList.add('is-open');
  }

  function closeOverlay() {
    $('#overlay').classList.remove('is-open');
  }

  /* ------------------------------------------------------------------
     Address autocomplete
     ------------------------------------------------------------------ */
  const ADDRESSES = [
    ['Ruelle des Prés de l’Egli', 'se 1, 1457 Nil-Saint-Vincent-Saint-Martin, Walhain'],
    ['Ruelle des Prés de l’Egli', 'se 3, 1457 Nil-Saint-Vincent-Saint-Martin, Walhain'],
    ['Ruelle des Prés de l’Egli', 'se 5, 1457 Nil-Saint-Vincent-Saint-Martin, Walhain']
  ];

  function initAddress() {
    const input = $('#addr-input');
    const list  = $('#addr-suggestions');
    const clear = $('#addr-clear');
    if (!input) return;

    function update() {
      const has = input.value.trim().length > 0;
      clear.hidden = !has;
      if (!has) { list.hidden = true; return; }
      list.hidden = false;
      list.innerHTML = ADDRESSES.map(([b, rest]) =>
        `<button class="suggestion"><b>${b}</b>${rest}</button>`).join('');
    }

    input.addEventListener('input', update);
    input.addEventListener('focus', () => { input.placeholder = 'Search'; });
    input.addEventListener('blur',  () => {
      if (!input.value) input.placeholder = 'Enter street, city or neighbourhood';
    });
    clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    list.addEventListener('click', e => {
      if (e.target.closest('.suggestion')) go('s-address-confirm');
    });
    $('#addr-locate').addEventListener('click', () => go('s-address-confirm'));
  }

  /* ------------------------------------------------------------------
     Password rules
     ------------------------------------------------------------------ */
  function initPassword() {
    const pw = $('#pw');
    if (!pw) return;
    const rules  = $('#pw-rules');
    const field2 = $('#pw2-field');

    pw.addEventListener('input', () => {
      const v = pw.value;
      const len = v.length >= 10;
      const mix = /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^\w\s]/.test(v);
      $('[data-rule="len"]', rules).classList.toggle('is-met', len);
      $('[data-rule="mix"]', rules).classList.toggle('is-met', mix);
      field2.hidden = !(len && mix);
    });

    $$('[data-toggle-pw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.togglePw);
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });
  }

  /* ------------------------------------------------------------------
     OTP auto-advance
     ------------------------------------------------------------------ */
  function initOtp() {
    const boxes = $$('#otp input');
    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/\D/g, '').slice(0, 1);
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
      });
      box.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !box.value && boxes[i - 1]) boxes[i - 1].focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     Steppers
     ------------------------------------------------------------------ */
  function initSteppers() {
    $$('[data-stepper]').forEach(st => {
      const out = $('output', st);
      const [minus, , plus] = $$('button, output', st);
      const read  = () => (out.textContent === '' ? null : parseInt(out.textContent, 10));
      const write = v => { out.textContent = v === null ? '' : v; };
      minus.addEventListener('click', () => {
        const v = read();
        if (v === null) return;
        write(v <= 0 ? null : v - 1);
      });
      plus.addEventListener('click', () => {
        const v = read();
        write(v === null ? 1 : v + 1);
      });
    });
  }

  /* ------------------------------------------------------------------
     Render bindings
     ------------------------------------------------------------------ */
  function completedCount() {
    return Object.values(state.sections).filter(s => s === 'done').length;
  }

  function render() {
    // estimate value follows how many sections are complete
    const idx = Math.min(completedCount(), state.estimates.length - 1);
    const est = state.estimates[idx];

    $$('[data-bind="mid"]').forEach(el => el.textContent = est.mid);
    $$('[data-bind="low"]').forEach(el => el.textContent = est.low);
    $$('[data-bind="high"]').forEach(el => el.textContent = est.high);
    $$('[data-bind="rent"]').forEach(el => el.textContent = est.rent);
    $$('[data-bind="estimate"]').forEach(el => el.textContent = est.mid.replace(' ', ','));

    // hub: "€472 000 vs initial estimation of €453 000"
    const delta = $('[data-refine-delta]');
    if (delta) delta.hidden = idx === 0;

    // navy card copy swaps once anything is refined
    const fresh = $('[data-est-state="fresh"]');
    const refined = $('[data-est-state="refined"]');
    if (fresh && refined) {
      fresh.hidden = idx > 0;
      refined.hidden = idx === 0;
    }

    // property meta line gains land area once basics are done
    const meta = $('[data-bind="propmeta"]');
    if (meta) {
      meta.innerHTML = state.sections.basics === 'done'
        ? 'House &nbsp;•&nbsp; 159 m² &nbsp;•&nbsp; 547 m² land'
        : 'House &nbsp;•&nbsp; 159 m²';
    }

    // section badges on the refine hub
    const BADGE = {
      todo:     { cls: 'badge',                text: 'Not started' },
      progress: { cls: 'badge badge--progress', text: 'In progress' },
      done:     { cls: 'badge badge--done',     text: 'Completed' }
    };
    Object.entries(state.sections).forEach(([key, val]) => {
      const el = $(`[data-badge="${key}"]`);
      if (!el) return;
      const cfg = BADGE[val];
      el.className = cfg.cls;
      el.innerHTML = val === 'done'
        ? `<svg class="ic ic--xs" viewBox="0 0 24 24"><use href="#i-check-circle"/></svg> ${cfg.text}`
        : `<span class="badge__dot"></span> ${cfg.text}`;
    });
  }

  /* ------------------------------------------------------------------
     Global delegated click handling
     ------------------------------------------------------------------ */
  document.addEventListener('click', e => {
    // -- navigate --------------------------------------------------
    const goto = e.target.closest('[data-goto]');
    if (goto) {
      e.preventDefault();
      if (goto.hasAttribute('data-signin')) state.signedIn = true;

      // mark a refine section complete on its final Next
      const done = goto.dataset.complete;
      if (done) state.sections[done] = 'done';

      go(goto.dataset.goto);
      return;
    }

    // -- bottom nav ------------------------------------------------
    const navTo = e.target.closest('[data-nav-to]');
    if (navTo) {
      const item = NAV.find(n => n.id === navTo.dataset.navTo);
      if (item && item.target === 'myimmo') {
        go(state.signedIn ? 's-myimmo-valuation' : 's-myimmo');
      } else {
        toast(`“${navTo.textContent.trim()}” lives outside this prototype`);
      }
      return;
    }

    // -- tabs ------------------------------------------------------
    const tab = e.target.closest('.tab');
    if (tab) {
      const group = tab.closest('[data-tabs]');
      const screen = group.closest('.screen');
      $$('.tab', group).forEach(t => t.classList.toggle('is-active', t === tab));
      $$('[data-tabpanel]', screen).forEach(p => {
        p.hidden = p.dataset.tabpanel !== tab.dataset.tab;
      });
      return;
    }

    // -- radio groups (choice cards + tiles) -----------------------
    const opt = e.target.closest('[data-radio-group] > [data-value]');
    if (opt) {
      const group = opt.parentElement;
      $$('[data-value]', group).forEach(o => {
        o.classList.toggle('is-selected', o === opt);
      });
      markInProgress(opt);
      return;
    }

    // -- checkboxes ------------------------------------------------
    const check = e.target.closest('[data-check]');
    if (check) {
      check.classList.toggle('is-checked');
      markInProgress(check);
      return;
    }

    // -- amenities (checkbox that expands) -------------------------
    const amenityHead = e.target.closest('.amenity__head');
    if (amenityHead) {
      amenityHead.parentElement.classList.toggle('is-open');
      markInProgress(amenityHead);
      return;
    }

    // -- switches --------------------------------------------------
    const sw = e.target.closest('.switch');
    if (sw) {
      const on = sw.classList.toggle('is-on');
      sw.setAttribute('aria-checked', String(on));
      return;
    }

    // -- open a picker sheet ---------------------------------------
    const sheetBtn = e.target.closest('[data-sheet]');
    if (sheetBtn) { openSheet(sheetBtn.dataset.sheet, sheetBtn); return; }

    // -- pick a sheet value ----------------------------------------
    const sheetVal = e.target.closest('[data-sheet-value]');
    if (sheetVal && sheetTrigger) {
      sheetTrigger.textContent = sheetVal.dataset.sheetValue;
      sheetTrigger.classList.remove('is-placeholder');
      // reveal the follow-up questions the design shows after a pick
      const details = sheetTrigger.dataset.sheet === 'epc'
        ? $('#epc-details') : $('#heating-details');
      if (details) details.hidden = false;
      markInProgress(sheetTrigger);
      closeOverlay();
      return;
    }

    // -- dismiss overlay / popovers --------------------------------
    if (e.target.closest('[data-dismiss-overlay]') || e.target.id === 'overlay') {
      closeOverlay();
      return;
    }
    const dismiss = e.target.closest('[data-dismiss]');
    if (dismiss) { $(dismiss.dataset.dismiss).hidden = true; return; }

    // -- not-in-prototype affordances ------------------------------
    const todo = e.target.closest('[data-todo]');
    if (todo) { toast(`“${todo.dataset.todo}” is not in this prototype yet`); }
  });

  // any interaction inside a refine flow flips that section to "In progress"
  function markInProgress(el) {
    const screen = el.closest('.screen');
    const flow = screen && screen.dataset.flow;
    if (flow && state.sections[flow] === 'todo') {
      state.sections[flow] = 'progress';
      render();
    }
  }

  // native <select> also counts as progress
  document.addEventListener('change', e => {
    if (e.target.matches('.select')) {
      e.target.classList.toggle('is-placeholder', e.target.value === '');
      markInProgress(e.target);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOverlay();
  });

  /* ------------------------------------------------------------------
     Toast — prototype-only affordance for out-of-scope taps
     ------------------------------------------------------------------ */
  let toastTimer;
  function toast(msg) {
    let el = $('#proto-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'proto-toast';
      el.style.cssText =
        'position:absolute;left:16px;right:16px;bottom:100px;z-index:100;' +
        'background:#000924;color:#fff;border-radius:12px;padding:12px 14px;' +
        'font-size:13px;line-height:1.4;text-align:center;opacity:0;' +
        'transition:opacity .2s ease;pointer-events:none';
      $('#device').appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 1900);
  }

  /* ------------------------------------------------------------------
     Prototype jump menu
     ------------------------------------------------------------------ */
  function initJump() {
    const sel = $('#proto-jump');
    sel.innerHTML = SCREENS.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
    sel.addEventListener('change', () => go(sel.value));
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  buildNav();
  buildAgents();
  buildCharts();
  initAddress();
  initPassword();
  initOtp();
  initSteppers();
  initJump();

  const start = location.hash ? 's-' + location.hash.slice(1) : 's-myimmo';
  go(document.getElementById(start) ? start : 's-myimmo');
})();
