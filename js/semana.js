/* Dehesa Index — «La semana en…»: resumen semanal por país (España, Francia, Italia, Alemania, EE. UU.), aparte del blog general. ES5, sin librerías.
   Lee data/blog/countries/index.json y data/blog/countries/<CC>/<semana>.json (scripts/build-country-weeks.py).
   La prosa sale solo de las cifras del fichero: cuántos datos se publicaron, qué precios se movieron más frente a su dato anterior y qué titulares
   publicaron los medios del país. No se escribe ni se interpreta nada que no esté en los datos; los titulares van en su idioma y enlazan a la fuente. */
(function () {
  'use strict';
  var S = window.DehesaShared; if (!S) return;
  var root = document.getElementById('sw-root'); if (!root) return;
  var esc = S.esc, CCS = ['ES', 'FR', 'IT', 'DE', 'US'];
  var NAME = {
    ES: { es: 'España', en: 'Spain', fr: 'Espagne', it: 'Spagna' }, FR: { es: 'Francia', en: 'France', fr: 'France', it: 'Francia' },
    IT: { es: 'Italia', en: 'Italy', fr: 'Italie', it: 'Italia' }, DE: { es: 'Alemania', en: 'Germany', fr: 'Allemagne', it: 'Germania' },
    US: { es: 'EE. UU.', en: 'the United States', fr: 'les États-Unis', it: 'gli Stati Uniti' }
  };
  var TAB = { US: { es: 'EE. UU.', en: 'United States', fr: 'États-Unis', it: 'Stati Uniti' } };
  var MEDIA = { ES: { es: 'españoles', en: 'Spanish', fr: 'espagnols', it: 'spagnoli' }, FR: { es: 'franceses', en: 'French', fr: 'français', it: 'francesi' },
    IT: { es: 'italianos', en: 'Italian', fr: 'italiens', it: 'italiani' }, DE: { es: 'alemanes', en: 'German', fr: 'allemands', it: 'tedeschi' },
    US: { es: 'estadounidenses', en: 'US', fr: 'américains', it: 'statunitensi' } };
  var T = {
    es: { title: 'La semana en cada país | Dehesa Index', h1: 'La semana en cada país', sub: 'España, Francia, Italia, Alemania y EE. UU.: los datos que se publicaron cada semana y los titulares de sus medios agrarios.',
      head: 'La semana en {c}', week: 'del {a} al {b}', open: 'Semana en curso: se actualiza cada día y se cierra el domingo.', closed: 'Semana cerrada.',
      p1: 'Esta semana llegaron a Dehesa Index {n} datos nuevos de {c}: {parts}.', p1none: 'Esta semana no llegó ningún dato nuevo de {c} a Dehesa Index.',
      parts: { precios: '{n} de precios', produccion: '{n} de producción y existencias', comercio: '{n} de comercio', costes: '{n} de costes e insumos', otros: '{n} de otros indicadores' },
      p1new: 'Además se incorporaron {n} series nuevas al catálogo del país.',
      p2: 'El precio que más se movió fue {l}: {v} ({ch} frente al dato anterior, del {pp}).', p2b: 'Le siguen {l2} ({ch2}) y {l3} ({ch3}).', p2b1: 'Le sigue {l2} ({ch2}).',
      p3: 'Los medios agrarios {m} que seguimos publicaron {n} noticias; abajo, los titulares más relevantes.', p3none: 'No archivamos titulares de medios {m} esta semana.',
      movers: 'Precios que más se movieron', moversD: 'Cambio frente al dato anterior de la misma serie', releases: 'Otros datos publicados', releasesD: 'Producción, comercio, costes y otros indicadores que se actualizaron',
      news: 'Titulares de la semana', newsD: 'Medios {m}, en su idioma, con enlace a la noticia', serie: 'Serie', val: 'Último dato', per: 'Periodo', ch: 'Cambio', prev: 'Dato anterior',
      older: 'Otras semanas', more: 'Todos los datos de {c}', cov: 'Cobertura desde el {d}: antes de esa fecha no registrábamos el día de llegada de cada dato.',
      note: 'Resumen automático, sin redacción: cuenta los datos que llegaron a Dehesa Index esa semana (un dato es nuevo cuando su serie publica un periodo nuevo; las revisiones no cuentan) y enlaza los titulares de medios del país sin reescribirlos ni verificarlos. El cambio es el de la propia serie frente a su dato anterior.',
      none: 'Todavía no hay ninguna semana para este país.', loading: 'Cargando…', err: 'No se pudo cargar esta semana.', blog: 'Resumen semanal general', lang: 'idioma' },
    en: { title: 'The week in each country | Dehesa Index', h1: 'The week in each country', sub: 'Spain, France, Italy, Germany and the US: the data published each week and the headlines from their farm media.',
      head: 'The week in {c}', week: '{a} to {b}', open: 'Current week: updated daily and closed on Sunday.', closed: 'Closed week.',
      p1: 'This week Dehesa Index received {n} new data points for {c}: {parts}.', p1none: 'No new data for {c} reached Dehesa Index this week.',
      parts: { precios: '{n} prices', produccion: '{n} production and stocks', comercio: '{n} trade', costes: '{n} costs and inputs', otros: '{n} other indicators' },
      p1new: '{n} new series were also added to the country’s catalogue.',
      p2: 'The biggest price move was {l}: {v} ({ch} on the previous figure, from {pp}).', p2b: 'Next came {l2} ({ch2}) and {l3} ({ch3}).', p2b1: 'Next came {l2} ({ch2}).',
      p3: 'The {m} farm media we follow published {n} news items; the most relevant headlines are below.', p3none: 'We archived no headlines from {m} media this week.',
      movers: 'Biggest price moves', moversD: 'Change on the previous figure of the same series', releases: 'Other data published', releasesD: 'Production, trade, costs and other indicators that were updated',
      news: 'Headlines of the week', newsD: '{m} media, in their language, linked to the story', serie: 'Series', val: 'Latest', per: 'Period', ch: 'Change', prev: 'Previous',
      older: 'Other weeks', more: 'All data for {c}', cov: 'Coverage from {d}: before that date we did not record the day each figure arrived.',
      note: 'Automatic summary, not written by anyone: it counts the data that reached Dehesa Index that week (a figure is new when its series publishes a new period; revisions do not count) and links headlines from the country’s media without rewriting or checking them. The change is the series’ own change on its previous figure.',
      none: 'There is no week for this country yet.', loading: 'Loading…', err: 'This week could not be loaded.', blog: 'General weekly digest', lang: 'language' },
    fr: { title: 'La semaine dans chaque pays | Dehesa Index', h1: 'La semaine dans chaque pays', sub: 'Espagne, France, Italie, Allemagne et États-Unis : les données publiées chaque semaine et les titres de leurs médias agricoles.',
      head: 'La semaine : {c}', week: 'du {a} au {b}', open: 'Semaine en cours : mise à jour chaque jour et clôturée le dimanche.', closed: 'Semaine clôturée.',
      p1: 'Cette semaine, Dehesa Index a reçu {n} nouvelles données pour {c} : {parts}.', p1none: 'Aucune nouvelle donnée pour {c} n’est arrivée cette semaine.',
      parts: { precios: '{n} de prix', produccion: '{n} de production et stocks', comercio: '{n} de commerce', costes: '{n} de coûts et intrants', otros: '{n} d’autres indicateurs' },
      p1new: 'De plus, {n} nouvelles séries ont été ajoutées au catalogue du pays.',
      p2: 'Le prix qui a le plus bougé : {l}, {v} ({ch} par rapport à la donnée précédente, du {pp}).', p2b: 'Suivent {l2} ({ch2}) et {l3} ({ch3}).', p2b1: 'Suit {l2} ({ch2}).',
      p3: 'Les médias agricoles {m} que nous suivons ont publié {n} actualités ; les titres les plus pertinents sont ci-dessous.', p3none: 'Aucun titre de médias {m} archivé cette semaine.',
      movers: 'Prix qui ont le plus bougé', moversD: 'Variation par rapport à la donnée précédente de la même série', releases: 'Autres données publiées', releasesD: 'Production, commerce, coûts et autres indicateurs mis à jour',
      news: 'Titres de la semaine', newsD: 'Médias {m}, dans leur langue, avec le lien vers l’article', serie: 'Série', val: 'Dernière donnée', per: 'Période', ch: 'Variation', prev: 'Donnée précédente',
      older: 'Autres semaines', more: 'Toutes les données : {c}', cov: 'Couverture depuis le {d} : avant cette date nous n’enregistrions pas le jour d’arrivée de chaque donnée.',
      note: 'Résumé automatique, non rédigé : il compte les données arrivées sur Dehesa Index cette semaine (une donnée est nouvelle quand sa série publie une nouvelle période ; les révisions ne comptent pas) et relie les titres des médias du pays sans les réécrire ni les vérifier. La variation est celle de la série par rapport à sa donnée précédente.',
      none: 'Aucune semaine pour ce pays pour l’instant.', loading: 'Chargement…', err: 'Impossible de charger cette semaine.', blog: 'Résumé hebdomadaire général', lang: 'langue' },
    it: { title: 'La settimana in ogni paese | Dehesa Index', h1: 'La settimana in ogni paese', sub: 'Spagna, Francia, Italia, Germania e Stati Uniti: i dati pubblicati ogni settimana e i titoli dei loro media agricoli.',
      head: 'La settimana: {c}', week: 'dal {a} al {b}', open: 'Settimana in corso: aggiornata ogni giorno e chiusa la domenica.', closed: 'Settimana chiusa.',
      p1: 'Questa settimana Dehesa Index ha ricevuto {n} nuovi dati per {c}: {parts}.', p1none: 'Questa settimana non è arrivato nessun nuovo dato per {c}.',
      parts: { precios: '{n} di prezzi', produccion: '{n} di produzione e scorte', comercio: '{n} di commercio', costes: '{n} di costi e input', otros: '{n} di altri indicatori' },
      p1new: 'Inoltre sono state aggiunte {n} nuove serie al catalogo del paese.',
      p2: 'Il prezzo che si è mosso di più: {l}, {v} ({ch} rispetto al dato precedente, del {pp}).', p2b: 'Seguono {l2} ({ch2}) e {l3} ({ch3}).', p2b1: 'Segue {l2} ({ch2}).',
      p3: 'I media agricoli {m} che seguiamo hanno pubblicato {n} notizie; sotto, i titoli più rilevanti.', p3none: 'Nessun titolo di media {m} archiviato questa settimana.',
      movers: 'Prezzi che si sono mossi di più', moversD: 'Variazione rispetto al dato precedente della stessa serie', releases: 'Altri dati pubblicati', releasesD: 'Produzione, commercio, costi e altri indicatori aggiornati',
      news: 'Titoli della settimana', newsD: 'Media {m}, nella loro lingua, con il link alla notizia', serie: 'Serie', val: 'Ultimo dato', per: 'Periodo', ch: 'Variazione', prev: 'Dato precedente',
      older: 'Altre settimane', more: 'Tutti i dati: {c}', cov: 'Copertura dal {d}: prima di quella data non registravamo il giorno di arrivo di ogni dato.',
      note: 'Riepilogo automatico, non redatto: conta i dati arrivati su Dehesa Index quella settimana (un dato è nuovo quando la sua serie pubblica un nuovo periodo; le revisioni non contano) e collega i titoli dei media del paese senza riscriverli né verificarli. La variazione è quella della serie rispetto al suo dato precedente.',
      none: 'Ancora nessuna settimana per questo paese.', loading: 'Caricamento…', err: 'Impossibile caricare questa settimana.', blog: 'Riepilogo settimanale generale', lang: 'lingua' }
  };
  var IDX = null, CACHE = {}, state = { c: 'ES', w: null };
  function lg() { var l = S.getLang(); return T[l] ? l : 'es'; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? '' : o[k]; }); }
  function get(u) { return fetch(S.sitePath ? S.sitePath(u) : u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  function dfmt(iso, y) { var p = String(iso).split('-'); if (p.length < 3) return iso; try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lg(), y ? { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function per(p) { return /^\d{4}-\d\d-\d\d$/.test(p) ? dfmt(p, true) : p; }
  function num(v) { if (v == null || isNaN(v)) return '–'; var a = Math.abs(v), d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 3; try { return Number(v).toLocaleString(lg(), { maximumFractionDigits: d }); } catch (e) { return String(v); } }
  function pct(v) { if (v == null || isNaN(v)) return '–'; var s = (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(Math.round(v * 10) / 10)) + ' %'; return lg() === 'en' ? s.replace(' %', '%') : s; }
  function lab(l) { var L = window.DILabelTl; return L && L.ready(lg()) ? L.tl(l, lg()) : l; }
  function cname(cc) { return (NAME[cc] || {})[lg()] || cc; }
  function tabName(cc) { return (TAB[cc] || NAME[cc] || {})[lg()] || cc; }
  function readUrl() { var q = /[?&]c=([A-Z]{2})/.exec(location.search), w = /[?&]w=(\d{4}-W\d\d)/.exec(location.search); if (q && CCS.indexOf(q[1]) > -1) state.c = q[1]; if (w) state.w = w[1]; }
  function writeUrl() { try { history.replaceState(null, '', '?c=' + state.c + (state.w ? '&w=' + state.w : '')); } catch (e) {} }
  function fold(title, desc, inner, open) { return '<details class="di-fold di-card" style="padding:12px 16px;margin:0 0 12px"' + (open ? ' open' : '') + '><summary><h3 style="margin:0 0 2px;font-size:16px">' + esc(title) + '</h3><p class="di-movers-hint" style="margin:0">' + esc(desc) + '</p></summary>' + inner + '</details>'; }
  function table(rows, t, withPrev) {
    var R = 'text-align:right;white-space:nowrap';
    function td(lab, html, st) { return '<td data-label="' + esc(lab) + '" style="' + (st || R) + '">' + html + '</td>'; }
    return '<div style="overflow-x:auto"><table class="di-table di-cards-m" data-no-rows style="width:100%;font-size:14px"><thead><tr><th scope="col" style="text-align:left">' + esc(t.serie) + '</th><th scope="col" style="text-align:left">' + esc(t.per) + '</th><th scope="col" style="text-align:right">' + esc(t.val) + '</th>' + (withPrev ? '<th scope="col" style="text-align:right">' + esc(t.prev) + '</th>' : '') + '<th scope="col" style="text-align:right">' + esc(t.ch) + '</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th scope="row" style="text-align:left;justify-content:flex-start;font-weight:600">' + esc(lab(r.label)) + '</th>' + td(t.per, esc(per(r.period)), 'white-space:nowrap') +
          td(t.val, esc(num(r.value)) + ' <span class="di-movers-hint">' + esc(r.unit) + '</span>') +
          (withPrev ? td(t.prev, esc(num(r.prevValue)) + ' <span class="di-movers-hint">' + esc(per(r.prevPeriod || '')) + '</span>') : '') + td(t.ch, esc(pct(r.changePct))) + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function body(d) {
    var l = lg(), t = T[l], c = cname(d.country), m = MEDIA[d.country][l], tt = d.totals, out = [];
    var parts = ['precios', 'produccion', 'comercio', 'costes', 'otros'].filter(function (k) { return tt.byBlock[k]; }).map(function (k) { return fill(t.parts[k], { n: num(tt.byBlock[k]) }); });
    var ps = [tt.updates ? fill(t.p1, { n: num(tt.updates), c: c, parts: parts.join(', ') }) : fill(t.p1none, { c: c })];
    if (tt.newSeries) ps.push(fill(t.p1new, { n: num(tt.newSeries) }));
    var mv = d.movers;
    if (mv.length) {
      ps.push(fill(t.p2, { l: lab(mv[0].label), v: num(mv[0].value) + ' ' + mv[0].unit, ch: pct(mv[0].changePct), pp: per(mv[0].prevPeriod) }));
      if (mv.length > 2) ps.push(fill(t.p2b, { l2: lab(mv[1].label), ch2: pct(mv[1].changePct), l3: lab(mv[2].label), ch3: pct(mv[2].changePct) }));
      else if (mv.length > 1) ps.push(fill(t.p2b1, { l2: lab(mv[1].label), ch2: pct(mv[1].changePct) }));
    }
    ps.push(tt.news ? fill(t.p3, { m: m, n: num(tt.news) }) : fill(t.p3none, { m: m }));
    out.push('<article class="di-card" style="padding:16px 18px;margin:0 0 12px"><h2 style="margin:0 0 2px;font-size:20px">' + esc(fill(t.head, { c: tabName(d.country) })) + '</h2>' +
      '<p class="di-movers-hint" style="margin:0 0 10px">' + esc(fill(t.week, { a: dfmt(d.from), b: dfmt(d.to, true) })) + ' · ' + esc(d.complete ? t.closed : t.open) + '</p>' +
      ps.map(function (p) { return '<p style="margin:0 0 8px;line-height:1.55">' + esc(p) + '</p>'; }).join('') +
      (d.coverage.from > d.from ? '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(fill(t.cov, { d: dfmt(d.coverage.from, true) })) + '</p>' : '') + '</article>');
    if (mv.length) out.push(fold(t.movers, t.moversD, table(mv, t, true)));
    if (d.releases.length) out.push(fold(t.releases, t.releasesD, table(d.releases, t, false)));
    if (d.news.length) out.push(fold(t.news, fill(t.newsD, { m: m.charAt(0).toUpperCase() + m.slice(1) }), '<ul style="margin:6px 0 0 18px;padding:0;line-height:1.5">' + d.news.map(function (n) {
      return '<li><a href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer">' + esc(n.h) + '</a> <span class="di-movers-hint">' + esc(n.source) + ' · ' + esc(dfmt(n.date)) + (n.lang && n.lang !== l ? ' · ' + esc(t.lang) + ': ' + esc(n.lang.toUpperCase()) : '') + '</span></li>'; }).join('') + '</ul>'));
    out.push('<p style="margin:4px 0 12px"><a href="paises.html?c=' + esc(d.country) + '">' + esc(fill(t.more, { c: tabName(d.country) })) + '</a> · <a href="blog.html">' + esc(t.blog) + '</a></p>');
    return out.join('');
  }
  function weeksNav(rows, t) {
    if (rows.length < 2) return '';
    return '<nav aria-label="' + esc(t.older) + '" style="margin:4px 0 16px"><span class="di-movers-hint">' + esc(t.older) + ':</span> ' + rows.map(function (r) {
      var cur = r.week === state.w; return '<a href="?c=' + state.c + '&amp;w=' + r.week + '" data-w="' + r.week + '"' + (cur ? ' aria-current="page" style="font-weight:700"' : '') + '>' + esc(fill(t.week, { a: dfmt(r.from), b: dfmt(r.to) })) + '</a>'; }).join(' · ') + '</nav>';
  }
  function tabs(t) {
    return '<div role="group" aria-label="' + esc(t.h1) + '" style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">' + CCS.map(function (cc) {
      var on = cc === state.c; return '<button type="button" class="di-chip" data-c="' + cc + '" aria-pressed="' + on + '" style="min-height:36px;padding:6px 12px;border-radius:18px;border:1px solid var(--border,#d8d2c0);background:' + (on ? 'var(--accent,#2f5d3a);color:#fff' : 'transparent;color:inherit') + ';font:inherit;font-size:14px;cursor:pointer">' + esc(tabName(cc)) + '</button>'; }).join('') + '</div>';
  }
  function render() {
    var l = lg(), t = T[l];
    document.title = t.title; document.documentElement.lang = l;
    document.getElementById('sw-h1').textContent = t.h1; document.getElementById('sw-sub').textContent = t.sub; document.getElementById('sw-note').textContent = t.note;
    if (!IDX) { root.innerHTML = '<p class="di-movers-hint">' + esc(t.loading) + '</p>'; return; }
    var rows = (IDX.countries || {})[state.c] || [];
    if (!state.w || !rows.some(function (r) { return r.week === state.w; })) state.w = rows.length ? rows[0].week : null;
    var head = tabs(t);
    if (!state.w) { root.innerHTML = head + '<p>' + esc(t.none) + '</p>'; return; }
    var key = state.c + '/' + state.w, d = CACHE[key];
    if (!d) {
      root.innerHTML = head + '<p class="di-movers-hint">' + esc(t.loading) + '</p>';
      get('data/blog/countries/' + key + '.json').then(function (x) { CACHE[key] = x; render(); }).catch(function () { root.innerHTML = head + '<p>' + esc(t.err) + '</p>'; });
      return;
    }
    root.innerHTML = head + body(d) + weeksNav(rows, t);
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-c],[data-w]') : null; if (!b) return;
    if (b.getAttribute('data-c')) { state.c = b.getAttribute('data-c'); state.w = null; }
    else { e.preventDefault(); state.w = b.getAttribute('data-w'); }
    writeUrl(); render();
  });
  S.init('blog');
  readUrl();
  S.onLangChange = function () { render(); if (window.DILabelTl && !window.DILabelTl.ready(lg())) window.DILabelTl.load(lg()).then(function (ok) { if (ok) render(); }); };
  render();
  get('data/blog/countries/index.json').then(function (x) { IDX = x; render(); }).catch(function () { root.innerHTML = '<p>' + esc(T[lg()].err) + '</p>'; });
  if (window.DILabelTl && !window.DILabelTl.ready(lg())) window.DILabelTl.load(lg()).then(function (ok) { if (ok) render(); });
})();
