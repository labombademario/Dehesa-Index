import { writeFile } from 'node:fs/promises';
const K = process.env.NASS_API_KEY; const out = [];
for (const q of ['commodity_desc=BUTTER', 'commodity_desc=MILK&class_desc=NONFAT DRY', 'commodity_desc=DAIRY PRODUCTS']) {
  const url = 'https://quickstats.nass.usda.gov/api/api_GET/?key=' + K + '&source_desc=SURVEY&statisticcat_desc=PRICE RECEIVED&agg_level_desc=NATIONAL&year__GE=2025&format=JSON&' + q;
  const r = await fetch(url); out.push(q + ' -> HTTP ' + r.status);
  if (r.ok) { const d = (await r.json()).data || []; const m = new Map(); for (const x of d) m.set(x.short_desc, (m.get(x.short_desc) || '') + x.reference_period_desc + ' ' + x.year + '=' + x.Value + '; '); for (const [k, v] of m) out.push('  ' + k + ' :: ' + v.slice(-160)); }
}
await writeFile('data/probe-nass-dairy.txt', out.join('\n') + '\n');
