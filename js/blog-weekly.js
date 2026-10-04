/* Dehesa Index — Blog: resumen semanal automático. ES5, sin librerías.
   Lee data/blog/weekly/index.json y el resumen de cada semana (generados por scripts/update-weekly-blog.py a partir del archivo de noticias).
   La prosa sale de las cifras (recuento de noticias, medios, temas, regiones); los titulares se enseñan en el idioma original del medio y enlazan a la noticia.
   No se reescribe ni se valida el contenido de las noticias: se cuentan y se enlazan. */
(function () {
  'use strict';
  var root = document.getElementById('bl-weekly'); if (!root || !window.DehesaShared) return;
  var S = window.DehesaShared;
  var T = {
    es: { h: 'Resumen semanal', sub: 'Cada semana, las noticias agrarias que Dehesa Index ha recogido: cuántas, de qué medios, de qué temas y los titulares más relevantes, con enlace a la fuente.', week: 'Semana del {a} al {b}', now: 'Semana en curso: se actualiza cada día y se cierra el domingo.', cov: 'Cobertura desde el {d}: antes de esa fecha todavía no archivábamos las noticias, por eso la semana empieza ahí.',
      intro: 'Dehesa Index recogió {n} noticias de {m} medios. Los temas más frecuentes fueron {t1} ({n1}) y {t2} ({n2}); por región, {r1} reunió {p1} % de las noticias.', intro1: 'Dehesa Index recogió {n} noticias de {m} medios. El tema más frecuente fue {t1} ({n1}); por región, {r1} reunió {p1} % de las noticias.',
      top: 'Titulares más relevantes', reg: 'Por región', themes: 'Temas de la semana', prods: 'Productos más citados', days: 'Noticias recogidas por día', partialDay: 'El día en curso puede estar incompleto.', news: 'noticias', see: 'Ver las noticias de este producto',
      older: 'Semanas anteriores', loading: 'Cargando…', err: 'No se pudo cargar este resumen.', none: 'Todavía no hay ningún resumen semanal: el primero aparece cuando haya una semana con cobertura suficiente.',
      note: 'Resumen automático: cuenta y enlaza los titulares que Dehesa Index ha recogido de sus ~270 fuentes; no los reescribe ni los verifica. El titular va en el idioma del medio. Los recuentos son de noticias recogidas, no del total publicado. La relevancia es la puntuación de nuestro clasificador (palabras clave de mercado), no un juicio editorial.', lang: 'idioma' },
    en: { h: 'Weekly digest', sub: 'Each week, the agricultural news Dehesa Index collected: how many, from which outlets, on which topics, and the most relevant headlines, linked to the source.', week: 'Week of {a} to {b}', now: 'Current week: updated daily and closed on Sunday.', cov: 'Coverage from {d}: before that date we were not yet archiving the news, so the week starts there.',
      intro: 'Dehesa Index collected {n} news items from {m} outlets. The most frequent topics were {t1} ({n1}) and {t2} ({n2}); by region, {r1} accounted for {p1}% of the items.', intro1: 'Dehesa Index collected {n} news items from {m} outlets. The most frequent topic was {t1} ({n1}); by region, {r1} accounted for {p1}% of the items.',
      top: 'Most relevant headlines', reg: 'By region', themes: 'Topics of the week', prods: 'Most-cited products', days: 'News collected per day', partialDay: 'The current day may be incomplete.', news: 'items', see: 'See the news for this product',
      older: 'Earlier weeks', loading: 'Loading…', err: 'This digest could not be loaded.', none: 'There is no weekly digest yet: the first one appears once a week has enough coverage.',
      note: 'Automatic digest: it counts and links the headlines Dehesa Index collected from its ~270 sources; it does not rewrite or verify them. Each headline is in the outlet’s language. Counts are of collected items, not of everything published. Relevance is our classifier’s score (market keywords), not an editorial judgement.', lang: 'language' },
    fr: { h: 'Résumé hebdomadaire', sub: 'Chaque semaine, les actualités agricoles collectées par Dehesa Index : combien, de quels médias, sur quels sujets, et les titres les plus pertinents, avec le lien vers la source.', week: 'Semaine du {a} au {b}', now: 'Semaine en cours : mise à jour chaque jour et clôturée le dimanche.', cov: 'Couverture depuis le {d} : avant cette date nous n’archivions pas encore les actualités, la semaine commence donc là.',
      intro: 'Dehesa Index a collecté {n} actualités de {m} médias. Les sujets les plus fréquents : {t1} ({n1}) et {t2} ({n2}) ; par région, {r1} représente {p1} % des actualités.', intro1: 'Dehesa Index a collecté {n} actualités de {m} médias. Le sujet le plus fréquent : {t1} ({n1}) ; par région, {r1} représente {p1} % des actualités.',
      top: 'Titres les plus pertinents', reg: 'Par région', themes: 'Sujets de la semaine', prods: 'Produits les plus cités', days: 'Actualités collectées par jour', partialDay: 'Le jour en cours peut être incomplet.', news: 'actualités', see: 'Voir les actualités de ce produit',
      older: 'Semaines précédentes', loading: 'Chargement…', err: 'Impossible de charger ce résumé.', none: 'Aucun résumé hebdomadaire pour l’instant : le premier apparaît dès qu’une semaine est suffisamment couverte.',
      note: 'Résumé automatique : il compte et relie les titres collectés par Dehesa Index auprès de ses ~270 sources ; il ne les réécrit ni ne les vérifie. Chaque titre est dans la langue du média. Les chiffres portent sur les actualités collectées, pas sur tout ce qui est publié. La pertinence est le score de notre classificateur (mots-clés de marché), pas un jugement éditorial.', lang: 'langue' },
    it: { h: 'Riepilogo settimanale', sub: 'Ogni settimana, le notizie agricole raccolte da Dehesa Index: quante, da quali testate, su quali temi e i titoli più rilevanti, con il link alla fonte.', week: 'Settimana dal {a} al {b}', now: 'Settimana in corso: aggiornata ogni giorno e chiusa la domenica.', cov: 'Copertura dal {d}: prima di quella data non archiviavamo ancora le notizie, per questo la settimana inizia lì.',
      intro: 'Dehesa Index ha raccolto {n} notizie da {m} testate. I temi più frequenti: {t1} ({n1}) e {t2} ({n2}); per regione, {r1} rappresenta il {p1} % delle notizie.', intro1: 'Dehesa Index ha raccolto {n} notizie da {m} testate. Il tema più frequente: {t1} ({n1}); per regione, {r1} rappresenta il {p1} % delle notizie.',
      top: 'Titoli più rilevanti', reg: 'Per regione', themes: 'Temi della settimana', prods: 'Prodotti più citati', days: 'Notizie raccolte al giorno', partialDay: 'Il giorno in corso può essere incompleto.', news: 'notizie', see: 'Vedi le notizie su questo prodotto',
      older: 'Settimane precedenti', loading: 'Caricamento…', err: 'Impossibile caricare questo riepilogo.', none: 'Non c’è ancora nessun riepilogo settimanale: il primo compare quando una settimana ha copertura sufficiente.',
      note: 'Riepilogo automatico: conta e collega i titoli raccolti da Dehesa Index dalle sue ~270 fonti; non li riscrive né li verifica. Ogni titolo è nella lingua della testata. I numeri riguardano le notizie raccolte, non tutto ciò che è stato pubblicato. La rilevanza è il punteggio del nostro classificatore (parole chiave di mercato), non un giudizio editoriale.', lang: 'lingua' }
  };
  var REG = { us: { es: 'EE. UU.', en: 'United States', fr: 'États-Unis', it: 'Stati Uniti' }, ca: { es: 'Canadá', en: 'Canada', fr: 'Canada', it: 'Canada' }, uk: { es: 'Reino Unido', en: 'United Kingdom', fr: 'Royaume-Uni', it: 'Regno Unito' }, eu: { es: 'Europa', en: 'Europe', fr: 'Europe', it: 'Europa' }, global: { es: 'Mundo', en: 'World', fr: 'Monde', it: 'Mondo' } };
  var TOP = {
    es: { clima: 'Clima', costes: 'Costes', comercio: 'Comercio', politica: 'Política agraria', oferta: 'Oferta y cosecha', tecnologia: 'Tecnología', energia: 'Energía', ayudas: 'Ayudas', precios: 'Precios y mercado', sanidad: 'Sanidad animal' },
    en: { clima: 'Weather', costes: 'Costs', comercio: 'Trade', politica: 'Agricultural policy', oferta: 'Supply & harvest', tecnologia: 'Technology', energia: 'Energy', ayudas: 'Support & aid', precios: 'Prices & markets', sanidad: 'Animal health' },
    fr: { clima: 'Climat', costes: 'Coûts', comercio: 'Commerce', politica: 'Politique agricole', oferta: 'Offre & récolte', tecnologia: 'Technologie', energia: 'Énergie', ayudas: 'Aides', precios: 'Prix et marchés', sanidad: 'Santé animale' },
    it: { clima: 'Clima', costes: 'Costi', comercio: 'Commercio', politica: 'Politica agricola', oferta: 'Offerta e raccolto', tecnologia: 'Tecnologia', energia: 'Energia', ayudas: 'Aiuti', precios: 'Prezzi e mercati', sanidad: 'Sanità animale' }
  };
  var PRD = {
    es: { trigo: 'Trigo', maiz: 'Maíz', arroz: 'Arroz', cebada: 'Cebada', soja: 'Soja', colza: 'Colza y girasol', azucar: 'Azúcar', leche: 'Leche y lácteos', vaca: 'Vacuno', cerdo: 'Porcino', cordero: 'Ovino', pollo: 'Aves', huevos: 'Huevos', ganado: 'Ganadería', oliva: 'Aceite de oliva', pienso: 'Piensos', fertilizantes: 'Fertilizantes', diesel: 'Diésel', energia: 'Energía', costes: 'Costes agrícolas', pac: 'PAC' },
    en: { trigo: 'Wheat', maiz: 'Corn', arroz: 'Rice', cebada: 'Barley', soja: 'Soybeans', colza: 'Rapeseed & sunflower', azucar: 'Sugar', leche: 'Dairy', vaca: 'Cattle & beef', cerdo: 'Pork', cordero: 'Sheep & lamb', pollo: 'Poultry', huevos: 'Eggs', ganado: 'Livestock', oliva: 'Olive oil', pienso: 'Animal feed', fertilizantes: 'Fertiliser', diesel: 'Diesel', energia: 'Energy', costes: 'Farm costs', pac: 'CAP' },
    fr: { trigo: 'Blé', maiz: 'Maïs', arroz: 'Riz', cebada: 'Orge', soja: 'Soja', colza: 'Colza et tournesol', azucar: 'Sucre', leche: 'Lait et produits laitiers', vaca: 'Bovins', cerdo: 'Porc', cordero: 'Ovins', pollo: 'Volaille', huevos: 'Œufs', ganado: 'Élevage', oliva: "Huile d'olive", pienso: 'Aliments du bétail', fertilizantes: 'Engrais', diesel: 'Gazole', energia: 'Énergie', costes: 'Coûts agricoles', pac: 'PAC' },
    it: { trigo: 'Grano', maiz: 'Mais', arroz: 'Riso', cebada: 'Orzo', soja: 'Soia', colza: 'Colza e girasole', azucar: 'Zucchero', leche: 'Latte e latticini', vaca: 'Bovini', cerdo: 'Suini', cordero: 'Ovini', pollo: 'Avicoli', huevos: 'Uova', ganado: 'Zootecnia', oliva: "Olio d'oliva", pienso: 'Mangimi', fertilizantes: 'Fertilizzanti', diesel: 'Gasolio', energia: 'Energia', costes: 'Costi agricoli', pac: 'PAC' }
  };
  var IDX = null, CACHE = {}, esc = S.esc;
  function lg() { var l = S.getLang(); return T[l] ? l : 'es'; }
  function get(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? '' : o[k]; }); }
  function dfmt(iso, o) { var p = iso.split('-'); try { return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString(lg(), o || { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return iso; } }
  function nf(n) { try { return n.toLocaleString(lg()); } catch (e) { return String(n); } }
  function weekTitle(w) { return fill(T[lg()].week, { a: dfmt(w.from), b: dfmt(w.to, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) }); }
  function sorted(o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }); }
  function headline(h, t) {
    return '<li><a href="' + esc(h.url) + '" target="_blank" rel="noopener noreferrer">' + esc(h.h) + '</a> <span class="di-movers-hint">' + esc(h.source) + ' · ' + esc(dfmt(h.date)) + (h.lang && h.lang !== lg() ? ' · ' + esc(t.lang) + ': ' + esc(h.lang.toUpperCase()) : '') + '</span></li>';
  }
  function list(rows, t) { return '<ul class="di-blog-weekly-list" style="margin:6px 0 0 18px;padding:0;line-height:1.45">' + rows.map(function (h) { return headline(h, t); }).join('') + '</ul>'; }
  function bars(pairs, max, label) {
    return pairs.map(function (p) { var w = max ? Math.max(2, Math.round(p[1] / max * 100)) : 0; return '<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:14px"><span style="flex:0 0 150px">' + esc(label(p[0])) + '</span><span style="flex:1 1 auto;background:var(--border,#E6E0CF);border-radius:3px;height:10px"><span style="display:block;width:' + w + '%;height:10px;background:var(--accent,#2f6b4a);border-radius:3px"></span></span><span style="flex:0 0 52px;text-align:right;font-variant-numeric:tabular-nums">' + esc(nf(p[1])) + '</span></div>'; }).join('');
  }
  function body(w) {
    var l = lg(), t = T[l], tt = w.totals, th = sorted(tt.byTopic), rg = sorted(tt.byRegion), pr = sorted(tt.byProduct).slice(0, 8), dy = Object.keys(tt.byDay).sort().map(function (d) { return [d, tt.byDay[d]]; });
    var intro = th.length ? fill(th.length > 1 ? t.intro : t.intro1, { n: nf(tt.items), m: nf(tt.sources), t1: (TOP[l][th[0][0]] || th[0][0]).toLowerCase(), n1: nf(th[0][1]), t2: th[1] ? (TOP[l][th[1][0]] || th[1][0]).toLowerCase() : '', n2: th[1] ? nf(th[1][1]) : '', r1: REG[rg[0][0]] ? REG[rg[0][0]][l] : rg[0][0], p1: Math.round(rg[0][1] / tt.items * 100) }) : '';
    var h = '<p style="margin:0 0 8px">' + esc(intro) + '</p>';
    if (!w.complete) h += '<p class="di-movers-hint">' + esc(t.now) + '</p>';
    if (w.coverage.from > w.from) h += '<p class="di-movers-hint">' + esc(fill(t.cov, { d: dfmt(w.coverage.from, { day: 'numeric', month: 'long', timeZone: 'UTC' }) })) + '</p>';
    h += '<h3 style="font-size:16px;margin:14px 0 2px">' + esc(t.top) + '</h3>' + list(w.top, t);
    h += '<h3 style="font-size:16px;margin:14px 0 2px">' + esc(t.reg) + '</h3>' + rg.filter(function (r) { return w.byRegion[r[0]]; }).map(function (r) { return '<h4 style="font-size:14px;margin:10px 0 0">' + esc(REG[r[0]] ? REG[r[0]][l] : r[0]) + ' <span class="di-movers-hint">' + esc(nf(r[1])) + ' ' + esc(t.news) + '</span></h4>' + list(w.byRegion[r[0]], t); }).join('');
    h += '<h3 style="font-size:16px;margin:14px 0 4px">' + esc(t.themes) + '</h3>' + bars(th, th.length ? th[0][1] : 0, function (k) { return TOP[l][k] || k; });
    h += '<h3 style="font-size:16px;margin:14px 0 4px">' + esc(t.prods) + '</h3>' + '<p style="margin:0;line-height:1.9">' + pr.map(function (p) { return '<a class="di-src-tab" href="noticias.html?product=' + encodeURIComponent(p[0]) + '" title="' + esc(t.see) + '">' + esc(PRD[l][p[0]] || p[0]) + ' · ' + esc(nf(p[1])) + '</a>'; }).join(' ') + '</p>';
    h += '<h3 style="font-size:16px;margin:14px 0 4px">' + esc(t.days) + '</h3>' + bars(dy, Math.max.apply(null, dy.map(function (d) { return d[1]; })), function (d) { return dfmt(d, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); }) + (w.complete ? '' : '<p class="di-movers-hint">' + esc(t.partialDay) + '</p>');
    return h;
  }
  function card(w, open, id) {
    return '<details class="di-card" id="' + esc(id) + '" data-wk="' + esc(w.week) + '" style="padding:12px 16px;margin:0 0 14px"' + (open ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700;font-size:18px">' + esc(weekTitle(w)) + ' <span class="di-movers-hint" style="font-weight:400">' + esc(nf(w.items)) + ' ' + esc(T[lg()].news) + '</span></summary><div data-wk-body="' + esc(w.week) + '" style="margin-top:8px">' + (open ? '' : '<p class="di-movers-hint">' + esc(T[lg()].loading) + '</p>') + '</div></details>';
  }
  function fillWeek(wk) {
    var box = root.querySelector('[data-wk-body="' + wk + '"]'); if (!box) return;
    var t = T[lg()];
    (CACHE[wk] ? Promise.resolve(CACHE[wk]) : get('data/blog/weekly/' + wk + '.json').then(function (d) { CACHE[wk] = d; return d; })).then(function (d) { box.innerHTML = body(d); }, function () { box.innerHTML = '<p class="di-movers-hint">' + esc(t.err) + '</p>'; });
  }
  function render() {
    var t = T[lg()];
    if (!IDX) { root.innerHTML = ''; return; }
    if (!IDX.weeks.length) { root.innerHTML = '<section class="di-card" style="padding:14px 16px;margin:0 0 16px"><h2 style="margin:0 0 4px;font-size:20px">' + esc(t.h) + '</h2><p class="di-movers-hint">' + esc(t.none) + '</p></section>'; return; }
    var hash = (location.hash || '').replace('#', ''), ws = IDX.weeks;
    root.innerHTML = '<section aria-labelledby="bl-weekly-h" style="margin:0 0 20px"><h2 id="bl-weekly-h" style="margin:0 0 4px;font-size:22px">' + esc(t.h) + '</h2><p class="di-movers-hint" style="margin:0 0 10px">' + esc(t.sub) + '</p>' +
      ws.map(function (w, i) { return card(w, i === 0 || w.week === hash, w.week); }).join('') + '<p class="di-movers-hint">' + esc(t.note) + '</p></section>';
    Array.prototype.forEach.call(root.querySelectorAll('details[data-wk]'), function (d) {
      var wk = d.getAttribute('data-wk'); if (d.open) fillWeek(wk);
      d.addEventListener('toggle', function () { if (d.open) fillWeek(wk); });
    });
    var up = document.getElementById('bl-updated'); if (up && IDX.generatedAt) up.textContent = dfmt(IDX.generatedAt.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  var prev = S.onLangChange; S.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
  get('data/blog/weekly/index.json').then(function (d) { IDX = d; render(); }, function () { IDX = { weeks: [] }; render(); });
})();
