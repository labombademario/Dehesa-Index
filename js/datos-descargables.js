/* Dehesa Index — Datos descargables: lista data/pack/index.json (scripts/build-data-pack.py). Un CSV y un Excel por producto y mercado,
   con histórico, fuente, licencia y atribución en cada fila. Solo entran fuentes aptas para uso comercial (o aptas con condiciones). ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'Datos descargables', h1: 'Datos descargables (CSV y Excel)',
      sub: 'Un fichero por producto y mercado, con todo el histórico publicado. Cada fila lleva la fuente oficial, la licencia y el texto de atribución. Solo incluimos fuentes cuya licencia permite el uso comercial; si una fuente deja de permitirlo, su fichero desaparece de esta lista en la siguiente actualización.',
      loading: 'Cargando…', fail: 'No se pudo cargar la lista de ficheros. Vuelve a intentarlo en unos minutos.',
      kF: 'Ficheros', kR: 'Filas de datos', kM: 'Mercados', kD: 'Datos a fecha de',
      mkt: 'Mercado', all: 'Todos', q: 'Buscar producto o fuente', none: 'Ningún fichero con ese filtro.',
      cols: ['Producto', 'Mercado', 'Fuente', 'Uso comercial', 'Periodo', 'Descargar'], rows: 'filas',
      v: { apto: 'Apto', condiciones: 'Con condiciones' },
      M: { us: 'EE. UU.', eu: 'Unión Europea', uk: 'Reino Unido', ca: 'Canadá' },
      fmtT: 'Qué trae cada fichero',
      fmtP: ['Columnas: product_key, product, market, date, value, unit, currency, frequency, source, license, attribution. Las fechas van como AAAA-MM (mensual), AAAA-MM-DD (semanal o diario) o AAAA-Qn (trimestral).',
        'El Excel tiene una segunda hoja, «Fuente y licencia», con la descripción del dato, la URL de la fuente y de la licencia, las condiciones y el aviso legal.',
        'Los valores son los publicados por la fuente, sin estimar ni rellenar huecos. Si reutilizas los datos, cita la fuente con el texto de atribución de cada fila.',
        '«Con condiciones» significa que la licencia permite el uso comercial pero pide algo concreto (por ejemplo, citar un aviso o no alterar el sentido). Las condiciones de cada fuente están en la hoja del Excel y en la página de condiciones.'],
      legal: 'Esto no es asesoramiento jurídico: manda la licencia de cada fuente.', cond: 'Ver condiciones de uso comercial', cta: '¿Necesitas otro producto, otro formato o recibirlo de forma automática? Cuéntanos qué te hace falta.', ctaBtn: 'Escríbenos'
    },
    en: {
      title: 'Downloadable data', h1: 'Downloadable data (CSV and Excel)',
      sub: 'One file per product and market, with the full published history. Every row carries the official source, the licence and the attribution text. Only sources whose licence allows commercial use are included; if a source stops allowing it, its file disappears from this list at the next update.',
      loading: 'Loading…', fail: 'Could not load the file list. Please try again in a few minutes.',
      kF: 'Files', kR: 'Data rows', kM: 'Markets', kD: 'Data as of',
      mkt: 'Market', all: 'All', q: 'Search product or source', none: 'No file matches that filter.',
      cols: ['Product', 'Market', 'Source', 'Commercial use', 'Period', 'Download'], rows: 'rows',
      v: { apto: 'Fit', condiciones: 'With conditions' },
      M: { us: 'United States', eu: 'European Union', uk: 'United Kingdom', ca: 'Canada' },
      fmtT: 'What each file contains',
      fmtP: ['Columns: product_key, product, market, date, value, unit, currency, frequency, source, license, attribution. Dates are YYYY-MM (monthly), YYYY-MM-DD (weekly or daily) or YYYY-Qn (quarterly).',
        'The Excel file has a second sheet, “Fuente y licencia”, with the data description, the source and licence URLs, the conditions and the legal notice.',
        'Values are as published by the source, with no estimates and no gap filling. If you reuse the data, credit the source with the attribution text in each row.',
        '“With conditions” means the licence allows commercial use but asks for something specific (for example quoting a notice or not altering the meaning). Each source’s conditions are in the Excel sheet and on the terms page.'],
      legal: 'This is not legal advice: each source’s licence prevails.', cond: 'See commercial-use terms', cta: 'Need another product, another format or automatic delivery? Tell us what you need.', ctaBtn: 'Contact us'
    },
    fr: {
      title: 'Données téléchargeables', h1: 'Données téléchargeables (CSV et Excel)',
      sub: 'Un fichier par produit et par marché, avec tout l’historique publié. Chaque ligne porte la source officielle, la licence et le texte d’attribution. Seules les sources dont la licence autorise l’usage commercial sont incluses ; si une source ne l’autorise plus, son fichier disparaît de cette liste à la mise à jour suivante.',
      loading: 'Chargement…', fail: 'Impossible de charger la liste des fichiers. Réessayez dans quelques minutes.',
      kF: 'Fichiers', kR: 'Lignes de données', kM: 'Marchés', kD: 'Données au',
      mkt: 'Marché', all: 'Tous', q: 'Rechercher un produit ou une source', none: 'Aucun fichier avec ce filtre.',
      cols: ['Produit', 'Marché', 'Source', 'Usage commercial', 'Période', 'Télécharger'], rows: 'lignes',
      v: { apto: 'Apte', condiciones: 'Sous conditions' },
      M: { us: 'États-Unis', eu: 'Union européenne', uk: 'Royaume-Uni', ca: 'Canada' },
      fmtT: 'Contenu de chaque fichier',
      fmtP: ['Colonnes : product_key, product, market, date, value, unit, currency, frequency, source, license, attribution. Dates au format AAAA-MM (mensuel), AAAA-MM-JJ (hebdomadaire ou quotidien) ou AAAA-Qn (trimestriel).',
        'Le fichier Excel a une seconde feuille, « Fuente y licencia », avec la description de la donnée, les URL de la source et de la licence, les conditions et l’avertissement juridique.',
        'Les valeurs sont celles publiées par la source, sans estimation ni comblement des trous. En cas de réutilisation, citez la source avec le texte d’attribution de chaque ligne.',
        '« Sous conditions » signifie que la licence autorise l’usage commercial mais demande quelque chose de précis (citer une mention, ne pas dénaturer le sens…). Les conditions de chaque source figurent dans la feuille Excel et sur la page des conditions.'],
      legal: 'Ceci n’est pas un conseil juridique : la licence de chaque source prévaut.', cond: 'Voir les conditions d’usage commercial', cta: 'Besoin d’un autre produit, d’un autre format ou d’une livraison automatique ? Dites-nous ce qu’il vous faut.', ctaBtn: 'Nous écrire'
    },
    it: {
      title: 'Dati scaricabili', h1: 'Dati scaricabili (CSV ed Excel)',
      sub: 'Un file per prodotto e mercato, con tutto lo storico pubblicato. Ogni riga riporta la fonte ufficiale, la licenza e il testo di attribuzione. Includiamo solo fonti la cui licenza consente l’uso commerciale; se una fonte smette di consentirlo, il suo file sparisce da questo elenco al successivo aggiornamento.',
      loading: 'Caricamento…', fail: 'Impossibile caricare l’elenco dei file. Riprova tra qualche minuto.',
      kF: 'File', kR: 'Righe di dati', kM: 'Mercati', kD: 'Dati al',
      mkt: 'Mercato', all: 'Tutti', q: 'Cerca prodotto o fonte', none: 'Nessun file con questo filtro.',
      cols: ['Prodotto', 'Mercato', 'Fonte', 'Uso commerciale', 'Periodo', 'Scarica'], rows: 'righe',
      v: { apto: 'Idoneo', condiciones: 'Con condizioni' },
      M: { us: 'Stati Uniti', eu: 'Unione europea', uk: 'Regno Unito', ca: 'Canada' },
      fmtT: 'Cosa contiene ogni file',
      fmtP: ['Colonne: product_key, product, market, date, value, unit, currency, frequency, source, license, attribution. Le date sono AAAA-MM (mensile), AAAA-MM-GG (settimanale o giornaliero) o AAAA-Qn (trimestrale).',
        'Il file Excel ha un secondo foglio, «Fuente y licencia», con la descrizione del dato, gli URL della fonte e della licenza, le condizioni e l’avviso legale.',
        'I valori sono quelli pubblicati dalla fonte, senza stime né riempimento dei vuoti. Se riutilizzi i dati, cita la fonte con il testo di attribuzione di ogni riga.',
        '«Con condizioni» significa che la licenza consente l’uso commerciale ma chiede qualcosa di preciso (citare un avviso, non alterarne il senso…). Le condizioni di ogni fonte sono nel foglio Excel e nella pagina delle condizioni.'],
      legal: 'Questa non è consulenza legale: prevale la licenza di ogni fonte.', cond: 'Vedi le condizioni d’uso commerciale', cta: 'Ti serve un altro prodotto, un altro formato o la consegna automatica? Raccontaci di cosa hai bisogno.', ctaBtn: 'Scrivici'
    }
  };
  var DOC = null, FAILED = false, MKT = '', Q = '';
  function lang() { return S.getLang ? S.getLang() : 'es'; }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nf(n) { try { return Number(n).toLocaleString(lang()); } catch (e) { return String(n); } }
  function kb(b) { return b >= 1048576 ? (Math.round(b / 104857.6) / 10).toString().replace('.', lang() === 'en' ? '.' : ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function nm(o, k) { return (o && (o[lang()] || o.es)) || k || ''; }
  function card(k, v) { return '<div class="di-card" style="padding:12px 16px"><div style="font-size:12px;color:var(--text-muted)">' + esc(k) + '</div><div style="font-size:22px;font-weight:700;margin-top:2px">' + esc(v) + '</div></div>'; }
  function tableHtml(w) {
    var q = Q.toLowerCase();
    var rows = DOC.files.filter(function (f) {
      if (MKT && f.region !== MKT) return false;
      if (!q) return true;
      return (nm(f.name, f.product) + ' ' + f.product + ' ' + f.sourceName + ' ' + nm(f.place)).toLowerCase().indexOf(q) > -1;
    });
    if (!rows.length) return '<p class="di-movers-hint">' + esc(w.none) + '</p>';
    var th = 'padding:8px 6px;text-align:left;font-size:12px;color:var(--text-muted);font-weight:600';
    var h = '<div class="di-card" style="padding:4px 14px;overflow-x:auto"><table data-no-rows style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>' +
      w.cols.map(function (c) { return '<th style="' + th + '">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (f) {
      var vc = f.verdict === 'apto' ? '#17703f' : '#8f5f12';
      h += '<tr style="border-top:1px solid var(--border)">' +
        '<td style="padding:8px 6px;font-weight:600">' + esc(nm(f.name, f.product)) + '</td>' +
        '<td style="padding:8px 6px">' + esc(w.M[f.region] || f.region) + (nm(f.place) && nm(f.place) !== (w.M[f.region] || '') && nm(f.place) !== 'EE. UU.' && nm(f.place) !== 'UE' ? '<div style="font-size:11.5px;color:var(--text-muted)">' + esc(nm(f.place)) + '</div>' : '') + '</td>' +
        '<td style="padding:8px 6px;font-size:12.5px">' + esc(f.sourceName) + '</td>' +
        '<td style="padding:8px 6px"><span class="di-badge" style="background:' + vc + '1a;color:' + vc + '">' + esc(w.v[f.verdict] || f.verdict) + '</span></td>' +
        '<td style="padding:8px 6px;font-size:12.5px;white-space:nowrap">' + esc(f.first) + ' → ' + esc(f.last) + '<div style="font-size:11.5px;color:var(--text-muted)">' + nf(f.rows) + ' ' + esc(w.rows) + '</div></td>' +
        '<td style="padding:8px 6px;white-space:nowrap"><a href="' + esc(S.sitePath(f.csv)) + '" download style="font-weight:600;margin-right:12px">CSV · ' + kb(f.csvBytes) + '</a><a href="' + esc(S.sitePath(f.xlsx)) + '" download style="font-weight:600">Excel · ' + kb(f.xlsxBytes) + '</a></td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function render() {
    var w = t(), root = document.getElementById('dd-body'); if (!root) return;
    document.getElementById('dd-h1').textContent = w.h1; document.getElementById('dd-sub').textContent = w.sub; document.title = w.title + ' | Dehesa Index';
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!DOC) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    var mk = {}; DOC.files.forEach(function (f) { mk[f.region] = 1; });
    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px">' +
      card(w.kF, nf(DOC.summary.files)) + card(w.kR, nf(DOC.summary.rows)) + card(w.kM, String(Object.keys(mk).length)) + card(w.kD, S.fmtDate ? S.fmtDate(DOC.generatedAt) : DOC.generatedAt) + '</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px"><label style="font-size:13px">' + esc(w.mkt) + ' <select id="dd-m" class="di-compare-select" style="width:auto">' +
      '<option value="">' + esc(w.all) + '</option>' + ['us', 'eu', 'uk', 'ca'].filter(function (r) { return mk[r]; }).map(function (r) { return '<option value="' + r + '"' + (MKT === r ? ' selected' : '') + '>' + esc(w.M[r]) + '</option>'; }).join('') +
      '</select></label><input id="dd-q" type="search" class="di-compare-select" style="min-width:220px;width:auto" placeholder="' + esc(w.q) + '" aria-label="' + esc(w.q) + '" value="' + esc(Q) + '"></div>';
    h += '<div id="dd-table">' + tableHtml(w) + '</div>';
    h += '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(w.fmtT) + '</h2>' + w.fmtP.map(function (p) { return '<p class="di-emp-p">' + esc(p) + '</p>'; }).join('') +
      '<p class="di-movers-hint">' + esc(w.legal) + ' <a href="condiciones.html">' + esc(w.cond) + '</a></p>';
    h += '<section class="di-card di-emp-cta" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.cta) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.ctaBtn) + '</a></section>';
    root.innerHTML = h;
    document.getElementById('dd-m').onchange = function (e) { MKT = e.target.value; document.getElementById('dd-table').innerHTML = tableHtml(t()); };
    document.getElementById('dd-q').oninput = function (e) { Q = e.target.value; document.getElementById('dd-table').innerHTML = tableHtml(t()); };
  }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/pack/index.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) { DOC = d; render(); }).catch(function () { FAILED = true; render(); });
})();
