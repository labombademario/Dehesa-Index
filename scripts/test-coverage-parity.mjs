#!/usr/bin/env node
// El Coverage Score que muestran las tarjetas de perfiles.html sale precalculado en data/catalog/manifest.json (scripts/build-data-catalog.py);
// el de la ficha de pais lo calcula en vivo DIProfile.coverage (js/perfil-pais.js). Si las dos formulas se separan, este test falla.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const win = {}; const ctx = vm.createContext({ window: win, document: {}, navigator: {}, console, Date, Math, JSON, parseInt, String, Number, Object, Array, RegExp, isNaN });
vm.runInContext(readFileSync(path.join(root, 'js/perfil-pais.js'), 'utf8'), ctx);
const DP = ctx.window.DIProfile; if (!DP || !DP.coverage) { console.error('DIProfile.coverage no disponible'); process.exit(1); }
const man = JSON.parse(readFileSync(path.join(root, 'data/catalog/manifest.json'), 'utf8')); let bad = 0, n = 0;
for (const [cc, e] of Object.entries(man.countries)) {
  if (!e.summary) continue;
  const cat = JSON.parse(readFileSync(path.join(root, 'data', e.catalog), 'utf8'));
  const S = cat.series.filter(s => s.group !== 'product' && s.format !== 'eu-regions').map(s => ({ id: s.id, label: s.label, group: s.group, frequency: s.freq, latestPeriod: s.latestPeriod, first: s.first }));
  const live = DP.coverage(S), pre = e.summary.coverage; n++;
  if (!live && !pre) continue;
  if (!live || !pre) { console.error('FALLO ' + cc + ': uno de los dos es nulo', !!live, !!pre); bad++; continue; }
  const d = Math.abs(live.score - pre.score);
  if (d > 1 || live.blocks !== pre.blocks || Math.abs(live.b - pre.b) > 1e-3 || Math.abs(live.f - pre.f) > 0.01 || Math.abs(live.d - pre.d) > 0.01 || Math.abs(live.q - pre.q) > 1e-3) { console.error('FALLO ' + cc + ': vivo ' + JSON.stringify(live) + ' vs manifiesto ' + JSON.stringify(pre)); bad++; }
}
console.log('Coverage parity: ' + n + ' paises, ' + bad + ' discrepancias'); process.exit(bad ? 1 : 0);
