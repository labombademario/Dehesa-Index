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
await writeFile(path.join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log('Generated data/latest.json and data/catalog.json from ' + files.length + ' snapshot(s).');
