#!/usr/bin/env node
// Tests de la Smart Watchlist 2.0 (js/watchlist.js): reglas combinables (any/all), cada tipo de regla, ack por periodo y por token, historial,
// Transmission Watch (solo OBSERVED_RELATIONSHIP y movimiento del insumo >= 10 %), y validacion estricta de exportar/importar.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const store = {};
const sandbox = { window: {}, document: {}, fetch: () => Promise.reject(new Error('sin red')), console };
sandbox.window.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
sandbox.window.DehesaShared = {}; sandbox.window.location = { pathname: '/' };
vm.createContext(sandbox); sandbox.window.window = sandbox.window; Object.assign(sandbox, { localStorage: sandbox.window.localStorage, location: sandbox.window.location });
vm.runInContext(readFileSync(new URL('../js/watchlist.js', import.meta.url), 'utf8'), sandbox);
const W = sandbox.window.DIWatch;
let bad = 0, n = 0;
const eq = (name, a, b) => { n++; const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) { bad++; console.error('FALLA', name, '\n   obtenido', JSON.stringify(a), '\n   esperado', JSON.stringify(b)); } };
const set = (items) => { store['di-watchlist-v1'] = JSON.stringify(items); };
const idx = (o) => Object.assign({ 'P/trigo/eu': ['trigo (EU)', 'EUR/tonelada', 'weekly', 'product', '2026-09-20', 250, 6.2], 'P/urea/eu': ['urea (EU)', 'USD/tonelada', 'monthly', 'product', '2026-08', 390, -2.5] }, o || {});
const ids = (ev) => ev.map((e) => e.s);
// --- reglas basicas
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'pct', v: 5 }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('pct >= 5 con periodo nuevo avisa', ids(W.evaluate(idx())), ['trigo/eu']);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'pct', v: 7 }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('pct 7 no avisa con +6,2', ids(W.evaluate(idx())), []);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'pct', v: 5, d: 'down' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('pct solo bajadas no avisa con una subida', ids(W.evaluate(idx())), []);
set([{ c: 'P', s: 'urea/eu', r: [{ t: 'pct', v: 2, d: 'down' }], seen: { p: '2026-07', v: 400 }, ack: '2026-07' }]);
eq('pct solo bajadas avisa con una bajada', ids(W.evaluate(idx())), ['urea/eu']);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'cross', v: 240, d: 'above' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('cruce hacia arriba avisa', ids(W.evaluate(idx())), ['trigo/eu']);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'cross', v: 240, d: 'above' }], seen: { p: '2026-09-13', v: 245 }, ack: '2026-09-13' }]);
eq('si ya estaba por encima no vuelve a avisar', ids(W.evaluate(idx())), []);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'new' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('dato nuevo', ids(W.evaluate(idx())), ['trigo/eu']);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'new' }], seen: { p: '2026-09-20', v: 250 }, ack: '2026-09-20' }]);
eq('mismo periodo y valor: nada', ids(W.evaluate(idx())), []);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'rev' }], seen: { p: '2026-09-20', v: 249 }, ack: '2026-09-20' }]);
eq('revision oficial (mismo periodo, otro valor)', ids(W.evaluate(idx())), ['trigo/eu']);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'new' }], seen: { p: '2026-09-20', v: 249 }, ack: '2026-09-20' }]);
eq('una revision sola no cuenta como dato nuevo', ids(W.evaluate(idx())), []);
// --- combinacion
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'pct', v: 5 }, { t: 'cross', v: 300, d: 'above' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('any: basta una', ids(W.evaluate(idx())), ['trigo/eu']);
set([{ c: 'P', s: 'trigo/eu', m: 'all', r: [{ t: 'pct', v: 5 }, { t: 'cross', v: 300, d: 'above' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('all: falta una, no avisa', ids(W.evaluate(idx())), []);
set([{ c: 'P', s: 'trigo/eu', m: 'all', r: [{ t: 'pct', v: 5 }, { t: 'cross', v: 240, d: 'above' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
eq('all: se cumplen todas', W.evaluate(idx()).map((e) => e.hits.length), [2]);
// --- frescura
const ctxF = { fr: false, obs: { 'P/trigo/eu': { freshness: 'DELAYED' }, 'P/urea/eu': { freshness: 'LIVE' } } };
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'fresh', v: 'DELAYED' }] }, { c: 'P', s: 'urea/eu', r: [{ t: 'fresh', v: 'DELAYED' }] }]);
eq('frescura: DELAYED cumple el umbral DELAYED; LIVE no', ids(W.evaluate(idx(), ctxF)), ['trigo/eu']);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'fresh', v: 'STALE' }] }]);
eq('frescura: DELAYED no llega a STALE', ids(W.evaluate(idx(), ctxF)), []);
eq('frescura sin contexto no inventa nada', ids(W.evaluate(idx())), []);
eq('frescura: una serie HISTORICAL no dispara la regla STALE (no es un retraso)', (() => { set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'fresh', v: 'STALE' }] }]); return ids(W.evaluate(idx(), { fr: false, obs: { 'P/trigo/eu': { freshness: 'HISTORICAL' } } })); })(), []);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'fresh', v: 'DELAYED' }] }]);
const ev1 = W.evaluate(idx(), ctxF); W.markSeen(ev1[0]);
eq('tras marcar visto, la misma frescura no repite', ids(W.evaluate(idx(), ctxF)), []);
eq('si el estado empeora, avisa de nuevo', ids(W.evaluate(idx(), { obs: { 'P/trigo/eu': { freshness: 'STALE' } } })), ['trigo/eu']);
// --- Transmission Watch
const rel = (st, ch, id) => ({ id: id || 'r1', status: st, input: { key: 'P/urea/eu' }, market: { key: 'P/trigo/eu' }, last: { input: { changePct: ch } } });
set([{ c: 'P', s: 'urea/eu', r: [{ t: 'tw' }] }]);
eq('TW: insumo movido >= 10 % con relacion observada', ids(W.evaluate(idx(), { rel: { relationships: [rel('OBSERVED_RELATIONSHIP', -12)] } })), ['urea/eu']);
eq('TW: movimiento < 10 % no', ids(W.evaluate(idx(), { rel: { relationships: [rel('OBSERVED_RELATIONSHIP', 9.9)] } })), []);
eq('TW: relacion debil/inestable no cuenta', ids(W.evaluate(idx(), { rel: { relationships: [rel('WEAK_OR_UNSTABLE', 30)] } })), []);
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'tw' }] }]);
eq('TW: el mercado afectado tambien se entera', W.evaluate(idx(), { rel: { relationships: [rel('OBSERVED_RELATIONSHIP', 15)] } }).map((e) => e.tw[0].role), ['market']);
eq('TW sin contexto no avisa', ids(W.evaluate(idx())), []);
// --- historial y ultima evaluacion
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'new' }], seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
const ev2 = W.evaluate(idx()); W.markSeen(ev2[0]);
const st = JSON.parse(store['di-watchlist-v1'])[0];
eq('markSeen guarda el periodo visto', [st.seen.p, st.ack], ['2026-09-20', '2026-09-20']);
eq('markSeen guarda el historial', [st.hist.length, st.hist[0].p, st.hist[0].h[0].t], [1, '2026-09-20', 'new']);
eq('hay marca de ultima evaluacion', !!W.meta().lastEval, true);
// --- exportar / importar
set([{ c: 'P', s: 'trigo/eu', r: [{ t: 'new' }, { t: 'pct', v: 5, d: 'up' }], m: 'all', seen: { p: '2026-09-13', v: 235 }, ack: '2026-09-13' }]);
const ex = W.exportAll(); eq('exporta formato', [ex.app, ex.kind, ex.version, ex.items.length], ['dehesa-index', 'watchlist', 2, 1]);
set([]); eq('importa lo exportado (ida y vuelta)', [W.importAll(ex, 'merge').ok, JSON.parse(store['di-watchlist-v1'])[0].m], [true, 'all']);
eq('rechaza otra app', W.importAll({ app: 'otra', kind: 'watchlist', version: 2, items: [] }, 'merge').ok, false);
eq('rechaza version desconocida', W.importAll({ app: 'dehesa-index', kind: 'watchlist', version: 9, items: [] }, 'merge').ok, false);
eq('rechaza items que no son lista', W.importAll({ app: 'dehesa-index', kind: 'watchlist', version: 2, items: {} }, 'merge').ok, false);
set([]);
const mix = W.importAll({ app: 'dehesa-index', kind: 'watchlist', version: 2, items: [
  { c: 'P', s: 'maiz/us', r: [{ t: 'cross', v: 5, d: 'above' }, { t: 'hack', v: 1 }, { t: 'pct', v: -3 }, { t: 'fresh', v: 'LIVE' }, { t: 'pct', v: 2, d: 'sideways' }] },
  { c: '<script>', s: 'a' }, { c: 'ES', s: '<img src=x onerror=alert(1)>' }, { c: 'P', s: '' }, { c: 'P', s: 'maiz/us' }, 7, null,
  { c: 'FR', s: 'fr-x', r: [{ t: 'tw' }], seen: { p: 'x'.repeat(50), v: 1 } }], }, 'merge');
