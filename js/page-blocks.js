/* Dehesa Index — «Mostrar u ocultar bloques» en la ficha de país (paises.html). ES5.
   Un panel con una casilla por cada bloque de datos propio de la ficha (nitratos, gasóleo agrícola, tierra y regadío, Agreste, previsiones…).
   La elección se guarda en este navegador (localStorage, clave por país) y se aplica sola cuando el bloque termina de cargar. */
(function (global) {
  'use strict';
  var KEY = 'dehesaIndexHiddenBlocks', CORE = /^(pp-(kpi|top|trade|ask|sum|drought-slot|ghg-slot|more-none|tip-.*)|pp-custom)$/;
  var T = {
    es: { sum: 'Mostrar u ocultar bloques', n: '{n} ocultos', hint: 'Elige qué bloques de datos ves en esta ficha. Se recuerda en este navegador.', all: 'Mostrar todos', none: 'Todavía no hay bloques que elegir: se van añadiendo a medida que cargan.' },
    en: { sum: 'Show or hide blocks', n: '{n} hidden', hint: 'Choose which data blocks you see on this page. Remembered in this browser.', all: 'Show all', none: 'No blocks to choose from yet: they are added as they load.' },
    fr: { sum: 'Afficher ou masquer des blocs', n: '{n} masqués', hint: 'Choisissez les blocs de données affichés sur cette fiche. Mémorisé dans ce navigateur.', all: 'Tout afficher', none: 'Pas encore de blocs à choisir : ils s’ajoutent au fil du chargement.' },
    it: { sum: 'Mostra o nascondi blocchi', n: '{n} nascosti', hint: 'Scegli quali blocchi di dati vedere in questa scheda. Ricordato in questo browser.', all: 'Mostra tutti', none: 'Ancora nessun blocco da scegliere: si aggiungono man mano che si caricano.' }
  };
  var ST = { cc: '', obs: null, sig: '', timer: 0, cb: null };
  function lang() { var l = global.DehesaShared && global.DehesaShared.getLang ? global.DehesaShared.getLang() : 'es'; return T[l] ? l : 'es'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function load() { try { var v = JSON.parse(global.localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' && !(v instanceof Array) ? v : {}; } catch (e) { return {}; } }
  function save(o) { try { global.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento: vale para esta visita */ } }
  function hiddenIds() { var a = load()[ST.cc]; return a instanceof Array ? a : []; }
  function setHidden(id, on) { var o = load(), a = (o[ST.cc] instanceof Array ? o[ST.cc] : []).filter(function (x) { return x !== id; }); if (on) a.push(id); o[ST.cc] = a; if (!a.length) delete o[ST.cc]; save(o); }
  function title(e) {
    var h = e.querySelector('h2,h3,summary'), t = h ? h.textContent : e.id;
    t = String(t).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''); var i = t.indexOf(' · '); if (i > 12) t = t.slice(0, i);
    return t.length > 90 ? t.slice(0, 87) + '…' : t;
  }
  /* bloques de datos de la ficha: los «pp-…» que tienen contenido (o que ocultó el propio visitante) y no están dentro de otro */
  function blocks() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('[id^="pp-"]'), function (e) {
      if (CORE.test(e.id) || e.getAttribute('data-pb') === 'off') return;
      var mine = e.getAttribute('data-pb-hid') === '1';
      if (!mine && !(e.firstElementChild && e.offsetHeight > 2)) return;
      if (e.parentNode && e.parentNode.closest && e.parentNode.closest('[id^="pp-"]:not(#pp-custom)')) return;
      out.push(e);
    });
    return out;
  }
  function apply(list) {
    var hid = hiddenIds();
    list.forEach(function (e) {
      var want = hid.indexOf(e.id) >= 0, mine = e.getAttribute('data-pb-hid') === '1';
      if (want && !mine) { e.setAttribute('data-pb-hid', '1'); e.hidden = true; e.style.display = 'none'; }
      else if (!want && mine) { e.removeAttribute('data-pb-hid'); e.hidden = false; e.style.display = ''; }
    });
  }
  function panel(list) {
    var x = T[lang()], host = document.getElementById('pp-custom'), hid = hiddenIds(), n = list.filter(function (e) { return hid.indexOf(e.id) >= 0; }).length;
    if (!host) return;
    var open = host.firstChild && host.firstChild.open;
    host.innerHTML = '<details class="di-card pa-custom"' + (open ? ' open' : '') + '><summary>' + esc(x.sum) + (n ? ' · <span>' + esc(x.n.replace('{n}', n)) + '</span>' : '') + '</summary>' +
      '<p class="di-movers-hint">' + esc(x.hint) + '</p>' + (list.length ? '<ul class="pa-custom-l">' + list.map(function (e) {
        return '<li><label><input type="checkbox" data-pb-id="' + esc(e.id) + '"' + (hid.indexOf(e.id) >= 0 ? '' : ' checked') + '> ' + esc(title(e)) + '</label></li>'; }).join('') + '</ul>' + (n ? '<p><button type="button" class="di-btn pa-custom-all">' + esc(x.all) + '</button></p>' : '') : '<p class="di-movers-hint">' + esc(x.none) + '</p>') + '</details>';
  }
  function refresh(force) {
    var list = blocks(); apply(list);
    var sig = list.map(function (e) { return e.id + ':' + title(e) + ':' + (e.getAttribute('data-pb-hid') || ''); }).join('|') + lang();
    if (force || sig !== ST.sig) { ST.sig = sig; panel(list); }
  }
  function later() { if (ST.timer) clearTimeout(ST.timer); ST.timer = setTimeout(function () { ST.timer = 0; refresh(false); }, 350); }
  function bind(host) {
    host.addEventListener('change', function (ev) {
      var t = ev.target, id = t && t.getAttribute && t.getAttribute('data-pb-id'); if (!id) return;
      setHidden(id, !t.checked); refresh(true); if (ST.cb) ST.cb();
    });
    host.addEventListener('click', function (ev) {
      if (!ev.target.closest || !ev.target.closest('.pa-custom-all')) return;
      var o = load(); delete o[ST.cc]; save(o); refresh(true); if (ST.cb) ST.cb();
    });
  }
  /* mount(cc, onChange): onChange se llama cuando la persona oculta o muestra un bloque (la ficha rehace su barra de secciones) */
  function mount(cc, onChange) {
    ST.cc = cc; ST.cb = onChange || null; ST.sig = '';
    if (ST.obs) { try { ST.obs.disconnect(); } catch (e) { /* nada */ } ST.obs = null; }
    var old = document.getElementById('pp-custom'); if (old && old.parentNode) old.parentNode.removeChild(old);
    var ref = document.getElementById('ps-sector'), kp = document.getElementById('pp-kpi'), host = document.createElement('div'); host.id = 'pp-custom';
    if (ref && ref.parentNode) ref.parentNode.insertBefore(host, ref.nextSibling); else if (kp && kp.parentNode) kp.parentNode.insertBefore(host, kp); else return;
    bind(host); refresh(true);
    var root = document.getElementById('pa-root') || (host.closest ? host.closest('main') : null) || document.body;
    if (global.MutationObserver) { ST.obs = new MutationObserver(later); ST.obs.observe(root, { childList: true, subtree: true }); }
    [1500, 4000, 9000].forEach(function (ms) { setTimeout(function () { if (ST.cc === cc) refresh(false); }, ms); });
  }
  global.DIPageBlocks = { mount: mount };
})(window);
