/* Dehesa Index — cita de fuente bajo cada cifra. ES5, navegador y Node (pruebas).
   Una línea corta («USDA NASS · ago. 2026») que, al pulsarla, despliega: fuente completa con enlace, fecha del dato y de publicación,
   licencia y texto de atribución tal como los publica la fuente, y si la licencia está verificada o pendiente. Todo sale de
   data/license-registry.json a través del sourceId: ningún texto de fuente o licencia se escribe a mano en las páginas.
   DICite.load() -> Promise<registro|null>
   DICite.html(sourceId, {period, pub, note})        -> HTML de la cita (cadena vacía si el sourceId no existe)
   DICite.derived([sourceId...], {what})              -> cita de una cifra CALCULADA por Dehesa Index a partir de esas fuentes
   DICite.text(sourceId, {period})                    -> texto plano corto
   DICite.bind(root)                                  -> cierra al pulsar fuera / Esc (opcional) */
(function (root) {
  'use strict';
  var REG = null, P = null;
  var T = {
    es: { nolic: 'Licencia de reutilización aún sin registrar en Dehesa Index: se cita la fuente tal como la publica el dato.', src: 'Fuente', full: 'Fuente completa', lic: 'Licencia', att: 'Atribución', period: 'Dato del periodo', pub: 'Publicado', ver: 'Licencia verificada el', pend: 'Licencia pendiente de confirmar: se usa con la atribución indicada hasta que se confirme su alcance', all: 'Todas las fuentes y licencias', calc: 'Calculado por Dehesa Index a partir de', calcN: 'Cálculo propio: no es una cifra publicada por la fuente.', unk: 'Fuente sin registro', open: 'Ver el dato original' },
    en: { nolic: 'Reuse licence not yet recorded in Dehesa Index: the source is cited as published with the data.', src: 'Source', full: 'Full source', lic: 'Licence', att: 'Attribution', period: 'Data for', pub: 'Published', ver: 'Licence verified on', pend: 'Licence pending confirmation: used with the attribution shown until its reuse scope is confirmed', all: 'All sources and licences', calc: 'Calculated by Dehesa Index from', calcN: 'Our own calculation: not a figure published by the source.', unk: 'Unregistered source', open: 'See the original data' },
    fr: { nolic: 'Licence de réutilisation pas encore enregistrée dans Dehesa Index : la source est citée telle que publiée avec la donnée.', src: 'Source', full: 'Source complète', lic: 'Licence', att: 'Attribution', period: 'Donnée de', pub: 'Publié', ver: 'Licence vérifiée le', pend: 'Licence en attente de confirmation : utilisée avec l’attribution indiquée jusqu’à confirmation de sa portée', all: 'Toutes les sources et licences', calc: 'Calculé par Dehesa Index à partir de', calcN: 'Calcul propre : ce n’est pas un chiffre publié par la source.', unk: 'Source non enregistrée', open: 'Voir la donnée d’origine' },
    it: { nolic: 'Licenza di riutilizzo non ancora registrata in Dehesa Index: la fonte è citata come pubblicata con il dato.', src: 'Fonte', full: 'Fonte completa', lic: 'Licenza', att: 'Attribuzione', period: 'Dato di', pub: 'Pubblicato', ver: 'Licenza verificata il', pend: 'Licenza in attesa di conferma: usata con l’attribuzione indicata finché non se ne conferma l’ambito', all: 'Tutte le fonti e licenze', calc: 'Calcolato da Dehesa Index a partire da', calcN: 'Calcolo proprio: non è un dato pubblicato dalla fonte.', unk: 'Fonte non registrata', open: 'Vedi il dato originale' }
  };
  function lang() { try { return root.DehesaShared && root.DehesaShared.getLang ? root.DehesaShared.getLang() : 'es'; } catch (e) { return 'es'; } }
  function tx() { return T[lang()] || T.es; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; }
  var MON = { es: ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'] };
  var MABB = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
  /* Periodo legible: 2026-08 -> «ago. 2026»; 2026-08-31 -> «31 ago. 2026»; 2026 -> «2026»; otros textos (2026-Q2, S1…) se muestran tal cual. */
  function per(p) {
    if (p == null || p === '') return '';
    var s = String(p), m = MON[lang()] || MON.es, a;
    if ((a = s.match(/^(\d{4})-(\d{2})$/)) && +a[2] >= 1 && +a[2] <= 12) return m[+a[2] - 1] + ' ' + a[1];
    if ((a = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)) && +a[2] >= 1 && +a[2] <= 12) return (lang() === 'en' ? m[+a[2] - 1] + ' ' + (+a[3]) + ', ' + a[1] : (+a[3]) + ' ' + m[+a[2] - 1] + ' ' + a[1]);
    if ((a = s.match(/^([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/)) && MABB[a[1].toUpperCase()]) return m[MABB[a[1].toUpperCase()] - 1] + ' ' + a[2];
    return s;
  }
  function entry(id) {
    if (!REG || !REG.sources || !id) return null;
    var S = REG.sources;
    if (S[id]) return S[id];
    var k; for (k in S) if (S.hasOwnProperty(k) && (S[k].aliases || []).indexOf(id) >= 0) return S[k];
    return null;
  }
  function shortName(e) { return e.short || String(e.name || '').split(' (')[0]; }
  function load(url) {
    if (P) return P;
    if (REG) { P = Promise.resolve(REG); return P; }
    P = (typeof fetch === 'function' ? fetch(url || 'data/views/license-cite.json').then(function (r) { return r.ok ? r.json() : null; }) : Promise.resolve(null))
      .then(function (d) { REG = d && d.sources ? d : null; return REG; }).catch(function () { return null; });
    return P;
  }
  function use(reg) { REG = reg; P = Promise.resolve(reg); } // pruebas / páginas que ya tienen el registro
  function row(k, v) { return '<div class="di-cite-r"><span>' + esc(k) + '</span><span>' + v + '</span></div>'; }
  function link(u, label) { u = safeUrl(u); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>' : esc(label); }
  function html(id, o) {
    o = o || {}; var e = entry(id), t = tx(); if (!e) return '';
    var pr = per(o.period), line = esc(shortName(e)) + (pr ? ' · ' + esc(pr) : '');
    var b = row(t.full, link(e.url, e.name));
    if (pr) b += row(t.period, esc(pr));
    if (o.pub) b += row(t.pub, esc(per(o.pub)));
    b += row(t.lic, link(e.licenseUrl, e.licenseName || e.licenseId || ''));
    if (e.attributionText) b += row(t.att, esc(clean(e.attributionText)));
    b += '<div class="di-cite-s ' + (e.status === 'VERIFIED' ? 'ok' : 'pend') + '">' + esc(e.status === 'VERIFIED' ? t.ver + ' ' + (e.verifiedAt ? (root.DehesaShared && root.DehesaShared.fmtDate ? root.DehesaShared.fmtDate(e.verifiedAt) : e.verifiedAt) : '') : t.pend) + '</div>';
    if (o.note) b += '<div class="di-cite-n">' + esc(o.note) + '</div>';
    b += '<div class="di-cite-a"><a href="legal.html#licencias">' + esc(t.all) + '</a></div>';
    return '<details class="di-cite" data-src="' + esc(id) + '"><summary><span class="di-cite-i" aria-hidden="true">ⓘ</span> ' + line + '</summary><div class="di-cite-b">' + b + '</div></details>';
  }
  function clean(x) { return String(x).replace(/\s*\((?:online data code|código)?:?\s*<[^>]*>\)/gi, '').replace(/,?\s*<[^>]*>/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,])/g, '$1').trim(); }
  function derived(ids, o) {
    o = o || {}; var t = tx(), seen = {}, names = [], rows = '';
    (ids || []).forEach(function (id) { var e = entry(id); if (!e || seen[e.name]) return; seen[e.name] = 1; names.push(shortName(e)); rows += row(t.src, link(e.url, e.name)) + (e.attributionText ? row(t.att, esc(clean(e.attributionText))) : ''); });
    if (!names.length) return '';
    return '<details class="di-cite di-cite-calc"><summary><span class="di-cite-i" aria-hidden="true">ⓘ</span> ' + esc(t.calc) + ' ' + esc(names.join(', ')) + '</summary><div class="di-cite-b">' + (o.what ? '<div class="di-cite-n">' + esc(o.what) + '</div>' : '') + '<div class="di-cite-n">' + esc(t.calcN) + '</div>' + rows + '<div class="di-cite-a"><a href="legal.html#licencias">' + esc(t.all) + '</a></div></div></details>';
  }
  /* Fuente que viaja con el propio dato (p. ej. country-wages.json) y que no está en el registro de licencias: se cita tal cual, sin afirmar licencia. */
  function custom(o) {
    o = o || {}; var t = tx(); if (!o.name) return '';
    var pr = per(o.period), line = esc(o.short || o.name) + (pr ? ' · ' + esc(pr) : '');
    var b = row(t.full, link(o.url, o.name)) + (pr ? row(t.period, esc(pr)) : '') + '<div class="di-cite-s pend">' + esc(t.nolic) + '</div><div class="di-cite-a"><a href="legal.html#licencias">' + esc(t.all) + '</a></div>';
    return '<details class="di-cite"><summary><span class="di-cite-i" aria-hidden="true">ⓘ</span> ' + line + '</summary><div class="di-cite-b">' + b + '</div></details>';
  }
  function text(id, o) { var e = entry(id); if (!e) return ''; var pr = per(o && o.period); return shortName(e) + (pr ? ' · ' + pr : ''); }
  function bind(r) {
    if (typeof document === 'undefined' || document.__diCite) return; document.__diCite = 1;
    document.addEventListener('click', function (ev) { var ds = document.querySelectorAll('details.di-cite[open]'); for (var i = 0; i < ds.length; i++) if (!ds[i].contains(ev.target)) ds[i].removeAttribute('open'); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { var ds = document.querySelectorAll('details.di-cite[open]'); for (var i = 0; i < ds.length; i++) ds[i].removeAttribute('open'); } });
  }
  /* Una cita completa por fuente y bloque: si varias cifras del mismo bloque citan la misma fuente y periodo, la primera
     conserva el desplegable y las siguientes llevan solo el nombre (cada cifra sigue con su fuente al lado). */
  function compact(rootEl, blockSel) {
    if (!rootEl || !rootEl.querySelectorAll) return;
    var seen = {}, ds = rootEl.querySelectorAll('details.di-cite');
    if (blockSel) { // un bloque = el elemento mas cercano que case con blockSel (secciones anidadas no se mezclan)
      var bl = rootEl.querySelectorAll(blockSel);
      for (var j = 0; j < bl.length; j++) compactOwn(bl[j], blockSel);
      return;
    }
    for (var i = 0; i < ds.length; i++) {
      var s = ds[i].querySelector('summary'); if (!s) continue;
      var key = (ds[i].getAttribute('data-src') || '') + '|' + s.textContent.replace(/\s+/g, ' ').trim();
      if (!seen[key]) { seen[key] = 1; continue; }
      var sp = document.createElement('span'); sp.className = 'di-cite di-cite-same';
      sp.textContent = s.textContent.replace('\u24D8', '').replace(/\s+/g, ' ').trim();
      ds[i].parentNode.replaceChild(sp, ds[i]);
    }
  }
  function compactOwn(block, blockSel) {
    var seen = {}, ds = block.querySelectorAll('details.di-cite');
    for (var i = 0; i < ds.length; i++) {
      if (ds[i].parentNode.closest && ds[i].parentNode.closest(blockSel) !== block) continue;
      var s = ds[i].querySelector('summary'); if (!s) continue;
      var key = (ds[i].getAttribute('data-src') || '') + '|' + s.textContent.replace(/\s+/g, ' ').trim();
      if (!seen[key]) { seen[key] = 1; continue; }
      var sp = document.createElement('span'); sp.className = 'di-cite di-cite-same';
      sp.textContent = s.textContent.replace('\u24D8', '').replace(/\s+/g, ' ').trim();
      ds[i].parentNode.replaceChild(sp, ds[i]);
    }
  }
  var API = { load: load, use: use, html: html, compact: compact, derived: derived, custom: custom, text: text, bind: bind, per: per, entry: entry, _T: T };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else { root.DICite = API; bind(); }
})(typeof window !== 'undefined' ? window : this);
