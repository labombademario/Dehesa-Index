/* Dehesa Index — Lonjas y mercados de España. Lee data/eu/<familia>.json (Comisión Europea, Agri-food Data Portal): cereales, aceite y oleaginosas.
   Solo muestra los mercados españoles que el portal publica (provincia o zona, no lonja concreta). Nada se promedia ni se convierte. ES5, sin librerías. */
(function () {
  'use strict';
  var FAMS = ['cereales', 'aceite', 'oleaginosas'];
  var SER = {
    cereales: [
      ['feed-barley-departure', ['Cebada pienso', 'Feed barley', 'Orge fourragère', 'Orzo da foraggio']],
      ['feed-wheat-departure', ['Trigo pienso', 'Feed wheat', 'Blé fourrager', 'Frumento da foraggio']],
      ['milling-wheat-departure', ['Trigo blando panificable', 'Milling wheat', 'Blé tendre meunier', 'Frumento tenero panificabile']],
      ['durum-wheat-departure', ['Trigo duro', 'Durum wheat', 'Blé dur', 'Frumento duro']],
      ['feed-maize-departure', ['Maíz pienso', 'Feed maize', 'Maïs fourrager', 'Mais da foraggio']],
      ['malting-barley-departure', ['Cebada cervecera', 'Malting barley', 'Orge de brasserie', 'Orzo da birra']]],
    aceite: [
      ['extra-virgin-olive-oil-up-to', ['Aceite de oliva virgen extra (hasta 0,8 %)', 'Extra virgin olive oil (up to 0.8%)', 'Huile d’olive vierge extra (jusqu’à 0,8 %)', 'Olio extra vergine di oliva (fino a 0,8 %)']],
      ['virgin-olive-oil-up-to', ['Aceite de oliva virgen (hasta 2 %)', 'Virgin olive oil (up to 2%)', 'Huile d’olive vierge (jusqu’à 2 %)', 'Olio di oliva vergine (fino a 2 %)']],
      ['lampante-olive-oil', ['Aceite de oliva lampante (2 %)', 'Lampante olive oil (2%)', 'Huile d’olive lampante (2 %)', 'Olio di oliva lampante (2 %)']],
      ['refined-olive-oil-up-to', ['Aceite de oliva refinado (hasta 0,3 %)', 'Refined olive oil (up to 0.3%)', 'Huile d’olive raffinée (jusqu’à 0,3 %)', 'Olio di oliva raffinato (fino a 0,3 %)']],
      ['crude-olive-pomace-oil', ['Aceite de orujo crudo (5 a 10 %)', 'Crude olive-pomace oil (5 to 10%)', 'Huile de grignons brute (5 à 10 %)', 'Olio di sansa greggio (5-10 %)']]],
    oleaginosas: [
      ['sunflower-seed-standard-depsilo', ['Girasol estándar, salida de silo', 'Sunflower seed, standard, ex-silo', 'Tournesol standard, départ silo', 'Girasole standard, franco silo']],
      ['sunflower-seed-high-oleic-depsilo', ['Girasol alto oleico, salida de silo', 'Sunflower seed, high-oleic, ex-silo', 'Tournesol oléique, départ silo', 'Girasole alto oleico, franco silo']]]
  };
  var T = {
    es: { title: 'Lonjas y mercados de España', sub: 'Precios semanales por provincia o zona de cereales, aceite de oliva y girasol. Cada mercado es el que publica la Comisión Europea; no se promedia ni se mezcla.',
      fam: { cereales: 'Cereales', aceite: 'Aceite de oliva', oleaginosas: 'Girasol' }, product: 'Producto', nat: 'Media nacional', zone: 'zona',
      kN: 'Mercados con precio', kHi: 'Más caro', kLo: 'Más barato', kGap: 'Diferencia', kGapSub: 'cálculo de Dehesa Index', date: 'Fecha del último precio',
      cMarket: 'Mercado', cPrice: 'Precio', cWeek: '1 semana', cYear: '1 año', cDate: 'Fecha', chart: 'Gráfica', chartAll: 'Comparar estos mercados en una gráfica',
      stale: 'Sin cotización reciente', staleSub: 'Su último precio es de más de 4 semanas antes del más reciente de este producto.', none: 'No hay mercados con precio reciente para este producto.',
      pos: 'Posición', limits: 'Qué no está aquí: las lonjas de asociaciones y cooperativas (Segovia, Ebro, Salamanca, Binéfar, Mercolleida…) publican sus cotizaciones en sus webs y no hemos podido confirmar una licencia que permita reutilizarlas, así que no las copiamos. El portal identifica cada mercado por provincia o zona, no por lonja concreta. Los precios son de salida de silo (cereales y girasol) o de origen (aceite).',
      src: 'Fuente', lic: 'Licencia', links: 'Más países y productos', err: 'No se han podido cargar los datos.' },
    en: { title: 'Spanish local markets', sub: 'Weekly prices by province or zone for cereals, olive oil and sunflower. Each market is the one published by the European Commission; nothing is averaged or mixed.',
      fam: { cereales: 'Cereals', aceite: 'Olive oil', oleaginosas: 'Sunflower' }, product: 'Product', nat: 'National average', zone: 'zone',
      kN: 'Markets with a price', kHi: 'Highest', kLo: 'Lowest', kGap: 'Gap', kGapSub: 'Dehesa Index calculation', date: 'Date of latest price',
      cMarket: 'Market', cPrice: 'Price', cWeek: '1 week', cYear: '1 year', cDate: 'Date', chart: 'Chart', chartAll: 'Compare these markets on one chart',
      stale: 'No recent quote', staleSub: 'Their latest price is more than 4 weeks older than the newest one for this product.', none: 'No market has a recent price for this product.',
      pos: 'Position', limits: 'What is not here: association and cooperative markets (Segovia, Ebro, Salamanca, Binéfar, Mercolleida…) publish their quotes on their own sites and we could not confirm a licence that allows reuse, so we do not copy them. The portal labels each market by province or zone, not by specific market. Prices are ex-silo (cereals and sunflower) or at origin (olive oil).',
      src: 'Source', lic: 'Licence', links: 'More countries and products', err: 'The data could not be loaded.' },
    fr: { title: 'Marchés locaux d’Espagne', sub: 'Prix hebdomadaires par province ou zone pour les céréales, l’huile d’olive et le tournesol. Chaque marché est celui publié par la Commission européenne ; rien n’est moyenné ni mélangé.',
      fam: { cereales: 'Céréales', aceite: 'Huile d’olive', oleaginosas: 'Tournesol' }, product: 'Produit', nat: 'Moyenne nationale', zone: 'zone',
      kN: 'Marchés avec un prix', kHi: 'Le plus cher', kLo: 'Le moins cher', kGap: 'Écart', kGapSub: 'calcul Dehesa Index', date: 'Date du dernier prix',
      cMarket: 'Marché', cPrice: 'Prix', cWeek: '1 semaine', cYear: '1 an', cDate: 'Date', chart: 'Graphique', chartAll: 'Comparer ces marchés sur un graphique',
      stale: 'Pas de cotation récente', staleSub: 'Leur dernier prix date de plus de 4 semaines avant le plus récent de ce produit.', none: 'Aucun marché n’a de prix récent pour ce produit.',
      pos: 'Position', limits: 'Ce qui n’est pas ici : les marchés d’associations et de coopératives (Ségovie, Èbre, Salamanque, Binéfar, Mercolleida…) publient leurs cotations sur leurs sites et nous n’avons pas pu confirmer de licence autorisant la réutilisation ; nous ne les copions pas. Le portail identifie chaque marché par province ou zone, pas par marché précis. Les prix sont départ silo (céréales et tournesol) ou à l’origine (huile).',
      src: 'Source', lic: 'Licence', links: 'Plus de pays et de produits', err: 'Impossible de charger les données.' },
    it: { title: 'Mercati locali della Spagna', sub: 'Prezzi settimanali per provincia o zona di cereali, olio d’oliva e girasole. Ogni mercato è quello pubblicato dalla Commissione europea; nulla è mediato o mescolato.',
      fam: { cereales: 'Cereali', aceite: 'Olio d’oliva', oleaginosas: 'Girasole' }, product: 'Prodotto', nat: 'Media nazionale', zone: 'zona',
      kN: 'Mercati con prezzo', kHi: 'Più caro', kLo: 'Più economico', kGap: 'Differenza', kGapSub: 'calcolo Dehesa Index', date: 'Data dell’ultimo prezzo',
      cMarket: 'Mercato', cPrice: 'Prezzo', cWeek: '1 settimana', cYear: '1 anno', cDate: 'Data', chart: 'Grafico', chartAll: 'Confronta questi mercati in un grafico',
      stale: 'Nessuna quotazione recente', staleSub: 'Il loro ultimo prezzo è di oltre 4 settimane prima del più recente di questo prodotto.', none: 'Nessun mercato ha un prezzo recente per questo prodotto.',
      pos: 'Posizione', limits: 'Cosa non c’è: i mercati di associazioni e cooperative (Segovia, Ebro, Salamanca, Binéfar, Mercolleida…) pubblicano le quotazioni sui propri siti e non abbiamo potuto confermare una licenza che ne permetta il riuso, quindi non le copiamo. Il portale identifica ogni mercato per provincia o zona, non per mercato preciso. I prezzi sono franco silo (cereali e girasole) o all’origine (olio).',
      src: 'Fonte', lic: 'Licenza', links: 'Più paesi e prodotti', err: 'Impossibile caricare i dati.' }
  };
  var ACC = { Lerida: 'Lleida', Leon: 'León', Cordoba: 'Córdoba', Cadiz: 'Cádiz', Jaen: 'Jaén', Malaga: 'Málaga', Almeria: 'Almería', Avila: 'Ávila', Caceres: 'Cáceres' };
  var ZONE = { Centro: 'Centro', Norte: 'Norte', Sur: 'Sur' };
  var ST = { fam: 'cereales', sid: null, data: {} }, IDX = null;
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { return { es: 0, en: 1, fr: 2, it: 3 }[lang()] || 0; }
  function tt() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { if (v == null) return '–'; try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function dt(s) { try { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return s; } }
  function day(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; }
  function isNat(m) { return !m || /national|nacional/i.test(m); }
  function clean(m) { var n = String(m).replace(/\s*\(ES\d+\)/, '').replace(/\s+$/, ''); return ACC[n] || ZONE[n] || n; }
  function pct(a, b, want, da, db) { if (!b || a == null || Math.abs(Math.abs(day(da) - day(db)) - want) > 6) return null; return (a / b - 1) * 100; }
  function delta(v) { if (v == null) return '<span style="color:var(--text-faint)">–</span>'; var c = v > 0.05 ? 'var(--positive)' : v < -0.05 ? '#a9491f' : 'var(--text-faint)'; return '<span style="color:' + c + ';font-weight:600">' + (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + nf(Math.abs(v), 1) + ' %</span>'; }
  function serTitle(sid) { var l = SER[ST.fam]; for (var i = 0; i < l.length; i++) if (sid.indexOf(l[i][0]) === 0) return l[i][1][li()]; return sid; }
  function famSeries() {
    var d = ST.data[ST.fam]; if (!d) return [];
    var out = [];
    SER[ST.fam].forEach(function (p) { d.series.forEach(function (s) { if (s.id.indexOf(p[0]) === 0 && out.indexOf(s) < 0 && marketsOf(s).cur.length) out.push(s); }); });
    return out;
  }
  function marketsOf(s) {
    var es = s.regions.filter(function (r) { return r.c === 'ES'; }), nat = null, byName = {}, ref = '';
    es.forEach(function (r) { if (r.last[0] > ref) ref = r.last[0]; });
    es.forEach(function (r) {
      if (isNat(r.m)) { if (!nat || r.last[0] > nat.last[0]) nat = r; return; }
      var k = clean(r.m), o = byName[k]; if (!o || r.last[0] > o.r.last[0]) byName[k] = { name: k, r: r };
    });
    var all = Object.keys(byName).map(function (k) { return byName[k]; }), cur = [], old = [];
    all.forEach(function (x) { (day(ref) - day(x.r.last[0]) <= 28 ? cur : old).push(x); });
    cur.sort(function (a, b) { return b.r.last[1] - a.r.last[1]; }); old.sort(function (a, b) { return b.r.last[0] < a.r.last[0] ? -1 : 1; });
    return { nat: nat, cur: cur, old: old, ref: ref };
  }
  function chartHref(s, names) { var keys = names.map(function (x) { return 'ES|' + x.r.m; }).slice(0, 6); return 'europa.html?f=' + ST.fam + '&s=' + encodeURIComponent(s.id) + '&r=' + encodeURIComponent(keys.join(',')); }
  function posBar(v, lo, hi) { if (lo == null || hi == null || hi === lo) return ''; var p = (v - lo) / (hi - lo) * 100; return '<span aria-hidden="true" style="position:relative;display:block;height:6px;border-radius:3px;background:var(--border)"><span style="position:absolute;left:' + p + '%;top:-2px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:var(--accent)"></span></span>'; }
  function row(x, s, t, dec, lo, hi) {
    var r = x.r, w = pct(r.last[1], r.prev && r.prev[1], 7, r.last[0], r.prev ? r.prev[0] : r.last[0]), y = pct(r.last[1], r.yoy && r.yoy[1], 364, r.last[0], r.yoy ? r.yoy[0] : r.last[0]);
    var lab = ZONE[x.name] ? x.name + ' (' + t.zone + ')' : x.name;
    return '<tr style="border-top:1px solid var(--border)"><td style="padding:9px 6px;font-weight:600">' + esc(lab) + '</td><td style="padding:9px 6px;text-align:right;font-variant-numeric:tabular-nums;font-weight:700">' + nf(r.last[1], dec) + ' <span style="font-weight:400;font-size:11.5px;color:var(--text-faint)">' + esc(s.unit) + '</span></td><td style="padding:9px 6px;text-align:right">' + delta(w) + '</td><td style="padding:9px 6px;text-align:right">' + delta(y) + '</td><td style="padding:9px 6px;text-align:right;font-size:12.5px;color:var(--text-muted)">' + dt(r.last[0]) + '</td><td style="padding:9px 6px;width:90px">' + posBar(r.last[1], lo, hi) + '</td><td style="padding:9px 6px;text-align:right"><a href="' + esc(chartHref(s, [x])) + '">' + t.chart + '</a></td></tr>';
  }
  function kpi(v, label, sub) { return '<div class="di-card" style="padding:14px 16px"><div style="font-size:26px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums">' + v + '</div><div style="font-size:13px;font-weight:600;margin-top:4px">' + esc(label) + '</div>' + (sub ? '<div style="font-size:11.5px;color:var(--text-faint)">' + esc(sub) + '</div>' : '') + '</div>'; }
  function build() {
    var root = document.getElementById('lj-body'); if (!root) return;
    var t = tt(), h = '', fs = famSeries(), s = null;
    fs.forEach(function (x) { if (x.id === ST.sid) s = x; }); if (!s) { s = fs[0]; ST.sid = s ? s.id : null; }
    h += '<div class="di-tabs-bar" role="tablist" style="margin-top:4px">' + FAMS.map(function (f) { return '<button type="button" role="tab" class="di-tab-btn' + (f === ST.fam ? ' active' : '') + '" aria-selected="' + (f === ST.fam) + '" data-f="' + f + '">' + esc(t.fam[f]) + '</button>'; }).join('') + '</div>';
    if (!s) { root.innerHTML = h + '<p class="di-movers-hint">' + t.none + '</p>'; bind(); return; }
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 14px" aria-label="' + esc(t.product) + '">' + fs.map(function (x) { return '<button type="button" class="di-tab-btn' + (x.id === s.id ? ' active' : '') + '" style="border-color:var(--border)" data-s="' + esc(x.id) + '">' + esc(serTitle(x.id)) + '</button>'; }).join('') + '</div>';
    var M = marketsOf(s), dec = s.unit.indexOf('/t') > 0 && s.unit.indexOf('100') < 0 ? 1 : 2;
    var hi = M.cur[0], lo = M.cur[M.cur.length - 1];
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' + kpi(String(M.cur.length), t.kN, t.date + ': ' + dt(M.ref)) + kpi(nf(hi.r.last[1], dec), t.kHi, hi.name + ' · ' + s.unit) + kpi(nf(lo.r.last[1], dec), t.kLo, lo.name + ' · ' + s.unit) + kpi(nf(hi.r.last[1] - lo.r.last[1], dec), t.kGap, s.unit + ' · ' + t.kGapSub) + (M.nat ? kpi(nf(M.nat.last[1], dec), t.nat, s.unit + ' · ' + dt(M.nat.last[0])) : '') + '</div>';
    var th = 'padding:8px 6px;text-align:right';
    h += '<div class="di-card" style="padding:6px 16px;overflow-x:auto;margin-top:16px"><table style="border-collapse:collapse;width:100%;min-width:640px;font-size:13.5px"><thead><tr style="font-size:11px;font-weight:700;color:var(--text-faint);text-align:left"><th style="padding:8px 6px">' + t.cMarket + '</th><th style="' + th + '">' + t.cPrice + '</th><th style="' + th + '">' + t.cWeek + '</th><th style="' + th + '">' + t.cYear + '</th><th style="' + th + '">' + t.cDate + '</th><th style="' + th + '">' + t.pos + '</th><th style="' + th + '"></th></tr></thead><tbody>' + M.cur.map(function (x) { return row(x, s, t, dec, lo.r.last[1], hi.r.last[1]); }).join('') + '</tbody></table></div>';
    h += '<p style="margin:10px 0"><a href="' + esc(chartHref(s, M.cur)) + '">' + t.chartAll + '</a></p>';
    if (M.old.length) h += '<details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">' + t.stale + ' (' + M.old.length + ')</summary><p class="di-movers-hint">' + t.staleSub + '</p><div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:640px;font-size:13.5px"><tbody>' + M.old.map(function (x) { return row(x, s, t, dec, null, null); }).join('') + '</tbody></table></div></details>';
    h += '<p class="di-movers-hint" style="margin-top:16px">' + t.limits + '</p><p class="di-movers-hint">' + t.src + ': <a href="https://agridata.ec.europa.eu/" target="_blank" rel="noopener">European Commission — Agri-food Data Portal</a> · ' + t.lic + ': Decision 2011/833/EU · <a href="europa.html">' + t.links + '</a></p>';
    root.innerHTML = h; bind(); sync();
  }
  function sync() { try { var q = new URLSearchParams(); q.set('f', ST.fam); if (ST.sid) q.set('s', ST.sid); history.replaceState(null, '', 'lonjas.html?' + q.toString()); } catch (e) {} }
  function load(f, cb) { if (ST.data[f]) return cb(); fetch('data/eu/' + f + '.json').then(function (r) { if (!r.ok) throw Error('x'); return r.json(); }).then(function (d) { ST.data[f] = d; cb(); }).catch(function () { var b = document.getElementById('lj-body'); if (b) b.innerHTML = '<p class="di-movers-hint">' + tt().err + '</p>'; }); }
  function bind() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-f]'), function (b) { b.onclick = function () { ST.fam = b.getAttribute('data-f'); ST.sid = null; load(ST.fam, build); }; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-s]'), function (b) { b.onclick = function () { ST.sid = b.getAttribute('data-s'); build(); }; });
  }
  function shell() { var t = tt(), h = document.getElementById('lj-h1'), s = document.getElementById('lj-sub'); if (h) h.textContent = t.title; if (s) s.textContent = t.sub; document.title = t.title + ' | Dehesa Index'; }
  (function () { var q = new URLSearchParams(window.location.search); if (FAMS.indexOf(q.get('f')) >= 0) ST.fam = q.get('f'); if (q.get('s')) ST.sid = q.get('s'); })();
  window.DehesaShared.init('informacion');
  var prev = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); shell(); if (ST.data[ST.fam]) build(); };
  shell(); load(ST.fam, build);
})();