eq('importacion mixta: cuenta', [mix.added, mix.skipped], [2, 6]);
eq('reglas invalidas descartadas, validas conservadas', JSON.parse(store['di-watchlist-v1']).find((x) => x.s === 'maiz/us').r, [{ t: 'cross', v: 5, d: 'above' }, { t: 'pct', v: 2 }]);
eq('seen con periodo absurdo descartado', 'seen' in JSON.parse(store['di-watchlist-v1']).find((x) => x.s === 'fr-x'), false);
const many = { app: 'dehesa-index', kind: 'watchlist', version: 2, items: Array.from({ length: 80 }, (_, i) => ({ c: 'P', s: 'p' + i + '/eu' })) };
set([]); const lim = W.importAll(many, 'merge'); eq('maximo 60 elementos', [lim.added, lim.skipped, JSON.parse(store['di-watchlist-v1']).length], [60, 20, 60]);
set([{ c: 'P', s: 'trigo/eu' }]); W.importAll({ app: 'dehesa-index', kind: 'watchlist', version: 2, items: [{ c: 'P', s: 'urea/eu' }] }, 'replace');
eq('replace sustituye la lista', JSON.parse(store['di-watchlist-v1']).map((x) => x.s), ['urea/eu']);
eq('mas de 500 items se rechaza', W.importAll({ app: 'dehesa-index', kind: 'watchlist', version: 2, items: Array.from({ length: 501 }, () => ({ c: 'P', s: 'a/b' })) }, 'merge').ok, false);
console.log(bad ? 'Watchlist: ' + bad + ' fallos de ' + n : 'Watchlist: ' + n + ' comprobaciones OK');
process.exit(bad ? 1 : 0);
