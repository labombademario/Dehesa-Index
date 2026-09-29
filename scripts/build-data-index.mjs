#!/usr/bin/env node
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const snapshotDir = path.join(root, '..', 'data', 'snapshots');
const outDir = path.join(root, '..', 'data');
const files = (await readdir(snapshotDir).catch(() => [])).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();

const byKey = {};
const all = [];

for (const file of files) {
  const doc = JSON.parse(await readFile(path.join(snapshotDir, file), 'utf8'));
  for (const observation of (doc.observations || [])) {
    const item = { ...observation, snapshotDate: file.slice(0, 10) };
    all.push(item);
    const key = observation.product + '-' + observation.region;
    const previous = byKey[key];
    if (!previous || String(item.observationDate) > String(previous.observationDate)) byKey[key] = item;
  }
}

const latest = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  observations: Object.values(byKey).sort((a, b) => (a.product + a.region).localeCompare(b.product + b.region))
};

const historyRows = [];
Object.values(byKey).forEach((o) => {
  const series = Array.isArray(o.history) ? o.history : [];
  series.forEach((point) => {
    const period = String(point.period || '');
    const year = String(point.year || '');
    let month = null;
    const monthMatch = period.match(/(\d{1,2})/);
    const monthNames = {jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
    if (monthMatch) month = monthMatch[1].padStart(2, '0');
    else if (monthNames[period]) month = String(monthNames[period]).padStart(2, '0');
    const observationDate = month ? year + '-' + month + '-01' : year ? year + '-01-01' : null;
    if (!observationDate) return;
    historyRows.push({
      id: o.id || ('di_' + o.product + '_' + o.region),
      product: o.product,
      region: o.region,
      sourceId: o.sourceId,
      observationDate,
      snapshotDate: o.snapshotDate,
      value: Number(point.value),
      currency: o.currency,
      unit: o.unit,
      frequency: o.frequency
    });
  });
});

const history = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  observations: historyRows.sort((a, b) =>
    String(a.observationDate).localeCompare(String(b.observationDate)) ||
    (a.product + a.region).localeCompare(b.product + b.region)
  )
};

const catalog = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  observationCount: all.length,
  products: [...new Set(all.map(o => o.product))].sort(),
  regions: [...new Set(all.map(o => o.region))].sort(),
  sources: [...new Set(all.map(o => o.sourceId))].sort(),
  frequencies: [...new Set(all.map(o => o.frequency))].sort(),
  latest: latest.observations.map(o => ({
    product: o.product,
    region: o.region,
    sourceId: o.sourceId,
    observationDate: o.observationDate,
    unit: o.unit,
    currency: o.currency
  }))
};

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'latest.json'), JSON.stringify(latest, null, 2) + '\n');
await writeFile(path.join(outDir, 'history.json'), JSON.stringify(history, null, 2) + '\n');
await writeFile(path.join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log('Generated latest.json, history.json and catalog.json from ' + files.length + ' snapshot(s).');
