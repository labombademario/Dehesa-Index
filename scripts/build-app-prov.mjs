// Provincias de España para la app -> data/app/v1/prov/ES.json (20-oct-2026).
// Mismos datos que «Mi mercado» (ganadería por provincia, MAPA) y que el clima por provincia de la web (NASA POWER): no se calcula ni se estima nada nuevo.
// Formato: {provinces:[{id,name,climate:{city,m:[[AAAA-MM, lluvia mm, lluvia normal mm, lluvia % sobre lo normal, temperatura °C, temperatura normal °C, diferencia °C]]},
//   live:{bovino|ovino|caprino|porcino:[[AAAA-MM, cabezas]]}}], baseline, climateSource, liveSource}. Uso: node scripts/build-app-prov.mjs
import fs from 'fs'; import path from 'path'; import vm from 'vm';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const J = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const sb = { window: {} }; vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(ROOT, 'vendor/es-provinces.js'), 'utf8'), sb);
const NAMES = {}; sb.window.DEHESA_ES_PROVINCES.states.forEach(s => { NAMES[s.id] = s.name; });
const clim = J('data/es-climate-provinces.json'), SP = ['bovino', 'ovino', 'caprino', 'porcino'];
const live = {}; SP.forEach(s => { live[s] = J('data/spain-livestock/livestock-' + s + '.json'); });
const out = [];
for (const p of clim.provinces) {
  const m = p.months.filter(x => x.precipMm != null && x.tempC != null).map(x => [x.period, x.precipMm, x.precipBaselineMm, x.precipAnomalyPct, x.tempC, x.tempBaselineC, x.tempAnomalyC]);
  const lv = {};
  for (const s of SP) { const f = live[s], a = f.v[p.id] && f.v[p.id]['01']; if (a) { const pts = f.periods.map((per, i) => [per, a[i]]).filter(x => x[1] != null); if (pts.length) lv[s] = pts; } }
  if (!NAMES[p.id] || (!m.length && !Object.keys(lv).length)) continue;
  out.push({ id: p.id, name: NAMES[p.id], climate: m.length ? { city: p.city, m } : null, live: lv });
}
out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
const doc = { schemaVersion: 1, generatedAt: new Date().toISOString().slice(0, 19) + 'Z', baseline: clim.baseline, climateAsOf: clim.lastPeriod, climateSource: { name: 'NASA POWER (MERRA-2)', url: clim.source.url }, liveSource: { name: 'MAPA, Encuestas ganaderas (efectivos de mayo y noviembre)', url: 'https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/ganaderia/encuestas-ganaderas/' }, provinces: out };
fs.mkdirSync(path.join(ROOT, 'data/app/v1/prov'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/app/v1/prov/ES.json'), JSON.stringify(doc));
console.log('app/v1/prov: ' + out.length + ' provincias, ' + Math.round(JSON.stringify(doc).length / 1024) + ' KB');
