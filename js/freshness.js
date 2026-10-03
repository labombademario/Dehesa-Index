/* Dehesa Index — Freshness Engine 2.0 (cliente y Node). MISMO algoritmo que scripts/freshness.py (paridad: scripts/test-freshness-parity.mjs).
   DIFreshness.evaluate(date, freq, sourceId, [nowMs]) -> {state, ageDays, periodEnd, lagDays, due, liveUntil, graceUntil, staleAfter} (fechas en ISO)
   DIFreshness.policy(policy)   -> fija la politica (data/freshness-policy.json); en el navegador DIFreshness.ready() la descarga
   Estados: LIVE, FRESH, EXPECTED_DELAY, DELAYED, STALE, HISTORICAL, PENDING (DISCONTINUED solo por declaracion en data/series-lifecycle.json; llega ya resuelto en el campo fs del catalogo). La frescura se mide contra el calendario de publicacion de la fuente, no contra la fecha del periodo. ES5. */
(function (root) {
  'use strict';
  var P = null, DAY = 86400000;
  function ord(y, m, d) { return Math.round(Date.UTC(y, m - 1, d) / DAY); }
  function dim(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function iso(o) { return new Date(o * DAY).toISOString().slice(0, 10); }
  function rnd(x) { return Math.floor(x + 0.5); }
  function parseEnd(s, freq) {
    var m = /^(\d{4})(?:-(\d{2}|Q[1-4]|S[12]))?(?:-(\d{2}))?/.exec(String(s == null ? '' : s));
    if (!m) return null;
    var y = +m[1], p = m[2], dd = m[3], mo;
    if (p && p.charAt(0) === 'Q') { mo = +p.charAt(1) * 3; return ord(y, mo, dim(y, mo)); }
    if (p && p.charAt(0) === 'S') { mo = +p.charAt(1) * 6; return ord(y, mo, dim(y, mo)); }
    if (freq === 'annual') return ord(y, 12, 31);
    if (!p) return (freq === 'monthly' || freq === 'quarterly' || freq === 'semiannual') ? ord(y, 12, 31) : ord(y, 1, 1);
    mo = +p;
    if (mo < 1 || mo > 12) return null;
    if (freq === 'quarterly') mo = Math.floor((mo - 1) / 3) * 3 + 3;
    else if (freq === 'semiannual') mo = Math.floor((mo - 1) / 6) * 6 + 6;
    if (freq === 'monthly' || freq === 'quarterly' || freq === 'semiannual' || freq === 'annual') return ord(y, mo, dim(y, mo));
    var day = +(dd || 1);
    if (day < 1 || day > dim(y, mo)) return null;
    return ord(y, mo, day);
  }
  function lagFor(source, freq) {
    var s = P.sources[source || ''], l = s && s.lagDays;
    if (l && l[freq] != null) return l[freq];
    return P.defaultLagDays[freq] != null ? P.defaultLagDays[freq] : P.defaultLagDays.monthly;
  }
  function evaluate(date, freq, source, nowMs) {
    var end = parseEnd(date, freq);
    if (end == null) return { state: 'PENDING', ageDays: null };
    var now = Math.floor((nowMs == null ? Date.now() : nowMs) / DAY);
    var period = P.periodDays[freq] != null ? P.periodDays[freq] : P.periodDays.monthly, lag = lagFor(source, freq);
    var due = end + period + lag;
    var live = end + lag + Math.max(2, rnd(P.liveFactor * period));
    var grace = due + Math.max(P.grace.minDays, Math.min(P.grace.maxDays, rnd(P.grace.factor * period)));
    var stale = due + Math.min(P.staleAfter.maxDays, rnd(P.staleAfter.factor * period));
    var hist = due + (P.historicalAfterDays[freq] != null ? P.historicalAfterDays[freq] : P.historicalAfterDays.monthly);
    var st = now <= live ? 'LIVE' : now <= due ? 'FRESH' : now <= grace ? 'EXPECTED_DELAY' : now <= stale ? 'DELAYED' : now <= hist ? 'STALE' : 'HISTORICAL';
    return { state: st, ageDays: now - end, periodEnd: iso(end), lagDays: lag, due: iso(due), liveUntil: iso(live), graceUntil: iso(grace), staleAfter: iso(stale), historicalAfter: iso(hist) };
  }
  var DT = { obs: { es: 'Última observación', en: 'Last observation', fr: 'Dernière observation', it: 'Ultima osservazione' }, due: { es: 'Publicación esperada', en: 'Next release expected', fr: 'Publication attendue', it: 'Pubblicazione attesa' }, per: { es: 'Periodicidad', en: 'Frequency', fr: 'Périodicité', it: 'Periodicità' }, st: { es: 'Estado', en: 'Status', fr: 'État', it: 'Stato' },
    fq: { daily: { es: 'diaria', en: 'daily', fr: 'quotidienne', it: 'giornaliera' }, weekly: { es: 'semanal', en: 'weekly', fr: 'hebdomadaire', it: 'settimanale' }, monthly: { es: 'mensual', en: 'monthly', fr: 'mensuelle', it: 'mensile' }, quarterly: { es: 'trimestral', en: 'quarterly', fr: 'trimestrielle', it: 'trimestrale' }, semiannual: { es: 'semestral', en: 'half-yearly', fr: 'semestrielle', it: 'semestrale' }, annual: { es: 'anual', en: 'annual', fr: 'annuelle', it: 'annuale' } } };
  function cls(state) { return state === 'LIVE' || state === 'FRESH' ? 'ok' : state === 'EXPECTED_DELAY' ? 'wait' : state === 'DELAYED' || state === 'STALE' ? 'late' : 'old'; }
  function esc(x) { return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // Punto de estado: verde actual, ambar retraso habitual, rojo retrasado, gris historico. El detalle va en aria-label y en el texto emergente (data-tip).
  function dot(f, lang, o) {
    o = o || {}; lang = DT.obs[lang] ? lang : 'es';
    var st = f && f.state || 'PENDING', L = (F.label[st] || {})[lang] || st, rows = [DT.st[lang] + ': ' + L];
    if (o.obs) rows.push(DT.obs[lang] + ': ' + o.obs);
    if (o.freq && DT.fq[o.freq]) rows.push(DT.per[lang] + ': ' + DT.fq[o.freq][lang]);
    if (f && f.due && st !== 'HISTORICAL' && st !== 'DISCONTINUED' && st !== 'PENDING') rows.push(DT.due[lang] + ': ' + f.due);
    var tip = rows.join('\n');
    return '<span class="di-fd di-fd-' + cls(st) + '" data-st="' + esc(st) + '" role="img"' + (o.focus ? ' tabindex="0"' : '') + ' aria-label="' + esc(rows.join('. ')) + '" data-tip="' + esc(tip) + '"></span>';
  }
  var F = {
    dot: dot,
    policy: function (p) { if (p) P = p; return P; },
    evaluate: function (d, f, s, n) { if (!P) throw new Error('DIFreshness: politica no cargada'); return evaluate(d, f, s, n); },
    isOk: function (state) { return !!P && P.okStates.indexOf(state) > -1; },
    isLate: function (state) { return state === 'DELAYED' || state === 'STALE'; },
    isArchive: function (state) { return state === 'HISTORICAL' || state === 'DISCONTINUED'; },
    ready: function () {
      if (P) return Promise.resolve(F);
      if (F._p) return F._p;
      var u = root.DehesaShared && root.DehesaShared.sitePath ? root.DehesaShared.sitePath('data/freshness-policy.json') : 'data/freshness-policy.json';
      return F._p = fetch(u).then(function (r) { if (!r.ok) throw new Error('freshness-policy ' + r.status); return r.json(); }).then(function (p) { P = p; return F; }).catch(function (e) { F._p = null; throw e; });
    },
    label: { LIVE: { es: 'EN DIRECTO', en: 'LIVE', fr: 'EN DIRECT', it: 'IN DIRETTA' }, FRESH: { es: 'AL DÍA', en: 'FRESH', fr: 'À JOUR', it: 'AGGIORNATO' },
      EXPECTED_DELAY: { es: 'RETRASO HABITUAL', en: 'EXPECTED DELAY', fr: 'RETARD HABITUEL', it: 'RITARDO ATTESO' }, DELAYED: { es: 'RETRASADO', en: 'DELAYED', fr: 'EN RETARD', it: 'IN RITARDO' },
      STALE: { es: 'DESACTUALIZADO', en: 'STALE', fr: 'OBSOLÈTE', it: 'OBSOLETO' }, HISTORICAL: { es: 'HISTÓRICA', en: 'HISTORICAL', fr: 'HISTORIQUE', it: 'STORICA' }, DISCONTINUED: { es: 'DISCONTINUADA', en: 'DISCONTINUED', fr: 'ARRÊTÉE', it: 'INTERROTTA' }, PENDING: { es: 'PENDIENTE', en: 'PENDING', fr: 'EN ATTENTE', it: 'IN ATTESA' } }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = F; else root.DIFreshness = F;
})(typeof window !== 'undefined' ? window : globalThis);
