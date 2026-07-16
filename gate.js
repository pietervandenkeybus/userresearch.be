/* ==========================================================================
   gate.js — password start screen.

   ⚠ READ THIS FIRST — this is a speed bump, not security.

   The check runs in the browser, so the answer is necessarily somewhere in
   this file. The password is stored as a hash rather than plain text, which
   stops it being *read* at a glance, but anyone who opens DevTools can delete
   the overlay, flip the sessionStorage flag, or simply request styles.css
   directly. It keeps casual visitors and stray link-clicks out. It will not
   keep out anyone who is actually curious.

   If the prototype ever needs real protection, do it on the server —
   see README.md ("Echte afscherming").

   ---- CHANGING THE PASSWORD ----
   1. Open the prototype, then in the browser console run:  GATE.hash('jouw-nieuwe-wachtwoord')
   2. Paste the number it prints into PASSWORD_HASH below.
   (Locked yourself out? Set PASSWORD_HASH to GATE.hash('') — an empty password —
   or just delete the <script src="gate.js"> line from index.html.)
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- CONFIG ----------------------------------------------------------
     The password itself is deliberately NOT written down here — only its
     hash. It is in README.md, which is excluded from the deploy via
     .vercelignore so it is never served next to this file.               */
  const PASSWORD_HASH = 1144609969;
  const SESSION_KEY   = 'immoweb-owner-hub-gate';

  /* ---- 32-bit FNV-1a ---------------------------------------------------
     Deliberately a plain hash, not crypto: window.crypto.subtle is
     unavailable on file:// in Chrome, and the prototype has to keep working
     when opened straight from the zip. Given the caveat above, a stronger
     hash here would buy nothing anyway.                                   */
  function hash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function unlocked() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
    catch (e) { return false; }   // private mode: just ask every time
  }

  function remember() {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
  }

  /* ---- the screen ------------------------------------------------------ */
  function build() {
    const el = document.createElement('div');
    el.className = 'gate';
    el.innerHTML = `
      <form class="gate__card" autocomplete="off">
        <p class="gate__brand">immoweb</p>
        <h1 class="gate__title">Owner Hub — prototype</h1>
        <p class="gate__body">Dit prototype is afgeschermd. Voer het wachtwoord in om verder te gaan.</p>

        <label class="gate__label" for="gate-pw">Wachtwoord</label>
        <input class="gate__input" id="gate-pw" type="password" autocomplete="current-password"
               autocapitalize="off" spellcheck="false" required>

        <p class="gate__error" id="gate-error" role="alert" hidden>Onjuist wachtwoord. Probeer opnieuw.</p>

        <button class="gate__btn" type="submit">Openen</button>
        <p class="gate__foot">Alle gegevens in dit prototype zijn gesimuleerd.</p>
      </form>`;
    return el;
  }

  function open(el) {
    el.remove();
    document.body.classList.remove('is-locked');
    // The app booted underneath already; just make sure it is sized right.
    window.dispatchEvent(new Event('resize'));
  }

  function init() {
    if (unlocked()) return;

    document.body.classList.add('is-locked');
    const el = build();
    document.body.appendChild(el);

    const input = el.querySelector('#gate-pw');
    const error = el.querySelector('#gate-error');
    input.focus();

    el.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (hash(input.value) === PASSWORD_HASH) {
        remember();
        open(el);
      } else {
        error.hidden = false;
        input.select();
        el.querySelector('.gate__card').classList.remove('shake');
        void el.offsetWidth;                       // restart the animation
        el.querySelector('.gate__card').classList.add('shake');
      }
    });

    input.addEventListener('input', () => { error.hidden = true; });
  }

  // Exposed so you can generate a new hash from the console.
  global.GATE = { hash };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
