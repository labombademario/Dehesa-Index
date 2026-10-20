/* Dehesa Index — pestaña «Otros países» de exportaciones.html: acceso a la ficha de comercio exterior de cada país que tiene datos (comercio-pais.html). ES5. */
(function () {
  'use strict';
  if (!window.CASeries || !window.CASeries.custom || !document.getElementById('ex-otros')) return;
  var CC = ['AT', 'AU', 'BE', 'BG', 'CL', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'UK'];
  var T = {
    es: ['Otros países', 'Exportaciones e importaciones agroalimentarias de cada país, con sus socios comerciales. Elige un país para abrir su ficha de comercio exterior.', 'Los datos vienen de Eurostat (Comext) para los países de la UE y de los organismos estadísticos de Reino Unido, Australia y Chile.'],
    en: ['Other countries', 'Agri-food exports and imports for each country, with its trading partners. Pick a country to open its foreign-trade profile.', 'Data come from Eurostat (Comext) for EU countries and from the national statistics offices of the UK, Australia and Chile.'],
    fr: ['Autres pays', 'Exportations et importations agroalimentaires de chaque pays, avec ses partenaires commerciaux. Choisissez un pays pour ouvrir sa fiche de commerce extérieur.', 'Les données viennent d’Eurostat (Comext) pour les pays de l’UE et des instituts statistiques du Royaume-Uni, de l’Australie et du Chili.'],
    it: ['Altri paesi', 'Esportazioni e importazioni agroalimentari di ogni paese, con i suoi partner commerciali. Scegli un paese per aprire la sua scheda di commercio estero.', 'I dati provengono da Eurostat (Comext) per i paesi UE e dagli istituti di statistica di Regno Unito, Australia e Cile.']
  };
  var LI = { es: 0, en: 1, fr: 2, it: 3 };
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function iso(c) { return { EL: 'GR', UK: 'GB' }[c] || c; }
  function flag(c) { c = iso(c); return String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1)); }
  function name(c) { try { return new Intl.DisplayNames([lang()], { type: 'region' }).of(iso(c)); } catch (e) { return c; } }
  function show() {
    var el = document.getElementById('ex-otros'), l = lang(), t = T[l] || T.es;
    var h1 = document.getElementById('pg-h1'), sb = document.getElementById('pg-sub'); if (h1) h1.textContent = t[0]; if (sb) sb.textContent = t[1];
    var list = CC.map(function (c) { return { c: c, n: name(c) }; }).sort(function (a, b) { return a.n.localeCompare(b.n, l); });
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin:8px 0 14px">' + list.map(function (x) { return '<a class="di-card" style="padding:12px 14px;text-decoration:none;color:inherit;display:flex;gap:10px;align-items:center" href="comercio-pais.html?c=' + x.c + '"><span aria-hidden="true" style="font-size:22px">' + flag(x.c) + '</span><span style="font-weight:600">' + esc(x.n) + '</span></a>'; }).join('') + '</div><p class="di-movers-hint">' + esc(t[2]) + '</p>';
  }
  window.CASeries.custom({ id: 'ex-otros', tabsHost: 'ex-ca-tabs', usBody: 'ex-body', usRender: function () { if (window.__exUsRender) window.__exUsRender(); }, country: 'XX', tabUS: ['EE. UU.', 'US', 'États-Unis', 'Stati Uniti'], label: ['Otros países', 'Other countries', 'Autres pays', 'Altri paesi'], onShow: show });
})();
