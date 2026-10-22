/* Dehesa Index — Glosario: al tocar (o pasar el cursor por) una sigla o término técnico de la página sale su definición de una línea.
   Lee data/glosario-<idioma>.json (generado por scripts/build-glosario.py). Subraya solo la primera aparición de cada término en el contenido principal.
   No toca enlaces, botones, selectores ni títulos de pestaña. ES5. */
(function () {
  'use strict';
  if (/(^|\/)(metodologia|embed|offline)\.html/.test(location.pathname)) return;
  var DATA = null, LANG = '', LOADING = '', RE_CS = null, RE_CI = null, MAP = {}, timer = null, obs = null, pop = null, cur = null, busy = false;
  var SKIP = /^(A|BUTTON|SELECT|OPTION|TEXTAREA|INPUT|SCRIPT|STYLE|ABBR|SUMMARY|LABEL|CODE|PRE|SVG|CANVAS|H1|NOSCRIPT)$/;
  var MORE = { es: 'Ver glosario completo', en: 'See full glossary', fr: 'Voir le glossaire complet', it: 'Vedi il glossario completo' };
  function lang() { var l = ''; try { l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : (window.localStorage.getItem('dehesaIndexLang') || document.documentElement.lang || 'es'); } catch (e) { l = 'es'; } return /^(es|en|fr|it)$/.test(l) ? l : 'es'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\\-\/]/g, '\\$&'); }
  function build(d) {
    MAP = {}; var cs = [], ci = [];
    d.entries.forEach(function (e) { if (e.a === 0) return; e.t.forEach(function (t) { MAP[t.toLowerCase()] = e; ((/^[A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9\-\. ]*$/.test(t) && t.length <= 8) || t.length <= 3 || t === 'Quick Stats' ? cs : ci).push(t); }); });
    function mk(a, flags) { a.sort(function (x, y) { return y.length - x.length; }); return a.length ? new RegExp('(^|[^A-Za-zÀ-ÿ0-9\\-_/])(' + a.map(rx).join('|') + ')(?![A-Za-zÀ-ÿ0-9\\-_/])', flags) : null; }
    RE_CS = mk(cs, ''); RE_CI = mk(ci, 'i');
  }
  function load(l, cb) {
    if (LOADING === l) return; LOADING = l;
    var x = new XMLHttpRequest(); x.open('GET', 'data/glosario-' + l + '.json', true);
    x.onload = function () { LOADING = ''; if (x.status !== 200) return; try { DATA = JSON.parse(x.responseText); LANG = l; build(DATA); cb(); } catch (e) { } };
    x.onerror = function () { LOADING = ''; }; x.send();
  }
  function main() { return document.querySelector('main') || document.getElementById('app') || document.body; }
  function present() { var s = {}; [].forEach.call(document.querySelectorAll('abbr.gl'), function (a) { s[a.getAttribute('data-g')] = 1; }); return s; }
  function firstHit(txt, seen) {
    var best = null;
    [RE_CS, RE_CI].forEach(function (r) {
      if (!r) return; var re = new RegExp(r.source, r.flags + 'g'), m;
      while ((m = re.exec(txt))) { var term = m[2], e = MAP[term.toLowerCase()]; if (!e || seen[e.id]) continue; var idx = m.index + m[1].length; if (!best || idx < best.i) best = { i: idx, t: term, e: e }; break; }
    });
    return best;
  }
  function isOff() { try { return window.localStorage.getItem('dehesaGlosarioOff') === '1'; } catch (e) { return false; } }
  function unwrap() { hide(); [].forEach.call(document.querySelectorAll('abbr.gl'), function (a) { var t = document.createTextNode(a.textContent); a.parentNode.replaceChild(t, a); }); if (document.body && document.body.normalize) document.body.normalize(); }
  function setOff(v) { try { if (v) window.localStorage.setItem('dehesaGlosarioOff', '1'); else window.localStorage.removeItem('dehesaGlosarioOff'); } catch (e) { } if (v) { if (obs) obs.disconnect(); unwrap(); } else scan(); }
  function scan() {
    if (isOff()) return;
    if (!DATA || LANG !== lang()) { if (LOADING !== lang()) load(lang(), scan); return; }
    busy = true; if (obs) obs.disconnect();
    try {
      var seen = present(), root = main(), nodes = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), n, cnt = 0;
      while ((n = w.nextNode()) && cnt < 4000) { cnt++; var p = n.parentNode; if (!p || n.nodeValue.length < 2) continue; if (!/[A-Za-z]/.test(n.nodeValue)) continue; nodes.push(n); }
      nodes.forEach(function (n) {
        var p = n.parentNode; if (!p || !p.closest) return;
        if (SKIP.test(p.tagName) || p.closest('a,button,select,h1,summary,label,abbr.gl,.gl-pop,[role=tab],[role=radio],[role=button],.pt-chip,[data-nogl],header,footer,nav,.di-nav,#di-nav-root,#di-footer-root,svg')) return;
        var h = firstHit(n.nodeValue, seen); if (!h) return;
        seen[h.e.id] = 1;
        var a = document.createElement('abbr'); a.className = 'gl'; a.tabIndex = 0; a.setAttribute('role', 'button'); a.setAttribute('data-g', h.e.id); a.textContent = h.t;
        var txt = n.nodeValue, after = n.splitText(h.i); after.nodeValue = after.nodeValue.slice(h.t.length); p.insertBefore(a, after);
      });
    } catch (e) { }
    busy = false; watch();
  }
  function watch() {
    if (!window.MutationObserver) return;
    if (!obs) obs = new MutationObserver(function (ms) {
      if (busy) return; var real = ms.some(function (m) { return !(m.target.closest && m.target.closest('.gl-pop')) && [].some.call(m.addedNodes, function (x) { return !(x.nodeType === 1 && (x.classList.contains('gl') || x.classList.contains('gl-pop'))); }); });
      if (!real) return; clearTimeout(timer); timer = setTimeout(scan, 500);
    });
    obs.observe(main(), { childList: true, subtree: true });
  }
  function hide() { if (pop) { pop.style.display = 'none'; } if (cur) { cur.removeAttribute('aria-describedby'); cur = null; } }
  function show(a) {
    if (!DATA) return; var id = a.getAttribute('data-g'), e = null; DATA.entries.forEach(function (x) { if (x.id === id) e = x; }); if (!e) return;
    if (!pop) { pop = document.createElement('div'); pop.className = 'gl-pop'; pop.id = 'gl-pop'; pop.setAttribute('role', 'tooltip'); document.body.appendChild(pop); }
    pop.innerHTML = '<strong>' + esc(e.t[0]) + '</strong><span>' + esc(e.d) + '</span><a href="metodologia.html#glosario">' + esc(MORE[LANG] || MORE.es) + '</a>';
    pop.style.display = 'block'; cur = a; a.setAttribute('aria-describedby', 'gl-pop');
    var r = a.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight, vw = document.documentElement.clientWidth;
    var left = Math.max(8, Math.min(r.left + window.pageXOffset, window.pageXOffset + vw - pw - 8)), top = r.bottom + window.pageYOffset + 6;
    if (r.bottom + ph + 12 > window.innerHeight && r.top > ph + 12) top = r.top + window.pageYOffset - ph - 6;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  document.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('abbr.gl'); if (a) { ev.preventDefault(); if (cur === a) hide(); else show(a); } else if (!(ev.target.closest && ev.target.closest('.gl-pop'))) hide(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') hide(); else if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('gl')) { ev.preventDefault(); show(ev.target); } });
  document.addEventListener('mouseover', function (ev) { var a = ev.target.closest && ev.target.closest('abbr.gl'); if (a && a !== cur && window.matchMedia && window.matchMedia('(hover: hover)').matches) show(a); });
  document.addEventListener('mouseout', function (ev) { var a = ev.target.closest && ev.target.closest('abbr.gl'); if (a && window.matchMedia && window.matchMedia('(hover: hover)').matches && !(ev.relatedTarget && ev.relatedTarget.closest && ev.relatedTarget.closest('.gl-pop'))) hide(); });
  function start() { (window.requestIdleCallback || function (f) { setTimeout(f, 900); })(function () { scan(); }, { timeout: 2500 }); }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  window.DehesaGlosario = { rescan: scan, isOff: isOff, setOff: setOff };
})();
