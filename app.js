/* ==========================================================================
   app.js — central state, hash router, action handling.

   State lives in one object and is mirrored to localStorage on every change,
   so a refresh restores exactly where the tester was.
   ========================================================================== */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'immoweb-owner-hub-proto';
  const $ = sel => document.querySelector(sel);

  /* =====================================================================
     State
     ===================================================================== */
  function blankState() {
    return {
      screen: 'owner-hub-empty',
      history: [],

      signedIn: false,
      // true  = entered via "Voeg je woning toe" / "+"  (PDF row 1)
      // false = entered via "Schatten"                   (PDF row 2)
      claimed: false,

      property: { saved: false },

      account: { firstName: '', lastName: '', email: '', phone: '' },

      sections: { basics: 'todo', interior: 'todo', energy: 'todo' },

      notifications: { valuation: true, neighbourhood: true },

      ui: {
        previewTab: 'overview',   // PDF shows Marktoverzicht as the default tab
        detailTab: 'overview',
        intentDismissed: false,
        sheet: null               // 'epc' | 'heating' | null
      },

      form: {
        addressQuery: '', addressPicked: false,
        email: '', firstName: '', lastName: '',
        password: '', password2: '',
        countryCode: '(BE) +32', phone: '',
        code: ['', '', '', '', '', ''],

        propertyType: '', houseKind: '', facades: '',
        livingArea: '', landArea: '', constructionYear: '',
        condition: '',

        rooms: { rooms: 0, bedrooms: 0, bathrooms: 0, toilets: 0 },
        view: '',
        amenities: { garden: false, terrace: false, pool: false },
        amenityDetails: {
          garden:  { surface: '', orientation: '' },
          terrace: { surface: '', orientation: '' }
        },

        epc: '', epcRef: '', epcConsumption: '', epcCo2: '',
        heating: '', energyFeatures: {},

        intent: ''
      }
    };
  }

  let state = blankState();

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* private mode — the prototype still works, just not across reloads */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      // shallow-merge onto a blank state so new keys always exist
      state = Object.assign(blankState(), saved);
      state.ui = Object.assign(blankState().ui, saved.ui || {});
      state.form = Object.assign(blankState().form, saved.form || {});
      state.form.rooms = Object.assign(blankState().form.rooms, (saved.form || {}).rooms || {});
      state.form.amenityDetails = Object.assign(blankState().form.amenityDetails, (saved.form || {}).amenityDetails || {});
      return true;
    } catch (e) { return false; }
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = blankState();
    save();
    location.hash = '';
    render();
  }

  /* =====================================================================
     Derived values
     ===================================================================== */
  function completedCount(st) {
    return Object.values((st || state).sections).filter(v => v === 'done').length;
  }

  // The estimate tightens as sections are completed: 453.000 -> 472.000 -> 491.000
  function currentEstimate(st) {
    const s = st || state;
    const n = completedCount(s);
    if (n === 0) return global.DATA.ESTIMATES.initial;
    if (n >= global.DATA.SECTIONS.length) return global.DATA.ESTIMATES.refined;
    return global.DATA.ESTIMATES.partial;
  }

  const emailValid = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test((v || '').trim());

  function passwordRules(v) {
    v = v || '';
    return {
      len: v.length >= 10,
      mix: /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^\w\s]/.test(v)
    };
  }

  const heatingLabel = value => {
    const o = global.DATA.OPTIONS.heating.find(h => h.value === value);
    return o ? o.label : '';
  };

  /* =====================================================================
     Router
     ===================================================================== */
  function go(screen, opts) {
    if (!global.SCREENS[screen]) { console.warn('[proto] unknown screen:', screen); return; }
    if (state.screen !== screen) state.history.push(state.screen);
    state.screen = screen;
    if (!opts || !opts.replace) location.hash = screen;
    save();
    render();
    $('#live').textContent = 'Scherm: ' + screen;
  }

  // "go:owner-hub" resolves to whichever Owner Hub variant the state implies
  function resolve(target) {
    if (target === 'owner-hub') {
      return state.property.saved ? 'owner-hub-property' : 'owner-hub-empty';
    }
    return target;
  }

  /* =====================================================================
     Render
     ===================================================================== */
  function render() {
    const root = $('#screen-root');
    const fn = global.SCREENS[state.screen] || global.SCREENS['owner-hub-empty'];
    root.innerHTML = fn(state) + sheetMarkup();
    // Scroll position resets when a new screen opens.
    const sc = root.querySelector('.scroll');
    if (sc) sc.scrollTop = 0;
    syncJump();
  }

  /* Bottom-sheet picker (Energieprestatie / Type verwarming) */
  function sheetMarkup() {
    const key = state.ui.sheet;
    if (!key) return '';
    const cfg = key === 'epc'
      ? { title: 'Energieprestatie', options: global.DATA.OPTIONS.epc.map(v => ({ value: v, label: v })) }
      : { title: 'Type verwarming', options: global.DATA.OPTIONS.heating };
    return `<div class="overlay is-open" data-act="close-sheet">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${global.UI.esc(cfg.title)}">
        <div class="hdr hdr--sheet">
          <span class="hdr__grab" aria-hidden="true"></span>
          <div class="hdr__left">
            <button type="button" class="icon-btn" data-act="close-sheet" aria-label="Sluiten">
              ${global.UI.icon('i-close')}
            </button>
          </div>
          <h2 class="hdr__title">${global.UI.esc(cfg.title)}</h2>
          <div class="hdr__right"></div>
        </div>
        <div class="sheet__list">
          ${cfg.options.map(o => `<button type="button" class="sheet__opt"
            data-act="pick-sheet" data-value="${global.UI.esc(o.value)}">${global.UI.esc(o.label)}</button>`).join('')}
        </div>
      </div>
    </div>`;
  }

  /* =====================================================================
     Actions — one delegated listener for the whole prototype.
     ===================================================================== */
  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;

    const act = el.dataset.act;
    const value = el.dataset.value;

    // go:<screen>
    if (act.startsWith('go:')) { go(resolve(act.slice(3))); return; }

    // set:<field>
    if (act.startsWith('set:')) {
      const key = act.slice(4);
      state.form[key] = state.form[key] === value ? '' : value;
      // Changing the property type invalidates the follow-ups below it.
      if (key === 'propertyType') { state.form.houseKind = ''; state.form.facades = ''; }
      if (key === 'houseKind') { state.form.facades = ''; }
      markProgress();
      save(); render();
      return;
    }

    // sheet:<key>
    if (act.startsWith('sheet:')) { state.ui.sheet = act.slice(6); render(); return; }

    // complete:<section>
    if (act.startsWith('complete:')) {
      state.sections[act.slice(9)] = 'done';
      save();
      go('estimate-section-overview');
      return;
    }

    switch (act) {
      /* ---- entry points: this is the branch --------------------------- */
      case 'start:claim':          // "Voeg je woning toe" / "+"  -> PDF row 1
        state.claimed = true;
        go('address-search');
        break;
      case 'start:estimate':       // "Schatten"                  -> PDF row 2
        state.claimed = false;
        go('address-search');
        break;

      /* ---- address ---------------------------------------------------- */
      case 'pick-address': {
        const s = global.DATA.SUGGESTIONS[Number(value)];
        state.form.addressQuery = s.match + s.rest;
        state.form.addressPicked = true;
        save();
        go('address-confirmation');
        break;
      }
      case 'clear-address':
        state.form.addressQuery = '';
        state.form.addressPicked = false;
        save();
        go('address-search', { replace: state.screen === 'address-search' });
        render();
        break;

      /* ---- e-mail ----------------------------------------------------- */
      case 'submit-email':
        if (!emailValid(state.form.email)) break;
        state.account.email = state.form.email;
        go('estimate-result-locked');
        break;
      case 'social-signin':
        // The wireframes route Google/Apple to the same next screen.
        go('estimate-result-locked');
        break;

      /* ---- tabs ------------------------------------------------------- */
      case 'set-preview-tab': state.ui.previewTab = value; save(); render(); break;
      case 'set-detail-tab':  state.ui.detailTab = value; save(); render(); break;

      /* ---- account ---------------------------------------------------- */
      case 'create-account':
        state.signedIn = true;
        state.property.saved = true;
        state.account.firstName = state.form.firstName;
        state.account.lastName = state.form.lastName;
        state.account.phone = state.form.phone;
        save();
        go('owner-hub-property');
        break;

      /* ---- claim (only reachable on the unclaimed branch) -------------- */
      case 'claim-property':
        state.claimed = true;
        save();
        go('owner-hub-property');
        break;

      /* ---- refine wizard ---------------------------------------------- */
      case 'save-exit':
        // Save & Exit keeps everything entered and returns to the overview.
        save();
        go('estimate-section-overview');
        break;

      case 'count': {
        const [name, delta] = value.split(':');
        const next = state.form.rooms[name] + Number(delta);
        state.form.rooms[name] = Math.max(0, next);
        markProgress(); save(); render();
        break;
      }

      case 'toggle-amenity':
        // Values inside a detail block are deliberately kept when unticked.
        state.form.amenities[value] = !state.form.amenities[value];
        markProgress(); save(); render();
        break;

      case 'toggle-feature':
        state.form.energyFeatures[value] = !state.form.energyFeatures[value];
        markProgress(); save(); render();
        break;

      case 'pick-sheet':
        if (state.ui.sheet === 'epc') state.form.epc = value;
        else state.form.heating = value;
        state.ui.sheet = null;
        markProgress(); save(); render();
        break;

      case 'close-sheet':
        if (ev.target.closest('.sheet') && !ev.target.closest('[data-act="close-sheet"]')) break;
        state.ui.sheet = null; render();
        break;

      /* ---- estimate detail -------------------------------------------- */
      case 'set-intent':   state.form.intent = value; save(); render(); break;
      case 'dismiss-intent': state.ui.intentDismissed = true; save(); render(); break;
      case 'toggle':
        state.notifications[value] = !state.notifications[value];
        save(); render();
        break;

      case 'nav-myimmo': go(resolve('owner-hub')); break;

      case 'toggle-pw': {
        const input = document.getElementById(value);
        input.type = input.type === 'password' ? 'text' : 'password';
        break;
      }
    }
  });

  /* Any answer inside a refine section flips it to "Bezig" */
  function markProgress() {
    const map = {
      'basics-type': 'basics', 'basics-characteristics': 'basics', 'basics-condition': 'basics',
      'interior-rooms': 'interior', 'interior-view': 'interior', 'interior-amenities': 'interior',
      'energy-performance': 'energy', 'energy-heating': 'energy', 'energy-features': 'energy'
    };
    const sec = map[state.screen];
    if (sec && state.sections[sec] === 'todo') state.sections[sec] = 'progress';
  }

  /* =====================================================================
     Inputs — typed values go straight into state.form via data-model.
     Re-render only when it changes something visible (validation gates,
     progressive disclosure), so typing never loses focus.
     ===================================================================== */
  document.addEventListener('input', function (ev) {
    const el = ev.target;

    if (el.dataset.otp !== undefined) {
      const i = Number(el.dataset.otp);
      el.value = el.value.replace(/\D/g, '').slice(0, 1);
      state.form.code[i] = el.value;
      const boxes = document.querySelectorAll('[data-otp]');
      if (el.value && boxes[i + 1]) boxes[i + 1].focus();
      save();
      refreshGates();
      return;
    }

    const model = el.dataset.model;
    if (!model) return;
    setModel(model, el.value);
    markProgress();
    save();

    // Address search shows/hides its suggestion list as you type.
    if (model === 'addressQuery') {
      state.form.addressPicked = false;
      renderKeepingFocus();
      return;
    }
    refreshGates();
  });

  document.addEventListener('change', function (ev) {
    const el = ev.target;
    if (!el.dataset.model) return;
    setModel(el.dataset.model, el.value);
    if (el.classList.contains('select')) el.classList.toggle('is-placeholder', !el.value);
    markProgress(); save();
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && state.ui.sheet) { state.ui.sheet = null; render(); }
    if (ev.key === 'Backspace' && ev.target.dataset && ev.target.dataset.otp !== undefined && !ev.target.value) {
      const i = Number(ev.target.dataset.otp);
      const boxes = document.querySelectorAll('[data-otp]');
      if (boxes[i - 1]) boxes[i - 1].focus();
    }
  });

  function setModel(path, value) {
    const parts = path.split('.');
    let obj = state.form;
    while (parts.length > 1) obj = obj[parts.shift()];
    obj[parts[0]] = value;
  }

  /* Screens whose *visible structure* changes as you type (password rules and
     the confirm field appearing) need a real re-render; everything else only
     needs its primary action re-evaluated, so typing never loses focus. */
  const RERENDER_ON_INPUT = ['account-password'];

  function refreshGates() {
    if (RERENDER_ON_INPUT.indexOf(state.screen) !== -1) { renderKeepingFocus(); return; }

    // Re-run the screen renderer off-DOM and copy the disabled state across,
    // matching buttons by their action rather than by position.
    const tmp = document.createElement('div');
    tmp.innerHTML = global.SCREENS[state.screen](state);

    tmp.querySelectorAll('button[data-act]').forEach(fresh => {
      const live = document.querySelector(
        `#screen-root button[data-act="${CSS.escape(fresh.dataset.act)}"]`);
      if (!live) return;
      const shouldDisable = fresh.hasAttribute('disabled');
      live.disabled = shouldDisable;
      if (shouldDisable) live.setAttribute('aria-disabled', 'true');
      else live.removeAttribute('aria-disabled');
    });
  }

  /* Re-render, then put the caret back where the tester left it. */
  function renderKeepingFocus() {
    const el = document.activeElement;
    const id = el && el.id;
    let pos = null;
    try { pos = el && el.selectionStart; } catch (e) {}
    render();
    if (!id) return;
    const back = document.getElementById(id);
    if (!back) return;
    back.focus();
    if (pos != null) { try { back.setSelectionRange(pos, pos); } catch (e) {} }
  }

  /* =====================================================================
     Desktop test controls (outside the mobile frame)
     ===================================================================== */
  const TEST_STATES = [
    ['owner-hub-empty',           'Lege Owner Hub'],
    ['address-search',            'Schattingsflow — adres'],
    ['estimate-result-locked',    'Vergrendelde schatting'],
    ['owner-hub-property',        'Owner Hub met woning'],
    ['estimate-section-overview', 'Overzicht gedetailleerde schatting'],
    ['estimate-result-refined',   'Verfijnde schatting (€ 491.000)']
  ];

  // Seeds the minimum state each test entry point needs to make sense.
  function seedFor(screen) {
    if (screen === 'owner-hub-empty' || screen === 'address-search') return;
    state.form.addressQuery = global.DATA.PROPERTY.full;
    state.form.addressPicked = true;
    state.form.email = 'jan.janssens@email.be';
    state.account.email = state.form.email;
    if (screen === 'estimate-result-locked') return;
    state.signedIn = true;
    state.property.saved = true;
    if (screen === 'estimate-result-refined') {
      state.sections = { basics: 'done', interior: 'done', energy: 'done' };
    }
  }

  function syncJump() {
    const sel = $('#test-jump');
    if (sel && sel.value !== state.screen) {
      const has = TEST_STATES.some(t => t[0] === state.screen);
      sel.value = has ? state.screen : '';
    }
  }

  function initControls() {
    const sel = $('#test-jump');
    sel.innerHTML = '<option value="">— huidig scherm —</option>' +
      TEST_STATES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      state = blankState();
      seedFor(sel.value);
      go(sel.value);
    });
    $('#reset-btn').addEventListener('click', reset);
  }

  /* =====================================================================
     Boot
     ===================================================================== */
  function boot() {
    const params = new URLSearchParams(location.search);

    if (params.get('reset') === 'true') {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      history.replaceState(null, '', location.pathname);
    } else {
      load();
    }

    // ?start=<screen> jumps straight to a documented test state
    const start = params.get('start');
    if (start && global.SCREENS[start]) {
      state = blankState();
      seedFor(start);
      state.screen = start;
    } else {
      const hash = location.hash.slice(1);
      if (hash && global.SCREENS[hash]) state.screen = hash;
    }

    initControls();
    save();
    render();
  }

  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1);
    if (hash && global.SCREENS[hash] && hash !== state.screen) { state.screen = hash; save(); render(); }
  });

  global.APP = {
    get state() { return state; },
    go, reset, currentEstimate, completedCount, emailValid, passwordRules, heatingLabel
  };

  document.addEventListener('DOMContentLoaded', boot);
})(window);
