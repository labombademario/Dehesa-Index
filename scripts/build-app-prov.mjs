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
const jc = J('data/es-jcyl-prices.json'), jcK = +String(jc.lastPeriod).replace('-', ''), mAbs = k => Math.floor(k / 100) * 12 + k % 100, prevK = (k, b) => { let y = Math.floor(k / 100), m = k % 100 - b; while (m < 1) { m += 12; y--; } return y * 100 + m; };
const live = {}; SP.forEach(s => { live[s] = J('data/spain-livestock/livestock-' + s + '.json'); });
const out = [];
for (const p of clim.provinces) {
  const m = p.months.filter(x => x.precipMm != null && x.tempC != null).map(x => [x.period, x.precipMm, x.precipBaselineMm, x.precipAnomalyPct, x.tempC, x.tempBaselineC, x.tempAnomalyC]);
  const lv = {};
  for (const s of SP) { const f = live[s], a = f.v[p.id] && f.v[p.id]['01']; if (a) { const pts = f.periods.map((per, i) => [per, a[i]]).filter(x => x[1] != null); if (pts.length) lv[s] = pts; } }
  if (!NAMES[p.id] || (!m.length && !Object.keys(lv).length)) continue;
  // histórico mensual desde 2001 (mismo formato compacto que la web: mm/mes, °C, y media 2001-2020 por mes del año) para el desplegable de año
  const H = p.history, hist = H && H.p && H.p.some(v => v != null) ? { from: H.from, p: H.p, t: H.t, bp: H.baseMmDay, bt: H.baseTempC } : null;
  // Castilla y León: precios en origen de la Junta (CC BY 4.0), solo productos con dato en los últimos 12 meses; [nombre, unidad, AAAAMM, precio, % mes anterior, % año anterior]
  const jr = [];
  for (const pr of jc.products || []) { const S = pr.series && pr.series[p.id]; if (!S || !S.length) continue; const l = S[S.length - 1]; if (mAbs(jcK) - mAbs(l[0]) > 12) continue;
    const mm = {}; S.forEach(x => { mm[x[0]] = x[1]; }); const pm = mm[prevK(l[0], 1)], py = mm[prevK(l[0], 12)];
    jr.push([pr.name, pr.unit, l[0], l[1], pm ? Math.round(1000 * (l[1] / pm - 1)) / 10 : null, py ? Math.round(1000 * (l[1] / py - 1)) / 10 : null]); }
  out.push({ id: p.id, name: NAMES[p.id], climate: m.length ? { city: p.city, m, ...(hist ? { h: hist } : {}) } : null, live: lv, ...(jr.length ? { jcyl: jr } : {}) });
}
out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
const doc = { schemaVersion: 1, generatedAt: new Date().toISOString().slice(0, 19) + 'Z', baseline: clim.baseline, climateAsOf: clim.lastPeriod, climateSource: { name: 'NASA POWER (MERRA-2)', url: clim.source.url }, jcylSource: { name: jc.source.name, url: jc.source.url, license: jc.source.license, licenseUrl: jc.source.licenseUrl, lastPeriod: jc.lastPeriod }, liveSource: { name: 'MAPA, Encuestas ganaderas (efectivos de mayo y noviembre)', url: 'https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/ganaderia/encuestas-ganaderas/' }, provinces: out };
fs.mkdirSync(path.join(ROOT, 'data/app/v1/prov'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/app/v1/prov/ES.json'), JSON.stringify(doc));
console.log('app/v1/prov: ' + out.length + ' provincias, ' + Math.round(JSON.stringify(doc).length / 1024) + ' KB');
