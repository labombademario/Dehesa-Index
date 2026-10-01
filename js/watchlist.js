/* Dehesa Index — Lista de seguimiento local (localStorage, sin cuenta ni servidor). ES5.
   DIWatch.list() -> [{c:'ES', s:'es-perc-aceite'}]; has/toggle/remove. Todo en try/catch: sin almacenamiento la página sigue funcionando. */
(function () {
  'use strict';
  var KEY = 'di-watchlist-v1', MEM = [];
  function read() { try { var v = JSON.parse(window.localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return MEM.slice(); } }
  function write(l) { MEM = l.slice(); try { window.localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function idx(l, c, s) { for (var i = 0; i < l.length; i++) if (l[i].c === c && l[i].s === s) return i; return -1; }
  window.DIWatch = {
    list: read,
    has: function (c, s) { return idx(read(), c, s) > -1; },
    toggle: function (c, s) { var l = read(), i = idx(l, c, s); if (i > -1) l.splice(i, 1); else l.unshift({ c: c, s: s }); write(l.slice(0, 60)); return i === -1; },
    remove: function (c, s) { var l = read(), i = idx(l, c, s); if (i > -1) { l.splice(i, 1); write(l); } },
    labels: { es: { follow: '☆ Seguir', following: '★ Siguiendo', title: 'Mi lista de seguimiento', hint: 'Series que sigues en este navegador. Se guardan solo aquí (sin cuenta); si borras los datos del navegador se pierden.', empty: 'Aún no sigues ninguna serie. Abre un perfil de país y pulsa “☆ Seguir” en el gráfico.', remove: 'Quitar', open: 'Abrir' },
      en: { follow: '☆ Follow', following: '★ Following', title: 'My watchlist', hint: 'Series you follow in this browser. Stored only here (no account); clearing browser data removes them.', empty: 'You are not following any series yet. Open a country profile and press “☆ Follow” on the chart.', remove: 'Remove', open: 'Open' },
      fr: { follow: '☆ Suivre', following: '★ Suivi', title: 'Ma liste de suivi', hint: 'Séries suivies dans ce navigateur. Stockées uniquement ici (sans compte) ; effacer les données du navigateur les supprime.', empty: 'Vous ne suivez encore aucune série. Ouvrez un profil de pays et cliquez sur « ☆ Suivre » sur le graphique.', remove: 'Retirer', open: 'Ouvrir' },
      it: { follow: '☆ Segui', following: '★ Segui già', title: 'La mia lista', hint: 'Serie seguite in questo browser. Salvate solo qui (senza account); cancellando i dati del browser si perdono.', empty: 'Non segui ancora nessuna serie. Apri un profilo paese e premi “☆ Segui” sul grafico.', remove: 'Rimuovi', open: 'Apri' } }
  };
})();

/* ---------- Smart Watchlist: reglas de aviso locales (sin cuenta ni servidor) ----------
   Cada elemento puede llevar reglas r:[{t:'pct',v:5} | {t:'new'} | {t:'cross',v:X,d:'above'|'below'}] y el ultimo estado visto seen:{p,v}.
   Se evaluan en el navegador contra data/watch-index.json (indice compacto de todas las series). Series de pais: c='ES', s=id. Productos: c='P', s='trigo/eu'. */
(function () {
  'use strict';
  var KEY = 'di-watchlist-v1', W = window.DIWatch; if (!W) return;
  function read() { try { var v = JSON.parse(window.localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(l) { try { window.localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function find(l, c, s) { for (var i = 0; i < l.length; i++) if (l[i].c === c && l[i].s === s) return l[i]; return null; }
  function key(c, s) { return c === 'P' ? 'P/' + s : c + '/' + s; }
  var IDX = null, IP = null;
  function load() { if (IP) return IP; IP = fetch((window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('data/watch-index.json') : 'data/watch-index.json')).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { IDX = d && d.series ? d.series : {}; return IDX; }).catch(function () { IDX = {}; return IDX; }); return IP; }
  function row(idx, c, s) { var a = idx[key(c, s)]; return a ? { label: a[0], unit: a[1], freq: a[2], group: a[3], period: a[4], value: a[5], change: a[6] } : null; }
  function cond(r, v) { return r.d === 'below' ? v <= r.v : v >= r.v; }
  W.key = key; W.loadIndex = load;
  W.rules = function (c, s) { var it = find(read(), c, s); return it && it.r ? it.r : []; };
  W.addRule = function (c, s, rule) {
    var l = read(), it = find(l, c, s); if (!it) { it = { c: c, s: s }; l.unshift(it); }
    it.r = it.r || []; it.r.push(rule);
    return load().then(function (idx) { var x = row(idx, c, s); if (x) { it.seen = { p: x.period, v: x.value }; it.ack = x.period; } write(l.slice(0, 60)); return it.r; });
  };
  W.delRule = function (c, s, i) { var l = read(), it = find(l, c, s); if (it && it.r) { it.r.splice(i, 1); write(l); } };
  W.ack = function (c, s) { var l = read(), it = find(l, c, s); if (!it) return; var x = IDX && row(IDX, c, s); if (x) { it.seen = { p: x.period, v: x.value }; it.ack = x.period; write(l); } };
  W.ackAll = function () { read().forEach(function (it) { W.ack(it.c, it.s); }); };
  // evalua todas las reglas: [{c,s,label,unit,period,value,change,hits:[{t,v,d}]}]
  W.evaluate = function (idx) {
    var out = [];
    read().forEach(function (it) {
      if (!it.r || !it.r.length) return; var x = row(idx, it.c, it.s); if (!x || x.period === it.ack) return; var hits = [];
      it.r.forEach(function (r) {
        if (r.t === 'new' && it.seen && x.period !== it.seen.p) hits.push(r);
        else if (r.t === 'pct' && typeof x.change === 'number' && Math.abs(x.change) >= r.v && (!it.seen || x.period !== it.seen.p)) hits.push(r);
        else if (r.t === 'cross' && typeof x.value === 'number' && cond(r, x.value) && !(it.seen && typeof it.seen.v === 'number' && cond(r, it.seen.v))) hits.push(r);
      });
      if (hits.length) out.push({ c: it.c, s: it.s, label: x.label, unit: x.unit, period: x.period, value: x.value, change: x.change, prev: it.seen, hits: hits });
    });
    return out;
  };
  var L = {
    es: { rules: 'Avisos', add: 'Añadir aviso', pct: 'Cambio de ±', pctU: '% en el último dato', neu: 'Nuevo dato', cross: 'Cruza', above: 'sube de', below: 'baja de', none: 'Sin avisos. Se evalúan en este navegador cada vez que abres Dehesa.', del: 'Quitar', ok: 'Visto', fired: 'Aviso', newd: 'nuevo dato', val: 'valor', chg: 'cambio', pill: 'avisos de tu lista', hint: 'Local: sin cuenta. El aviso aparece cuando abres la web; no se envía nada.' },
    en: { rules: 'Alerts', add: 'Add alert', pct: 'Change of ±', pctU: '% in the latest data', neu: 'New data', cross: 'Crosses', above: 'rises above', below: 'falls below', none: 'No alerts. They are checked in this browser whenever you open Dehesa.', del: 'Remove', ok: 'Seen', fired: 'Alert', newd: 'new data', val: 'value', chg: 'change', pill: 'alerts from your list', hint: 'Local only: no account. The alert shows when you open the site; nothing is sent.' },
    fr: { rules: 'Alertes', add: 'Ajouter une alerte', pct: 'Variation de ±', pctU: '% sur la dernière donnée', neu: 'Nouvelle donnée', cross: 'Franchit', above: 'dépasse', below: 'passe sous', none: 'Aucune alerte. Elles sont évaluées dans ce navigateur à chaque visite.', del: 'Retirer', ok: 'Vu', fired: 'Alerte', newd: 'nouvelle donnée', val: 'valeur', chg: 'variation', pill: 'alertes de votre liste', hint: 'Local, sans compte. L’alerte s’affiche à l’ouverture du site ; rien n’est envoyé.' },
    it: { rules: 'Avvisi', add: 'Aggiungi avviso', pct: 'Variazione di ±', pctU: '% nell’ultimo dato', neu: 'Nuovo dato', cross: 'Supera', above: 'sale sopra', below: 'scende sotto', none: 'Nessun avviso. Vengono valutati in questo browser a ogni visita.', del: 'Rimuovi', ok: 'Visto', fired: 'Avviso', newd: 'nuovo dato', val: 'valore', chg: 'variazione', pill: 'avvisi dalla tua lista', hint: 'Solo locale, senza account. L’avviso appare quando apri il sito; non viene inviato nulla.' }
  };
  W.rl = L;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ruleText(r, t) { return r.t === 'pct' ? t.pct + r.v + t.pctU : r.t === 'new' ? t.neu : t.cross + ' ' + (r.d === 'below' ? t.below : t.above) + ' ' + r.v; }
  W.ruleText = function (r, lang) { return ruleText(r, L[lang] || L.es); };
  // editor HTML (lista de reglas + formulario). Se conecta con W.bindEditor(contenedor, c, s, lang, onChange)
  W.editor = function (c, s, lang) {
    var t = L[lang] || L.es, rs = W.rules(c, s), h = '<div class="di-wl-ed" data-c="' + esc(c) + '" data-s="' + esc(s) + '" style="font-size:13px">';
    h += rs.length ? rs.map(function (r, i) { return '<span style="display:inline-flex;align-items:center;gap:6px;margin:0 6px 6px 0;padding:3px 10px;border:1px solid var(--border);border-radius:999px">🔔 ' + esc(ruleText(r, t)) + ' <button type="button" data-del="' + i + '" aria-label="' + esc(t.del) + '" style="border:0;background:none;cursor:pointer;color:inherit;font:inherit">×</button></span>'; }).join('') : '<div class="di-movers-hint" style="margin:0 0 6px">' + esc(t.none) + '</div>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:4px"><select data-k="t" aria-label="' + esc(t.add) + '" style="font:inherit;padding:3px 6px"><option value="pct">' + esc(t.pct.replace(' of', '').trim()) + ' %</option><option value="new">' + esc(t.neu) + '</option><option value="above">' + esc(t.cross) + ' ' + esc(t.above) + '</option><option value="below">' + esc(t.cross) + ' ' + esc(t.below) + '</option></select>' +
      '<input data-k="v" type="number" step="any" value="5" aria-label="valor" style="width:84px;font:inherit;padding:3px 6px"><button type="button" data-add="1" style="font:inherit;padding:3px 12px;border:1px solid var(--border);border-radius:999px;background:transparent;color:inherit;cursor:pointer">+ ' + esc(t.add) + '</button></div>';
    return h + '<div class="di-movers-hint" style="margin-top:6px">' + esc(t.hint) + '</div></div>';
  };
  W.bindEditor = function (root, onChange) {
    if (!root) return; var eds = root.querySelectorAll('.di-wl-ed');
    Array.prototype.forEach.call(eds, function (ed) {
      var c = ed.getAttribute('data-c'), s = ed.getAttribute('data-s');
      ed.addEventListener('click', function (e) {
        var d = e.target.getAttribute && e.target.getAttribute('data-del'), a = e.target.getAttribute && e.target.getAttribute('data-add');
        if (d !== null && d !== undefined && d !== '') { W.delRule(c, s, +d); if (onChange) onChange(); return; }
        if (a) {
          var t = ed.querySelector('[data-k=t]').value, v = parseFloat(ed.querySelector('[data-k=v]').value), r;
          if (t === 'pct') { if (!(v > 0)) return; r = { t: 'pct', v: v }; } else if (t === 'new') r = { t: 'new' }; else { if (isNaN(v)) return; r = { t: 'cross', v: v, d: t }; }
          if (!W.has(c, s)) W.toggle(c, s);
          W.addRule(c, s, r).then(function () { if (onChange) onChange(); });
        }
      });
    });
  };
  // aviso flotante en cualquier pagina cuando hay reglas disparadas
  W.pill = function (lang) {
    var any = read().some(function (it) { return it.r && it.r.length; }); if (!any || /brief\.html/.test(location.pathname)) return;
    load().then(function (idx) {
      var ev = W.evaluate(idx); if (!ev.length) return; var t = L[lang] || L.es;
      var a = document.createElement('a'); a.href = (window.DehesaShared && window.DehesaShared.sitePath ? window.DehesaShared.sitePath('brief.html') : 'brief.html') + '#watch';
      a.setAttribute('role', 'status'); a.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9000;background:#2f6b3a;color:#fff;padding:9px 14px;border-radius:999px;font:600 13px "Public Sans",system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.2)';
      a.textContent = '🔔 ' + ev.length + ' ' + t.pill; document.body.appendChild(a);
    });
  };
})();
