/* Dehesa Index — Zona de produccion y categoria de las denominaciones francesas (INAO; data/gi/FR-geo.json y FR-inao.json). ES5.
   Los poligonos estan simplificados y se dibujan sobre los contornos de vendor/fr-regions.js (misma proyeccion). Se cargan solo al pedir una zona. */
(function () {
  'use strict';
  var T = {
    es: { show: 'Ver zona', hide: 'Ocultar zona', note: 'Zona de producción según el INAO, con el contorno simplificado: es orientativa, no sirve para delimitar parcelas.', src: 'Fuente: INAO, delimitación de las áreas geográficas de los SIQO (Licence Ouverte 2.0).', err: 'No se ha podido cargar la zona.' },
    en: { show: 'Show area', hide: 'Hide area', note: 'Production area according to INAO, outline simplified: indicative only, not for delimiting plots.', src: 'Source: INAO, delimitation of the geographical areas of SIQO (Licence Ouverte 2.0).', err: 'The area could not be loaded.' },
    fr: { show: 'Voir l’aire', hide: 'Masquer l’aire', note: 'Aire de production selon l’INAO, contour simplifié : indicatif, ne permet pas de délimiter des parcelles.', src: 'Source : INAO, délimitation des aires géographiques des SIQO (Licence Ouverte 2.0).', err: 'Impossible de charger l’aire.' },
    it: { show: 'Mostra zona', hide: 'Nascondi zona', note: 'Zona di produzione secondo l’INAO, contorno semplificato: indicativa, non serve a delimitare parcelle.', src: 'Fonte: INAO, delimitazione delle aree geografiche dei SIQO (Licence Ouverte 2.0).', err: 'Impossibile caricare la zona.' }
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
    Promise.all([json('data/gi/FR-geo.json'), script('vendor/fr-regions.js?v=20261013')]).then(function (r) {
      var g = r[0], a = g && g.areas && g.areas[f];
      if (!a) { box.innerHTML = '<span class="di-movers-hint">' + esc(t.err) + '</span>'; return; }
      var R = window.DEHESA_FR_REGIONS && window.DEHESA_FR_REGIONS.states;
      box.innerHTML = svg(a, R) + '<p class="di-movers-hint" style="margin:4px 0 0">' + esc(t.note) + ' ' + esc(t.src) + '</p>';
    });
  }
  function lang() { var l; if (window.DehesaShared && window.DehesaShared.getLang) l = window.DehesaShared.getLang(); try { if (!l) l = localStorage.getItem('dehesaIndexLang'); } catch (e) {} l = l || document.documentElement.lang || 'es'; return T[l] ? l : 'es'; }
  document.addEventListener('click', function (ev) { var b = ev.target && ev.target.closest ? ev.target.closest('[data-gi-z]') : null; if (b) toggle(b, lang()); });
  window.GIZ = { info: info, btn: btn, toggle: toggle, cat: cat };
})();
