/* Dehesa Index — Relaciones entre mercados (Cross-Market Intelligence 2.0). ES5.
   Lee data/relationships.json (scripts/build-relationships.py). SOLO descriptivo: cada relacion se muestra con su correlacion de cambios, rezago, n, periodo, cobertura,
   estabilidad del signo, confianza y ultimo movimiento de entrada y mercado. La correlacion (dato) y la hipotesis economica (texto escrito a mano, no demostrado) van SEPARADAS.
   Estado visible: OBSERVED RELATIONSHIP / WEAK OR UNSTABLE / INSUFFICIENT DATA. Estado de la URL: ?ch=&r=&st=&c=&p=&id= */
(function () {
  'use strict';
  var LANGS = ['es', 'en', 'fr', 'it'];
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function li() { var i = LANGS.indexOf(lang()); return i < 0 ? 0 : i; }
  var TX = {
    title: ['Relaciones entre mercados', 'Cross-market relationships', 'Relations entre marchés', 'Relazioni tra mercati'],
    sub: ['Cómo se han movido juntos, en el pasado, los insumos (fertilizantes, energía, pienso), el clima, las existencias y los precios agrarios. Cada relación indica su correlación, rezago, muestra, periodo y estabilidad.', 'How inputs (fertiliser, energy, feed), weather, stocks and farm prices have moved together in the past. Each relationship shows its correlation, lag, sample, period and stability.', 'Comment les intrants (engrais, énergie, aliments), la météo, les stocks et les prix agricoles ont évolué ensemble par le passé. Chaque relation indique sa corrélation, son décalage, son échantillon, sa période et sa stabilité.', 'Come input (fertilizzanti, energia, mangimi), meteo, scorte e prezzi agricoli si sono mossi insieme in passato. Ogni relazione indica correlazione, ritardo, campione, periodo e stabilità.'],
    discl: ['Descriptivo, no predictivo.', 'Descriptive, not predictive.', 'Descriptif, pas prédictif.', 'Descrittivo, non predittivo.'],
    method: ['Cómo se calcula', 'How it is computed', 'Comment c’est calculé', 'Come si calcola'],
    mSummary: ['Correlación de Pearson entre los cambios periodo a periodo del insumo y del mercado (datos semanales promediados por mes). Se prueban unos pocos rezagos fijados por familia y se publica el de mayor |r|: es el mejor de varios, así que la correlación es optimista y se declara.', 'Pearson correlation between period-over-period changes of the input and the market (weekly data averaged by month). A few lags fixed per family are tested and the one with the largest |r| is published: it is the best of several, so the correlation is optimistic and says so.', 'Corrélation de Pearson entre les variations d’une période à l’autre de l’intrant et du marché (données hebdomadaires moyennées par mois). Quelques décalages fixés par famille sont testés et celui au |r| le plus grand est publié : c’est le meilleur de plusieurs, la corrélation est donc optimiste et le dit.', 'Correlazione di Pearson tra le variazioni da un periodo all’altro dell’input e del mercato (dati settimanali mediati per mese). Si provano pochi ritardi fissati per famiglia e si pubblica quello con |r| maggiore: è il migliore tra diversi, quindi la correlazione è ottimistica e lo dichiara.'],
    mRules: ['Estado: OBSERVED RELATIONSHIP si hay muestra suficiente, |r| ≥ 0,2 y el signo se mantiene en al menos la mitad de las ventanas; WEAK OR UNSTABLE si no; INSUFFICIENT DATA con menos de 24 meses (12 trimestres). Confianza: describe lo bien que se sostiene la asociación estadística, no la hipótesis económica ni una probabilidad.', 'Status: OBSERVED RELATIONSHIP with enough data, |r| ≥ 0.2 and the sign holding in at least half the windows; WEAK OR UNSTABLE otherwise; INSUFFICIENT DATA below 24 months (12 quarters). Confidence: describes how well the statistical association holds, not the economic hypothesis nor a probability.', 'Statut : OBSERVED RELATIONSHIP avec assez de données, |r| ≥ 0,2 et le signe tenant dans au moins la moitié des fenêtres ; WEAK OR UNSTABLE sinon ; INSUFFICIENT DATA sous 24 mois (12 trimestres). Confiance : décrit la solidité de l’association statistique, pas l’hypothèse économique ni une probabilité.', 'Stato: OBSERVED RELATIONSHIP con dati sufficienti, |r| ≥ 0,2 e segno stabile in almeno metà delle finestre; WEAK OR UNSTABLE altrimenti; INSUFFICIENT DATA sotto 24 mesi (12 trimestri). Confidenza: descrive quanto regge l’associazione statistica, non l’ipotesi economica né una probabilità.'],
    mCur: ['Si las dos series tienen moneda distinta, ambas se pasan a EUR con el tipo mensual del BCE (mes exacto o el anterior, máximo 2 meses). Sin causalidad: la hipótesis económica es una explicación plausible escrita a mano que estos datos no prueban.', 'If the two series have different currencies both are converted to EUR with the ECB monthly rate (exact month or previous, at most 2 months). No causality: the economic hypothesis is a plausible hand-written explanation that these data do not prove.', 'Si les deux séries ont des devises différentes, toutes deux sont converties en EUR au taux mensuel de la BCE (mois exact ou précédent, 2 mois maximum). Pas de causalité : l’hypothèse économique est une explication plausible rédigée à la main que ces données ne prouvent pas.', 'Se le due serie hanno valuta diversa, entrambe sono convertite in EUR con il cambio mensile della BCE (mese esatto o precedente, al massimo 2 mesi). Nessuna causalità: l’ipotesi economica è una spiegazione plausibile scritta a mano che questi dati non dimostrano.'],
    fCh: ['Canal', 'Channel', 'Canal', 'Canale'], fReg: ['Mercado', 'Market', 'Marché', 'Mercato'], fSt: ['Estado', 'Status', 'Statut', 'Stato'], fProd: ['Producto', 'Product', 'Produit', 'Prodotto'], fConf: ['Confianza', 'Confidence', 'Confiance', 'Confidenza'],
    all: ['Todos', 'All', 'Tous', 'Tutti'],
    ch_fertilizer: ['Fertilizante', 'Fertiliser', 'Engrais', 'Fertilizzante'], ch_energy: ['Energía', 'Energy', 'Énergie', 'Energia'], ch_feed: ['Pienso', 'Feed', 'Aliments', 'Mangimi'], ch_feedstock: ['Materia prima', 'Feedstock', 'Matière première', 'Materia prima'], ch_weather: ['Clima', 'Weather', 'Météo', 'Meteo'], ch_stocks: ['Existencias', 'Stocks', 'Stocks', 'Scorte'],
    st_OBSERVED_RELATIONSHIP: ['OBSERVED RELATIONSHIP', 'OBSERVED RELATIONSHIP', 'OBSERVED RELATIONSHIP', 'OBSERVED RELATIONSHIP'],
    st_WEAK_OR_UNSTABLE: ['WEAK OR UNSTABLE', 'WEAK OR UNSTABLE', 'WEAK OR UNSTABLE', 'WEAK OR UNSTABLE'],
    st_INSUFFICIENT_DATA: ['INSUFFICIENT DATA', 'INSUFFICIENT DATA', 'INSUFFICIENT DATA', 'INSUFFICIENT DATA'],
    stl_OBSERVED_RELATIONSHIP: ['Relación observada', 'Observed relationship', 'Relation observée', 'Relazione osservata'], stl_WEAK_OR_UNSTABLE: ['Débil o inestable', 'Weak or unstable', 'Faible ou instable', 'Debole o instabile'], stl_INSUFFICIENT_DATA: ['Datos insuficientes', 'Insufficient data', 'Données insuffisantes', 'Dati insufficienti'],
    conf_HIGH: ['Confianza alta', 'High confidence', 'Confiance élevée', 'Confidenza alta'], conf_MEDIUM: ['Confianza media', 'Medium confidence', 'Confiance moyenne', 'Confidenza media'], conf_LOW: ['Confianza baja', 'Low confidence', 'Confiance faible', 'Confidenza bassa'],
    INPUT: ['INSUMO', 'INPUT', 'INTRANT', 'INPUT'], CHANNEL: ['CANAL', 'CHANNEL', 'CANAL', 'CANALE'], MARKET: ['MERCADO', 'MARKET', 'MARCHÉ', 'MERCATO'],
    corr: ['Correlación', 'Correlation', 'Corrélation', 'Correlazione'], dir: ['Dirección', 'Direction', 'Sens', 'Direzione'], lag: ['Rezago', 'Lag', 'Décalage', 'Ritardo'], n: ['Observaciones', 'Observations', 'Observations', 'Osservazioni'],
    period: ['Periodo', 'Period', 'Période', 'Periodo'], cov: ['Cobertura', 'Coverage', 'Couverture', 'Copertura'], stab: ['Estabilidad del signo', 'Sign stability', 'Stabilité du signe', 'Stabilità del segno'], recent: ['Correlación últimos 36 periodos', 'Correlation, last 36 periods', 'Corrélation, 36 dernières périodes', 'Correlazione, ultimi 36 periodi'],
    lastIn: ['Último movimiento del insumo', 'Last input move', 'Dernier mouvement de l’intrant', 'Ultimo movimento dell’input'], lastMk: ['Último movimiento del mercado', 'Last market move', 'Dernier mouvement du marché', 'Ultimo movimento del mercato'],
    d_positive: ['mismo sentido', 'same direction', 'même sens', 'stessa direzione'], d_negative: ['sentido contrario', 'opposite', 'sens inverse', 'direzione opposta'], d_none: ['sin asociación lineal clara', 'no clear linear association', 'pas d’association linéaire claire', 'nessuna associazione lineare chiara'],
    s_negligible: ['insignificante', 'negligible', 'négligeable', 'trascurabile'], s_weak: ['débil', 'weak', 'faible', 'debole'], s_moderate: ['moderada', 'moderate', 'modérée', 'moderata'], s_strong: ['fuerte', 'strong', 'forte', 'forte'],
    sameP: ['mismo periodo', 'same period', 'même période', 'stesso periodo'], mon: ['m', 'mo', 'm', 'm'], qtr: ['T', 'Q', 'T', 'T'], yr: ['a', 'y', 'a', 'a'],
    obsH: ['Lo observado (estadística)', 'What was observed (statistics)', 'Ce qui a été observé (statistiques)', 'Ciò che si è osservato (statistica)'],
    hypH: ['Hipótesis económica (no demostrada)', 'Economic hypothesis (not proven)', 'Hypothèse économique (non démontrée)', 'Ipotesi economica (non dimostrata)'],
    lagH: ['Correlación por rezago probado', 'Correlation by tested lag', 'Corrélation par décalage testé', 'Correlazione per ritardo provato'],
    pend: ['pendiente', 'pending', 'en attente', 'in sospeso'], none: ['Ninguna relación coincide con los filtros.', 'No relationship matches the filters.', 'Aucune relation ne correspond aux filtres.', 'Nessuna relazione corrisponde ai filtri.'],
    count: ['relaciones', 'relationships', 'relations', 'relazioni'], reset: ['Quitar filtros', 'Clear filters', 'Effacer les filtres', 'Rimuovi filtri'],
    err: ['No se pudo cargar data/relationships.json.', 'Could not load data/relationships.json.', 'Impossible de charger data/relationships.json.', 'Impossibile caricare data/relationships.json.'],
    gen: ['Calculado', 'Computed', 'Calculé', 'Calcolato'], fresh: ['Frescura', 'Freshness', 'Fraîcheur', 'Freschezza'], src: ['Fuente', 'Source', 'Source', 'Fonte'], open: ['Ver ficha', 'Open page', 'Voir la fiche', 'Apri scheda'], link: ['enlace', 'link', 'lien', 'link']
  };
  function t(k) { var v = TX[k]; return v ? v[li()] : k; }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nf(v, d) { try { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (e) { return v.toFixed(d); } }
  function L(o) { return o ? (o[lang()] || o.en || '') : ''; }
  var PAGE = { trigo: 'trigo', maiz: 'maiz', leche: 'leche', vaca: 'vacuno', urea: 'urea', diesel: 'diesel', harina_soja: 'soja', cerdo: 'cerdo', cebada: 'cebada' };
  var DOC = null, F = { ch: '', r: '', st: '', c: '', p: '', id: '' };

  function readUrl() { var q = new URLSearchParams(location.search); for (var k in F) F[k] = q.get(k) || ''; }
  function writeUrl() {
    var q = new URLSearchParams(); for (var k in F) if (F[k]) q.set(k, F[k]);
    var s = q.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); } catch (e) {}
  }
  function regionName(r) { return DOC.regions[r] ? L(DOC.regions[r]) : r.toUpperCase(); }
  function sidesOf(x) { return [x.input, x.market]; }
  function matches(x) {
    if (F.id) return x.id === F.id;
    if (F.ch && x.channel !== F.ch) return false;
    if (F.st && x.status !== F.st) return false;
    if (F.c && x.confidence !== F.c) return false;
    if (F.r && x.input.region !== F.r && x.market.region !== F.r) return false;
    if (F.p && x.input.product !== F.p && x.market.product !== F.p && PAGE[x.input.product] !== F.p && PAGE[x.market.product] !== F.p) return false;
    return true;
  }
  function chip(group, val, label, on) { return '<button type="button" class="pt-chip" aria-pressed="' + (!!on) + '" data-f="' + group + '" data-v="' + esc(val) + '">' + esc(label) + '</button>'; }
  function uniq(list) { var o = {}, r = []; list.forEach(function (x) { if (!o[x]) { o[x] = 1; r.push(x); } }); return r; }
  function filters() {
    var rels = DOC.relationships, chs = uniq(rels.map(function (x) { return x.channel; })), regs = uniq([].concat.apply([], rels.map(function (x) { return [x.input.region, x.market.region]; }))).sort();
    var prods = uniq([].concat.apply([], rels.map(function (x) { return sidesOf(x).map(function (s) { return PAGE[s.product] || s.product; }); }))).sort();
    var h = '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fCh')) + '"><span class="pt-lbl">' + esc(t('fCh')) + '</span>' + chip('ch', '', t('all'), !F.ch) + chs.map(function (c) { return chip('ch', c, t('ch_' + c), F.ch === c); }).join('') + '</div>';
    h += '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fSt')) + '"><span class="pt-lbl">' + esc(t('fSt')) + '</span>' + chip('st', '', t('all'), !F.st) + ['OBSERVED_RELATIONSHIP', 'WEAK_OR_UNSTABLE', 'INSUFFICIENT_DATA'].map(function (s) { return chip('st', s, t('stl_' + s), F.st === s); }).join('') + '</div>';
    h += '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fConf')) + '"><span class="pt-lbl">' + esc(t('fConf')) + '</span>' + chip('c', '', t('all'), !F.c) + ['HIGH', 'MEDIUM', 'LOW'].map(function (s) { return chip('c', s, t('conf_' + s), F.c === s); }).join('') + '</div>';
    h += '<div class="pt-bar-ctl" role="group" aria-label="' + esc(t('fReg')) + '"><span class="pt-lbl">' + esc(t('fReg')) + '</span>' + chip('r', '', t('all'), !F.r) + regs.map(function (r) { return chip('r', r, regionName(r), F.r === r); }).join('') + '</div>';
    h += '<div class="rl-prod"><label for="rl-p" class="pt-lbl">' + esc(t('fProd')) + '</label> <select id="rl-p" data-f="p"><option value="">' + esc(t('all')) + '</option>' + prods.map(function (p) { return '<option value="' + esc(p) + '"' + (F.p === p ? ' selected' : '') + '>' + esc(prodLabel(p)) + '</option>'; }).join('') + '</select></div>';
    return h;
  }
  function prodLabel(p) {
    for (var i = 0; i < DOC.relationships.length; i++) { var s = sidesOf(DOC.relationships[i]); for (var j = 0; j < 2; j++) if ((PAGE[s[j].product] || s[j].product) === p) return L(s[j].label); }
    return p;
  }
  function mv(m) {
    if (!m) return '—';
    var c = m.changePct, cls = c === null ? 'pt-flat' : c > 0 ? 'pt-up' : c < 0 ? 'pt-down' : 'pt-flat';
    return esc(m.period) + ' · ' + (c === null ? '—' : '<span class="' + cls + '">' + (c > 0 ? '+' : '') + nf(c, 1) + ' %</span>');
  }
  function side(kind, s, fresh) {
    var pg = PAGE[s.product], name = esc(L(s.label)) + ' <span class="pt-sub">(' + esc(regionName(s.region)) + ')</span>';
    var nm = pg ? '<a href="producto.html?p=' + pg + '">' + name + '</a>' : name;
    return '<div class="rl-node rl-' + kind + '"><span class="pt-k">' + esc(t(kind.toUpperCase())) + '</span><strong>' + nm + '</strong><span class="pt-sub">' + (ci(s.sourceId) || esc(s.sourceId || '')) + (s.unit ? ' · ' + esc((s.currency || '') + '/' + s.unit) : '') + '</span><span class="pt-badge pt-fs-' + esc(fresh) + '">' + esc(fresh) + '</span></div>';
  }
  function lagUnit(x, n) { return n + ' ' + (x.frequency === 'monthly' ? t('mon') : x.frequency === 'annual' ? t('yr') : t('qtr')); }
  function profile(x) {
    var s = x.stat, mx = 0.05; s.lagProfile.forEach(function (p) { if (p[1] !== null && Math.abs(p[1]) > mx) mx = Math.abs(p[1]); });
    var h = '<div class="pt-bars rl-prof" role="img" aria-label="' + esc(t('lagH')) + '">';
    s.lagProfile.forEach(function (p) {
      var r = p[1], w = r === null ? 0 : Math.round(Math.abs(r) / mx * 100), cur = p[0] === s.lag;
      h += '<div class="pt-row"><span class="n">' + esc(p[0] === 0 ? t('sameP') : lagUnit(x, p[0])) + (cur ? ' ◀' : '') + '</span><span class="rl-barwrap"><i class="' + (r !== null && r < 0 ? 'neg' : '') + '" style="width:' + w + '%"></i></span><span>' + (r === null ? '—' : nf(r, 2)) + ' <span class="pt-sub">n=' + p[2] + '</span></span></div>';
    });
    return h + '</div>';
  }
  function card(x) {
    var s = x.stat, fam = DOC.families[x.family], ok = x.status !== 'INSUFFICIENT_DATA';
    var h = '<article class="di-card rl-card" id="r-' + esc(x.id) + '" data-status="' + x.status + '">';
    h += '<div class="rl-flow">' + side('input', x.input, x.freshness.input) + '<span class="rl-arrow" aria-hidden="true">→</span><div class="rl-node rl-channel"><span class="pt-k">' + esc(t('CHANNEL')) + '</span><strong>' + esc(L(DOC.channels[x.channel])) + '</strong></div><span class="rl-arrow" aria-hidden="true">→</span>' + side('market', x.market, x.freshness.market) + '</div>';
    h += '<p class="rl-badges"><span class="pt-badge rl-st-' + x.status + '" title="' + esc(t('stl_' + x.status)) + '">' + esc(t('st_' + x.status)) + '</span><span class="pt-badge rl-conf-' + x.confidence + '">' + esc(t('conf_' + x.confidence)) + '</span></p>';
    h += '<h3 class="rl-h">' + esc(t('obsH')) + '</h3><p class="rl-expl">' + esc(L(x.explanation)) + '</p>';
    h += '<dl class="rl-stats">';
    function kv(k, v) { return '<div><dt>' + esc(t(k)) + '</dt><dd>' + v + '</dd></div>'; }
    h += kv('corr', s.correlation === null ? '—' : '<strong>' + nf(s.correlation, 2) + '</strong> <span class="pt-sub">' + esc(t('s_' + s.strength)) + '</span>');
    h += kv('dir', esc(t('d_' + s.direction)));
    h += kv('lag', ok ? esc(s.lag === 0 ? t('sameP') : lagUnit(x, s.lag)) : '—');
    h += kv('n', s.n + ' <span class="pt-sub">/ ' + s.lagsTested + ' ' + esc(t('lag').toLowerCase()) + '</span>');
    h += kv('period', esc(s.periodStart + ' – ' + s.periodEnd));
    h += kv('cov', nf(s.coverage * 100, 0) + ' %');
    h += kv('stab', s.signStability === null ? '—' : nf(s.signStability * 100, 0) + ' % <span class="pt-sub">(' + s.windows + ')</span>');
    h += kv('recent', s.recentCorrelation === null ? '—' : nf(s.recentCorrelation, 2));
    h += kv('lastIn', x.stat.inputTransform === 'anomaly' && x.last.input ? esc(x.last.input.period) + ' · ' + (x.last.input.value > 0 ? '+' : '') + nf(x.last.input.value, 1) + ' ' + (x.input.unit.charAt(0) === '%' ? '%' : '°C') : mv(x.last.input)); h += kv('lastMk', mv(x.last.market));
    h += '</dl>';
    h += '<h3 class="rl-h">' + esc(t('hypH')) + '</h3><p class="rl-hyp">' + esc(L(fam.hypothesis)) + '</p>';
    h += '<details class="rl-det"><summary>' + esc(t('lagH')) + '</summary>' + profile(x) + '</details>';
    h += '<p class="pt-src">' + esc(t('discl')) + ' <a href="#r-' + esc(x.id) + '" data-copy="' + esc(x.id) + '">' + esc(t('link')) + '</a></p>';
    return h + '</article>';
  }
  function ci(id, o) { return window.DICite && id ? window.DICite.html(id, o || {}) : ''; }
  function render() {
    var body = document.getElementById('rl-body'); if (!body) return;
    document.getElementById('rl-h1').textContent = t('title'); document.getElementById('rl-sub').textContent = t('sub'); document.title = t('title') + ' | Dehesa Index';
    if (!DOC) return;
    var list = DOC.relationships.filter(matches);
    var h = '<div class="pt-note rl-disclaimer" role="note"><strong>' + esc(L(DOC.disclaimer)) + '</strong></div>';
    h += '<details class="rl-det rl-method"><summary>' + esc(t('method')) + '</summary><p>' + esc(t('mSummary')) + '</p><p>' + esc(t('mRules')) + '</p><p>' + esc(t('mCur')) + '</p></details>';
    h += '<div class="rl-filters">' + filters() + '</div>';
    h += '<p class="pt-sub" aria-live="polite">' + list.length + ' / ' + DOC.relationships.length + ' ' + esc(t('count')) + ' · ' + esc(t('gen')) + ' ' + esc(DOC.generatedAt.slice(0, 10)) + (Object.keys(F).some(function (k) { return F[k]; }) ? ' · <button type="button" class="pt-chip" data-reset="1">' + esc(t('reset')) + '</button>' : '') + '</p>';
    h += list.length ? '<div class="rl-list">' + list.map(card).join('') + '</div>' : '<p class="pt-note">' + esc(t('none')) + '</p>';
    body.innerHTML = h;
    if (F.id) { var el = document.getElementById('r-' + F.id); if (el && el.scrollIntoView) el.scrollIntoView(); }
  }
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('button[data-f],button[data-reset],a[data-copy]') : null; if (!b) return;
    if (b.getAttribute('data-reset')) { for (var k in F) F[k] = ''; }
    else if (b.getAttribute('data-copy')) { e.preventDefault(); F = { ch: '', r: '', st: '', c: '', p: '', id: b.getAttribute('data-copy') }; }
    else { F[b.getAttribute('data-f')] = b.getAttribute('data-v'); F.id = ''; }
    writeUrl(); render();
  }
  function onChange(e) { var el = e.target; if (el.id === 'rl-p') { F.p = el.value; F.id = ''; writeUrl(); render(); } }
  var prevCb = window.DehesaShared.onLangChange;
  window.DehesaShared.onLangChange = function () { if (prevCb) prevCb.apply(this, arguments); render(); };
  window.DehesaShared.init('informacion');
  readUrl();
  var body = document.getElementById('rl-body'); body.addEventListener('click', onClick); body.addEventListener('change', onChange);
  render();
  fetch('data/relationships.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { DOC = d; var go = function () { render(); }; (window.DICite ? window.DICite.load() : Promise.resolve()).then(go, go); })
    .catch(function () { body.innerHTML = '<p class="pt-err">' + esc(t('err')) + '</p>'; });
  window.DIRelations = { state: function () { return { F: F, doc: DOC }; } };
})();
