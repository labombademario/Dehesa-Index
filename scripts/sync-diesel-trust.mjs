#!/usr/bin/env node
// Sincroniza js/data.js (ficha Data Trust + constante de precio) con la última observación
// de diésel verificada en data/latest.json. Los scripts de EIA y Oil Bulletin solo escriben
// snapshots; sin este paso la ficha de confianza se queda con la fecha de la última edición manual.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_JS = path.join(root, 'js', 'data.js');
const latest = JSON.parse(await readFile(path.join(root, 'data', 'latest.json'), 'utf8'));
let data = await readFile(DATA_JS, 'utf8');
const TARGETS = {
  us: { id: 'di_diesel_us', trustKey: 'energia-diesel-us', constant: 'DIESEL_US_NATIONAL', points: 7,
        methodology: o => 'US national diesel fuel reference; USD/gallon. Observation dated ' + o.observationDate + '; EIA release dated ' + o.publicationDate + '.' },
  eu: { id: 'di_diesel_eu', trustKey: 'energia-diesel-eu', constant: 'DIESEL_EU_NATIONAL', points: 6, methodology: null }
};
for (const [region, t] of Object.entries(TARGETS)) {
  const o = latest.observations.find(x => x.id === t.id);
  if (!o || o.status !== 'verified' || !o.publicationDate) { console.log(region + ': sin observación verificada con fecha de publicación, no se toca'); continue; }
  // ficha Data Trust
  const re = new RegExp("('" + t.trustKey + "': \\{[\\s\\S]*?)observationDate: '[^']*', publicationDate: [^,]+, status: '[^']*', verifiedAt: '[^']*'");
  if (!re.test(data)) throw new Error('Ficha ' + t.trustKey + ' no reconocida');
  data = data.replace(re, (_m, a) => a + "observationDate: '" + o.observationDate + "', publicationDate: '" + o.publicationDate + "', status: 'verified', verifiedAt: '" + o.verifiedAt + "'");
  if (t.methodology) {
    const mre = new RegExp("('" + t.trustKey + "': \\{\\s*sourceId: '[^']*', frequency: '[^']*',\\s*methodology: ')(?:[^'\\\\]|\\\\.)*(')");
    data = data.replace(mre, (_m, a, b) => a + t.methodology(o) + b);
  }
  // constante de precio de la tarjeta
  const hist = (o.history || []).slice(-t.points).map(h => h.value);
  const cre = new RegExp("(var " + t.constant + " = \\{) price: [^,]+, changePct: [^,]+, history: \\[[^\\]]*\\]");
  if (!cre.test(data)) throw new Error('Constante ' + t.constant + ' no reconocida');
  data = data.replace(cre, (_m, a) => a + ' price: ' + o.value + ', changePct: ' + o.changePct + ', history: [' + hist.join(', ') + ']');
  console.log(region + ': ficha y precio sincronizados con ' + o.observationDate + ' = ' + o.value);
}
await writeFile(DATA_JS, data, 'utf8');
