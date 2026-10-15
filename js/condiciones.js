/* Dehesa Index — Condiciones de uso comercial de los datos. Lee data/commercial-catalog.json, que se calcula del registro de licencias
   (scripts/build-commercial-catalog.py): qué fuentes y ficheros podrían ofrecerse a empresas y con qué condiciones. No es una oferta ni asesoramiento jurídico. ES5. */
(function () {
  'use strict';
  var S = window.DehesaShared;
  var T = {
    es: {
      title: 'Condiciones de uso comercial', h1: 'Condiciones de uso comercial de los datos',
      sub: 'Qué datos de Dehesa Index podrían ofrecerse a empresas, según la licencia de cada fuente oficial. Hoy no hay ninguna oferta comercial: esto es la lectura abierta del registro de licencias, para que cualquiera pueda comprobarla.',
      loading: 'Cargando…', fail: 'No se pudo cargar el catálogo comercial. Vuelve a intentarlo en unos minutos.',
      cSrc: 'Fuentes aptas', cSrcD: 'Uso comercial, derivados y redistribución permitidos.', cCon: 'Aptas con condiciones', cConD: 'Hay condiciones que cumplir (se citan una a una).', cNo: 'Fuentes no aptas', cNoD: 'Licencia pendiente o sin confirmar: quedan fuera de cualquier oferta de pago.',
      files: 'Ficheros de datos', filesD: '{a} aptos · {c} con condiciones · {p} parciales · {n} no aptos',
      how: 'Cómo se decide', howSub: 'Reglas y límites de esta lectura',
      howP: ['Cada fuente tiene en el registro de licencias tres permisos: uso comercial, obras derivadas y redistribución. Una fuente es apta si los tres están concedidos de forma expresa y la licencia está verificada.',
        'Es apta con condiciones si no hay ningún permiso negado ni sin confirmar, pero alguno depende de condiciones (marcar los datos modificados, no cobrar un extra por ellos, citar un aviso concreto…). Esas condiciones se muestran tal cual en la tabla de fuentes.',
        'No es apta si la licencia está pendiente, restringida o bloqueada, o si algún permiso está negado o sin confirmar. Nunca damos por bueno un permiso que no consta.',
        'Un fichero es apto si todas sus fuentes lo son. Si mezcla fuentes aptas y no aptas, es parcial: solo se podría ofrecer filtrando por fuente. Los ficheros que calcula Dehesa Index (derivados) quedan fuera hasta que se declare de qué fuentes salen.',
        'Esto no es asesoramiento jurídico ni una oferta de venta. Las licencias pueden cambiar y se revisan periódicamente; la fecha de la última generación figura abajo.'],
      srcT: 'Fuentes', srcSub: 'Licencia, permisos, atribución y condiciones de cada fuente', filt: 'Veredicto', all: 'Todos', q: 'Buscar', more: 'Ver más', shown: 'Mostrando {n} de {t}',
      sCols: ['Fuente', 'Licencia', 'Veredicto', 'Atribución que se muestra', 'Condiciones'], none: 'Nada que mostrar con ese filtro.',
      dsT: 'Ficheros de datos', dsSub: 'Veredicto de cada fichero o carpeta de datos publicado', dCols: ['Fichero', 'Veredicto', 'Fuentes', 'Notas'],
      dnOnly: 'Solo filtrando por fuente. Aptas: {a}. Excluidas: {x}.', dnRev: 'Revisar antes de cobrar las condiciones de: {r}.', dnExc: 'Excluidas: {x}.', dnDer: 'Se calcula en Dehesa Index; falta declarar de qué fuentes sale.',
      v: { apto: 'Apto', condiciones: 'Con condiciones', 'no-apto': 'No apto', parcial: 'Parcial', derivado: 'Derivado' },
      perm: { yes: 'sí', no: 'no', conditional: 'condicionado', unclear: 'sin confirmar' }, permT: 'Uso comercial / derivados / redistribución',
      conf: 'Confianza jurídica', owner: 'Dado por válido por el propietario del sitio (15-oct-2026); estas condiciones se mantienen.', gen: 'Generado el {d}', contact: '¿Quieres usar estos datos con fines comerciales? Cuéntanos qué necesitas.', contactBtn: 'Ir a Empresas'
    },
    en: {
      title: 'Commercial use terms', h1: 'Commercial-use terms for the data',
      sub: 'Which Dehesa Index data could be offered to businesses, based on the licence of each official source. There is no commercial offer today: this is an open reading of our licence registry so anyone can check it.',
      loading: 'Loading…', fail: 'Could not load the commercial catalogue. Please try again in a few minutes.',
      cSrc: 'Fit sources', cSrcD: 'Commercial use, derivatives and redistribution allowed.', cCon: 'Fit with conditions', cConD: 'There are conditions to meet (quoted one by one).', cNo: 'Sources not fit', cNoD: 'Licence pending or unconfirmed: left out of any paid offer.',
      files: 'Data files', filesD: '{a} fit · {c} with conditions · {p} partial · {n} not fit',
      how: 'How it is decided', howSub: 'Rules and limits of this reading',
      howP: ['Each source has three permissions in the licence registry: commercial use, derivative works and redistribution. A source is fit if all three are expressly granted and the licence is verified.',
        'It is fit with conditions if no permission is denied or unconfirmed but some depend on conditions (flagging modified data, not charging extra for it, quoting a specific notice…). The conditions are shown verbatim in the sources table.',
        'It is not fit if the licence is pending, restricted or blocked, or if any permission is denied or unconfirmed. We never assume a permission that is not on record.',
        'A file is fit if all its sources are. If it mixes fit and unfit sources it is partial: it could only be offered filtered by source. Files computed by Dehesa Index (derived) stay out until we declare which sources they come from.',
        'This is not legal advice or a sales offer. Licences can change and are reviewed regularly; the generation date is shown below.'],
      srcT: 'Sources', srcSub: 'Licence, permissions, attribution and conditions of each source', filt: 'Verdict', all: 'All', q: 'Search', more: 'Show more', shown: 'Showing {n} of {t}',
      sCols: ['Source', 'Licence', 'Verdict', 'Attribution shown', 'Conditions'], none: 'Nothing to show with that filter.',
      dsT: 'Data files', dsSub: 'Verdict for each published data file or folder', dCols: ['File', 'Verdict', 'Sources', 'Notes'],
      dnOnly: 'Only when filtered by source. Fit: {a}. Excluded: {x}.', dnRev: 'Check the conditions of {r} before charging.', dnExc: 'Excluded: {x}.', dnDer: 'Computed by Dehesa Index; the sources it comes from are not yet declared.',
      v: { apto: 'Fit', condiciones: 'With conditions', 'no-apto': 'Not fit', parcial: 'Partial', derivado: 'Derived' },
      perm: { yes: 'yes', no: 'no', conditional: 'conditional', unclear: 'unconfirmed' }, permT: 'Commercial use / derivatives / redistribution',
      conf: 'Legal confidence', owner: 'Accepted by the site owner (15 Oct 2026); these conditions still apply.', gen: 'Generated {d}', contact: 'Want to use this data commercially? Tell us what you need.', contactBtn: 'Go to Business'
    },
    fr: {
      title: 'Conditions d’usage commercial', h1: 'Conditions d’usage commercial des données',
      sub: 'Quelles données de Dehesa Index pourraient être proposées aux entreprises, selon la licence de chaque source officielle. Il n’y a aucune offre commerciale aujourd’hui : c’est une lecture ouverte de notre registre de licences, que chacun peut vérifier.',
      loading: 'Chargement…', fail: 'Impossible de charger le catalogue commercial. Réessayez dans quelques minutes.',
      cSrc: 'Sources aptes', cSrcD: 'Usage commercial, œuvres dérivées et redistribution autorisés.', cCon: 'Aptes sous conditions', cConD: 'Des conditions sont à respecter (citées une à une).', cNo: 'Sources non aptes', cNoD: 'Licence en attente ou non confirmée : hors de toute offre payante.',
      files: 'Fichiers de données', filesD: '{a} aptes · {c} sous conditions · {p} partiels · {n} non aptes',
      how: 'Comment on décide', howSub: 'Règles et limites de cette lecture',
      howP: ['Chaque source a trois permissions dans le registre de licences : usage commercial, œuvres dérivées et redistribution. Une source est apte si les trois sont expressément accordées et la licence vérifiée.',
        'Elle est apte sous conditions si aucune permission n’est refusée ni non confirmée mais certaines dépendent de conditions (signaler les données modifiées, ne pas facturer de supplément, citer une mention précise…). Ces conditions figurent telles quelles dans le tableau des sources.',
        'Elle n’est pas apte si la licence est en attente, restreinte ou bloquée, ou si une permission est refusée ou non confirmée. Nous ne présumons jamais une permission qui n’est pas établie.',
        'Un fichier est apte si toutes ses sources le sont. S’il mêle sources aptes et non aptes, il est partiel : il ne pourrait être proposé qu’en filtrant par source. Les fichiers calculés par Dehesa Index (dérivés) restent exclus tant que leurs sources ne sont pas déclarées.',
        'Ceci n’est ni un conseil juridique ni une offre de vente. Les licences peuvent changer et sont revues régulièrement ; la date de génération figure ci-dessous.'],
      srcT: 'Sources', srcSub: 'Licence, permissions, attribution et conditions de chaque source', filt: 'Verdict', all: 'Tous', q: 'Rechercher', more: 'Voir plus', shown: '{n} sur {t}',
      sCols: ['Source', 'Licence', 'Verdict', 'Attribution affichée', 'Conditions'], none: 'Rien à afficher avec ce filtre.',
      dsT: 'Fichiers de données', dsSub: 'Verdict de chaque fichier ou dossier de données publié', dCols: ['Fichier', 'Verdict', 'Sources', 'Notes'],
      dnOnly: 'Seulement en filtrant par source. Aptes : {a}. Exclues : {x}.', dnRev: 'Vérifier avant de facturer les conditions de : {r}.', dnExc: 'Exclues : {x}.', dnDer: 'Calculé par Dehesa Index ; ses sources ne sont pas encore déclarées.',
      v: { apto: 'Apte', condiciones: 'Sous conditions', 'no-apto': 'Non apte', parcial: 'Partiel', derivado: 'Dérivé' },
      perm: { yes: 'oui', no: 'non', conditional: 'conditionné', unclear: 'non confirmé' }, permT: 'Usage commercial / dérivés / redistribution',
      conf: 'Confiance juridique', owner: 'Validé par le propriétaire du site (15 oct. 2026) ; ces conditions restent applicables.', gen: 'Généré le {d}', contact: 'Vous voulez utiliser ces données à des fins commerciales ? Dites-nous ce qu’il vous faut.', contactBtn: 'Aller à Entreprises'
    },
    it: {
      title: 'Condizioni d’uso commerciale', h1: 'Condizioni d’uso commerciale dei dati',
      sub: 'Quali dati di Dehesa Index potrebbero essere offerti alle aziende, in base alla licenza di ogni fonte ufficiale. Oggi non c’è alcuna offerta commerciale: è una lettura aperta del nostro registro delle licenze, verificabile da chiunque.',
      loading: 'Caricamento…', fail: 'Impossibile caricare il catalogo commerciale. Riprova tra qualche minuto.',
      cSrc: 'Fonti idonee', cSrcD: 'Uso commerciale, opere derivate e ridistribuzione consentiti.', cCon: 'Idonee con condizioni', cConD: 'Ci sono condizioni da rispettare (citate una per una).', cNo: 'Fonti non idonee', cNoD: 'Licenza in sospeso o non confermata: fuori da qualsiasi offerta a pagamento.',
      files: 'File di dati', filesD: '{a} idonei · {c} con condizioni · {p} parziali · {n} non idonei',
      how: 'Come si decide', howSub: 'Regole e limiti di questa lettura',
      howP: ['Ogni fonte ha tre permessi nel registro delle licenze: uso commerciale, opere derivate e ridistribuzione. Una fonte è idonea se tutti e tre sono concessi espressamente e la licenza è verificata.',
        'È idonea con condizioni se nessun permesso è negato o non confermato ma alcuni dipendono da condizioni (segnalare i dati modificati, non addebitare extra, citare un avviso preciso…). Le condizioni compaiono testualmente nella tabella delle fonti.',
        'Non è idonea se la licenza è in sospeso, limitata o bloccata, o se un permesso è negato o non confermato. Non diamo mai per buono un permesso che non risulta.',
        'Un file è idoneo se lo sono tutte le sue fonti. Se mescola fonti idonee e non idonee è parziale: si potrebbe offrire solo filtrando per fonte. I file calcolati da Dehesa Index (derivati) restano esclusi finché non si dichiara da quali fonti provengono.',
        'Questo non è un parere legale né un’offerta di vendita. Le licenze possono cambiare e sono riviste periodicamente; la data di generazione è indicata sotto.'],
      srcT: 'Fonti', srcSub: 'Licenza, permessi, attribuzione e condizioni di ogni fonte', filt: 'Verdetto', all: 'Tutti', q: 'Cerca', more: 'Mostra altro', shown: '{n} di {t}',
      sCols: ['Fonte', 'Licenza', 'Verdetto', 'Attribuzione mostrata', 'Condizioni'], none: 'Niente da mostrare con questo filtro.',
      dsT: 'File di dati', dsSub: 'Verdetto di ogni file o cartella di dati pubblicato', dCols: ['File', 'Verdetto', 'Fonti', 'Note'],
      dnOnly: 'Solo filtrando per fonte. Idonee: {a}. Escluse: {x}.', dnRev: 'Controllare prima di addebitare le condizioni di: {r}.', dnExc: 'Escluse: {x}.', dnDer: 'Calcolato da Dehesa Index; le fonti di origine non sono ancora dichiarate.',
      v: { apto: 'Idoneo', condiciones: 'Con condizioni', 'no-apto': 'Non idoneo', parcial: 'Parziale', derivado: 'Derivato' },
      perm: { yes: 'sì', no: 'no', conditional: 'condizionato', unclear: 'non confermato' }, permT: 'Uso commerciale / derivati / ridistribuzione',
      conf: 'Affidabilità giuridica', owner: 'Accettata dal proprietario del sito (15 ott. 2026); queste condizioni restano valide.', gen: 'Generato il {d}', contact: 'Vuoi usare questi dati a fini commerciali? Dicci di cosa hai bisogno.', contactBtn: 'Vai ad Aziende'
    }
  };
  var DOC = null, FAILED = false, SRC_Q = '', SRC_V = 'all', SRC_LIM = 40, DS_Q = '', DS_V = 'all', DS_LIM = 40, OPEN = {};
  var COLOR = { apto: '#2f7d4f', condiciones: '#a9741f', 'no-apto': '#b0382f', parcial: '#a9741f', derivado: '#6b6b6b' };
  function lang() { return S.getLang(); }
  function t() { return T[lang()] || T.es; }
  function esc(x) { return S.esc(x == null ? '' : String(x)); }
  function url(u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; }
  function link(u, label) { var h = url(u); return h ? '<a href="' + esc(h) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>' : esc(label); }
  function chip(v) { return '<span style="display:inline-block;padding:1px 8px;border-radius:10px;border:1px solid ' + COLOR[v] + ';color:' + COLOR[v] + ';font-size:11.5px;font-weight:700;white-space:nowrap">' + esc(t().v[v] || v) + '</span>'; }
  function table(cols, rows) {
    return '<div class="di-table-wrap" style="overflow-x:auto"><table class="di-table" data-no-cards data-no-rows style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr>' + cols.map(function (c) {
      return '<th style="text-align:left;padding:6px 8px;white-space:nowrap">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  function td(x, raw) { return '<td style="padding:6px 8px;border-top:1px solid var(--border);vertical-align:top">' + (raw ? x : esc(x)) + '</td>'; }
  function fold(id, title, sub, body) {
    return '<details class="di-fold di-card" data-id="' + id + '"' + (OPEN[id] ? ' open' : '') + ' style="padding:14px 16px;margin:0 0 12px"><summary><h2 style="font-size:17px;margin:0">' + esc(title) + '</h2><p class="di-movers-hint" style="margin:3px 0 0">' + esc(sub) + '</p></summary>' + body + '</details>';
  }
  function card(label, value, note, color) {
    return '<div class="di-card cof-card" style="padding:14px 16px"><div class="cof-lbl">' + esc(label) + '</div><div class="cof-val"' + (color ? ' style="color:' + color + '"' : '') + '>' + esc(value) + '</div><div class="cof-note">' + esc(note) + '</div></div>';
  }
  function names(ids, M, max) {
    var n = (ids || []).map(function (i) { return M[i] ? M[i].name : i; });
    return n.length > max ? n.slice(0, max).join(', ') + ' +' + (n.length - max) : n.join(', ');
  }
  function sourcesBody(w) {
    var M = {}, i; for (i = 0; i < DOC.sources.length; i++) M[DOC.sources[i].id] = DOC.sources[i];
    var R = DOC.sources.filter(function (s) {
      return (SRC_V === 'all' || s.verdict === SRC_V) && (!SRC_Q || (s.name + ' ' + s.id + ' ' + s.licenseName + ' ' + s.country).toLowerCase().indexOf(SRC_Q) > -1);
    });
    var sel = '<select id="cc-sv" class="di-compare-select" aria-label="' + esc(w.filt) + '"><option value="all">' + esc(w.filt + ': ' + w.all) + '</option>' + ['apto', 'condiciones', 'no-apto'].map(function (k) {
      return '<option value="' + k + '"' + (SRC_V === k ? ' selected' : '') + '>' + esc(w.v[k]) + '</option>'; }).join('') + '</select>';
    var inp = '<input type="search" id="cc-sq" class="di-compare-select" aria-label="' + esc(w.q) + '" placeholder="' + esc(w.q) + '" value="' + esc(SRC_Q) + '" style="min-width:200px">';
    var rows = R.slice(0, SRC_LIM).map(function (s) {
      var p = [s.commercialUse, s.derivatives, s.redistribution].map(function (x) { return w.perm[x] || x; }).join(' / ');
      return '<tr>' + td(link(s.url, s.name) + '<div class="di-movers-hint" style="margin:2px 0 0">' + esc(s.country) + '</div>', 1) +
        td(link(s.licenseUrl, s.licenseName) + '<div class="di-movers-hint" style="margin:2px 0 0" title="' + esc(w.permT) + '">' + esc(p) + ' · ' + esc(w.conf + ': ' + s.legalConfidence) + '</div>', 1) +
        td(chip(s.verdict) + (s.why ? '<div class="di-movers-hint" style="margin:2px 0 0">' + esc(s.why) + '</div>' : ''), 1) + td(s.attribution || '—') + td((s.conditions || '—') + (s.ownerDecision ? ' ' + w.owner : '')) + '</tr>';
    });
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px">' + sel + inp + '</div>' + (R.length ? table(w.sCols, rows) : '<p class="di-movers-hint">' + esc(w.none) + '</p>') +
      '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(w.shown.replace('{n}', Math.min(SRC_LIM, R.length)).replace('{t}', R.length)) + (R.length > SRC_LIM ? ' <button type="button" class="di-link-btn" id="cc-smore">' + esc(w.more) + '</button>' : '') + '</p>';
  }
  function datasetsBody(w) {
    var M = {}, i; for (i = 0; i < DOC.sources.length; i++) M[DOC.sources[i].id] = DOC.sources[i];
    var all = DOC.datasets.concat(DOC.derived);
    var R = all.filter(function (d) { return (DS_V === 'all' || d.verdict === DS_V) && (!DS_Q || d.path.toLowerCase().indexOf(DS_Q) > -1); });
    var sel = '<select id="cc-dv" class="di-compare-select" aria-label="' + esc(w.filt) + '"><option value="all">' + esc(w.filt + ': ' + w.all) + '</option>' + ['apto', 'condiciones', 'parcial', 'no-apto', 'derivado'].map(function (k) {
      return '<option value="' + k + '"' + (DS_V === k ? ' selected' : '') + '>' + esc(w.v[k]) + '</option>'; }).join('') + '</select>';
    var inp = '<input type="search" id="cc-dq" class="di-compare-select" aria-label="' + esc(w.q) + '" placeholder="' + esc(w.q) + '" value="' + esc(DS_Q) + '" style="min-width:200px">';
    var rows = R.slice(0, DS_LIM).map(function (d) {
      var note = [];
      if (d.verdict === 'parcial') note.push(w.dnOnly.replace('{a}', names(d.commercialSources, M, 4)).replace('{x}', names(d.excludedSources, M, 4)));
      else if (d.excludedSources && d.excludedSources.length) note.push(w.dnExc.replace('{x}', names(d.excludedSources, M, 4)));
      if (d.reviewBeforeSelling && d.reviewBeforeSelling.length) note.push(w.dnRev.replace('{r}', names(d.reviewBeforeSelling, M, 4)));
      if (d.verdict === 'derivado') note.push(w.dnDer);
      return '<tr>' + td('<code>' + esc(d.path) + '</code>', 1) + td(chip(d.verdict), 1) + td(d.sources ? names(d.sources, M, 3) || '—' : '—') + td(note.join(' ') || '—') + '</tr>';
    });
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px">' + sel + inp + '</div>' + (R.length ? table(w.dCols, rows) : '<p class="di-movers-hint">' + esc(w.none) + '</p>') +
      '<p class="di-movers-hint" style="margin:6px 0 0">' + esc(w.shown.replace('{n}', Math.min(DS_LIM, R.length)).replace('{t}', R.length)) + (R.length > DS_LIM ? ' <button type="button" class="di-link-btn" id="cc-dmore">' + esc(w.more) + '</button>' : '') + '</p>';
  }
  function render() {
    var w = t(), root = document.getElementById('cc-body');
    document.title = w.title + ' | Dehesa Index';
    document.getElementById('cc-h1').textContent = w.h1; document.getElementById('cc-sub').textContent = w.sub;
    if (FAILED) { root.innerHTML = '<p>' + esc(w.fail) + '</p>'; return; }
    if (!DOC) { root.innerHTML = '<p class="di-movers-hint">' + esc(w.loading) + '</p>'; return; }
    var m = DOC.summary, h = '';
    h += '<div class="cof-cards" style="margin:0 0 16px">' + card(w.cSrc, m.sourcesApto + ' / ' + m.sources, w.cSrcD, COLOR.apto) + card(w.cCon, String(m.sourcesCondiciones), w.cConD, COLOR.condiciones) +
      card(w.cNo, String(m.sourcesNoApto), w.cNoD, COLOR['no-apto']) +
      card(w.files, String(m.datasets + m.derived), w.filesD.replace('{a}', m.datasets_apto).replace('{c}', m.datasets_condiciones).replace('{p}', m.datasets_parcial).replace('{n}', m['datasets_no-apto']) + ' · ' + w.v.derivado + ': ' + m.derived) + '</div>';
    h += fold('how', w.how, w.howSub, w.howP.map(function (p) { return '<p class="di-emp-p">' + esc(p) + '</p>'; }).join(''));
    h += fold('src', w.srcT, w.srcSub, '<div id="cc-src">' + sourcesBody(w) + '</div>');
    h += fold('ds', w.dsT, w.dsSub, '<div id="cc-ds">' + datasetsBody(w) + '</div>');
    h += '<p class="di-movers-hint">' + esc(w.gen.replace('{d}', S.fmtDate ? S.fmtDate(String(DOC.generatedAt || '').slice(0, 10)) : String(DOC.generatedAt || '').slice(0, 10))) + '</p>';
    h += '<section class="di-card di-emp-cta" style="margin-top:16px"><p class="di-emp-cta-body" style="margin:0 0 12px">' + esc(w.contact) + '</p><a class="di-btn-gold-solid" href="empresas.html#contacto">' + esc(w.contactBtn) + '</a></section>';
    root.innerHTML = h;
    wire();
  }
  function rerender(which) {
    var w = t();
    if (which === 'src') { document.getElementById('cc-src').innerHTML = sourcesBody(w); }
    else { document.getElementById('cc-ds').innerHTML = datasetsBody(w); }
    wire(which);
  }
  function refocus(id, pos) { var n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } }
  function wire(only) {
    var els = document.querySelectorAll('#cc-body details.di-fold'), i;
    for (i = 0; i < els.length; i++) (function (d) { d.ontoggle = function () { OPEN[d.getAttribute('data-id')] = d.open; }; })(els[i]);
    var a;
    if (only !== 'ds') {
      a = document.getElementById('cc-sv'); if (a) a.onchange = function () { SRC_V = a.value; SRC_LIM = 40; rerender('src'); };
      a = document.getElementById('cc-sq'); if (a) a.oninput = function () { SRC_Q = a.value.toLowerCase(); SRC_LIM = 40; var p = a.selectionStart; rerender('src'); refocus('cc-sq', p); };
      a = document.getElementById('cc-smore'); if (a) a.onclick = function () { SRC_LIM += 80; rerender('src'); };
    }
    if (only !== 'src') {
      a = document.getElementById('cc-dv'); if (a) a.onchange = function () { DS_V = a.value; DS_LIM = 40; rerender('ds'); };
      a = document.getElementById('cc-dq'); if (a) a.oninput = function () { DS_Q = a.value.toLowerCase(); DS_LIM = 40; var p = a.selectionStart; rerender('ds'); refocus('cc-dq', p); };
      a = document.getElementById('cc-dmore'); if (a) a.onclick = function () { DS_LIM += 80; rerender('ds'); };
    }
  }
  S.init('data');
  S.onLangChange = render;
  render();
  fetch(S.sitePath('data/commercial-catalog.json'), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (d) { DOC = d; render(); }).catch(function () { FAILED = true; render(); });
})();
