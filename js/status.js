/* Dehesa Index — Estado de los datos: lee data/pipeline-status.json y data/data-quality.json. ES5. */
(function () {
  'use strict';
  var T = {
    es: { title: 'Estado de los datos', sub: 'Cada fuente se actualiza con un proceso automático. Aquí se ve cuándo se ejecutó por última vez, si terminó bien, cuándo toca la siguiente y si los datos pasaron las comprobaciones antes de publicarse.',
      all: 'Procesos', ok: 'Correctos', late: 'Con retraso', error: 'Con error', not_run: 'Aún sin ejecutar', unknown: 'Sin información', filter: 'Mostrar', fall: 'Todos', fprob: 'Solo con problemas',
      proc: 'Proceso', stat: 'Estado', last: 'Última ejecución', next: 'Próxima', dur: 'Duración', rec: 'Últimas 10', files: 'Datos que escribe', change: 'último cambio', valid: 'validación',
      s: { ok: 'Correcto', late: 'Retraso', error: 'Error', not_run: 'Sin ejecutar', unknown: 'Sin datos' }, v: { ok: 'válido', warning: 'avisos', error: 'inválido' },
      upd: 'Estado generado', never: 'sin ejecuciones recientes', sec: 's', min: 'min', series: 'series', lines: 'líneas', run: 'Ver ejecución',
      qtitle: 'Comprobaciones de datos', qtxt: 'Antes de guardar un fichero se comprueba su estructura (contrato de esquema) y su contenido: sin valores no numéricos, sin fechas futuras, series ordenadas y sin periodos repetidos, periodo coherente con la frecuencia, último valor igual al último punto y saltos extremos señalados. Si falla, el cambio se descarta y se conserva el dato anterior.',
      qfiles: 'Ficheros comprobados', qerr: 'Con errores', qwarn: 'Con avisos', warns: 'Avisos', none: 'Ninguno', ago: 'hace', h: 'h', d: 'd', in_: 'en', now: 'ahora' },
    en: { title: 'Data status', sub: 'Each source is refreshed by an automated job. This page shows when it last ran, whether it succeeded, when the next run is due and whether the data passed checks before publishing.',
      all: 'Jobs', ok: 'Healthy', late: 'Late', error: 'Failing', not_run: 'Not run yet', unknown: 'No information', filter: 'Show', fall: 'All', fprob: 'Only with problems',
      proc: 'Job', stat: 'Status', last: 'Last run', next: 'Next', dur: 'Duration', rec: 'Last 10', files: 'Data it writes', change: 'last change', valid: 'validation',
      s: { ok: 'OK', late: 'Late', error: 'Error', not_run: 'Not run', unknown: 'No data' }, v: { ok: 'valid', warning: 'warnings', error: 'invalid' },
      upd: 'Status generated', never: 'no recent runs', sec: 's', min: 'min', series: 'series', lines: 'lines', run: 'View run',
      qtitle: 'Data checks', qtxt: 'Before a file is saved its structure (schema contract) and content are checked: no non-numeric values, no future dates, sorted series without repeated periods, period consistent with frequency, latest value equal to the last point, extreme jumps flagged. If a check fails, the change is discarded and the previous data is kept.',
      qfiles: 'Files checked', qerr: 'With errors', qwarn: 'With warnings', warns: 'Warnings', none: 'None', ago: '', h: 'h ago', d: 'd ago', in_: 'in', now: 'now' },
    fr: { title: 'État des données', sub: 'Chaque source est actualisée par un processus automatique. Cette page indique la dernière exécution, son résultat, la prochaine échéance et si les données ont passé les contrôles avant publication.',
      all: 'Processus', ok: 'Corrects', late: 'En retard', error: 'En erreur', not_run: 'Pas encore exécuté', unknown: 'Sans information', filter: 'Afficher', fall: 'Tous', fprob: 'Seulement les problèmes',
      proc: 'Processus', stat: 'État', last: 'Dernière exécution', next: 'Prochaine', dur: 'Durée', rec: '10 dernières', files: 'Données écrites', change: 'dernier changement', valid: 'validation',
      s: { ok: 'Correct', late: 'Retard', error: 'Erreur', not_run: 'Pas exécuté', unknown: 'Sans données' }, v: { ok: 'valide', warning: 'avertissements', error: 'invalide' },
      upd: 'État généré', never: 'aucune exécution récente', sec: 's', min: 'min', series: 'séries', lines: 'lignes', run: 'Voir l’exécution',
      qtitle: 'Contrôles des données', qtxt: 'Avant d’enregistrer un fichier, on vérifie sa structure (contrat de schéma) et son contenu : pas de valeurs non numériques, pas de dates futures, séries triées sans périodes répétées, période cohérente avec la fréquence, dernière valeur égale au dernier point, sauts extrêmes signalés. En cas d’échec, la modification est écartée et la donnée précédente est conservée.',
      qfiles: 'Fichiers contrôlés', qerr: 'Avec erreurs', qwarn: 'Avec avertissements', warns: 'Avertissements', none: 'Aucun', ago: 'il y a', h: 'h', d: 'j', in_: 'dans', now: 'maintenant' },
    it: { title: 'Stato dei dati', sub: 'Ogni fonte è aggiornata da un processo automatico. Qui si vede l’ultima esecuzione, l’esito, la prossima scadenza e se i dati hanno superato i controlli prima della pubblicazione.',
      all: 'Processi', ok: 'Corretti', late: 'In ritardo', error: 'In errore', not_run: 'Non ancora eseguito', unknown: 'Senza informazioni', filter: 'Mostra', fall: 'Tutti', fprob: 'Solo con problemi',
      proc: 'Processo', stat: 'Stato', last: 'Ultima esecuzione', next: 'Prossima', dur: 'Durata', rec: 'Ultime 10', files: 'Dati scritti', change: 'ultima modifica', valid: 'validazione',
      s: { ok: 'Corretto', late: 'Ritardo', error: 'Errore', not_run: 'Non eseguito', unknown: 'Senza dati' }, v: { ok: 'valido', warning: 'avvisi', error: 'non valido' },
      upd: 'Stato generato', never: 'nessuna esecuzione recente', sec: 's', min: 'min', series: 'serie', lines: 'righe', run: 'Vedi esecuzione',
      qtitle: 'Controlli sui dati', qtxt: 'Prima di salvare un file se ne verificano struttura (contratto di schema) e contenuto: nessun valore non numerico, nessuna data futura, serie ordinate senza periodi ripetuti, periodo coerente con la frequenza, ultimo valore uguale all’ultimo punto, salti estremi segnalati. Se il controllo fallisce, la modifica è scartata e si conserva il dato precedente.',
      qfiles: 'File controllati', qerr: 'Con errori', qwarn: 'Con avvisi', warns: 'Avvisi', none: 'Nessuno', ago: '', h: 'h fa', d: 'g fa', in_: 'tra', now: 'ora' }
  };
  var COL = { ok: '#17703f', late: '#8f5f12', error: '#c0392b', not_run: '#6b7fa3', unknown: '#666666' };
  var P = null, Q = null, FR = null, only = false;
  function lang() { return window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; }
  function tt() { return T[lang()] || T.es; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function when(iso, future) {
    if (!iso) return '–'; var t = tt(), ms = new Date(iso).getTime() - Date.now(), h = Math.abs(ms) / 36e5, v = h < 48 ? Math.round(h) + ' ' + (lang() === 'es' || lang() === 'fr' || lang() === 'it' ? 'h' : 'h') : Math.round(h / 24) + ' ' + (lang() === 'fr' || lang() === 'it' ? (lang() === 'fr' ? 'j' : 'g') : 'd');
    if (h < 0.75) return t.now;
    var l = lang();
    if (ms > 0) return t.in_ + ' ' + v;
    return l === 'en' ? v + ' ago' : (l === 'es' ? 'hace ' + v : (l === 'fr' ? 'il y a ' + v : v + ' fa'));
  }
  function dur(s) { var t = tt(); if (s == null) return '–'; return s < 90 ? s + ' ' + t.sec : Math.round(s / 60) + ' ' + t.min; }
  function nf(n) { try { return Number(n).toLocaleString(lang()); } catch (e) { return String(n); } }
  function render() {
    var t = tt(), root = document.getElementById('status-body'); if (!root) return;
    document.getElementById('st-h1').textContent = t.title; document.getElementById('st-sub').textContent = t.sub; document.title = 'Dehesa Index — ' + t.title;
    if (!P) { root.innerHTML = ''; return; }
    var sm = P.summary, h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:10px">';
    h += '<div class="di-card" style="padding:12px 16px"><div style="font-size:11px;font-weight:700;color:var(--text-faint)">' + esc(t.all).toUpperCase() + '</div><div style="font-size:26px;font-weight:700">' + P.pipelines.length + '</div></div>';
    ['ok', 'late', 'error', 'not_run', 'unknown'].filter(function (k) { return k === 'ok' || k === 'late' || k === 'error' || sm[k]; }).forEach(function (k) { h += '<div class="di-card" style="padding:12px 16px;border-left:4px solid ' + COL[k] + '"><div style="font-size:11px;font-weight:700;color:' + COL[k] + '">' + esc(t[k]).toUpperCase() + '</div><div style="font-size:26px;font-weight:700">' + (sm[k] || 0) + '</div></div>'; });
    h += '</div><div style="font-size:12px;color:var(--text-faint);margin-bottom:12px">' + esc(t.upd) + ': ' + esc(when(P.generatedAt)) + ' · <label style="cursor:pointer"><input type="checkbox" id="st-only"' + (only ? ' checked' : '') + '> ' + esc(t.fprob) + '</label></div>';
    var th = 'padding:8px 6px;text-align:left';
    h += '<div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:820px;font-size:13px"><thead><tr style="font-size:10.5px;font-weight:700;letter-spacing:.4px;color:var(--text-faint)"><th style="' + th + '">' + esc(t.proc).toUpperCase() + '</th><th style="' + th + '">' + esc(t.stat).toUpperCase() + '</th><th style="' + th + '">' + esc(t.last).toUpperCase() + '</th><th style="' + th + '">' + esc(t.next).toUpperCase() + '</th><th style="' + th + '">' + esc(t.dur).toUpperCase() + '</th><th style="' + th + '">' + esc(t.rec).toUpperCase() + '</th><th style="' + th + '">' + esc(t.files).toUpperCase() + '</th></tr></thead><tbody>';
    P.pipelines.forEach(function (p) {
      if (only && p.status === 'ok') return;
      var l = p.last, f = (p.files || []).filter(function (x) { return /\.json$/.test(x.path); }).slice(0, 4);
      var fs = f.map(function (x) {
        var bits = [x.path.replace(/^data\//, '')];
        if (x.series) bits.push(nf(x.series) + ' ' + t.series); else if (x.lines) bits.push(nf(x.lines) + ' ' + t.lines);
        if (x.lastChange) bits.push(t.change + ' ' + when(x.lastChange));
        var vc = x.valid ? ' <span style="color:' + (x.valid === 'ok' ? COL.ok : x.valid === 'warning' ? COL.late : COL.error) + '">· ' + esc(t.v[x.valid] || x.valid) + '</span>' : '';
        return '<div style="font-size:12px;color:var(--text-muted)">' + esc(bits.join(' · ')) + vc + '</div>';
      }).join('');
      h += '<tr style="border-top:1px solid var(--border)"><td style="padding:8px 6px;font-weight:600">' + esc(p.name) + '<div style="font-size:11px;font-weight:400;color:var(--text-faint)">' + esc((p.crons || []).join(' | ')) + '</div></td>' +
        '<td style="padding:8px 6px"><span class="di-badge" style="background:' + COL[p.status] + '1a;color:' + COL[p.status] + '">' + esc(t.s[p.status] || p.status) + '</span></td>' +
        '<td style="padding:8px 6px">' + (l ? (l.url ? '<a href="' + esc(l.url) + '" target="_blank" rel="noopener" title="' + esc(t.run) + '">' + esc(when(l.startedAt)) + '</a>' : esc(when(l.startedAt))) : '<span style="color:var(--text-faint)">' + esc(t.never) + '</span>') + '</td>' +
        '<td style="padding:8px 6px">' + esc(when(p.nextRun)) + '</td><td style="padding:8px 6px">' + esc(l ? dur(l.durationSec) : '–') + '</td>' +
        '<td style="padding:8px 6px">' + (p.recent ? p.recent.success + '/' + p.recent.runs : '–') + '</td><td style="padding:8px 6px">' + (fs || '–') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    if (Q) {
      var qs = Q.summary, bad = Q.files.filter(function (f) { return f.status !== 'ok'; });
      h += '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(t.qtitle) + '</h2><p style="color:var(--text-muted);font-size:13.5px;max-width:760px">' + esc(t.qtxt) + '</p>' +
        '<div style="font-size:13px;margin:8px 0">' + esc(t.qfiles) + ': <strong>' + qs.files + '</strong> · ' + esc(t.qerr) + ': <strong>' + qs.errors + '</strong> · ' + esc(t.qwarn) + ': <strong>' + qs.warnings + '</strong> · ' + esc(t.upd) + ': ' + esc(when(Q.generatedAt)) + '</div>';
      if (bad.length) {
        h += '<div class="di-card" style="padding:10px 16px"><div style="font-size:11px;font-weight:700;color:var(--text-faint);margin-bottom:6px">' + esc(t.warns).toUpperCase() + '</div>' + bad.map(function (f) {
          return '<div style="font-size:12.5px;margin:4px 0"><strong>' + esc(f.file) + '</strong> <span style="color:' + (f.status === 'error' ? COL.error : COL.late) + '">(' + esc(t.v[f.status === 'warning' ? 'warning' : 'error']) + ')</span> — ' + esc((f.errors.concat(f.warnings)).slice(0, 2).join(' · ')) + '</div>';
        }).join('') + '</div>';
      }
    }
    h += freshBlock();
    root.innerHTML = h;
    var c = document.getElementById('st-only'); if (c) c.onchange = function () { only = c.checked; render(); };
  }
  var FT = {
    es: ['Frescura del catálogo', 'Series al día', 'Retrasadas', 'Desactualizadas', 'Históricas', 'Desactualizada = debería seguir publicándose y el siguiente dato esperado no ha llegado. Histórica = lleva muchos ciclos sin datos nuevos y se conserva como registro: no cuenta como retraso.'],
    en: ['Catalog freshness', 'Up to date', 'Delayed', 'Stale', 'Historical', 'Stale = it should still be published and the next expected observation has not arrived. Historical = no new data for many cycles, kept as a record: it does not count as a delay.'],
    fr: ['Fraîcheur du catalogue', 'À jour', 'En retard', 'Obsolètes', 'Historiques', 'Obsolète = devrait encore être publiée et la prochaine observation attendue n’est pas arrivée. Historique = sans nouvelles données depuis de nombreux cycles, conservée comme archive : ne compte pas comme un retard.'],
    it: ['Freschezza del catalogo', 'Aggiornate', 'In ritardo', 'Obsolete', 'Storiche', 'Obsoleta = dovrebbe essere ancora pubblicata e la prossima osservazione attesa non è arrivata. Storica = nessun nuovo dato da molti cicli, conservata come archivio: non conta come ritardo.']
  };
  function freshBlock() {
    if (!FR || !FR.catalog) return '';
    var b = FR.catalog.byState, f = FT[lang()] || FT.es, ok = (b.LIVE || 0) + (b.FRESH || 0) + (b.EXPECTED_DELAY || 0), arch = (FR.catalog.historicalTotal || 0) + (FR.catalog.discontinuedTotal || 0);
    return '<h2 style="margin:26px 0 8px;font-size:18px">' + esc(f[0]) + '</h2><div style="font-size:13px;margin:8px 0">' + esc(f[1]) + ': <strong>' + nf(ok) + '</strong> · ' + esc(f[2]) + ': <strong>' + nf(b.DELAYED || 0) + '</strong> · ' + esc(f[3]) + ': <strong>' + nf(b.STALE || 0) + '</strong> · ' + esc(f[4]) + ': <strong>' + nf(arch) + '</strong> / ' + nf(FR.catalog.total) + '</div><p style="color:var(--text-muted);font-size:13px;max-width:760px">' + esc(f[5]) + '</p>';
  }
  function get(u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  Promise.all([get('data/pipeline-status.json'), get('data/data-quality.json'), get('data/freshness.json')]).then(function (r) { P = r[0]; Q = r[1]; FR = r[2]; render(); });
  var prev = window.DehesaShared && window.DehesaShared.onLangChange;
  if (window.DehesaShared) window.DehesaShared.onLangChange = function () { if (prev) prev.apply(this, arguments); render(); };
})();
