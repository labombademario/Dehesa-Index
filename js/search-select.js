/* Dehesa Index — selector con buscador (norma del sitio, 28-oct-2026): cada <select data-search> con mas de 12 opciones se sustituye por un boton
   que abre un cuadro con campo de busqueda y la lista agrupada. Escribir filtra (sin distinguir mayusculas ni tildes; todas las palabras deben aparecer
   en el nombre de la opcion o de su grupo). Teclado: flechas, Intro, Esc. Como js/chip-select.js: el <select> original sigue en el DOM (oculto) y recibe
   el valor y el evento «change», asi que el codigo de cada bloque no cambia. ES5. */
(function () {
  'use strict';
  var MIN = 12, uid = 0;
  var L = {
    es: { ph: 'Buscar en la lista…', none: 'Sin resultados', n: ' opciones', clear: 'Borrar búsqueda' },
    en: { ph: 'Search the list…', none: 'No results', n: ' options', clear: 'Clear search' },
    fr: { ph: 'Chercher dans la liste…', none: 'Aucun résultat', n: ' options', clear: 'Effacer la recherche' },
    it: { ph: 'Cerca nell’elenco…', none: 'Nessun risultato', n: ' opzioni', clear: 'Cancella la ricerca' }
  };
  var CSS = '.ss{position:relative;display:inline-block;max-width:100%;vertical-align:middle}.ss-btn{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:220px;max-width:100%;width:100%;text-align:left;cursor:pointer}.ss-cur{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ss-car{color:var(--text-faint);flex:none}'
    + '.ss-pop{position:absolute;z-index:60;left:0;top:calc(100% + 4px);width:min(460px,92vw);background:var(--surface,#fff);color:var(--text,inherit);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:8px}.ss-pop[hidden]{display:none}'
    + '.ss-qrow{position:relative;margin-bottom:6px}.ss-q{width:100%;box-sizing:border-box;font:inherit;font-size:14px;padding:9px 34px 9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface,#fff);color:inherit}.ss-q:focus-visible,.ss-btn:focus-visible{outline:2px solid var(--accent,#1f3d2f);outline-offset:1px}'
    + '.ss-x{position:absolute;right:4px;top:50%;transform:translateY(-50%);border:0;background:none;font-size:20px;line-height:1;padding:4px 9px;cursor:pointer;color:var(--text-faint)}.ss-x[hidden]{display:none}'
    + '.ss-list{list-style:none;margin:0;padding:0;max-height:min(300px,50vh);overflow:auto;overscroll-behavior:contain;position:relative}.ss-g{font-size:11px;font-weight:700;letter-spacing:.4px;color:var(--text-faint);padding:10px 10px 4px}'
    + '.ss-o{padding:6px 10px;border-radius:8px;cursor:pointer;font-size:14px;line-height:1.3}.ss-o.ss-act{background:var(--surface-2,rgba(0,0,0,.07))}.ss-o.ss-sel{font-weight:700}.ss-o.ss-sel::before{content:"✓ "}.ss-o[aria-selected="true"].ss-act{background:var(--accent,#1f3d2f);color:#fff}'
    + '.ss-none{padding:12px 10px;color:var(--text-faint);font-size:14px}.ss-none[hidden]{display:none}.ss-cnt{font-size:11.5px;color:var(--text-faint);padding:4px 10px 0}.ss-cnt:empty{display:none}';
  function css() { if (document.getElementById('ss-css')) return; var s = document.createElement('style'); s.id = 'ss-css'; s.textContent = CSS; document.head.appendChild(s); }
  function lg() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return L[l] ? l : 'es'; }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[áàâäã]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôöõ]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ñ/g, 'n').replace(/ç/g, 'c');
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function build(sel) {
    var items = [], i, g, o, kids = sel.children;
    for (i = 0; i < kids.length; i++) {
      g = kids[i];
      if (g.tagName === 'OPTGROUP') { items.push({ group: g.label }); for (o = 0; o < g.children.length; o++) items.push({ v: g.children[o].value, t: g.children[o].textContent, g: g.label }); }
      else if (g.tagName === 'OPTION') items.push({ v: g.value, t: g.textContent, g: '' });
    }
    var nopt = items.filter(function (x) { return !x.group; }).length;
    if (nopt <= MIN) return;
    sel.setAttribute('data-ss', '1'); css();

    var id = 'ss' + (++uid), T = L[lg()];
    var wrap = el('div', 'ss'), btn = el('button', 'ss-btn di-field-input'), cur = el('span', 'ss-cur'), car = el('span', 'ss-car', '▾');
    var pop = el('div', 'ss-pop'), q = el('input', 'ss-q'), clr = el('button', 'ss-x', '×'), list = el('ul', 'ss-list'), none = el('div', 'ss-none', T.none), cnt = el('div', 'ss-cnt');
    btn.type = 'button'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', id + '-l');
    var lab = sel.id ? document.querySelector('label[for="' + sel.id + '"]') : null;
    if (lab) { if (!lab.id) lab.id = id + '-lab'; btn.setAttribute('aria-labelledby', lab.id + ' ' + id + '-cur'); } else btn.setAttribute('aria-label', sel.getAttribute('aria-label') || '');
    cur.id = id + '-cur';
    q.type = 'search'; q.setAttribute('aria-label', T.ph); q.placeholder = T.ph; q.autocomplete = 'off'; q.setAttribute('autocapitalize', 'off'); q.setAttribute('spellcheck', 'false');
    q.setAttribute('role', 'combobox'); q.setAttribute('aria-controls', id + '-l'); q.setAttribute('aria-expanded', 'true'); q.setAttribute('aria-autocomplete', 'list');
    clr.type = 'button'; clr.setAttribute('aria-label', T.clear); clr.hidden = true;
    list.id = id + '-l'; list.setAttribute('role', 'listbox'); none.hidden = true; cnt.setAttribute('aria-live', 'polite');
    btn.appendChild(cur); btn.appendChild(car);
    var qrow = el('div', 'ss-qrow'); qrow.appendChild(q); qrow.appendChild(clr);
    pop.appendChild(qrow); pop.appendChild(list); pop.appendChild(none); pop.appendChild(cnt); pop.hidden = true;
    wrap.appendChild(btn); wrap.appendChild(pop);
    sel.style.display = 'none'; sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
    sel.parentNode.insertBefore(wrap, sel.nextSibling);

    var lis = [], act = -1, isOpen = false;
    function curLabel() { for (var k = 0; k < items.length; k++) if (!items[k].group && items[k].v === sel.value) return items[k].t; return ''; }
    function paint() { cur.textContent = curLabel(); }
    function draw() {
      var words = norm(q.value).split(/\s+/).filter(Boolean), shown = 0, lastG = null, pendingG = null;
      list.innerHTML = ''; lis = []; act = -1;
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        if (it.group) { pendingG = it; continue; }
        var hay = norm(it.t + ' ' + it.g), ok = true;
        for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) { ok = false; break; }
        if (!ok) continue;
        if (it.g && it.g !== lastG) { var h = el('li', 'ss-g', it.g); h.setAttribute('role', 'presentation'); list.appendChild(h); lastG = it.g; }
        var li = el('li', 'ss-o', it.t); li.setAttribute('role', 'option'); li.id = id + '-o' + k; li.setAttribute('data-v', it.v);
        if (it.v === sel.value) { li.setAttribute('aria-selected', 'true'); li.className += ' ss-sel'; if (act < 0) act = lis.length; }
        lis.push(li); list.appendChild(li); shown++;
      }
      if (words.length && lis.length) act = 0;
      none.hidden = shown > 0; clr.hidden = !q.value;
      cnt.textContent = words.length ? shown + T.n : '';
      mark(act, true);
    }
    function mark(n, scroll) {
      for (var k = 0; k < lis.length; k++) lis[k].classList.remove('ss-act');
      act = n;
      if (n >= 0 && lis[n]) { lis[n].classList.add('ss-act'); q.setAttribute('aria-activedescendant', lis[n].id); if (scroll) { var top = lis[n].offsetTop - list.offsetTop; if (top < list.scrollTop + 30 || top > list.scrollTop + list.clientHeight - 40) list.scrollTop = Math.max(0, top - 60); } }
      else q.removeAttribute('aria-activedescendant');
    }
    function open() {
      if (isOpen) return; isOpen = true; pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); wrap.classList.add('ss-open'); q.value = ''; draw();
      q.focus();
    }
    function close(back) { if (!isOpen) return; isOpen = false; pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); wrap.classList.remove('ss-open'); if (back) btn.focus(); }
    function pick(v) {
      close(true);
      if (v === sel.value) return;
      sel.value = v; paint();
      var ev; if (typeof Event === 'function') ev = new Event('change', { bubbles: true }); else { ev = document.createEvent('Event'); ev.initEvent('change', true, true); }
      sel.dispatchEvent(ev);
    }
    btn.addEventListener('click', function () { if (isOpen) close(true); else open(); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
    q.addEventListener('input', draw);
    clr.addEventListener('click', function () { q.value = ''; draw(); q.focus(); });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function (e) { var t = e.target; while (t && t !== list && !(t.getAttribute && t.getAttribute('data-v') !== null && t.tagName === 'LI')) t = t.parentNode; if (t && t !== list) pick(t.getAttribute('data-v')); });
    list.addEventListener('mousemove', function (e) { var t = e.target; if (t && t.tagName === 'LI' && t.getAttribute('data-v') !== null) { var n = lis.indexOf(t); if (n >= 0 && n !== act) mark(n, false); } });
    q.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); if (lis.length) mark(Math.min(lis.length - 1, act + 1), true); }
      else if (k === 'ArrowUp') { e.preventDefault(); if (lis.length) mark(Math.max(0, act - 1), true); }
      else if (k === 'Home' && e.ctrlKey) { e.preventDefault(); mark(0, true); }
      else if (k === 'End' && e.ctrlKey) { e.preventDefault(); mark(lis.length - 1, true); }
      else if (k === 'Enter') { e.preventDefault(); if (lis[act]) pick(lis[act].getAttribute('data-v')); }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (k === 'Tab') close(false);
    });
    document.addEventListener('mousedown', function (e) { if (isOpen && !wrap.contains(e.target)) close(false); });
    if (lab) lab.addEventListener('click', function (e) { e.preventDefault(); btn.focus(); });
    sel.addEventListener('change', paint);
    paint();
  }

  function scan(root) {
    var all = (root || document).querySelectorAll('select[data-search]:not([data-ss])');
    for (var i = 0; i < all.length; i++) build(all[i]);
  }
  scan(document);
  if (window.MutationObserver) new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeType === 1 && (n.matches && n.matches('select[data-search]') || n.querySelector && n.querySelector('select[data-search]'))) { scan(document); return; } }
  }).observe(document.body, { childList: true, subtree: true });
})();
