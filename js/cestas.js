/* Dehesa Index — Cestas de precios: indices por categoria (data/indices, scripts/build-baskets.py). Base 100 = media del año base, pesos iguales,
   metodologia publicada; cada miembro con su fuente y licencia. Los numeros indice miden evolucion, no precios. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'Cestas de precios', h1: 'Cestas de precios',
      sub: 'Índices por categoría (cereales, pienso, lácteos) que resumen cómo se han movido varios precios a la vez. Base 100, pesos iguales y metodología publicada. Cada serie que entra lleva su fuente y su licencia.',
      loading: 'Cargando…', fail: 'No se pudieron cargar las cestas. Vuelve a intentarlo en unos minutos.', basket: 'Cesta',
      last: 'Último mes', mom: 'Frente al mes anterior', yoy: 'Frente a hace un año', base: 'Año base (=100)', range: 'Desde', rows: 'meses',
      mT: 'Qué series entran', mCols: ['Serie', 'Peso', 'Unidad', 'Fuente', 'Licencia', 'Uso comercial'], v: { apto: 'Apto', condiciones: 'Con condiciones' },
      meT: 'Metodología', dT: 'Descargar', dCsv: 'CSV de la cesta', dJson: 'JSON de la cesta', dAll: 'Catálogo de cestas (JSON)',
      xT: 'Cestas no publicadas', xP: 'No hay datos suficientes para publicar estas cestas sin inventar nada:', net: 'Un índice no es un precio: mide cómo evoluciona, no cuánto cuesta.',
      why: { missing_series: 'Falta la serie {n} en la API', too_few_series: 'Menos de {n} series', no_base_year: 'Ningún año natural completo con todos los miembros', too_few_months: 'Solo {n} meses con todos los miembros (mínimo 24)' },
      M: { us: 'EE. UU.', eu: 'UE', uk: 'Reino Unido', ca: 'Canadá' }, chartLbl: 'Evolución de la cesta, base 100', attr: 'Atribución', cta: '¿Necesitas otra cesta o pesos propios (tu ración, tu cartera de cultivos)? Cuéntanos qué te hace falta.', ctaB: 'Escríbenos', csvHead: 'mes;indice_base_100'
    },
    en: {
      title: 'Price baskets', h1: 'Price baskets',
      sub: 'Category indices (cereals, feed, dairy) that summarise how several prices moved together. Base 100, equal weights and published methodology. Every series included carries its source and licence.',
      loading: 'Loading…', fail: 'Could not load the baskets. Please try again in a few minutes.', basket: 'Basket',
      last: 'Latest month', mom: 'Against the previous month', yoy: 'Against a year ago', base: 'Base year (=100)', range: 'From', rows: 'months',
      mT: 'Which series are included', mCols: ['Series', 'Weight', 'Unit', 'Source', 'Licence', 'Commercial use'], v: { apto: 'Fit', condiciones: 'With conditions' },
      meT: 'Methodology', dT: 'Download', dCsv: 'Basket CSV', dJson: 'Basket JSON', dAll: 'Basket catalogue (JSON)',
      xT: 'Baskets not published', xP: 'There is not enough data to publish these baskets without making anything up:', net: 'An index is not a price: it measures how things evolve, not how much they cost.',
      why: { missing_series: 'Series {n} is missing from the API', too_few_series: 'Fewer than {n} series', no_base_year: 'No full calendar year with all members', too_few_months: 'Only {n} months with all members (minimum 24)' },
      M: { us: 'US', eu: 'EU', uk: 'UK', ca: 'Canada' }, chartLbl: 'Basket trend, base 100', attr: 'Attribution', cta: 'Need another basket or your own weights (your ration, your crop mix)? Tell us what you need.', ctaB: 'Contact us', csvHead: 'month;index_base_100'
    },
    fr: {
      title: 'Paniers de prix', h1: 'Paniers de prix',
      sub: 'Indices par catégorie (céréales, aliments du bétail, produits laitiers) qui résument l’évolution de plusieurs prix à la fois. Base 100, poids égaux et méthodologie publiée. Chaque série incluse porte sa source et sa licence.',
      loading: 'Chargement…', fail: 'Impossible de charger les paniers. Réessayez dans quelques minutes.', basket: 'Panier',
      last: 'Dernier mois', mom: 'Par rapport au mois précédent', yoy: 'Par rapport à il y a un an', base: 'Année de base (=100)', range: 'Depuis', rows: 'mois',
      mT: 'Quelles séries entrent', mCols: ['Série', 'Poids', 'Unité', 'Source', 'Licence', 'Usage commercial'], v: { apto: 'Apte', condiciones: 'Sous conditions' },
      meT: 'Méthodologie', dT: 'Télécharger', dCsv: 'CSV du panier', dJson: 'JSON du panier', dAll: 'Catalogue des paniers (JSON)',
      xT: 'Paniers non publiés', xP: 'Les données sont insuffisantes pour publier ces paniers sans rien inventer :', net: 'Un indice n’est pas un prix : il mesure l’évolution, pas le coût.',
      why: { missing_series: 'La série {n} manque dans l’API', too_few_series: 'Moins de {n} séries', no_base_year: 'Aucune année civile complète avec tous les membres', too_few_months: 'Seulement {n} mois avec tous les membres (minimum 24)' },
      M: { us: 'É.-U.', eu: 'UE', uk: 'Royaume-Uni', ca: 'Canada' }, chartLbl: 'Évolution du panier, base 100', attr: 'Attribution', cta: 'Besoin d’un autre panier ou de vos propres poids (votre ration, votre assolement) ? Dites-nous ce qu’il vous faut.', ctaB: 'Nous écrire', csvHead: 'mois;indice_base_100'
    },
    it: {
      title: 'Panieri di prezzi', h1: 'Panieri di prezzi',
      sub: 'Indici per categoria (cereali, mangimi, latticini) che riassumono come si sono mossi più prezzi insieme. Base 100, pesi uguali e metodologia pubblicata. Ogni serie inclusa riporta fonte e licenza.',
      loading: 'Caricamento…', fail: 'Impossibile caricare i panieri. Riprova tra qualche minuto.', basket: 'Paniere',
      last: 'Ultimo mese', mom: 'Rispetto al mese precedente', yoy: 'Rispetto a un anno fa', base: 'Anno base (=100)', range: 'Da', rows: 'mesi',
      mT: 'Quali serie entrano', mCols: ['Serie', 'Peso', 'Unità', 'Fonte', 'Licenza', 'Uso commerciale'], v: { apto: 'Idoneo', condiciones: 'Con condizioni' },
      meT: 'Metodologia', dT: 'Scarica', dCsv: 'CSV del paniere', dJson: 'JSON del paniere', dAll: 'Catalogo dei panieri (JSON)',
      xT: 'Panieri non pubblicati', xP: 'Non ci sono dati sufficienti per pubblicare questi panieri senza inventare nulla:', net: 'Un indice non è un prezzo: misura l’andamento, non quanto costa.',
      why: { missing_series: 'Manca la serie {n} nell’API', too_few_series: 'Meno di {n} serie', no_base_year: 'Nessun anno solare completo con tutti i membri', too_few_months: 'Solo {n} mesi con tutti i membri (minimo 24)' },
      M: { us: 'USA', eu: 'UE', uk: 'Regno Unito', ca: 'Canada' }, chartLbl: 'Andamento del paniere, base 100', attr: 'Attribuzione', cta: 'Ti serve un altro paniere o pesi tuoi (la tua razione, il tuo piano colturale)? Raccontaci di cosa hai bisogno.', ctaB: 'Scrivici', csvHead: 'mese;indice_base_100'
    }
  };
  var IDX = null, DOC = {}, SEL = '', FAILED = false;
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n, d) { try { return Number(n).toLocaleString(lang(), { maximumFractionDigits: d == null ? 2 : d }); } catch (e) { return String(n); } }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function sg(n, d) { return (n > 0 ? '+' : '') + nf(n, d) + ' %'; }
  function card(k, v, sub) { return '<div class="di-card" style="padding:12px 16px"><div style="font-size:12px;color:var(--text-muted)">' + esc(k) + '</div><div style="font-size:22px;font-weight:700;margin-top:2px">' + esc(v) + '</div>' + (sub ? '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(sub) + '</div>' : '') + '</div>'; }
  function chart(w, b) {
    var P = b.points, W = 700, H = 200, L = 38, R = 8, T0 = 8, B = 20, lo = Infinity, hi = -Infinity, i;
    for (i = 0; i < P.length; i++) { lo = Math.min(lo, P[i][1]); hi = Math.max(hi, P[i][1]); }
    lo = Math.min(lo, 100); hi = Math.max(hi, 100); var pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
    var X = function (k) { return L + k / (P.length - 1 || 1) * (W - L - R); }, Y = function (v) { return T0 + (hi - v) / (hi - lo) * (H - T0 - B); };
    var d = P.map(function (p, k) { return (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('');
    var yl = [lo + pad, 100, hi - pad].map(function (v) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#bbb" stroke-width="' + (v === 100 ? 1 : 0.5) + '" ' + (v === 100 ? 'stroke-dasharray="4 3"' : '') + '/><text x="' + (L - 4) + '" y="' + (Y(v) + 3).toFixed(1) + '" font-size="10" fill="#6b6b6b" text-anchor="end">' + nf(v, 0) + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(w.chartLbl + ': ' + nm(b.name)) + '" style="width:100%;height:auto">' + yl + '<path d="' + d + '" fill="none" stroke="#1f5c3a" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="' + X(P.length - 1).toFixed(1) + '" cy="' + Y(P[P.length - 1][1]).toFixed(1) + '" r="3.5" fill="#1f5c3a" stroke="#fff" stroke-width="2"/><text x="' + L + '" y="' + (H - 5) + '" font-size="10" fill="#6b6b6b">' + esc(P[0][0]) + '</text><text x="' + (W - R) + '" y="' + (H - 5) + '" font-size="10" fill="#6b6b6b" text-anchor="end">' + esc(P[P.length - 1][0]) + '</text></svg>';
  }
  function load(id) {
    if (DOC[id]) return; DOC[id] = 'loading';
    fetch(S.sitePath('data/indices/' + id + '.json')).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { DOC[id] = d; }).catch(function () { delete DOC[id]; FAILED = true; }).then(render);
  }
  function csvHref(w, b) {
    var rows = [w.csvHead].concat(b.points.map(function (p) { return p[0] + ';' + p[1]; }), ['', nm(b.name) + ';' + b.attribution]);
    return 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + rows.join('\n'));
  }
  function render() {
    var w = t(), root = document.getElementById('ce-body'); if (!root) return;
    document.getElementById('ce-h1').textContent = w.h1; document.getElementById('ce-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED && !IDX) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!IDX) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    if (!SEL || !IDX.baskets.some(function (b) { return b.id === SEL; })) SEL = IDX.baskets[0].id;
    load(SEL); var b = DOC[SEL];
    var h = '<label style="font-size:13px">' + esc(w.basket) + '<br><select id="ce-s" class="di-compare-select" style="width:auto;min-width:240px">' + IDX.baskets.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === SEL ? ' selected' : '') + '>' + esc(nm(x.name)) + '</option>'; }).join('') + '</select></label>';
    if (!b || b === 'loading') root.innerHTML = h + '<p class="di-movers-hint">' + esc(FAILED ? w.fail : w.loading) + '</p>';
    else {
      var last = b.points[b.points.length - 1];
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:14px 0">' + card(w.last, nf(last[1]), last[0]) + card(w.mom, b.changeMoMPct == null ? '—' : sg(b.changeMoMPct)) + card(w.yoy, b.changeYoYPct == null ? '—' : sg(b.changeYoYPct)) + card(w.base, String(b.basePeriod), w.range + ' ' + b.first + ' · ' + b.rows + ' ' + w.rows) + '</div>';
      h += '<div class="di-card" style="padding:10px 12px">' + chart(w, b) + '</div><p class="di-movers-hint">' + esc(w.net) + '</p>';
      h += '<h2 style="margin:22px 0 8px;font-size:18px">' + esc(w.mT) + '</h2><div class="di-card" style="padding:4px 14px;overflow-x:auto"><table data-no-rows style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' + w.mCols.map(function (c) { return '<th style="padding:8px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        b.members.map(function (m) { var vc = m.verdict === 'apto' ? '#17703f' : '#8f5f12'; return '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px;font-weight:600">' + esc(nm(m.name, m.product)) + '</td><td style="padding:8px 6px">' + nf(m.weightPct, 1) + ' %</td><td style="padding:8px 6px">' + esc(m.unit + ' ' + m.currency) + '</td><td style="padding:8px 6px;font-size:12.5px">' + esc(m.sourceName) + '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(m.attribution) + '</div></td><td style="padding:8px 6px">' + esc(m.license) + '</td><td style="padding:8px 6px"><span class="di-badge" style="background:' + vc + '1a;color:' + vc + '">' + esc(w.v[m.verdict] || m.verdict) + '</span></td></tr>'; }).join('') + '</tbody></table></div>';
      h += '<h2 style="margin:22px 0 8px;font-size:18px">' + esc(w.meT) + '</h2><p class="di-emp-p">' + esc(nm(b.methodology)) + '</p>';
      h += '<h2 style="margin:22px 0 8px;font-size:18px">' + esc(w.dT) + '</h2><p><a href="' + csvHref(w, b) + '" download="cesta-' + esc(b.id.replace('/', '-')) + '.csv">' + esc(w.dCsv) + '</a> · <a href="' + esc(S.sitePath('data/indices/' + b.id + '.json')) + '">' + esc(w.dJson) + '</a> · <a href="' + esc(S.sitePath('data/indices/index.json')) + '">' + esc(w.dAll) + '</a></p>';
      if (IDX.excluded.length) h += '<h2 style="margin:22px 0 8px;font-size:18px">' + esc(w.xT) + '</h2><p class="di-emp-p">' + esc(w.xP) + '</p><ul class="di-emp-p" style="margin:0;padding-left:18px">' + IDX.excluded.map(function (e) { return '<li>' + esc(nm(e.name)) + ': ' + esc((w.why[e.code] || e.reason).replace('{n}', e.n == null ? '' : e.n)) + '</li>'; }).join('') + '</ul>';
      h += '<section class="di-card di-emp-cta" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaB) + '</a></section>';
      root.innerHTML = h;
    }
    var s = document.getElementById('ce-s'); if (s) s.onchange = function (e) { SEL = e.target.value; try { history.replaceState(null, '', '?c=' + SEL); } catch (x) {} render(); };
  }
  var qp = /[?&]c=([^&]+)/.exec(location.search); if (qp) SEL = decodeURIComponent(qp[1]);
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/indices/index.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) { IDX = d; render(); }).catch(function () { FAILED = true; render(); });
})();
