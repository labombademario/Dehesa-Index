/* Dehesa Index — selector de país (norma del sitio): cada <select data-cpick> donde se elige un país se sustituye por un botón con buscador y grupos
   «Zona euro · Resto de Europa · América · Resto del mundo». El <select> original sigue en el DOM (oculto) y recibe el valor y el evento «change»,
   así que el código de cada página no cambia. El código de país sale del value de la opción (ISO-2) o, si no, de la bandera que abre su texto. ES5. */
(function () {
  'use strict';
  function set(s) { var o = {}; s.split(' ').forEach(function (k) { o[k] = 1; }); return o; }
  var EZ = set('AT BE BG CY DE EE ES FI FR EL GR HR IE IT LT LU LV MT NL PT SI SK');
  var EU = set('AL AD AM BA BY CH CZ DK GB UK GE HU IS LI MC MD ME MK NO PL RO RS RU SE SM TR UA VA XK');
  var AM = set('US CA MX AR BR CL CO PE UY PY BO EC VE CR PA GT HN NI SV DO CU JM HT BS BB BZ GY SR TT');
  var T = {
    es: { rec: 'Recientes', ez: 'Zona euro', eu: 'Resto de Europa', am: 'América', ow: 'Resto del mundo', ot: 'Otras opciones', q: 'Buscar país…', none: 'Sin resultados' },
    en: { rec: 'Recent', ez: 'Euro area', eu: 'Rest of Europe', am: 'Americas', ow: 'Rest of the world', ot: 'Other options', q: 'Search country…', none: 'No results' },
    fr: { rec: 'Récents', ez: 'Zone euro', eu: 'Reste de l’Europe', am: 'Amériques', ow: 'Reste du monde', ot: 'Autres options', q: 'Rechercher un pays…', none: 'Aucun résultat' },
    it: { rec: 'Recenti', ez: 'Area euro', eu: 'Resto d’Europa', am: 'Americhe', ow: 'Resto del mondo', ot: 'Altre opzioni', q: 'Cerca paese…', none: 'Nessun risultato' }
  };
  function lg() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return T[l] ? l : 'es'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function flagCode(txt) { var cp = []; for (var i = 0; i < txt.length && cp.length < 2; i++) { var c = txt.codePointAt(i); if (c > 0xFFFF) i++; if (c >= 127462 && c <= 127487) cp.push(String.fromCharCode(c - 127397)); else break; } return cp.length === 2 ? cp.join('') : ''; }
  function codeOf(o) { var v = String(o.value || '').toUpperCase(); if (/^[A-Z]{2}$/.test(v)) return v; var f = flagCode(o.textContent.trim()); return f === 'GR' ? 'EL' : f; }
  function group(c) { return c === 'EU' ? 'eu' : EZ[c] ? 'ez' : EU[c] ? 'eu' : AM[c] ? 'am' : c ? 'ow' : 'ot'; }
  function fl(c) { c = c === 'EL' ? 'GR' : c === 'UK' ? 'GB' : c; return /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1)) + ' ' : ''; }
  function lab(o) { var tx = o.textContent.trim(), c = codeOf(o); return flagCode(tx) || !c || c === 'EU' ? tx : fl(c) + tx; }
  function strip(t) { return t.replace(/\s*\([^)]*\)\s*$/, ''); }
  var CSS = '.cp-w{position:relative;display:inline-block;max-width:100%}.cp-b{min-width:220px;max-width:100%;text-align:left;cursor:pointer}.cp-p{position:absolute;z-index:60;left:0;top:calc(100% + 4px);width:min(440px,92vw);max-height:min(420px,70vh);overflow:auto;background:var(--surface,#fff);color:var(--text,inherit);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:10px}.cp-t{font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);margin:8px 0 4px}.cp-c{display:flex;flex-wrap:wrap;gap:6px}.cp-o[aria-selected="true"]{background:var(--accent,#1f3d2f);color:#fff}.cp-p[hidden],.cp-g[hidden],.cp-o[hidden]{display:none}';
  function css() { if (document.getElementById('cp-css')) return; var s = document.createElement('style'); s.id = 'cp-css'; s.textContent = CSS; document.head.appendChild(s); }
  function enhance(sel) {
    if (sel._cp) return; sel._cp = 1; css();
    var w = document.createElement('span'), b = document.createElement('button'), pn = null, open = false;
    w.className = 'cp-w'; b.type = 'button'; b.className = (sel.className || 'di-compare-select') + ' cp-b'; b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
    var al = sel.getAttribute('aria-label'); if (al) b.setAttribute('aria-label', al);
    sel.style.display = 'none'; sel.parentNode.insertBefore(w, sel); w.appendChild(b); w.appendChild(sel);
    function text() { var o = sel.options[sel.selectedIndex]; b.textContent = (o ? lab(o) : '') + ' ▾'; }
    /* el panel va en position:fixed para que ninguna tarjeta con overflow:hidden lo recorte (antes no se podia bajar a los demas paises) */
    function place() {
      if (!open || !pn) return; var r = b.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, wd = Math.min(440, vw * 0.92), below = vh - r.bottom - 12, above = r.top - 12, up = below < 260 && above > below, mh = Math.max(160, Math.min(420, up ? above : below));
      pn.style.position = 'fixed'; pn.style.width = wd + 'px'; pn.style.maxHeight = mh + 'px'; pn.style.left = Math.max(8, Math.min(r.left, vw - wd - 8)) + 'px';
      if (up) { pn.style.top = 'auto'; pn.style.bottom = (vh - r.top + 4) + 'px'; } else { pn.style.bottom = 'auto'; pn.style.top = (r.bottom + 4) + 'px'; }
    }
    function close() { if (!open) return; open = false; window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); if (pn) pn.hidden = true; b.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', away, true); document.removeEventListener('keydown', key, true); }
    function away(e) { if (!w.contains(e.target)) close(); }
    function key(e) { if (e.key === 'Escape') { close(); b.focus(); } }
    function build() {
      var t = T[lg()], G = { ot: [], ez: [], eu: [], am: [], ow: [] };
      Array.prototype.forEach.call(sel.options, function (o) { var c = codeOf(o); G[group(c)].push(o); });
      var many = sel.options.length > 8, h = many ? '<input type="search" class="di-compare-select cp-q" autocomplete="off" placeholder="' + esc(t.q) + '" style="width:100%;margin:0 0 8px">' : '';
      ['ot', 'ez', 'eu', 'am', 'ow'].forEach(function (g) {
        if (!G[g].length) return;
        h += '<div class="cp-g"><div class="cp-t">' + esc(t[g]) + '</div><div class="cp-c">' + G[g].map(function (o) {
          var tx = lab(o), short = strip(tx);
          return '<button type="button" role="option" class="pt-chip cp-o" data-i="' + o.index + '" data-n="' + esc(short.toLowerCase()) + '" aria-selected="' + (o.index === sel.selectedIndex) + '" title="' + esc(tx) + '">' + esc(short) + '</button>';
        }).join('') + '</div></div>';
      });
      h += '<p class="di-movers-hint cp-none" hidden>' + esc(t.none) + '</p>';
      if (!pn) { pn = document.createElement('div'); pn.className = 'cp-p'; pn.setAttribute('role', 'listbox'); w.appendChild(pn); }
      pn.innerHTML = h;
      var q = pn.querySelector('.cp-q');
      function filt() { var v = q ? q.value.trim().toLowerCase() : '', any = false; Array.prototype.forEach.call(pn.querySelectorAll('.cp-o'), function (c) { var ok = !v || c.getAttribute('data-n').indexOf(v) > -1; c.hidden = !ok; if (ok) any = true; }); Array.prototype.forEach.call(pn.querySelectorAll('.cp-g'), function (g) { g.hidden = !g.querySelector('.cp-o:not([hidden])'); }); pn.querySelector('.cp-none').hidden = any; }
      if (q) { q.oninput = filt; q.onkeydown = function (e) { if (e.key === 'Enter') { var f = pn.querySelector('.cp-o:not([hidden])'); if (f) f.click(); } }; }
      Array.prototype.forEach.call(pn.querySelectorAll('.cp-o'), function (c) { c.onclick = function () { var i = +c.getAttribute('data-i'); close(); if (sel.selectedIndex !== i) { sel.selectedIndex = i; text(); sel.dispatchEvent(new Event('change', { bubbles: true })); } b.focus(); }; });
      return q;
    }
    b.onclick = function () { if (open) { close(); return; } var q = build(); pn.hidden = false; open = true; b.setAttribute('aria-expanded', 'true'); document.addEventListener('click', away, true); document.addEventListener('keydown', key, true); place(); window.addEventListener('resize', place); window.addEventListener('scroll', place, true); if (q) q.focus(); };
    sel.addEventListener('change', text); text();
    /* data-cprecent="clave": linea «Recientes» con los ultimos paises elegidos en esa pagina (solo en este navegador) */
    var rk = sel.getAttribute('data-cprecent');
    if (rk) {
      rk = 'di-cp-recent-' + rk; var rl = function () { try { var v = JSON.parse(localStorage.getItem(rk) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
      var rs = document.createElement('span'); rs.className = 'cp-rec';
      var draw = function () {
        var cur = sel.value, idx = {}; Array.prototype.forEach.call(sel.options, function (o) { idx[o.value] = o; });
        var l = rl().filter(function (v) { return v !== cur && idx[v]; }).slice(0, 3);
        rs.hidden = !l.length; rs.innerHTML = l.length ? esc(T[lg()].rec) + ': ' + l.map(function (v) { return '<button type="button" class="cp-rl" data-v="' + esc(v) + '">' + esc(strip(idx[v].textContent.trim()).replace(/^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/, '')) + '</button>'; }).join(' · ') : '';
        Array.prototype.forEach.call(rs.querySelectorAll('.cp-rl'), function (x) { x.onclick = function () { sel.value = x.getAttribute('data-v'); text(); sel.dispatchEvent(new Event('change', { bubbles: true })); }; });
      };
      var push = function () { var l = rl().filter(function (v) { return v !== sel.value; }); l.unshift(sel.value); try { localStorage.setItem(rk, JSON.stringify(l.slice(0, 4))); } catch (e) { } };
      sel.addEventListener('change', function () { push(); draw(); });
      push(); w.parentNode.insertBefore(rs, w.nextSibling); draw();   // el pais con el que se abre tambien cuenta: asi se puede volver a el
    }
  }
  function scan(root) { var r = root && root.querySelectorAll ? root : document; Array.prototype.forEach.call(r.querySelectorAll('select[data-cpick]'), enhance); if (r.matches && r.matches('select[data-cpick]')) enhance(r); }
  scan(document);
  new MutationObserver(function (ms) { ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); }); }); }).observe(document.documentElement, { childList: true, subtree: true });
  window.DehesaCountryPicker = { scan: scan };
})();
