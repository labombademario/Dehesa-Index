const KEY = process.env.MARS_API_KEY;
const H = { Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64'), Accept: 'application/json' };
import { writeFile } from 'node:fs/promises';
const out = [];
const res = await fetch('https://marsapi.ams.usda.gov/services/v1.2/reports', { headers: H });
out.push('HTTP ' + res.status);
const list = res.ok ? await res.json() : [];
const arr = Array.isArray(list) ? list : (list.results || []);
out.push('reports ' + arr.length);
for (const r of arr) {
  const s = JSON.stringify(r);
  if (/national dairy|NDPSR|dairy products sales|butter|nonfat|nfdm|cme|weekly dairy/i.test(s)) out.push(s.slice(0, 260));
}
await writeFile('data/probe-mars-dairy.txt', out.join('\n') + '\n');
