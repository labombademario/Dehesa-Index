/* Dehesa Index — selector con botones (norma del sitio, 21-oct-2026): cada <select data-chips> se sustituye por una fila de botones con emoticono.
   Como js/country-picker.js: el <select> original sigue en el DOM (oculto) y recibe el valor y el evento «change», así que el código de cada bloque no cambia.
   Listas largas: se ven los primeros 8 (siempre con el elegido) y «Ver todos» despliega el resto. El emoticono sale del texto de la opción
   (en los cuatro idiomas); si ninguno encaja, el botón va sin él. data-chips="noemo" lo quita. ES5. */
(function () {
  'use strict';
  var MAX = 8;
  var EMO = [
    [/remolacha azucar|sugar ?beet|betterave sucr|barbabietola da zucchero|sugarbeet/, '🍬'], [/remolacha forraj|fodder beet|betterave fourr|barbabietola da foraggio/, '🌿'],
    [/patata|potato|pomme de terre|patat/, '🥔'], [/colza|rapeseed|canola/, '🌼'], [/girasol|sunflower|tournesol/, '🌻'], [/soja|soy|soia/, '🫘'],
    [/guisante|\bpeas?\b|\bpois\b|pisell/, '🫛'], [/haba|judia|bean|feve|fava|fagiol|lupin|altramuz|legumin|pulse|lentej|lentil|lentill|lenticch/, '🫘'],
    [/maiz|maize|\bcorn\b|\bmais\b/, '🌽'], [/arroz|\brice\b|\briz\b|\briso\b/, '🍚'],
    [/trigo|wheat|\bble\b|frumento|centeno|\brye\b|seigle|segale|triticale|avena|\boats?\b|avoine|cebada|barley|\borge\b|orzo|cereal|cereal/, '🌾'],
    [/mantequilla|butter|beurre|burro/, '🧈'], [/queso|cheese|fromage|formaggi/, '🧀'], [/leche|\bmilk\b|\blait\b|latte|lacte|dairy|laiti/, '🥛'],
    [/cerdo|porcin|\bpigs?\b|\bhogs?\b|\bporc|suin|swine|sows?\b|cerda|lechon|piglet|maiale/, '🐖'],
    [/vacun|bovin|cattle|\bcows?\b|vaca|bull|toro|steer|novill|heifer|vaquill|calf|calves|terner|veal|beef|vitell|manz/, '🐄'],
    [/ovin|sheep|lamb|cordero|agneau|agnell|\bewes?\b|oveja|pecor/, '🐑'], [/caprin|goat|cabra|chevre|capra/, '🐐'],
    [/pavo|turkey|dinde|tacchin/, '🦃'], [/huevo|\beggs?\b|oeuf|uova/, '🥚'], [/pollo|chicken|poulet|broiler|poultry|\baves\b|volaill|pollame|gallin/, '🐔'],
    [/manzana|\bapples?\b|\bpommes?\b|\bmele?\b/, '🍎'], [/\bperas?\b|\bpears?\b|poire|\bpere\b/, '🍐'], [/\buvas?\b|grape|raisin|\bvino\b|\bwine\b|\bvin\b/, '🍇'],
    [/oliv/, '🫒'], [/tomate|tomato|pomodor/, '🍅'], [/fruta|fruit|frutt/, '🍑'], [/hortaliz|verdura|vegetable|legume|ortagg/, '🥬'],
    [/fertiliz|abono|engrais|concim|nitrog|nitrat/, '🧪'], [/agua|water|\beau\b|acqua|irrig|riego/, '💧'], [/sequia|drought|secheresse|siccit/, '🏜️'],
    [/pesca|fish|peche|pesce|acuicult|aquacult/, '🐟'], [/madera|wood|timber|\bbois\b|legn|forest|bosque/, '🌲'],
    [/rendimiento|yield|rendement|\bresa\b/, '📈'], [/produccion|production|produzione|cosecha|harvest|recolte|raccolt/, '📦'],
    [/superficie|\barea\b|surface|hectar/, '🗺️'], [/precio|price|\bprix\b|prezz/, '💶'], [/sacrific|slaughter|abattage|macell/, '🏭'],
    [/censo|cabana|cheptel|consistenz|\bherd\b|cabezas|heads|effectif|capi\b/, '🐾'], [/ayuda|subsid|aide|sussid|\bpac\b|\bcap\b/, '🏛️'],
    [/subasta|auction|enchere|asta/, '🔨'], [/region|provinc|estado|state|land|departament/, '📍']
  ];
  function norm(s) { return String(s || '').toLowerCase().replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ñ/g, 'n').replace(/ç/g, 'c'); }
  function emoOf(t) { var n = norm(t); for (var i = 0; i < EMO.length; i++) if (EMO[i][0].test(n)) return EMO[i][1]; return ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var L = { es: ['Ver todos', 'Ver menos'], en: ['Show all', 'Show fewer'], fr: ['Tout voir', 'Voir moins'], it: ['Vedi tutti', 'Vedi meno'] };
  function lg() { var l = window.DehesaShared && window.DehesaShared.getLang ? window.DehesaShared.getLang() : 'es'; return L[l] ? l : 'es'; }
  var CSS = '.dch{margin:6px 0 4px;min-width:0;max-width:100%}.dch-l{display:block;font-size:12.5px;color:var(--text-tertiary,#666);margin:0 0 4px}' +
    '.dch-row{display:flex;flex-wrap:wrap;gap:6px}.dch-b{font:inherit;font-size:14px;min-height:38px;padding:0 12px;border-radius:999px;border:1px solid var(--border,#d6cfbb);background:var(--surface,#fffdf7);color:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1.2;text-align:left}' +
    '.dch-b[aria-pressed="true"]{background:var(--text,#1d2a22);color:var(--bg,#fffdf7);border-color:var(--text,#1d2a22);font-weight:600}.dch-b:focus-visible{outline:2px solid var(--focus,#2b5f9e);outline-offset:2px}' +
    '.dch-x{display:none}.dch.dch-all .dch-x{display:inline-flex}.dch-m{border-style:dashed;color:var(--text-tertiary,#555)}.dch-g{flex-basis:100%;font-size:12px;color:var(--text-tertiary,#666);margin:4px 0 0}' +
    '.de-ctl .dch{flex:1 1 100%}.dch-hide{display:none!important}';
  function css() { if (document.getElementById('dch-css')) return; var s = document.createElement('style'); s.id = 'dch-css'; s.textContent = CSS; document.head.appendChild(s); }
  var OPEN = {}, LAST = null;   // grupos desplegados y último grupo pulsado (para devolverle el foco cuando el bloque se vuelve a pintar)
  function sig(sel) { var a = [], at = sel.attributes; for (var i = 0; i < at.length; i++) if (/^data-/.test(at[i].name) && at[i].name !== 'data-chips') a.push(at[i].name + '=' + at[i].value); return a.join('&') || (sel.name || sel.id || ''); }
  function labelOf(sel) {
    var lb = sel.closest ? sel.closest('label') : null, t = '';
    if (lb) { for (var i = 0; i < lb.childNodes.length; i++) { var n = lb.childNodes[i]; if (n.nodeType === 3) t += n.textContent; else if (n.nodeType === 1 && n !== sel && !/^(SELECT|BR)$/.test(n.tagName)) t += n.textContent; } }
    t = t.replace(/\s+/g, ' ').trim();
    return { el: lb, text: t || sel.getAttribute('aria-label') || '' };
  }
  function enhance(sel) {
    if (sel._dch || !sel.options) return; sel._dch = 1; css();
    var noemo = sel.getAttribute('data-chips') === 'noemo', lab = labelOf(sel), k = sig(sel), opts = [], groups = false;
    for (var i = 0; i < sel.options.length; i++) { var o = sel.options[i], g = o.parentNode && o.parentNode.tagName === 'OPTGROUP' ? o.parentNode.label : null; if (g) groups = true; opts.push({ v: o.value, t: o.textContent.trim(), g: g, on: o.selected, dis: o.disabled }); }
    if (opts.length < 2) return;
    // años o campañas en lista larga: se quedan como desplegable (una fila de 30 años no ayuda)
    if (opts.length > 6 && opts.every(function (o) { return /^\s*((19|20)\d\d([\/\u2013-]\d{2,4})?|(19|20)\d\d\s*[-\u2013]\s*(19|20)\d\d)\s*$/.test(o.t); })) { sel._dch = 0; return; }
    var box = document.createElement('div'); box.className = 'dch' + (OPEN[k] ? ' dch-all' : ''); box.setAttribute('role', 'group'); if (lab.text) box.setAttribute('aria-label', lab.text);
    var cur = -1; opts.forEach(function (o, j) { if (o.on) cur = j; });
    var many = !groups && opts.length > MAX, h = lab.text ? '<span class="dch-l">' + esc(lab.text) + '</span>' : '', lastG = null;
    h += '<div class="dch-row">';
    opts.forEach(function (o, j) {
      if (groups && o.g !== lastG) { lastG = o.g; if (o.g) h += '<span class="dch-g">' + esc(o.g) + '</span>'; }
      var hid = many && j >= MAX && j !== cur, e = noemo ? '' : emoOf(o.t);
      h += '<button type="button" class="dch-b' + (hid ? ' dch-x' : '') + '" data-dch-v="' + j + '" aria-pressed="' + (j === cur) + '"' + (o.dis ? ' disabled' : '') + '>' + (e ? '<span aria-hidden="true">' + e + '</span>' : '') + '<span>' + esc(o.t) + '</span></button>';
    });
    if (many) { var n = opts.length, tx = L[lg()]; h += '<button type="button" class="dch-b dch-m" data-dch-more="1" aria-expanded="' + !!OPEN[k] + '">' + esc(OPEN[k] ? tx[1] : tx[0] + ' (' + n + ')') + ' ' + (OPEN[k] ? '▴' : '▾') + '</button>'; }
    h += '</div>'; box.innerHTML = h;
    var host = lab.el && lab.el.parentNode ? lab.el : sel;
    host.parentNode.insertBefore(box, host.nextSibling);
    if (lab.el) lab.el.classList.add('dch-hide'); else sel.classList.add('dch-hide');
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('button') : null; if (!b || !box.contains(b)) return;
      if (b.getAttribute('data-dch-more')) { OPEN[k] = !OPEN[k]; box.classList.toggle('dch-all', !!OPEN[k]); var tx2 = L[lg()]; b.setAttribute('aria-expanded', String(!!OPEN[k])); b.textContent = (OPEN[k] ? tx2[1] : tx2[0] + ' (' + opts.length + ')') + ' ' + (OPEN[k] ? '▴' : '▾'); return; }
      var j = +b.getAttribute('data-dch-v'); if (isNaN(j) || sel.selectedIndex === j) return;
      Array.prototype.forEach.call(box.querySelectorAll('[data-dch-v]'), function (x) { x.setAttribute('aria-pressed', String(+x.getAttribute('data-dch-v') === j)); });
      LAST = { k: k, v: opts[j].v }; setTimeout(function () { LAST = null; }, 4000);
      sel.selectedIndex = j; sel.dispatchEvent(new Event('change', { bubbles: true }));
      if (box.isConnected) b.focus();
    });
    // si el bloque se ha vuelto a pintar tras pulsar, el foco vuelve al botón elegido del mismo grupo (teclado y lectores de pantalla)
    if (LAST && LAST.k === k) { var bf = box.querySelector('[aria-pressed="true"]'); if (bf) setTimeout(function () { if (bf.isConnected) bf.focus(); }, 0); LAST = null; }
  }
  function scan(root) { var r = root && root.querySelectorAll ? root : document; Array.prototype.forEach.call(r.querySelectorAll('select[data-chips]'), enhance); if (r.matches && r.matches('select[data-chips]')) enhance(r); }
  scan(document);
  new MutationObserver(function (ms) { ms.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); }); }); }).observe(document.documentElement, { childList: true, subtree: true });
  window.DehesaChipSelect = { scan: scan, emo: emoOf };
})();
