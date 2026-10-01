#!/usr/bin/env node
// Paridad del Freshness Engine: js/freshness.js y scripts/freshness.py deben dar el mismo estado, edad y fechas sobre TODAS las series reales
// (latest.json + catalogo) y sobre casos de borde, con tres "hoy" distintos. Ademas, tests unitarios de los estados.
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../js/freshness.js');
F.policy(JSON.parse(readFileSync('data/freshness-policy.json', 'utf8')));
const cases = [];
for (const o of JSON.parse(readFileSync('data/latest.json', 'utf8')).observations) cases.push([o.observationDate, o.frequency, o.sourceId]);
for (const f of readdirSync('data/catalog')) if (/^[A-Z]{2}\.json$/.test(f)) for (const s of JSON.parse(readFileSync('data/catalog/' + f, 'utf8')).series) cases.push([s.latestPeriod, s.freq, s.sourceId]);
for (const d of ['2026', '2026-02', '2024-02-29', '2025-Q4', '2025-S2', '2026-13', 'x', '', '2026-02-31', '2026-W10']) for (const fq of ['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual']) cases.push([d, fq, 'statcan']);
const NOWS = [Date.UTC(2026, 9, 1), Date.UTC(2027, 2, 15), Date.UTC(2026, 0, 31)];
const py = execFileSync('python3', ['-c', `
import sys, json; sys.path.insert(0, 'scripts'); import freshness as F
cases = json.load(sys.stdin); out = []
for now in ${JSON.stringify(NOWS)}:
    nd = F.today_ord(now)
    for d, f, s in cases:
        r = F.evaluate(d, f, s, nd); out.append([r['state'], r.get('ageDays'), F.iso(r['due']) if 'due' in r else None])
print(json.dumps(out))
`], { input: JSON.stringify(cases), maxBuffer: 1 << 28 }).toString();
const want = JSON.parse(py); let bad = 0, i = 0;
for (const now of NOWS) for (const [d, f, s] of cases) {
  const r = F.evaluate(d, f, s, now), w = want[i++];
  if (r.state !== w[0] || r.ageDays !== w[1] || (r.due || null) !== w[2]) { if (bad++ < 8) console.error('DIFIERE', d, f, s, now, JSON.stringify(r), JSON.stringify(w)); }
}
const T = (name, ok) => { if (!ok) { bad++; console.error('FALLA', name); } };
const at = (date, freq, src, y, m, d) => F.evaluate(date, freq, src, Date.UTC(y, m - 1, d)).state;
T('mensual NASS agosto, 1-oct = FRESH/LIVE (no es obsoleto)', ['LIVE', 'FRESH'].includes(at('2026-08', 'monthly', 'usda_nass', 2026, 10, 1)));
T('mensual NASS agosto, 1-feb = STALE', at('2026-08', 'monthly', 'usda_nass', 2027, 2, 1) === 'STALE');
T('semanal EU 2 ago, 1-oct = STALE', at('2026-08-02', 'weekly', 'eu_agrifood', 2026, 10, 1) === 'STALE');
T('semanal fecha de hoy = LIVE', at('2026-10-01', 'weekly', 'eia', 2026, 10, 1) === 'LIVE');
T('sin fecha = PENDING', at('', 'monthly', 'x', 2026, 10, 1) === 'PENDING' && at('2026-13', 'monthly', 'x', 2026, 10, 1) === 'PENDING');
T('anual 2024 en oct-2026 = FRESH/EXPECTED', ['LIVE', 'FRESH', 'EXPECTED_DELAY'].includes(at('2024', 'annual', 'fao', 2026, 10, 1)));
T('anual 2023 en oct-2026 = STALE (deberia seguir publicandose)', at('2023', 'annual', 'fao', 2026, 10, 1) === 'STALE');
T('anual 2020 en oct-2026 = HISTORICAL', at('2020', 'annual', 'fao', 2026, 10, 1) === 'HISTORICAL');
T('semanal terminada en 2015 = HISTORICAL, no STALE', at('2015-06-01', 'weekly', 'eu_agrifood', 2026, 10, 1) === 'HISTORICAL');
T('semanal parada hace 2 meses sigue STALE (no HISTORICAL)', at('2026-08-02', 'weekly', 'eu_agrifood', 2026, 10, 1) === 'STALE');
T('mensual terminada en 2017 = HISTORICAL', at('2017-03', 'monthly', 'mapa_es', 2026, 10, 1) === 'HISTORICAL');
T('HISTORICAL no es estado ok ni de retraso', !F.isOk('HISTORICAL') && !F.isLate('HISTORICAL') && F.isArchive('HISTORICAL') && F.isArchive('DISCONTINUED') && F.isLate('STALE'));
T('etiquetas en 4 idiomas para los 8 estados', ['LIVE','FRESH','EXPECTED_DELAY','DELAYED','STALE','HISTORICAL','DISCONTINUED','PENDING'].every(s => ['es','en','fr','it'].every(l => F.label[s] && F.label[s][l])));
const order = ['LIVE', 'FRESH', 'EXPECTED_DELAY', 'DELAYED', 'STALE', 'HISTORICAL']; let prev = -1, mono = true;
for (let k = 0; k < 900; k += 3) { const s = order.indexOf(F.evaluate('2026-06', 'monthly', 'statcan', Date.UTC(2026, 6, 1) + k * 86400000).state); if (s < prev) mono = false; prev = s; }
T('el estado solo empeora con el tiempo', mono);
console.log('Freshness: ' + cases.length * NOWS.length + ' evaluaciones comparadas, ' + bad + ' diferencias/fallos'); process.exit(bad ? 1 : 0);
