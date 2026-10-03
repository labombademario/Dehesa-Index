#!/usr/bin/env node
// Punto de estado del dato (DIFreshness.dot): verde/ambar/rojo/gris segun el estado, etiqueta accesible con estado, ultima observacion, periodicidad y publicacion esperada, en 4 idiomas, sin undefined. Uso: node scripts/test-fresh-dots.mjs
import fs from 'node:fs'; import { createRequire } from 'node:module';
const F = createRequire(import.meta.url)('../js/freshness.js'); F.policy(JSON.parse(fs.readFileSync('data/freshness-policy.json', 'utf8')));
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const want = { LIVE: 'ok', FRESH: 'ok', EXPECTED_DELAY: 'wait', DELAYED: 'late', STALE: 'late', HISTORICAL: 'old', DISCONTINUED: 'old', PENDING: 'old' };
for (const l of ['es', 'en', 'fr', 'it']) for (const [st, c] of Object.entries(want)) {
  const h = F.dot({ state: st, due: '2026-10-10' }, l, { obs: '2026-09-30', freq: 'monthly' });
  ok(l + ' ' + st + ' clase', h.includes('di-fd-' + c)); ok(l + ' ' + st + ' etiqueta', h.includes(F.label[st][l]) && !/undefined|NaN|\[object/.test(h));
  ok(l + ' ' + st + ' observacion', h.includes('2026-09-30')); ok(l + ' ' + st + ' accesible', /role="img"/.test(h) && /aria-label="[^"]{10,}"/.test(h));
  if (c === 'old') ok(l + ' ' + st + ' sin fecha esperada', !h.includes('2026-10-10'));
}
ok('escapa HTML', !F.dot({ state: 'FRESH' }, 'es', { obs: '<b>x"' }).includes('<b>'));
console.log(fail ? 'test-fresh-dots: ' + fail + ' fallos' : 'test-fresh-dots: OK'); process.exit(fail ? 1 : 0);
