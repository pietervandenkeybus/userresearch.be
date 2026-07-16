/* ==========================================================================
   screens.js — one render function per screen.

   NAVIGATION IS TAKEN STRICTLY FROM THE ARROWS IN "Owner Hub Logic Proto.pdf".
   Anything the wireframes leave unconnected is rendered with `inert: true`
   (looks real, announces aria-disabled, routes nowhere).

   THE TWO ROWS IN THE PDF ARE TWO BRANCHES, not duplicates:
     Row 1 — entered via "Voeg je woning toe" / "+"  -> state.claimed = true
             The property sits in the "Mijn woning" card.
             The refined result footer shows ONLY "Plaats op Immoweb".
     Row 2 — entered via "Schatten"                  -> state.claimed = false
             "Mijn woning" keeps its empty state and the property card sits
             under "Schattingen". The refined result footer shows BOTH
             "Plaats op Immoweb" and "Claim deze woning"; claiming routes to
             the Owner Hub with the property claimed.
   ========================================================================== */
(function (global) {
  'use strict';

  const U = global.UI;
  const screens = {};

  /* ---------------------------------------------------------------------
     Small local helpers
     --------------------------------------------------------------------- */
  const scroll = html => `<div class="scroll"><div class="pad">${html}</div></div>`;
  const scrollRaw = html => `<div class="scroll">${html}</div>`;

  // Property card used on the Owner Hub (both branches show it, in different slots)
  function propertyCard(st) {
    const P = global.DATA.PROPERTY;
    const e = global.APP.currentEstimate(st);
    return `<button type="button" class="prop-card" data-act="go:estimate-detail">
      <span class="prop-card__top">
        <span class="prop-card__icon" aria-hidden="true">${U.icon('i-home', 'ic--sm')}</span>
        <span class="prop-card__price">${U.euro(e.mid)}</span>
      </span>
      <span class="prop-card__title">${U.esc(P.cardTitle)}</span>
      <span class="prop-card__meta">${U.esc(P.cardMeta)}</span>
    </button>`;
  }

  function emptyHomeCard() {
    return `<div class="card card--outlined">
      <h2 class="card__title">Mijn woning</h2>
      <p class="card__body">Je hebt nog geen woning ingesteld. Claim een van je schattingen of voeg een nieuwe toe.</p>
      ${U.button({ label: 'Voeg je woning toe', block: true, act: 'start:claim' })}
    </div>`;
  }

  /* =====================================================================
     1. owner-hub-empty  /  owner-hub-property
     One renderer: which slot the property card lands in depends on
     state.claimed — that IS the difference between the two PDF rows.
     ===================================================================== */
  function ownerHub(st) {
    const hasProperty = st.property.saved;
    const claimed = st.claimed;

    // "Mijn woning" slot
    const homeSlot = (hasProperty && claimed)
      ? `<div class="card card--outlined">
           <h2 class="card__title">Mijn woning</h2>
           ${propertyCard(st)}
         </div>`
      : emptyHomeCard();

    // "Schattingen" slot
    const valuationSlot = (hasProperty && !claimed)
      ? propertyCard(st)
      : `<div class="card">
           <h3 class="card__title">Schat je woning gratis</h3>
           <p class="card__body">Volg de waarde van je woning op</p>
           ${U.button({ label: 'Schatten', variant: 'soft', small: true, act: 'start:estimate' })}
         </div>`;

    return U.header({
      variant: 'app',
      title: 'Mijn Immo',
      actions: [
        // The bell has no destination in the wireframes.
        { icon: 'i-bell', label: 'Meldingen', disabled: true },
        { icon: 'i-plus', label: 'Woning toevoegen', act: 'start:claim' }
      ]
    }) + scroll(`
      ${homeSlot}

      <h2 class="section-title">Schattingen</h2>
      ${valuationSlot}

      <div class="row-link is-inert" aria-disabled="true" title="Niet beschikbaar in dit prototype">
        <span>
          <span class="row-link__title">Vind een kantoor in de buurt</span>
          <span class="row-link__sub">Krijg antwoord op je vragen</span>
        </span>
        ${U.icon('i-chevron-right', 'ic--sm')}
      </div>

      <h2 class="section-title">Beheer je woning</h2>
      <div class="card">
        <h3 class="card__title">Plaats een zoekertje</h3>
        <p class="card__body">Bekijk kantoren in de buurt en vind de beste partner</p>
        ${U.button({ label: 'Aanmaken', variant: 'soft', small: true, inert: true })}
      </div>

      <div class="row-link is-inert" aria-disabled="true" title="Niet beschikbaar in dit prototype">
        <span>
          <span class="row-link__title">Vertrouw je verkoop toe aan een expert</span>
          <span class="row-link__sub">Bekijk kantoren in de buurt en vind de beste partner</span>
        </span>
        ${U.icon('i-chevron-right', 'ic--sm')}
      </div>
    `) + U.bottomNav();
  }
  screens['owner-hub-empty'] = ownerHub;
  screens['owner-hub-property'] = ownerHub;

  /* =====================================================================
     2. address-search / address-results
     Same screen; suggestions appear once text is entered.
     ===================================================================== */
  screens['address-search'] = function (st) {
    const q = st.form.addressQuery || '';
    const showSuggestions = q.trim().length > 0 && !st.form.addressPicked;

    const suggestions = showSuggestions
      ? `<ul class="suggestions" role="listbox" aria-label="Adressuggesties">
          ${global.DATA.SUGGESTIONS.map((s, i) => `
            <li><button type="button" class="suggestion" role="option" aria-selected="false"
                  data-act="pick-address" data-value="${i}">
              <b>${U.esc(s.match)}</b>${U.esc(s.rest)}
            </button></li>`).join('')}
        </ul>`
      : '';

    return U.header({ variant: 'sheet', title: 'Schat je woning', close: 'go:owner-hub' }) + scroll(`
      <h1 class="h1">Wat is het adres van de woning?</h1>

      <div class="search">
        <span class="search__icon" aria-hidden="true">${U.icon('i-search', 'ic--sm')}</span>
        <label class="sr-only" for="addr">Adres</label>
        <input class="input" id="addr" type="text" autocomplete="off" spellcheck="false"
          placeholder="Straat, gemeente of buurt" value="${U.esc(q)}" data-model="addressQuery">
        ${q ? `<button type="button" class="search__clear" data-act="clear-address"
                 aria-label="Adres wissen">${U.icon('i-close', 'ic--sm')}</button>` : ''}
      </div>

      <!-- No arrow leaves this control in the wireframes, so it stays inert. -->
      <span class="link-row is-inert" aria-disabled="true" title="Niet beschikbaar in dit prototype">
        ${U.icon('i-location', 'ic--sm')} Gebruik mijn huidige locatie
      </span>

      ${suggestions}
    `);
  };
  screens['address-results'] = screens['address-search'];

  /* =====================================================================
     3. address-confirmation
     "Bevestigen" only becomes active once an address has been selected.
     ===================================================================== */
  screens['address-confirmation'] = function (st) {
    const picked = !!st.form.addressPicked;
    return U.header({ variant: 'sheet', title: 'Schat je woning', close: 'go:owner-hub' }) + scroll(`
      <h1 class="h1">Wat is het adres van de woning?</h1>

      <div class="search">
        <span class="search__icon" aria-hidden="true">${U.icon('i-search', 'ic--sm')}</span>
        <label class="sr-only" for="addr2">Adres</label>
        <input class="input" id="addr2" type="text" readonly value="${U.esc(st.form.addressQuery)}">
        <button type="button" class="search__clear" data-act="clear-address" aria-label="Adres wissen">
          ${U.icon('i-close', 'ic--sm')}
        </button>
      </div>

      <p class="label-sm">Kaartvoorbeeld</p>
      <div class="map-frame">${U.mapIllustration({ h: 200 })}</div>
    `) + U.actionBar({
      back: 'go:address-search',
      buttons: [{
        label: 'Bevestigen',
        act: 'go:property-summary',
        disabled: !picked,
        title: picked ? '' : 'Kies eerst een adres'
      }]
    });
  };

  /* =====================================================================
     4. property-summary
     ===================================================================== */
  screens['property-summary'] = function () {
    const P = global.DATA.PROPERTY;
    return U.header({ variant: 'plain', back: 'go:address-confirmation' }) + scroll(`
      <div class="photo" aria-label="Foto van de woning (placeholder)" role="img">
        ${U.icon('i-house-line', 'ic--lg')}
      </div>
      <h1 class="h1 mt-20">${U.esc(P.street)}</h1>
      <p class="lede">${U.esc(P.city)}, ${U.esc(P.region)}</p>

      <dl class="specs">
        <div class="spec"><dt>Type woning</dt><dd>${U.esc(P.type)}</dd></div>
        <div class="spec"><dt>Bouwjaar</dt><dd>${U.esc(P.year)}</dd></div>
        <div class="spec"><dt>Oppervlakte</dt><dd>${U.esc(P.surface)}</dd></div>
      </dl>
    `) + U.actionBar({
      buttons: [{ label: 'Bekijk mijn schatting', block: true, act: 'go:estimate-email' }]
    });
  };

  /* =====================================================================
     5. estimate-email
     Continue only unlocks with a plausible e-mail address.
     The wireframes route Google and Apple to the same next screen.
     ===================================================================== */
  screens['estimate-email'] = function (st) {
    const ok = global.APP.emailValid(st.form.email);
    return U.header({ variant: 'plain', close: 'go:property-summary' }) + scroll(`
      <h1 class="h1">Ontvang je schatting</h1>
      <p class="lede">Geef je e-mailadres en bekijk je schatting meteen. Zo kan je ook je voortgang bewaren en je schatting later verfijnen.</p>

      ${U.field({
        id: 'email', label: 'E-mailadres', type: 'email', inputmode: 'email',
        autocomplete: 'email', placeholder: 'jan.janssens@email.be',
        value: st.form.email, model: 'email'
      })}

      ${U.button({
        label: 'Doorgaan', block: true, act: 'submit-email', disabled: !ok,
        title: ok ? '' : 'Vul eerst een geldig e-mailadres in'
      })}

      <div class="or">of</div>

      ${U.button({ label: 'Doorgaan met Google', variant: 'outline', block: true, act: 'social-signin' })}
      ${U.button({ label: 'Doorgaan met Apple', block: true, act: 'social-signin' })}

      <p class="legal">Je gegevens worden gebruikt voor de schatting en voor e-mailopvolging. Je kan je op elk moment uitschrijven. Door op “Doorgaan” te klikken en je e-mailadres te geven, ga je akkoord met de algemene voorwaarden.</p>
    `);
  };

  /* =====================================================================
     6. estimate-result-locked
     Per the PDF: FIVE things lead to account-benefits — the lock chips on
     the range, "Verfijn mijn schatting", the locked stats, the locked map,
     and "Bekijk alle inzichten". Default tab is Marktoverzicht.
     ===================================================================== */
  screens['estimate-result-locked'] = function (st) {
    const P = global.DATA.PROPERTY;
    const M = global.DATA.MARKET;
    const tab = st.ui.previewTab;

    const lockedStat = label => `<button type="button" class="stat stat--locked" data-act="go:account-benefits">
      <span class="stat__label">${U.esc(label)}</span>
      <span class="stat__locked"><span class="blur-bar"></span>${U.icon('i-lock', 'ic--sm')}</span>
    </button>`;

    const overview = `
      <div class="stat-grid">
        ${lockedStat('Gem. verkoopprijs in de buurt')}
        ${lockedStat('Prijstrend (12M)')}
        ${lockedStat('Vraag')}
        ${lockedStat('Dagen te koop')}
      </div>
      <button type="button" class="panel panel--locked" data-act="go:account-benefits">
        <span class="panel__title">Prijstrend (gem. € / m² in de buurt)</span>
        <span class="locked-wrap">${U.trendChart(true)}<span class="locked-badge">${U.icon('i-lock', 'ic--sm')}</span></span>
      </button>`;

    const comparables = `
      <div class="stat-grid">
        <button type="button" class="stat stat--locked" data-act="go:account-benefits">
          <span class="stat__label">Verschijnt in</span>
          <span class="stat__locked"><span class="blur-bar blur-bar--sm"></span>${U.icon('i-lock', 'ic--sm')}
            <span class="stat__unit">zoekopdrachten</span></span>
        </button>
        <button type="button" class="stat stat--locked" data-act="go:account-benefits">
          <span class="stat__label">Concurreert met</span>
          <span class="stat__locked"><span class="blur-bar blur-bar--sm"></span>${U.icon('i-lock', 'ic--sm')}
            <span class="stat__unit">gelijkaardige woningen</span></span>
        </button>
      </div>
      <button type="button" class="panel panel--locked" data-act="go:account-benefits">
        <span class="panel__title">Marktactiviteit (laatste X jaar)</span>
        <span class="locked-wrap">${U.mapIllustration({ activity: true, locked: true })}
          <span class="locked-badge">${U.icon('i-lock', 'ic--sm')}</span></span>
      </button>`;

    return U.header({ variant: 'sheet', title: 'Schat je woning', close: 'go:owner-hub' }) + scrollRaw(`
      ${U.addressLine(P.metaLocked)}
      <div class="pad pad--top0">
        ${U.estimateCard({ estimate: global.DATA.ESTIMATES.initial, locked: true })}
        ${tabs(tab, 'set-preview-tab')}
        ${tab === 'overview' ? overview : comparables}
        <hr class="rule">
        <p class="sponsored">Gesponsord</p>
        <h3 class="h3">Vind experts voor je project</h3>
        <p class="card__body">We brengen je in contact met een makelaar voor een gratis schatting, zonder verplichtingen.</p>
        ${U.agentCards()}
      </div>
    `) + U.actionBar({
      back: 'go:estimate-email',
      buttons: [{ label: 'Bekijk alle inzichten', act: 'go:account-benefits', lock: true }]
    });
  };

  function tabs(active, act) {
    return `<div class="tabs" role="tablist" aria-label="Marktinformatie">
      <button type="button" role="tab" class="tab${active === 'overview' ? ' is-active' : ''}"
        aria-selected="${active === 'overview'}" data-act="${act}" data-value="overview">Marktoverzicht</button>
      <button type="button" role="tab" class="tab${active === 'comparables' ? ' is-active' : ''}"
        aria-selected="${active === 'comparables'}" data-act="${act}" data-value="comparables">Vergelijkbare woningen</button>
    </div>`;
  }

  /* =====================================================================
     7. account-benefits
     ===================================================================== */
  screens['account-benefits'] = function () {
    return U.header({ variant: 'sheet', close: 'go:estimate-result-locked' }) + scroll(`
      <h1 class="h1">Eén gratis account.<br>Het volledige plaatje van je woning.</h1>
      <p class="lede">Maak een gratis Immoweb-account. Zonder verplichtingen.</p>

      <ul class="benefits">
        ${global.DATA.BENEFITS.map(b => `
          <li class="benefit">
            <span class="benefit__icon" aria-hidden="true">${U.icon(b.icon, 'ic--sm')}</span>
            <span>
              <span class="benefit__title">${U.esc(b.title)}</span>
              <span class="benefit__body">${U.esc(b.body)}</span>
            </span>
          </li>`).join('')}
      </ul>

      ${U.button({ label: 'Maak een account', block: true, act: 'go:account-personal-details' })}
    `);
  };

  /* =====================================================================
     8. account-personal-details
     E-mail stays prefilled from estimate-email.
     ===================================================================== */
  screens['account-personal-details'] = function (st) {
    const f = st.form;
    const ok = f.firstName.trim() && f.lastName.trim() && global.APP.emailValid(f.email);
    return U.header({ variant: 'plain', back: 'go:account-benefits' }) + scroll(`
      <h1 class="h1 mt-40">Vertel ons iets over jezelf</h1>
      ${U.field({ id: 'fn', label: 'Voornaam', autocomplete: 'given-name', value: f.firstName, model: 'firstName' })}
      ${U.field({ id: 'ln', label: 'Achternaam', autocomplete: 'family-name', value: f.lastName, model: 'lastName' })}
      ${U.field({ id: 'em', label: 'E-mailadres', type: 'email', autocomplete: 'email', value: f.email, model: 'email' })}
      ${U.button({
        label: 'Volgende', block: true, act: 'go:account-password',
        disabled: !ok, title: ok ? '' : 'Vul eerst je voornaam, achternaam en e-mailadres in'
      })}
    `);
  };

  /* =====================================================================
     9. account-password
     The requirements from the design are shown, and tick live as you type,
     but they are NOT enforced — this is a prototype, so any non-empty
     password continues and a mismatched confirmation does not block.
     ===================================================================== */
  screens['account-password'] = function (st) {
    const f = st.form;
    const r = global.APP.passwordRules(f.password);
    const ok = f.password.length > 0;

    return U.header({ variant: 'plain', back: 'go:account-personal-details' }) + scroll(`
      <h1 class="h1 mt-40">Stel je wachtwoord in</h1>
      ${U.passwordField({ id: 'pw', label: 'Wachtwoord', value: f.password, model: 'password' })}

      <div class="rules">
        <p class="rules__title">Je wachtwoord moet bevatten:</p>
        <p class="pwrule${r.len ? ' is-met' : ''}">
          <span class="pwrule__dot" aria-hidden="true">${U.icon('i-check')}</span>
          <span>Minstens 10 tekens${r.len ? '<span class="sr-only"> — voldaan</span>' : ''}</span>
        </p>
        <p class="pwrule${r.mix ? ' is-met' : ''}">
          <span class="pwrule__dot" aria-hidden="true">${U.icon('i-check')}</span>
          <span>Een combinatie van hoofdletters, kleine letters, cijfers en symbolen.${r.mix ? '<span class="sr-only"> — voldaan</span>' : ''}</span>
        </p>
      </div>

      ${U.passwordField({ id: 'pw2', label: 'Bevestig je wachtwoord', value: f.password2, model: 'password2' })}

      ${U.button({
        label: 'Volgende', block: true, act: 'go:account-phone',
        disabled: !ok, title: ok ? '' : 'Vul eerst een wachtwoord in'
      })}
    `);
  };

  /* =====================================================================
     10. account-phone
     ===================================================================== */
  screens['account-phone'] = function (st) {
    const f = st.form;
    const ok = f.phone.replace(/\D/g, '').length >= 6;
    return U.header({ variant: 'plain', back: 'go:account-password' }) + scroll(`
      <h1 class="h1 mt-40">Je bent er bijna</h1>
      <div class="field">
        <label class="field__label" for="tel">Telefoonnummer</label>
        <div class="phone-row">
          <select class="select" id="cc" data-model="countryCode" aria-label="Landcode">
            ${global.DATA.OPTIONS.countryCodes.map(c =>
              `<option${f.countryCode === c ? ' selected' : ''}>${U.esc(c)}</option>`).join('')}
          </select>
          <input class="input" id="tel" type="tel" inputmode="tel" autocomplete="tel-national"
            placeholder="123 44 55" value="${U.esc(f.phone)}" data-model="phone">
        </div>
        <p class="field__help">We beloven je niet te spammen, maar we sturen je een sms om je nummer te bevestigen.</p>
      </div>
      ${U.button({
        label: 'Volgende', block: true, act: 'go:account-code',
        disabled: !ok, title: ok ? '' : 'Vul eerst je telefoonnummer in'
      })}
    `);
  };

  /* =====================================================================
     11. account-code
     Six separate fields. Any six digits are accepted — no SMS is sent.
     ===================================================================== */
  screens['account-code'] = function (st) {
    const code = st.form.code;
    const ok = code.join('').length === 6;
    return U.header({ variant: 'plain', back: 'go:account-phone' }) + scroll(`
      <h1 class="h1 mt-40">Bevestig je nummer</h1>
      <p class="lede">Vul de code in die we via sms stuurden naar ${U.esc(st.form.countryCode)} ${U.esc(st.form.phone)}.
        Verkeerd nummer? <button type="button" class="link" data-act="go:account-phone">Wijzigen</button></p>

      <div class="otp" role="group" aria-label="Bevestigingscode, zes cijfers">
        ${code.map((v, i) => `<input class="otp__box" inputmode="numeric" maxlength="1"
          value="${U.esc(v)}" data-otp="${i}" aria-label="Cijfer ${i + 1} van 6">`).join('')}
      </div>

      <p class="resend">Geen sms ontvangen?
        <span class="link is-inert" aria-disabled="true" title="Niet beschikbaar in dit prototype">Opnieuw versturen</span>
      </p>

      ${U.button({
        label: 'Account aanmaken', block: true, act: 'create-account',
        disabled: !ok, title: ok ? '' : 'Vul eerst de zescijferige code in'
      })}
    `);
  };

  /* =====================================================================
     12. estimate-detail  (also serves estimate-result-refined)
     The footer is where the two PDF rows diverge:
       claimed  -> "Plaats op Immoweb" only (full width, inert)
       unclaimed-> "Plaats op Immoweb" (inert) + "Claim deze woning" (routes)
     ===================================================================== */
  function estimateDetail(st) {
    const P = global.DATA.PROPERTY;
    const M = global.DATA.MARKET;
    const e = global.APP.currentEstimate(st);
    const refined = global.APP.completedCount(st) > 0;
    const tab = st.ui.detailTab;

    const overview = `
      <div class="stat-grid">
        <div class="stat"><span class="stat__label">Gem. verkoopprijs in de buurt</span><span class="stat__value">${U.esc(M.avgNearby)}</span></div>
        <div class="stat"><span class="stat__label">Prijstrend (12M)</span><span class="stat__value">${U.esc(M.priceTrend)}</span></div>
        <div class="stat"><span class="stat__label">Vraag</span><span class="stat__value">${U.esc(M.demand)}</span></div>
        <div class="stat"><span class="stat__label">Dagen te koop</span><span class="stat__value">${U.esc(M.daysOnMarket)}</span></div>
      </div>
      <div class="panel">
        <p class="panel__title">Prijstrend (gem. € / m² in de buurt)</p>
        ${U.trendChart(false)}
      </div>`;

    const comparables = `
      <div class="stat-grid">
        <div class="stat"><span class="stat__label">Verschijnt in</span>
          <span class="stat__value">${U.esc(M.searches)} <small>zoekopdrachten</small></span>
          <span class="stat__meta">${U.esc(M.searchesDelta)}</span></div>
        <div class="stat"><span class="stat__label">Concurreert met</span>
          <span class="stat__value">${U.esc(M.competing)} <small>gelijkaardige woningen</small></span>
          <span class="stat__meta">${U.esc(M.competingDelta)}</span></div>
      </div>
      <div class="panel">
        <p class="panel__title">Marktactiviteit (laatste X jaar)</p>
        ${U.mapIllustration({ activity: true })}
        <p class="legend">
          <span>${U.icon('i-pin', 'ic--xs')} verkochte woningen in de buurt</span>
          <span>${U.icon('i-pin', 'ic--xs')} woningen te koop in de buurt</span>
        </p>
      </div>`;

    // Selling-intention question — dismissable, matches the wireframe popover
    const intent = st.ui.intentDismissed ? '' : `
      <section class="popover">
        <button type="button" class="popover__close" data-act="dismiss-intent" aria-label="Sluiten">
          ${U.icon('i-close', 'ic--sm')}
        </button>
        <h3 class="popover__title">Wat wil je met deze woning doen?</h3>
        <div class="stack stack--tight" role="radiogroup" aria-label="Wat wil je met deze woning doen?">
          ${global.DATA.OPTIONS.intent.map(o => `
            <button type="button" role="radio" aria-checked="${st.form.intent === o.value}"
              class="choice choice--plain${st.form.intent === o.value ? ' is-selected' : ''}"
              data-act="set-intent" data-value="${o.value}">${U.esc(o.label)}</button>`).join('')}
        </div>
        ${U.button({
          label: 'Bewaren', variant: 'soft', small: true, act: 'dismiss-intent',
          disabled: !st.form.intent, title: st.form.intent ? '' : 'Kies eerst een optie'
        })}
      </section>`;

    // ---- the branch ----
    const footerButtons = st.claimed
      ? [{ label: 'Plaats op Immoweb', variant: 'pill-light', block: true, inert: true }]
      : [
          { label: 'Plaats op Immoweb', variant: 'pill-light', inert: true },
          { label: 'Claim deze woning', act: 'claim-property' }
        ];

    return U.header({
      variant: 'app',
      title: 'Mijn schatting',
      back: 'go:owner-hub',
      actions: [{ icon: 'i-share', label: 'Delen', disabled: true }]
    }) + scrollRaw(`
      ${U.addressLine(refined ? P.metaLong : P.metaShort)}
      <div class="pad pad--top0">
        ${U.estimateCard({ estimate: e, state: refined ? 'refined' : 'plain' })}
        ${intent}
        ${tabs(tab, 'set-detail-tab')}
        ${tab === 'overview' ? overview : comparables}

        ${U.button({ label: 'Download het volledige rapport', variant: 'pill-light', block: true, icon: 'i-download', inert: true })}

        <hr class="rule">
        <p class="sponsored">Gesponsord</p>
        <h3 class="h3">Vind experts voor je project</h3>
        <p class="card__body">We brengen je in contact met een makelaar voor een gratis schatting, zonder verplichtingen.</p>
        ${U.agentCards()}

        <hr class="rule">
        ${U.toggle({
          title: 'Verwittig me als de schatting verandert',
          body: 'We sturen je een e-mail en een melding als de prijs van deze schatting verandert.',
          on: st.notifications.valuation, act: 'toggle', name: 'valuation'
        })}
        ${U.toggle({
          title: 'Verwittig me over deze buurt',
          body: 'Ontvang maandelijks inzichten over deze buurt, met gemiddelde prijzen, lokaal nieuws en updates.',
          on: st.notifications.neighbourhood, act: 'toggle', name: 'neighbourhood'
        })}

        <hr class="rule">
        <h3 class="h3">Niet langer geïnteresseerd in deze woning?</h3>
        <span class="link-row is-inert" aria-disabled="true" title="Niet beschikbaar in dit prototype">
          ${U.icon('i-trash', 'ic--sm')} Verwijder deze schatting
        </span>
      </div>
    `) + U.actionBar({ buttons: footerButtons, stack: !st.claimed });
  }
  screens['estimate-detail'] = estimateDetail;
  screens['estimate-result-refined'] = estimateDetail;

  /* =====================================================================
     13. estimate-section-overview
     ===================================================================== */
  screens['estimate-section-overview'] = function (st) {
    const e = global.APP.currentEstimate(st);
    const done = global.APP.completedCount(st);
    const init = global.DATA.ESTIMATES.initial;

    return U.header({ variant: 'plain', back: 'go:estimate-detail' }) + scroll(`
      <h1 class="h1 mt-32">Krijg een nauwkeurigere schatting</h1>
      <p class="lede">Hoe meer details je deelt, hoe nauwkeuriger onze berekening.</p>

      <div class="current-est">
        <p class="current-est__label">Huidige schatting</p>
        <p class="current-est__value">${U.euro(e.mid)}
          ${done > 0 ? `<small>t.o.v. eerste schatting van ${U.euro(init.mid)}</small>` : ''}
        </p>
      </div>

      <p class="label-sm mt-20">Vul elk onderdeel in wanneer het jou past</p>

      <div class="stack">
        ${global.DATA.SECTIONS.map(s => `
          <button type="button" class="hub-card" data-act="go:${s.first}">
            <span class="hub-card__title">${U.esc(s.title)}</span>
            <span class="hub-card__body">${U.esc(s.body)}</span>
            <span class="hub-card__foot">
              <span class="hub-card__time">${U.esc(s.time)}</span>
              ${U.statusBadge(st.sections[s.id])}
            </span>
          </button>`).join('')}
      </div>
    `);
  };

  /* =====================================================================
     14. basics-type
     Progressive disclosure, exactly as the PDF shows it:
       type chosen -> "Wat voor soort huis?" appears (only for Huis)
       kind chosen -> "Hoeveel gevels?" appears
     Next stays disabled until the visible questions are answered.
     ===================================================================== */
  screens['basics-type'] = function (st) {
    const f = st.form;
    const O = global.DATA.OPTIONS;
    const isHouse = f.propertyType === 'house';
    const showKind = isHouse;
    const showFacades = isHouse && !!f.houseKind;
    // Non-house types skip the follow-ups entirely.
    const ok = f.propertyType && (!isHouse || (f.houseKind && f.facades));

    let pct = 0;
    if (f.propertyType) pct = isHouse ? 12 : 33;
    if (showFacades) pct = 24;
    if (ok) pct = 33;

    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Wat voor soort woning is dit?</h1>
      ${U.tileGroup({ label: 'Soort woning', act: 'set:propertyType', options: O.propertyType, selected: f.propertyType, stacked: true })}

      ${showKind ? `<h2 class="q">Wat voor soort huis?</h2>
        ${U.tileGroup({ label: 'Soort huis', act: 'set:houseKind', options: O.houseKind, selected: f.houseKind })}` : ''}

      ${showFacades ? `<h2 class="q">Hoeveel gevels heeft het huis?</h2>
        ${U.tileGroup({ label: 'Aantal gevels', act: 'set:facades', options: O.facades, selected: f.facades })}` : ''}
    `) + U.actionBar({
      progress: pct,
      buttons: [{
        label: 'Volgende', act: 'go:basics-characteristics',
        disabled: !ok, title: ok ? '' : 'Beantwoord eerst de vragen hierboven'
      }]
    });
  };

  /* =====================================================================
     15. basics-characteristics
     Land area is optional and may stay empty.
     ===================================================================== */
  screens['basics-characteristics'] = function (st) {
    const f = st.form;
    const ok = f.livingArea.trim() && f.constructionYear.trim();
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Wat zijn de belangrijkste kenmerken van de woning?</h1>
      ${U.field({ id: 'la', label: 'Bewoonbare oppervlakte', type: 'number', inputmode: 'numeric', suffix: 'm²', value: f.livingArea, model: 'livingArea' })}
      ${U.field({ id: 'lnd', label: 'Totale grondoppervlakte', optional: true, type: 'number', inputmode: 'numeric', suffix: 'm²', value: f.landArea, model: 'landArea' })}
      ${U.field({ id: 'yr', label: 'Bouwjaar', type: 'number', inputmode: 'numeric', value: f.constructionYear, model: 'constructionYear' })}
    `) + U.actionBar({
      back: 'go:basics-type',
      progress: 66,
      buttons: [{
        label: 'Volgende', act: 'go:basics-condition',
        disabled: !ok, title: ok ? '' : 'Vul eerst de bewoonbare oppervlakte en het bouwjaar in'
      }]
    });
  };

  /* =====================================================================
     16. basics-condition  — last step of "Basisgegevens"
     ===================================================================== */
  screens['basics-condition'] = function (st) {
    const ok = !!st.form.condition;
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Hoe zou je de staat omschrijven?</h1>
      ${U.radioGroup({ label: 'Staat van de woning', act: 'set:condition', options: global.DATA.OPTIONS.condition, selected: st.form.condition })}
    `) + U.actionBar({
      back: 'go:basics-characteristics',
      progress: 100,
      buttons: [{
        label: 'Volgende', act: 'complete:basics',
        disabled: !ok, title: ok ? '' : 'Kies eerst een optie'
      }]
    });
  };

  /* =====================================================================
     17. interior-rooms
     ===================================================================== */
  screens['interior-rooms'] = function (st) {
    const r = st.form.rooms;
    const ok = r.rooms > 0 && r.bedrooms > 0;
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Vertel ons meer over de woning</h1>
      <div class="counters">
        ${U.counter({ label: 'Kamers', name: 'rooms', value: r.rooms, act: 'count', info: 'Alle leefruimtes, exclusief badkamers en toiletten' })}
        ${U.counter({ label: 'Slaapkamers', name: 'bedrooms', value: r.bedrooms, act: 'count' })}
        ${U.counter({ label: 'Badkamers', name: 'bathrooms', value: r.bathrooms, act: 'count' })}
        ${U.counter({ label: 'Toiletten', name: 'toilets', value: r.toilets, act: 'count', info: 'Aparte toiletten, buiten de badkamers' })}
      </div>
    `) + U.actionBar({
      progress: 33,
      buttons: [{
        label: 'Volgende', act: 'go:interior-view',
        disabled: !ok, title: ok ? '' : 'Vul eerst het aantal kamers en slaapkamers in'
      }]
    });
  };

  /* =====================================================================
     18. interior-view
     ===================================================================== */
  screens['interior-view'] = function (st) {
    const ok = !!st.form.view;
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Hoe zou je het zicht vanuit de woning omschrijven?</h1>
      ${U.radioGroup({ label: 'Zicht', act: 'set:view', options: global.DATA.OPTIONS.view, selected: st.form.view })}
    `) + U.actionBar({
      back: 'go:interior-rooms',
      progress: 66,
      buttons: [{
        label: 'Volgende', act: 'go:interior-amenities',
        disabled: !ok, title: ok ? '' : 'Kies eerst een optie'
      }]
    });
  };

  /* =====================================================================
     19. interior-amenities — last step of "Binnen & buiten"
     Ticking Tuin / Terras reveals its detail fields; unticking hides them
     but keeps the entered values (prompt: PRESERVE ENTERED VALUES).
     ===================================================================== */
  screens['interior-amenities'] = function (st) {
    const f = st.form;
    const O = global.DATA.OPTIONS;

    const block = a => {
      const on = f.amenities[a.value];
      if (!a.detailed) {
        return U.checkRow({ act: 'toggle-amenity', value: a.value, label: a.label, icon: a.icon, checked: on });
      }
      const d = f.amenityDetails[a.value];
      return `<div class="amenity${on ? ' is-open' : ''}">
        <button type="button" role="checkbox" aria-checked="${on}" class="amenity__head"
          data-act="toggle-amenity" data-value="${a.value}">
          <span class="box" aria-hidden="true">${U.icon('i-check', 'ic--xs')}</span>
          <span class="check__icon">${U.icon(a.icon, 'ic--sm')}</span>
          <span>${U.esc(a.label)}</span>
        </button>
        ${on ? `<div class="amenity__body">
          ${U.field({ id: a.value + '-s', label: 'Oppervlakte', type: 'number', inputmode: 'numeric', suffix: 'm²', value: d.surface, model: `amenityDetails.${a.value}.surface` })}
          ${U.selectField({ id: a.value + '-o', label: 'Oriëntatie', options: O.orientation, value: d.orientation, model: `amenityDetails.${a.value}.orientation` })}
        </div>` : ''}
      </div>`;
    };

    // At least one amenity ticked, or explicitly none — the wireframes let the
    // user continue either way, so Volgende stays enabled here.
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Welke extra troeven heeft de woning?</h1>
      <div class="stack">${O.amenities.map(block).join('')}</div>
    `) + U.actionBar({
      back: 'go:interior-view',
      progress: 100,
      buttons: [{ label: 'Volgende', act: 'complete:interior' }]
    });
  };

  /* =====================================================================
     20. energy-performance
     Choosing an EPC rating reveals the extra EPC fields.
     ===================================================================== */
  screens['energy-performance'] = function (st) {
    const f = st.form;
    const ok = !!f.epc;
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Wat is de energieprestatie van de woning?</h1>
      <div class="mt-16">
        <span class="sr-only" id="epc-lbl">Energieprestatie</span>
        ${U.sheetSelect({ act: 'sheet:epc', value: f.epc })}
      </div>

      ${ok ? `<h2 class="q">Welke andere gegevens?</h2>
        ${U.field({ id: 'epc-ref', label: 'Referentienummer van het EPC-rapport', value: f.epcRef, model: 'epcRef', placeholder: '20250703-0002345678-RES-1' })}
        ${U.field({ id: 'epc-cons', label: 'EPC-energieverbruik per m²', value: f.epcConsumption, model: 'epcConsumption', suffix: 'kWh/m²', placeholder: '399' })}
        ${U.field({ id: 'epc-co2', label: 'EPC – CO₂-uitstoot', value: f.epcCo2, model: 'epcCo2', suffix: 'kg CO₂/m²', placeholder: '100' })}` : ''}
    `) + U.actionBar({
      progress: ok ? 50 : 10,
      buttons: [{
        label: 'Volgende', act: 'go:energy-heating',
        disabled: !ok, title: ok ? '' : 'Kies eerst een energielabel'
      }]
    });
  };

  /* =====================================================================
     21. energy-heating (+ energy features)
     The PDF keeps these on one screen: choosing a heating type reveals the
     "Selecteer extra energiekenmerken" checklist below it.
     ===================================================================== */
  function energyHeating(st) {
    const f = st.form;
    const ok = !!f.heating;
    return U.header({ variant: 'plain', saveExit: 'save-exit' }) + scroll(`
      <h1 class="h1 mt-24">Hoe wordt de woning verwarmd?</h1>
      <div class="mt-16">${U.sheetSelect({ act: 'sheet:heating', value: global.APP.heatingLabel(f.heating) })}</div>

      ${ok ? `<h2 class="q">Selecteer extra energiekenmerken:</h2>
        <div class="stack" role="group" aria-label="Extra energiekenmerken">
          ${global.DATA.OPTIONS.energyFeatures.map(x => U.checkRow({
            act: 'toggle-feature', value: x.value, label: x.label, icon: x.icon,
            checked: !!f.energyFeatures[x.value]
          })).join('')}
        </div>` : ''}
    `) + U.actionBar({
      back: 'go:energy-performance',
      progress: 100,
      buttons: [{
        label: 'Volgende', act: 'complete:energy',
        disabled: !ok, title: ok ? '' : 'Kies eerst een type verwarming'
      }]
    });
  }
  screens['energy-heating'] = energyHeating;
  screens['energy-features'] = energyHeating;

  global.SCREENS = screens;
})(window);
