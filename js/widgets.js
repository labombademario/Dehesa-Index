/* Dehesa Index — generador de widgets para cooperativas: eliges serie, idioma, color y nombre, ves la vista previa y copias el codigo.
   El widget (embed.html + js/embed.js) lee la API publica; la fuente, la licencia y el enlace a Dehesa Index siempre se muestran. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: { h1: 'Widgets para tu web', sub: 'Pega un precio con su gráfico, su fuente y su licencia en la web de tu cooperativa. Gratis, sin cuenta y con tu nombre arriba.',
      s: 'Precio', lang: 'Idioma', org: 'Tu nombre (opcional)', ph: 'Cooperativa San Isidro', col: 'Color', th: 'Tema', tl: 'Claro', td: 'Oscuro', yr: 'Años del gráfico', pv: 'Vista previa',
      c1: 'Opción 1: un script (se ajusta solo al alto)', c2: 'Opción 2: un iframe (funciona en cualquier web)', cp: 'Copiar código', ok: 'Copiado',
      nT: 'Qué debes saber', n: ['Cada widget muestra la fuente, la licencia y un enlace a Dehesa Index. No se pueden quitar: son la condición de uso de los datos.', 'No usa cookies ni pide datos a quien visita tu web. Los precios se leen de la API pública.', 'El tamaño se adapta al contenedor. Si tu web bloquea scripts de terceros, usa el iframe.', 'Información de fuentes oficiales, no asesoramiento financiero. Algunas fuentes piden citar su atribución, que ya aparece en el widget.'],
      rep: 'Informe de negociación imprimible de este producto', terms: 'Condiciones de uso', load: 'Cargando…', fail: 'No se pudo cargar la lista de precios.' },
    en: { h1: 'Widgets for your website', sub: 'Paste a price with its chart, source and licence into your cooperative’s website. Free, no account, with your name on top.',
      s: 'Price', lang: 'Language', org: 'Your name (optional)', ph: 'Saint Isidore Cooperative', col: 'Colour', th: 'Theme', tl: 'Light', td: 'Dark', yr: 'Chart years', pv: 'Preview',
      c1: 'Option 1: a script (adjusts its own height)', c2: 'Option 2: an iframe (works on any site)', cp: 'Copy code', ok: 'Copied',
      nT: 'What you should know', n: ['Every widget shows the source, the licence and a link to Dehesa Index. They cannot be removed: they are the terms of use of the data.', 'It uses no cookies and asks your visitors for no data. Prices are read from the public API.', 'The size adapts to its container. If your site blocks third-party scripts, use the iframe.', 'Information from official sources, not financial advice. Some sources require their attribution to be cited, and it already appears in the widget.'],
      rep: 'Printable negotiation report for this product', terms: 'Terms of use', load: 'Loading…', fail: 'Could not load the price list.' },
    fr: { h1: 'Widgets pour votre site', sub: 'Collez un prix avec son graphique, sa source et sa licence sur le site de votre coopérative. Gratuit, sans compte, avec votre nom en haut.',
      s: 'Prix', lang: 'Langue', org: 'Votre nom (facultatif)', ph: 'Coopérative Saint-Isidore', col: 'Couleur', th: 'Thème', tl: 'Clair', td: 'Sombre', yr: 'Années du graphique', pv: 'Aperçu',
      c1: 'Option 1 : un script (ajuste sa hauteur)', c2: 'Option 2 : un iframe (fonctionne partout)', cp: 'Copier le code', ok: 'Copié',
      nT: 'À savoir', n: ['Chaque widget affiche la source, la licence et un lien vers Dehesa Index. Ils ne peuvent pas être retirés : ce sont les conditions d’utilisation des données.', 'Aucun cookie et aucune donnée demandée à vos visiteurs. Les prix sont lus depuis l’API publique.', 'La taille s’adapte au conteneur. Si votre site bloque les scripts tiers, utilisez l’iframe.', 'Information issue de sources officielles, pas un conseil financier. Certaines sources exigent de citer leur attribution, déjà présente dans le widget.'],
      rep: 'Rapport de négociation imprimable pour ce produit', terms: 'Conditions d’utilisation', load: 'Chargement…', fail: 'Impossible de charger la liste des prix.' },
    it: { h1: 'Widget per il tuo sito', sub: 'Incolla un prezzo con grafico, fonte e licenza nel sito della tua cooperativa. Gratis, senza account, con il tuo nome in alto.',
      s: 'Prezzo', lang: 'Lingua', org: 'Il tuo nome (facoltativo)', ph: 'Cooperativa Sant’Isidoro', col: 'Colore', th: 'Tema', tl: 'Chiaro', td: 'Scuro', yr: 'Anni del grafico', pv: 'Anteprima',
      c1: 'Opzione 1: uno script (regola l’altezza da solo)', c2: 'Opzione 2: un iframe (funziona ovunque)', cp: 'Copia il codice', ok: 'Copiato',
      nT: 'Da sapere', n: ['Ogni widget mostra fonte, licenza e un link a Dehesa Index. Non si possono togliere: sono le condizioni d’uso dei dati.', 'Nessun cookie e nessun dato richiesto ai visitatori. I prezzi sono letti dall’API pubblica.', 'La dimensione si adatta al contenitore. Se il tuo sito blocca script di terze parti, usa l’iframe.', 'Informazioni da fonti ufficiali, non consulenza finanziaria. Alcune fonti richiedono di citare la loro attribuzione, già presente nel widget.'],
      rep: 'Rapporto di negoziazione stampabile per questo prodotto', terms: 'Condizioni d’uso', load: 'Caricamento…', fail: 'Impossibile caricare l’elenco dei prezzi.' }
  };
  var IDX = null, FAILED = false, ST = { s: '', org: '', c: '2f6b3f', t: 'light', y: 3, lang: null };
  var ORIGIN = 'https://dehesaindex.com/';
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function codes() {
    var l = ST.lang || lang(), a = ' data-dehesa="' + esc(ST.s) + '" data-lang="' + l + '"' + (ST.org ? ' data-org="' + esc(ST.org) + '"' : '') + ' data-color="' + ST.c + '" data-theme="' + ST.t + '" data-years="' + ST.y + '"';
    var u = ORIGIN + 'embed.html?s=' + encodeURIComponent(ST.s) + '&lang=' + l + (ST.org ? '&org=' + encodeURIComponent(ST.org) : '') + '&c=' + ST.c + '&t=' + ST.t + '&y=' + ST.y;
    return { script: '<div' + a + '></div>\n<script async src="' + ORIGIN + 'js/embed.js"><\/script>', iframe: '<iframe src="' + esc(u) + '" title="Dehesa Index" style="width:100%;max-width:460px;height:400px;border:0" loading="lazy"></iframe>', url: u.replace(ORIGIN, '') };
  }
  function render() {
    var w = T[lang()] || T.es, root = document.getElementById('wg-body'); if (!root) return;
    document.getElementById('wg-h1').textContent = w.h1; document.getElementById('wg-sub').textContent = w.sub; document.title = w.h1 + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!IDX) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.load) + '</p>'; return; }
    var l = lang(); if (!ST.lang) ST.lang = l;
    var opts = IDX.series.slice().sort(function (a, b) { var x = (a.name[l] || a.name.es) + (a.place[l] || ''), y = (b.name[l] || b.name.es) + (b.place[l] || ''); return x < y ? -1 : x > y ? 1 : 0; }).map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === ST.s ? ' selected' : '') + '>' + esc((s.name[l] || s.name.es) + ' — ' + (s.place[l] || s.place.es || s.region)) + '</option>'; }).join('');
    var lg = ['es', 'en', 'fr', 'it'].map(function (x) { return '<option value="' + x + '"' + (x === ST.lang ? ' selected' : '') + '>' + x.toUpperCase() + '</option>'; }).join('');
    var yr = [1, 2, 3, 5].map(function (x) { return '<option value="' + x + '"' + (x === ST.y ? ' selected' : '') + '>' + x + '</option>'; }).join('');
    var c = codes(), prod = ST.s.split('/')[1] || '';
    var lab = function (t, ctl) { return '<label style="display:grid;gap:4px;font-size:12.5px">' + esc(t) + ctl + '</label>'; };
    var h = '<div class="di-card" style="padding:14px;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">' +
      lab(w.s, '<select id="wg-s" style="padding:7px">' + opts + '</select>') + lab(w.lang, '<select id="wg-l" style="padding:7px">' + lg + '</select>') +
      lab(w.org, '<input id="wg-o" maxlength="60" placeholder="' + esc(w.ph) + '" value="' + esc(ST.org) + '" style="padding:7px">') + lab(w.col, '<input id="wg-c" type="color" value="#' + ST.c + '" style="height:34px;padding:2px">') +
      lab(w.th, '<select id="wg-t" style="padding:7px"><option value="light"' + (ST.t === 'light' ? ' selected' : '') + '>' + esc(w.tl) + '</option><option value="dark"' + (ST.t === 'dark' ? ' selected' : '') + '>' + esc(w.td) + '</option></select>') +
      lab(w.yr, '<select id="wg-y" style="padding:7px">' + yr + '</select>') + '</div>';
    h += '<h2 style="margin:22px 0 8px;font-size:18px">' + esc(w.pv) + '</h2><iframe id="wg-pv" title="' + esc(w.pv) + '" src="' + esc(c.url) + '" style="width:100%;max-width:460px;height:400px;border:0;display:block"></iframe>';
    h += '<h2 style="margin:22px 0 6px;font-size:16px">' + esc(w.c1) + '</h2><pre class="di-card" id="wg-c1" style="padding:12px 14px;overflow:auto;font-size:12.5px;white-space:pre-wrap;word-break:break-all">' + esc(c.script) + '</pre><button class="di-btn-sec" data-cp="script">' + esc(w.cp) + '</button>';
    h += '<h2 style="margin:22px 0 6px;font-size:16px">' + esc(w.c2) + '</h2><pre class="di-card" id="wg-c2" style="padding:12px 14px;overflow:auto;font-size:12.5px;white-space:pre-wrap;word-break:break-all">' + esc(c.iframe) + '</pre><button class="di-btn-sec" data-cp="iframe">' + esc(w.cp) + '</button>';
    h += '<h2 style="margin:26px 0 6px;font-size:16px">' + esc(w.nT) + '</h2><ul class="di-emp-p" style="padding-left:18px">' + w.n.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p><a class="di-btn-sec" href="informe-negociacion.html?p=' + encodeURIComponent(prod) + '">' + esc(w.rep) + '</a> <a class="di-btn-sec" href="condiciones.html">' + esc(w.terms) + '</a></p>';
    root.innerHTML = h; bind(w);
  }
  function bind(w) {
    function g(id) { return document.getElementById(id); }
    function upd() { ST.s = g('wg-s').value; ST.lang = g('wg-l').value; ST.org = g('wg-o').value.replace(/[<>]/g, ''); ST.c = g('wg-c').value.replace('#', '').toLowerCase(); ST.t = g('wg-t').value; ST.y = parseInt(g('wg-y').value, 10) || 3;
      var c = codes(); g('wg-pv').src = c.url; g('wg-c1').textContent = c.script; g('wg-c2').textContent = c.iframe; }
    ['wg-s', 'wg-l', 'wg-t', 'wg-y'].forEach(function (id) { g(id).addEventListener('change', upd); }); ['wg-o', 'wg-c'].forEach(function (id) { g(id).addEventListener('input', upd); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-cp]'), function (b) { b.addEventListener('click', function () {
      var txt = b.getAttribute('data-cp') === 'script' ? g('wg-c1').textContent : g('wg-c2').textContent, done = function () { var o = b.textContent; b.textContent = w.ok; setTimeout(function () { b.textContent = o; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { }); else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { } document.body.removeChild(ta); } }); });
  }
  window.addEventListener('message', function (e) { var f = document.getElementById('wg-pv'); if (f && e.source === f.contentWindow && e.data && e.data.type === 'dehesa-embed-height' && e.data.h > 0 && e.data.h < 2000) f.style.height = e.data.h + 'px'; });
  S.init('data');
  S.onLangChange = function () { ST.lang = null; render(); };
  render();
  fetch(S.sitePath('data/api/v1/index.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) {
    IDX = d; var m = /[?&]s=([a-z]{2}\/[a-z0-9_-]+)/.exec(location.search); ST.s = (m && d.series.some(function (x) { return x.id === m[1]; })) ? m[1] : (d.series.some(function (x) { return x.id === 'eu/trigo'; }) ? 'eu/trigo' : d.series[0].id); render();
  }).catch(function () { FAILED = true; render(); });
})();
