#!/usr/bin/env node
// Identidad visible del instrumento: cobertura (todo instrumento/indice de product-metadata tiene identidad), reglas de comparacion y revision por producto.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const I = require('../js/instrument-identity.js');
const J = f => JSON.parse(readFileSync(f, 'utf8'));
I.data(J('data/instrument-identity.json'));
const meta = J('data/product-metadata.json').products, ids = {};
for (const f of readdirSync('data/prices/latest')) for (const o of J('data/prices/latest/' + f).observations) ids[o.region + '/' + o.product] = o.id;
let bad = 0; const T = (n, ok) => { if (!ok) { bad++; console.error('FALLA', n); } };
const review = [];
for (const [pid, m] of Object.entries(meta)) {
  const inst = m.instruments.map(i => ids[i.region + '/' + i.product]).filter(Boolean).map(id => ({ id, e: I.get(id) }));
  T(pid + ': todos los instrumentos tienen identidad', inst.every(x => x.e));
  for (const x of inst) for (const l of ['es', 'en', 'fr', 'it']) { const s = I.line(x.e, l); T(x.id + ' ' + l + ': linea de identidad completa', s.length > 15 && !/undefined|null/.test(s)); }
  for (const x of m.indices.map(i => ids[i.region + '/' + i.product]).filter(Boolean)) T(x + ': indice con identidad', I.get(x) && I.get(x).kind === 'index');
  const lv = {}; for (let a = 0; a < inst.length; a++) for (let b = a + 1; b < inst.length; b++) { const c = I.compare(inst[a].e, inst[b].e, 'es'); lv[c.level] = (lv[c.level] || 0) + 1; }
  review.push([pid, inst.length, lv.same || 0, lv.qualified || 0, lv.different || 0]);
}
const g = id => I.get(id);
const s = ['di_pienso_harina_soja_eu', 'di_pienso_harina_soja_us', 'di_cereales_soja_grano_ca'].map(g);
T('soja UE y EE. UU.: misma forma pero NO equivalentes (calidad y etapa distintas)', I.compare(s[0], s[1], 'es').level === 'qualified' && I.compare(s[0], s[1], 'es').diffs.map(d => d.dim).join() === 'grade,stage');
T('harina frente a grano de soja: no se calcula diferencia', I.compare(s[0], s[2], 'es').level === 'different' && I.compare(s[1], s[2], 'es').level === 'different');
T('la linea de la soja UE nombra producto, calidad, mercado y etapa', /Harina de soja 40–50 % de proteína, España, salida de fábrica/.test(I.line(s[0], 'es')));
T('la linea de la soja EE. UU. nombra Iowa y FOB', /Harina de soja 46,5–48 % de proteína, Iowa \(EE\. UU\.\), FOB/.test(I.line(s[1], 'es')));
T('la linea de la soja de Canada nombra Ontario y precio en granja', /Soja grano, Ontario \(Canadá\), precio en granja/.test(I.line(s[2], 'es')));
T('un indice nunca es equivalente a un precio', I.compare(g('di_defra_wheat_output_index'), g('di_cereales_trigo_eu'), 'es').level === 'different');
T('mismo instrumento en otro mercado = same', I.compare(g('di_cereales_maiz_ca'), { ...g('di_cereales_maiz_ca'), market: g('di_cereales_trigo_ca').market }, 'es').level === 'same');
T('pollo UE (ave entera) y EE. UU. (peso vivo) son formas distintas', I.compare(g('di_avicultura_pollo_eu'), g('di_pollo_us'), 'es').level === 'different');
T('cerdo UE (canal) y EE. UU. (peso vivo) son formas distintas', I.compare(g('di_porcino_cerdo_eu'), g('di_cerdo_us'), 'es').level === 'different');
console.log('Revision de identidad por producto (pares de instrumentos: iguales / orientativos / distintos):');
for (const r of review) console.log('  ' + r[0].padEnd(14) + r[1] + ' instr. | mismo ' + r[2] + ' | orientativo ' + r[3] + ' | distinto ' + r[4]);
console.log('Identidad: ' + review.length + ' productos, ' + bad + ' fallos'); process.exit(bad ? 1 : 0);
