/* ==========================================================================
   data.js — all mock content in one place.
   Every value here is deterministic: nothing is randomised, so two runs of
   the prototype always produce the same numbers.
   Interface language: Dutch (Belgium), informal "je / jouw".
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- The one example property, per the prompt ------------------------- */
  const PROPERTY = {
    street:   'Statiestraat 15',
    city:     '2000 Antwerpen',
    region:   'Vlaanderen',
    short:    'Statiestraat 15, 2000 Antwerpen',
    full:     'Statiestraat 15, 2000 Antwerpen, Vlaanderen',
    type:     'Huis',
    year:     '1975',
    surface:  '159 m²',
    land:     '547 m²',
    // shown on the Owner Hub property card
    cardTitle: 'Huis in Statiestraat 15, Antwerpen',
    cardMeta:  '159 m² • 3 slaapkamers • 2 badkamers • Terras',
    // shown under the address on the estimate screens
    metaShort: 'Huis • 159 m²',
    metaLong:  'Huis • 159 m² • 547 m² grond',
    metaLocked:'159 m² • 4 slaapkamers • 2 badkamers • Terras'
  };

  /* ---- Hard-coded address suggestions ---------------------------------- */
  // Only the first one is the example property; the others exist so the list
  // feels real. All three lead to the same confirmation screen.
  const SUGGESTIONS = [
    { match: 'Statiestraat 15', rest: ', 2000 Antwerpen, Vlaanderen', isExample: true },
    { match: 'Statiestraat 15', rest: 'A, 2000 Antwerpen, Vlaanderen' },
    { match: 'Statiestraat 17', rest: ', 2000 Antwerpen, Vlaanderen' }
  ];

  /* ---- Deterministic estimate values ----------------------------------- */
  const ESTIMATES = {
    initial: { mid: 453000, low: 440000, high: 465000, rent: 1300 },
    partial: { mid: 472000, low: 460000, high: 484000, rent: 1450 },
    refined: { mid: 491000, low: 478000, high: 501000, rent: 1600 }
  };

  const MARKET = {
    avgNearby:  '€ 442.500',
    priceTrend: '+6,4%',
    demand:     'Hoog',
    daysOnMarket: '28 dagen',
    searches:   '234',
    searchesDelta: '↑ 11,0% sinds mei',
    competing:  '54',
    competingDelta: '↑ 13 nieuwe woningen sinds mei',
    trendPoints: [412, 430, 437, 452, 461, 471, 476],
    trendLabels: ['jun ’24', 'aug ’24', 'okt ’24', 'dec ’24', 'feb ’25', 'apr ’25', 'jun ’25'],

    /* ---- Pins on the "Marktactiviteit" map ----
       Two kinds, matching the legend the map already carries:
         sold    — verkochte woningen in de buurt  (filled pin)
         forsale — woningen te koop in de buurt    (outlined pin)
       x/y are coordinates inside the map's 340 × 230 viewBox.
       Sold pins sit low and open their card upwards; for-sale pins sit high
       and open downwards, so a card never falls outside the map. */
    activity: [
      { id: 'p1', type: 'sold',    x: 62,  y: 178, price: 398000, date: '15 januari 2025',
        address: 'Statiestraat 22',        beds: 3, baths: 1, area: 118 },
      { id: 'p2', type: 'sold',    x: 152,  y: 196, price: 442500, date: '3 maart 2025',
        address: 'Van Wesenbekestraat 8',  beds: 4, baths: 2, area: 152 },
      { id: 'p3', type: 'sold',    x: 252,  y: 182, price: 515000, date: '28 april 2025',
        address: 'De Coninckplein 3',      beds: 5, baths: 2, area: 186 },
      { id: 'p4', type: 'forsale', x: 104,  y: 42,  price: 469000,
        address: 'Statiestraat 41',        beds: 3, baths: 2, area: 140 },
      { id: 'p5', type: 'forsale', x: 206,  y: 34,  price: 529000,
        address: 'Diamantstraat 12',       beds: 4, baths: 2, area: 175 },
      { id: 'p6', type: 'forsale', x: 292,  y: 50,  price: 615000,
        address: 'Pelikaanstraat 60',      beds: 5, baths: 3, area: 210 }
    ]
  };

  const AGENTS = [
    { name: 'Belvil.immo',      meta: '2000 Antwerpen • 3 km verderop',  count: '12 woningen te koop' },
    { name: 'TB Immobiliën',    meta: '2018 Antwerpen • 6 km verderop',  count: '23 woningen te koop' },
    { name: 'Sunset Estate',    meta: '2600 Berchem • 9 km verderop',    count: '125 woningen te koop' }
  ];

  /* ---- Option sets ------------------------------------------------------ */
  const OPTIONS = {
    propertyType: [
      { value: 'house',     label: 'Huis',                 icon: 'i-house-line' },
      { value: 'apartment', label: 'Appartement of studio', icon: 'i-building' },
      { value: 'other',     label: 'Andere',               icon: 'i-dots' }
    ],
    houseKind: [
      { value: 'house',     label: 'Huis',      icon: 'i-house-line' },
      { value: 'chalet',    label: 'Chalet',    icon: 'i-cabin' },
      { value: 'mansion',   label: 'Herenhuis', icon: 'i-manor' },
      { value: 'bungalow',  label: 'Bungalow',  icon: 'i-home' },
      { value: 'townhouse', label: 'Rijhuis',   icon: 'i-row' },
      { value: 'villa',     label: 'Villa',     icon: 'i-villa' }
    ],
    facades: [
      { value: '2', label: '2 of minder' },
      { value: '3', label: '3' },
      { value: '4', label: '4 of meer' }
    ],
    condition: [
      { value: 'new',        label: 'Nieuw of zo goed als nieuw', sub: 'Nieuwbouw of volledig gerenoveerd',   icon: 'i-sparkle' },
      { value: 'renovated',  label: 'Recent gerenoveerd',         sub: 'Vernieuwd in de laatste 4 jaar',      icon: 'i-brush' },
      { value: 'good',       label: 'Goed',                       sub: 'Instapklaar, geen grote werken nodig', icon: 'i-thumb' },
      { value: 'dated',      label: 'Gedateerd',                  sub: 'Al meer dan 15 jaar niet vernieuwd',  icon: 'i-clock' },
      { value: 'renovation', label: 'Te renoveren',               sub: 'Grote werken nodig, niet bewoonbaar', icon: 'i-tools' }
    ],
    view: [
      { value: 'outstanding', label: 'Uitzonderlijk', sub: 'Een uniek zicht: monument, berg, zee of park',   icon: 'i-mountain' },
      { value: 'clear',       label: 'Vrij',          sub: 'Open zicht op straat, tuinen of daken',          icon: 'i-window' },
      { value: 'blocked',     label: 'Belemmerd',     sub: 'Kijkt uit op een muur, omheining of het gebouw ernaast', icon: 'i-wall' }
    ],
    orientation: [
      'Noord', 'Noordoost', 'Oost', 'Zuidoost', 'Zuid', 'Zuidwest', 'West', 'Noordwest'
    ],
    epc: ['A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
    heating: [
      { value: 'carbon',   label: 'Kolen' },
      { value: 'electric', label: 'Elektrisch' },
      { value: 'gas',      label: 'Gas' },
      { value: 'fueloil',  label: 'Stookolie' },
      { value: 'wood',     label: 'Hout' },
      { value: 'pellet',   label: 'Pellets' },
      { value: 'solar',    label: 'Zonne-energie' }
    ],
    energyFeatures: [
      { value: 'heatpump',    label: 'Warmtepomp',                  icon: 'i-flame' },
      { value: 'pv',          label: 'Fotovoltaïsche zonnepanelen', icon: 'i-bolt' },
      { value: 'thermic',     label: 'Thermische zonnepanelen',     icon: 'i-sun' },
      { value: 'glazing',     label: 'Dubbele beglazing',           icon: 'i-window' },
      { value: 'waterheater', label: 'Gemeenschappelijke boiler',   icon: 'i-drop' },
      { value: 'insulation',  label: 'Dakisolatie',                 icon: 'i-leaf' }
    ],
    amenities: [
      { value: 'garden',  label: 'Tuin',    icon: 'i-tree',    detailed: true },
      { value: 'terrace', label: 'Terras',  icon: 'i-terrace', detailed: true },
      { value: 'pool',    label: 'Zwembad', icon: 'i-pool',    detailed: false }
    ],
    intent: [
      { value: 'sell',    label: 'Ik wil ze verkopen' },
      { value: 'rent',    label: 'Ik wil ze verhuren' },
      { value: 'curious', label: 'Niets, ik ben gewoon benieuwd' }
    ],
    countryCodes: ['(BE) +32', '(NL) +31', '(FR) +33', '(LU) +352', '(DE) +49']
  };

  /* ---- The three refine sections --------------------------------------- */
  const SECTIONS = [
    {
      id: 'basics',
      title: 'Basisgegevens',
      body: 'Type woning, bouwjaar, renovaties, enz.',
      time: '± 3 min',
      first: 'basics-type'
    },
    {
      id: 'interior',
      title: 'Binnen & buiten',
      body: 'Staat van de kamers, zicht, buitenruimtes, enz.',
      time: '± 5 min',
      first: 'interior-rooms'
    },
    {
      id: 'energy',
      title: 'Energie & nutsvoorzieningen',
      body: 'Isolatie, energieprestatie (EPC), enz.',
      time: '± 10 min',
      first: 'energy-performance'
    }
  ];

  /* ---- Bottom navigation ------------------------------------------------
     Only "Mijn Immo" has a destination in the wireframes. The other four are
     shown for realism but are inert (prompt: OWNER HUB / rules 3-6).       */
  const NAV = [
    { id: 'home',    label: 'Home',       icon: 'i-home',   active: false },
    { id: 'search',  label: 'Zoeken',     icon: 'i-search', active: false },
    { id: 'saves',   label: 'Favorieten', icon: 'i-heart',  active: false },
    { id: 'myimmo',  label: 'Mijn Immo',  icon: 'i-key',    active: true  },
    { id: 'profile', label: 'Profiel',    icon: 'i-user',   active: false }
  ];

  /* ---- Account benefits (account-benefits screen) ----------------------- */
  const BENEFITS = [
    {
      icon: 'i-sparkle',
      title: 'Verfijn je schatting',
      body: 'Vul de gegevens van je woning aan om de marge te verkleinen en een bedrag te krijgen dat past bij wat jouw woning uniek maakt.'
    },
    {
      icon: 'i-info',
      title: 'Zie hoe we het berekenen',
      body: 'Krijg de volledige uitleg achter je schatting: vergelijkbare verkopen, prijstrends en de vraag in jouw buurt.'
    },
    {
      icon: 'i-download',
      title: 'Download het volledige rapport',
      body: 'Bewaar je schatting en buurtinzichten als rapport, klaar om te delen met je bank, een makelaar of je familie.'
    },
    {
      icon: 'i-bell',
      title: 'Blijf op de hoogte',
      body: 'We verwittigen je zodra de prijs van je woning of je buurt verandert, zodat je nooit voor verrassingen staat.'
    }
  ];

  global.DATA = { PROPERTY, SUGGESTIONS, ESTIMATES, MARKET, AGENTS, OPTIONS, SECTIONS, NAV, BENEFITS };
})(window);
