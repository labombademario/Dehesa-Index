/* Dehesa Index — Zona de produccion y categoria de las denominaciones francesas (INAO; data/gi/FR-geo.json y FR-inao.json). ES5.
   Los poligonos estan simplificados y se dibujan sobre los contornos de vendor/fr-regions.js (misma proyeccion). Se cargan solo al pedir una zona. */
(function () {
  'use strict';
  var T = {
    es: { zmHC: 'Mapa de las zonas de los quesos', zmNC: 'Pulsa una zona para ver solo ese queso. La zona sale del pliego de cada queso, a nivel de las unidades administrativas que cita, así que puede ser mayor que la real: es orientativa.', zmHP: 'Mapa de las zonas de vino (DOP e IGP)', zmNP: 'Pulsa una zona para ver solo esa denominación. Las DOP van a nivel municipal; las IGP (y alguna DOP) a nivel de las unidades administrativas que cita su pliego, así que el área puede ser mayor que la real: es orientativo.', noteP: 'Zona según el pliego de condiciones, a nivel de unidades administrativas (NUTS, Eurostat/GISCO): puede ser mayor que la zona real y no sirve para delimitar parcelas.', srcP: 'Fuente: pliego de condiciones de la denominación y Eurostat/GISCO.', show: 'Ver zona', hide: 'Ocultar zona', note: 'Zona de producción según el INAO, con el contorno simplificado: es orientativa, no sirve para delimitar parcelas.', src: 'Fuente: INAO, delimitación de las áreas geográficas de los SIQO (Licence Ouverte 2.0).', err: 'No se ha podido cargar la zona.',
      zmH: 'Mapa de las zonas de DOP de vino', zmN: 'Pulsa una zona para ver solo esa denominación. Solo DOP de vino (sin IGP), contorno a nivel municipal y simplificado: es orientativo.', zmIs: '{n} zonas en islas: usa «Ver zona» en la lista.', zmClr: 'Quitar selección', noteG: 'Zona de producción a nivel municipal (registro de la UE a nov-2021), con el contorno simplificado: es orientativa, no sirve para delimitar parcelas.', srcG: 'Fuente: Candiago et al. 2022, EU-PDO (Scientific Data), CC0.' },
    en: { zmHC: 'Map of cheese areas', zmNC: 'Click an area to see only that cheese. Each area comes from the cheese’s specification, at the level of the administrative units it names, so it may be larger than the real one: indicative only.', zmHP: 'Map of wine areas (PDO and PGI)', zmNP: 'Click an area to see only that designation. PDOs are at municipality level; PGIs (and a few PDOs) at the level of the administrative units named in their specification, so the area may be larger than the real one: indicative only.', noteP: 'Area according to the product specification, at the level of administrative units (NUTS, Eurostat/GISCO): it may be larger than the real area and is not for delimiting plots.', srcP: 'Source: product specification of the designation and Eurostat/GISCO.', show: 'Show area', hide: 'Hide area', note: 'Production area according to INAO, outline simplified: indicative only, not for delimiting plots.', src: 'Source: INAO, delimitation of the geographical areas of SIQO (Licence Ouverte 2.0).', err: 'The area could not be loaded.',
      zmH: 'Map of wine PDO areas', zmN: 'Click an area to see only that designation. Wine PDOs only (no PGIs), municipal-level simplified outline: indicative only.', zmIs: '{n} areas on islands: use “Show area” in the list.', zmClr: 'Clear selection', noteG: 'Production area at municipality level (EU register as of Nov 2021), outline simplified: indicative only, not for delimiting plots.', srcG: 'Source: Candiago et al. 2022, EU-PDO (Scientific Data), CC0.' },
    fr: { zmHC: 'Carte des aires des fromages', zmNC: 'Cliquez sur une aire pour ne voir que ce fromage. L’aire vient du cahier des charges de chaque fromage, à l’échelle des unités administratives qu’il cite : elle peut être plus grande que la réelle, indicatif.', zmHP: 'Carte des aires viticoles (AOP et IGP)', zmNP: 'Cliquez sur une aire pour ne voir que cette appellation. Les AOP sont à l’échelle communale ; les IGP (et quelques AOP) à celle des unités administratives citées dans leur cahier des charges, l’aire peut donc être plus grande que la réelle : indicatif.', noteP: 'Aire selon le cahier des charges, à l’échelle d’unités administratives (NUTS, Eurostat/GISCO) : elle peut être plus grande que l’aire réelle et ne permet pas de délimiter des parcelles.', srcP: 'Source : cahier des charges de la dénomination et Eurostat/GISCO.', show: 'Voir l’aire', hide: 'Masquer l’aire', note: 'Aire de production selon l’INAO, contour simplifié : indicatif, ne permet pas de délimiter des parcelles.', src: 'Source : INAO, délimitation des aires géographiques des SIQO (Licence Ouverte 2.0).', err: 'Impossible de charger l’aire.',
      zmH: 'Carte des aires des AOP viticoles', zmN: 'Cliquez sur une aire pour ne voir que cette appellation. AOP viticoles uniquement (sans IGP), contour communal simplifié : indicatif.', zmIs: '{n} aires sur des îles : utilisez « Voir l’aire » dans la liste.', zmClr: 'Effacer la sélection', noteG: 'Aire de production à l’échelle communale (registre de l’UE, nov. 2021), contour simplifié : indicatif, ne permet pas de délimiter des parcelles.', srcG: 'Source : Candiago et al. 2022, EU-PDO (Scientific Data), CC0.' },
    it: { zmHC: 'Mappa delle zone dei formaggi', zmNC: 'Clicca su una zona per vedere solo quel formaggio. La zona viene dal disciplinare di ogni formaggio, a livello delle unità amministrative citate, quindi può essere più grande di quella reale: indicativo.', zmHP: 'Mappa delle zone dei vini (DOP e IGP)', zmNP: 'Clicca su una zona per vedere solo quella denominazione. Le DOP sono a livello comunale; le IGP (e qualche DOP) a livello delle unità amministrative citate nel disciplinare, quindi l’area può essere più grande di quella reale: indicativo.', noteP: 'Zona secondo il disciplinare, a livello di unità amministrative (NUTS, Eurostat/GISCO): può essere più grande della zona reale e non serve a delimitare parcelle.', srcP: 'Fonte: disciplinare della denominazione ed Eurostat/GISCO.', show: 'Mostra zona', hide: 'Nascondi zona', note: 'Zona di produzione secondo l’INAO, contorno semplificato: indicativa, non serve a delimitare parcelle.', src: 'Fonte: INAO, delimitazione delle aree geografiche dei SIQO (Licence Ouverte 2.0).', err: 'Impossibile caricare la zona.',
      zmH: 'Mappa delle zone delle DOP vinicole', zmN: 'Clicca una zona per vedere solo quella denominazione. Solo DOP del vino (senza IGP), contorno comunale semplificato: indicativo.', zmIs: '{n} zone su isole: usa «Mostra zona» nell’elenco.', zmClr: 'Rimuovi selezione', noteG: 'Zona di produzione a livello comunale (registro UE a nov. 2021), contorno semplificato: indicativa, non serve a delimitare parcelle.', srcG: 'Fonte: Candiago et al. 2022, EU-PDO (Scientific Data), CC0.' }
  };
  /* categorias del referencial del INAO (en frances) -> es|en|it */
  var CAT = {
    'Vin tranquille': 'tranquilo|still|fermo', 'Vin primeur': 'de primor|primeur|novello', 'Vin mousseux': 'espumoso|sparkling|spumante', 'Vin mousseux "Crémant"': 'espumoso (crémant)|sparkling (crémant)|spumante (crémant)',
    'Vin mousseux "Méthode ancestrale"': 'espumoso (método ancestral)|sparkling (ancestral method)|spumante (metodo ancestrale)', 'Vin pétillant': 'de aguja|semi-sparkling|frizzante', 'Vin doux naturel': 'dulce natural|natural sweet wine|dolce naturale',
    'Vin de liqueur': 'de licor|fortified|liquoroso', 'Vin de vendanges tardives': 'de vendimia tardía|late harvest|vendemmia tardiva', 'Vin de sélection de grains nobles': 'de granos nobles|noble berry selection|selezione di grani nobili',
    'Vin de raisins surmuris': 'de uvas sobremaduras|overripe grapes|uve surmature', 'Vin de triees successives': 'de cosechas sucesivas|successive pickings|raccolte successive', 'Vin de paille': 'de paja|straw wine|vino di paglia',
    'Vin jaune': 'vino amarillo|vin jaune|vin jaune', 'Vin sur lie': 'sobre lías|on lees|sur lie', 'Eaux-de-vie de cidre et de poiré': 'aguardiente de sidra y perada|cider and perry brandy|acquavite di sidro e sidro di pere',
    'Chèvre': 'cabra|goat|capra', 'Pâte pressée cuite': 'pasta prensada cocida|cooked pressed|pasta pressata cotta', 'Pâte pressée non cuite': 'pasta prensada no cocida|uncooked pressed|pasta pressata non cotta', 'Pâte persillée': 'pasta azul|blue|erborinato',
    'Pâte molle et croûte fleurie': 'pasta blanda, corteza florida|soft, bloomy rind|pasta molle, crosta fiorita', 'Pâte molle et croûte lavée': 'pasta blanda, corteza lavada|soft, washed rind|pasta molle, crosta lavata', 'autres fromages (frais, blanc, fondu...)': 'otros (fresco, fundido…)|other (fresh, processed…)|altri (freschi, fusi…)'
  };
  var LI = { es: 0, en: 1, it: 2 };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cat(fr, lg) { var v = CAT[fr]; return v && LI[lg] != null ? v.split('|')[LI[lg]] : fr; }
  var P = {};
  function json(u) { return P[u] || (P[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }).catch(function () { return null; })); }
  function script(u) {
    return P[u] || (P[u] = new Promise(function (ok) {
      var s = document.createElement('script'); s.src = u; s.onload = function () { ok(true); }; s.onerror = function () { ok(false); }; document.head.appendChild(s);
    }));
  }
  function info() { return json('data/gi/FR-inao.json'); }
  var GEO = { ES: 1, PT: 1, UK: 1, CZ: 1, AT: 1, BE: 1, BG: 1, HR: 1, DE: 1, EL: 1, HU: 1, NL: 1, RO: 1, SK: 1, SI: 1, CY: 1, MT: 1, DK: 1, LU: 1, PL: 1, IE: 1, LT: 1, SE: 1, IT: 1 };
  function ccOf(f) { var c = (String(f).split('-')[1] || '').toUpperCase(); return c === 'GB' ? 'UK' : c === 'GR' ? 'EL' : c; }
  // paises con zonas del dataset EU-PDO: devuelve { z: [ids con zona], geo: documento }
  function geoInfo(cc) { return GEO[cc] ? json('data/gi/' + cc + '-geo.json').then(function (g) { return g && g.areas ? { z: Object.keys(g.areas), geo: g } : null; }) : Promise.resolve(null); }
  function zoneMap(g, names, sel, lg, only, kind) {
    var keys = Object.keys(g.areas).filter(function (k) { return !only || only[k]; });
    if (!keys.length) return '';
    var t = T[lg] || T.es, isl = 0, hasP = keys.some(function (k) { return g.areas[k].p; }), ch = kind === 'cheese';
    var H = ch ? t.zmHC : hasP ? t.zmHP : t.zmH;
    var paths = keys.map(function (f) {
      var a = g.areas[f]; if (a.i) { isl++; return ''; }
      var nm = names[f] || f, on = sel === f;
      return '<path d="' + a.d + '" class="di-gi-zm' + (on ? ' on' : '') + '" data-gi-zn="' + esc(f) + '" tabindex="0" role="button" aria-pressed="' + on + '" aria-label="' + esc(nm) + '"><title>' + esc(nm) + '</title></path>';
    }).join('');
    return '<div class="di-gi-map" style="flex:0 0 300px;max-width:100%"><div style="font-size:12px;font-weight:700;margin:0 0 4px">' + esc(H) + '</div><svg viewBox="' + g.viewBox + '" style="width:100%;height:auto;max-height:380px" role="group" aria-label="' + esc(H) + '">' + (g.n ? '<path class="di-gi-zn" d="' + g.n + '" pointer-events="none"/>' : '') + (g.o ? '<path class="di-gi-zo" d="' + g.o + '" pointer-events="none"/>' : '') + paths + (g.o ? '<path class="di-gi-zb" d="' + g.o + '" pointer-events="none"/>' : '') + '</svg>' +
      '<div class="di-movers-hint" style="margin:4px 0 0">' + esc(ch ? t.zmNC : hasP ? t.zmNP : t.zmN) + (isl ? ' ' + esc(t.zmIs.replace('{n}', isl)) : '') + '</div>' +
      (sel ? '<div style="margin:6px 0 0"><b>' + esc(names[sel] || sel) + '</b> <button type="button" class="di-gi-zbtn" data-gi-zclr="1">' + esc(t.zmClr) + '</button></div>' : '') + '</div>';
  }
  function btn(f, lg) { var t = T[lg] || T.es; return ' <button type="button" class="di-gi-zbtn" data-gi-z="' + esc(f) + '" aria-expanded="false">' + esc(t.show) + '</button>'; }
  function svg(a, regions) {
    var b = a.b, w = Math.max(b[2], 90), h = Math.max(b[3], 70), px = w * 0.3, py = h * 0.3;
    var vw = w + 2 * px, vh = h + 2 * py; if (vw / vh < 1.3) vw = vh * 1.3; else vh = vw / 1.3;
    var vx = b[0] + b[2] / 2 - vw / 2, vy = b[1] + b[3] / 2 - vh / 2;
    var bg = (regions || []).map(function (s) { return '<path d="' + s.d + '"/>'; }).join('');
    return '<svg class="di-gi-zsvg" viewBox="' + [vx, vy, vw, vh].map(function (n) { return n.toFixed(1); }).join(' ') + '" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">' +
      '<g class="di-gi-zbg">' + bg + '</g><path class="di-gi-zarea" d="' + a.d + '"/></svg>';
  }
  function toggle(btnEl, lg) {
    var t = T[lg] || T.es, li = btnEl.closest ? btnEl.closest('li') : btnEl.parentNode, f = btnEl.getAttribute('data-gi-z'), box = li.querySelector('.di-gi-zone');
    if (box) { box.parentNode.removeChild(box); btnEl.textContent = t.show; btnEl.setAttribute('aria-expanded', 'false'); return; }
    box = document.createElement('div'); box.className = 'di-gi-zone'; box.innerHTML = '<span class="di-movers-hint">…</span>'; li.appendChild(box);
    btnEl.textContent = t.hide; btnEl.setAttribute('aria-expanded', 'true');
    var gcc = ccOf(f);
    if (GEO[gcc]) {
      json('data/gi/' + gcc + '-geo.json').then(function (g) {
        var a = g && g.areas && g.areas[f];
        if (!a) { box.innerHTML = '<span class="di-movers-hint">' + esc(t.err) + '</span>'; return; }
        var bg = Object.keys(g.areas).filter(function (k) { return k !== f && !!g.areas[k].i === !!a.i; }).map(function (k) { return { d: g.areas[k].d }; });
        box.innerHTML = svg(a, bg) + '<p class="di-movers-hint" style="margin:4px 0 0">' + esc(a.p ? t.noteP : t.noteG) + ' ' + esc(a.p ? t.srcP : t.srcG) + '</p>';
      });
      return;
    }
    Promise.all([json('data/gi/FR-geo.json'), script('vendor/fr-regions.js?v=20261013')]).then(function (r) {
      var g = r[0], a = g && g.areas && g.areas[f];
      if (!a) { box.innerHTML = '<span class="di-movers-hint">' + esc(t.err) + '</span>'; return; }
      var R = window.DEHESA_FR_REGIONS && window.DEHESA_FR_REGIONS.states;
      box.innerHTML = svg(a, R) + '<p class="di-movers-hint" style="margin:4px 0 0">' + esc(t.note) + ' ' + esc(t.src) + '</p>';
    });
  }
  function lang() { var l; if (window.DehesaShared && window.DehesaShared.getLang) l = window.DehesaShared.getLang(); try { if (!l) l = localStorage.getItem('dehesaIndexLang'); } catch (e) {} l = l || document.documentElement.lang || 'es'; return T[l] ? l : 'es'; }
  document.addEventListener('click', function (ev) { var b = ev.target && ev.target.closest ? ev.target.closest('[data-gi-z]') : null; if (b) toggle(b, lang()); });
  window.GIZ = { info: info, geoInfo: geoInfo, zoneMap: zoneMap, btn: btn, toggle: toggle, cat: cat };
})();
