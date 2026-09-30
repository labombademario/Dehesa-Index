#!/usr/bin/env node
/*
 * Mercados USDA AMS (API MARS): lee una lista curada de informes nacionales y
 * regionales con PRECIOS (piensos y subproductos, etanol, granos, oleaginosas,
 * legumbres, arroz, aves, huevos, subproductos cárnicos, cerdos de recría,
 * ganado directo, heno, lácteos) y los guarda como series en data/ams/.
 *
 * Los informes MARS tienen estructuras distintas, así que el lector es genérico:
 *  - busca en cada fila los campos de precio (medio, mínimo, máximo o base),
 *  - todo campo de texto que describe el producto (clase, calidad, lugar...) forma
 *    la clave de la serie; los que no cambian en todo el informe se descartan,
 *  - si una semana/día tiene dos filas distintas para la misma serie, se descarta
 *    ese punto (no se adivina cuál vale).
 * No convierte monedas ni unidades. Si falla un informe conserva su archivo anterior.
 *
 * Requiere MARS_API_KEY. Uso: node scripts/update-ams.mjs [id,id,...]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'data', 'ams');
const KEY = process.env.MARS_API_KEY;
if (!KEY) { console.error('falta MARS_API_KEY'); process.exit(1); }
const BASE = 'https://marsapi.ams.usda.gov/services/v1.2/reports/';

// fam: feed, bio, grain, oilseed, pulse, rice, poultry, meat, pig, cattle, hay, dairy
export const REPORTS = [
  ...[3510, 3511, 3512, 3618].map(id => ({ id, fam: 'feed', f: 'w' })),
  ...[3616].map(id => ({ id, fam: 'bio', f: 'w' })), { id: 3617, fam: 'bio', f: 'd' },
  { id: 2920, fam: 'grain', f: 'w' },
  ...[3046, 3223, 3043, 2850, 2711, 2771, 2787, 2851, 2886, 2892, 2912, 2928, 2932, 2960, 3049, 3088, 3091, 3100, 3146, 3148, 3156, 3167, 3186, 3192, 3225, 3239, 3463, 3878].map(id => ({ id, fam: 'grain', f: 'd' })),
  { id: 2887, fam: 'oilseed', f: 'd' },
  { id: 2914, fam: 'pulse', f: 'w' }, { id: 2917, fam: 'pulse', f: 'd' },
  { id: 1655, fam: 'rice', f: 'w' },
  ...[2843, 2734, 3888].map(id => ({ id, fam: 'poultry', f: 'd' })),
  ...[2842, 2844, 2848, 3645, 3646, 3647].map(id => ({ id, fam: 'poultry', f: 'w' })),
  { id: 2833, fam: 'meat', f: 'd' },
  ...[2838, 2839, 2835, 3641, 2911].map(id => ({ id, fam: 'meat', f: 'w' })),
  { id: 2810, fam: 'pig', f: 'w' },
  ...[2708, 2709, 2710, 2770, 2906, 2940, 3059, 3096, 3097, 3098, 3184, 3237, 3455, 2808].map(id => ({ id, fam: 'cattle', f: 'w' })),
  ...[2707, 2769, 2807, 2885, 2904, 2905, 2929, 2935, 2939, 3056, 3057, 3058, 3095, 3236, 3731, 3784, 3793, 3926].map(id => ({ id, fam: 'hay', f: 'w' })),
  ...[1034, 1035, 1036, 1038, 1039, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053, 1082, 1089, 1090, 1091, 1098, 1099, 1100, 1101, 1102].map(id => ({ id, fam: 'dairy', f: 'w' })),
  ...[2277, 2278, 2279, 2280, 2281, 2282, 2283, 2284, 2285, 2286, 2287, 2288, 2290, 2291, 2292, 2293, 2294, 2295, 2296, 2297, 2302, 2303, 2304, 2305, 2306, 2307, 2308, 2309, 2310, 2311, 2312, 2313, 2314, 2315, 2316, 2317, 2318, 2319, 2320, 2321, 2386, 2387, 2388, 2389, 2390, 2391, 2392, 2393, 2394, 2395, 2396, 2398, 2399, 2400, 2401, 2402, 2403, 2404, 2405, 2406, 2409, 2410, 2411, 2412, 2413, 2720, 2721, 3133, 3134, 3135, 3913, 3914, 3915].map(id => ({ id, fam: 'fv', f: 'd' })),
  ...[1234, 1235, 1236, 1237, 1245, 1248, 1249, 1254, 1255, 1280, 1281, 1290, 1418, 1419, 1420, 1421, 1422, 1423, 1424, 1510, 1512, 1607, 1608, 1609, 1622, 1651, 1683, 1684, 1703, 1704, 1772, 1773, 1774, 1775, 1776, 1777, 1779, 1780, 1781, 1782, 1783, 1788, 1789, 1790, 1791, 1792, 1793, 1794, 1795, 1796, 1797, 1798, 1799, 1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811, 1812, 1813, 1814, 1815, 1816, 1817, 1818, 1819, 1820, 1822, 1823, 1824, 1825, 1826, 1827, 1828, 1829, 1830, 1832, 1834, 1835, 1836, 1839, 1840, 1843, 1844, 1848, 1849, 1850, 1851, 1852, 1853, 1854, 1855, 1856, 1857, 1858, 1859, 1861, 1863, 1864, 1865, 1866, 1867, 1868, 1869, 1870, 1871, 1872, 1874, 1876, 1878, 1879, 1880, 1882, 1883, 1884, 1886, 1887, 1888, 1889, 1891, 1892, 1893, 1894, 1896, 1897, 1898, 1899, 1900, 1901, 1902, 1903, 1906, 1908, 1909, 1910, 1911, 1912, 1913, 1916, 1917, 1918, 1920, 1922, 1923, 1924, 1925, 1927, 1928, 1929, 1930, 1931, 1932, 1933, 1934, 1935, 1937, 1938, 1939, 1940, 1941, 1942, 1943, 1944, 1946, 1947, 1948, 1949, 1950, 1953, 1954, 1955, 1956, 1958, 1959, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970, 1971, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2003, 2005, 2006, 2007, 2008, 2009, 2010, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2029, 2031, 2032, 2033, 2034, 2036, 2037, 2038, 2040, 2042, 2043, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2051, 2052, 2053, 2054, 2055, 2057, 2058, 2059, 2060, 2061, 2062, 2063, 2064, 2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2075, 2077, 2078, 2079, 2080, 2081, 2083, 2084, 2086, 2087, 2088, 2089, 2090, 2092, 2093, 2094, 2095, 2096, 2097, 2098, 2099, 2100, 2101, 2103, 2104, 2105, 2110, 2111, 2112, 2113, 2114, 2115, 2116, 2117, 2118, 2119, 2120, 2122, 2123, 2124, 2125, 2126, 2127, 2128, 2129, 2130, 2131, 2132, 2133, 2134, 2135, 2136, 2137, 2139, 2140, 2142, 2144, 2145, 2146, 2147, 2148, 2149, 2150, 2151, 2152, 2153, 2154, 2155, 2156, 2157, 2158, 2159, 2160, 2161, 2162, 2163, 2164, 2165, 2166, 2168, 2169, 2170, 2171, 2172, 2173, 2174, 2175, 2176, 2177, 2178, 2180, 2181, 2182, 2183, 2184, 2185, 2186, 2188, 2189, 2190, 2191, 2192, 2194, 2195, 2196, 2197, 2198, 2199, 2200, 2201, 2202, 2203, 2204, 2206, 2207, 2208, 2209, 2210, 2211, 2212, 2213, 2214, 2215, 2216, 2217, 2218, 2219, 2220, 2221, 2222, 2223, 2224, 2225, 2227, 2228, 2229, 2230, 2234, 2236, 2238, 2247, 2248, 2252, 2253, 2256, 2257, 2258, 2259, 2262, 2378, 2379, 2383, 2415, 2528, 2713, 2772, 2894, 2895, 2896, 2897, 2922, 2934, 2937, 2938, 3087, 3090, 3102, 3103, 3104, 3161, 3241, 3242, 3338, 3339, 3340, 3365, 3368, 3369, 3370, 3371, 3407, 3410, 3411, 3412, 3414, 3415, 3416, 3417, 3418, 3429, 3453, 3454, 3456, 3459, 3460, 3467, 3468, 3470, 3473, 3474, 3475, 3476, 3477, 3479, 3483, 3484, 3485, 3488, 3490, 3509, 3615, 3620, 3622, 3623, 3624, 3626, 3628, 3631, 3632, 3633, 3634, 3635, 3648, 3653, 3654, 3659, 3662, 3665, 3666, 3670, 3671, 3672, 3673, 3675, 3676, 3677, 3678, 3686, 3692, 3724, 3775, 3777, 3785, 3790, 3791, 3792, 3794, 3795, 3801, 3873, 3874, 3879, 3880, 3882, 3891, 3892, 3893, 3894, 3900, 3902, 3903, 3904, 3906, 3907, 3909, 3916, 3917, 3919, 3920, 3921, 3922, 3923].map(id => ({ id, fam: 'auction', f: 'w', grp: 'auc' })),
  ...[2756, 2757, 2867, 2868, 3228, 3229, 3796, 3797, 2995, 3324].map(id => ({ id, fam: 'retail', f: 'w' })),
  ...[1778, 1784, 1785, 1821, 1831, 1833, 1837, 1838, 1841, 1842, 1845, 1847, 1860, 1895, 1907, 1919, 2011, 2039, 2041, 2056, 2082, 2091, 2106, 2167, 2187, 2193, 2240].map(id => ({ id, fam: 'auction', f: 'w' })),
  ...[1650, 1716, 1725, 2243, 2244, 2245, 2246, 3364, 3489, 3652, 3660].map(id => ({ id, fam: 'hay', f: 'w' })),
  ...[3050, 3183, 3905].map(id => ({ id, fam: 'hay', f: 'w' })),
  ...[2829, 2830, 2834, 2837].map(id => ({ id, fam: 'meat', f: 'd' })),
  ...[2863, 3159, 3195, 3621, 3776, 3883].map(id => ({ id, fam: 'costs', f: 'w' })),
  ...[3667, 3668, 3669].map(id => ({ id, fam: 'feed', f: 'w' })),
  { id: 3802, fam: 'feed', f: 'w' },
  { id: 2714, fam: 'grain', f: 'd' },
  { id: 3147, fam: 'grain', f: 'd' },
  { id: 3649, fam: 'poultry', f: 'w' },
  { id: 3650, fam: 'poultry', f: 'w' },
  { id: 1623, fam: 'dairy', f: 'w' },
];

const norm = k => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const num = v => { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace(/[$,]/g, '')); return Number.isFinite(n) ? n : null; };
const iso = s => { const m = /^(\d\d)\/(\d\d)\/(\d{4})/.exec(String(s || '')); return m ? m[3] + '-' + m[1] + '-' + m[2] : null; };
const AVG = new Set(['weeklyav', 'avgprice', 'wtdavgprice', 'price', 'priceavg', 'weightedavgprice', 'averageprice', 'wtdavg', 'avgpricewtd']);
const LO = new Set(['pricemin', 'pricelow', 'lowprice', 'priceminimum', 'minprice', 'pricelo']);
const HI = new Set(['pricemax', 'pricehigh', 'highprice', 'pricemaximum', 'maxprice']);
const BLO = new Set(['basismin']), BHI = new Set(['basismax']);
const UNIT = ['priceunit', 'unit', 'basisunit'];
const META = /^(reportdate|reportbegindate|reportenddate|publisheddate|officename|officecode|officecity|officestate|slugid|slugname|reporttitle|markettype|markettypecategory|finalind|revision|reportstatus|marketlocationcity|marketlocationstate|reportsection)$/;
const NOISE = /(change|direction|previous|lastyear|lastrep|lastreported|yearago|weekago|volume|loads|receipts|quantity|headcount|count|pct|percent|futuresmonth|deliverymonth|slaughter|value|epv|current$|comment|note|narrative|methodology|secondary|source|mostly)/;
const NUMOK = new Set(['weightmin', 'weightmax']);

async function get(id, from, to) {
  const url = BASE + id + '?q=report_begin_date=' + from + ':' + to + '&allSections=true';
  let err = '';
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(120000), headers: { Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64'), Accept: 'application/json' } });
      if (!r.ok) { err = 'HTTP ' + r.status; await new Promise(z => setTimeout(z, 3000 * (i + 1))); continue; }
      const d = await r.json();
      return Array.isArray(d) ? d : [d];
    } catch (e) { err = e.message; }
  }
  throw new Error(err);
}

function build(cfg, sections) {
  const rows = [];
  let title = null;
  for (const s of sections) {
    const name = s.reportSection || 'Report';
    if (name === 'Report Header') { if (s.results && s.results[0]) title = s.results[0].report_title || title; continue; }
    for (const r of (s.results || [])) rows.push({ sec: name, r });
  }
  const skippedSecs = {};
  const recs = [];
  for (const { sec, r } of rows) {
    if (!title && r.report_title) title = r.report_title;
    if (r.period && !/^current$/i.test(String(r.period))) continue; // Year Ago / Previous no son la serie actual
    let avg = null, lo = null, hi = null, blo = null, bhi = null, unit = null, bunit = null;
    const dims = {};
    for (const [k, v] of Object.entries(r)) {
      const n = norm(k);
      if (v === null || v === undefined || v === '') continue;
      if (AVG.has(n)) { avg = num(v); continue; }
      if (LO.has(n)) { lo = num(v); continue; }
      if (HI.has(n)) { hi = num(v); continue; }
      if (BLO.has(n)) { blo = num(v); continue; }
      if (BHI.has(n)) { bhi = num(v); continue; }
      if (n === 'priceunit') { unit = String(v); continue; }
      if (n === 'basisunit') { bunit = String(v); continue; }
      if (META.test(n) || NOISE.test(n)) continue;
      if (typeof v === 'number') continue;
      const sv = String(v).trim();
      if (!sv || sv === 'N/A' || sv === 'None' || sv.length > 60) continue;
      if (num(sv) !== null && !NUMOK.has(n)) continue;
      dims[k] = sv;
    }
    let a = avg, l = lo, h = hi, u = unit;
    if (!u && cfg.fam === 'fv') u = 'USD per package (see Package)';
    if (a === null && l === null && h === null) { if (blo !== null || bhi !== null) { l = blo; h = bhi; u = 'Basis ' + (bunit || unit || ''); } else { skippedSecs[sec] = (skippedSecs[sec] || 0) + 1; continue; } }
    const d = iso(r.report_end_date) || iso(r.report_date);
    if (!d || !u) { skippedSecs[sec] = (skippedSecs[sec] || 0) + 1; continue; }
    dims._sec = sec;
    recs.push({ d, dims, u: u.trim(), a, l, h, pub: String(r.published_date || '') });
  }
  // dimensiones constantes fuera
  const names = new Set(); recs.forEach(x => Object.keys(x.dims).forEach(k => names.add(k)));
  const keep = [];
  for (const k of names) { const vals = new Set(recs.map(x => x.dims[k] === undefined ? '' : x.dims[k])); if (vals.size > 1) keep.push(k); }
  const RANK = [/^commodity$|^commod$/, /^item$/, /^class$|^type$|^eggtype$|^variety$|^var$/, /^grade$|^protein$|^quality$|^primal$|^description$|^size$|^condition$|^color$|^environment$/, /location|region|state|market|origin|destination|^tradeloc/, /^quotetype$|^saletype$|^purchasetype$|^freight|^transmode$|^package|^pkg$|^sec$/];
  const rk = k => { const n = norm(k); for (let i = 0; i < RANK.length; i++) if (RANK[i].test(n)) return i; return 3.5; };
  keep.sort((a, b) => rk(a) - rk(b) || a.localeCompare(b));
  const map = new Map();
  let dup = 0;
  for (const x of recs) {
    const v = keep.map(k => x.dims[k] === undefined ? '' : x.dims[k]);
    const sk = v.join('\u0001') + '\u0002' + x.u;
    if (!map.has(sk)) map.set(sk, { v, u: x.u, pts: new Map() });
    const s = map.get(sk);
    const cur = s.pts.get(x.d);
    if (!cur) s.pts.set(x.d, [x]);
    else cur.push(x);
  }
  const series = [];
  for (const s of map.values()) {
    const pts = [];
    for (const [d, list] of [...s.pts.entries()].sort()) {
      const lastPub = list.map(x => x.pub).sort().pop();
      const c = list.filter(x => x.pub === lastPub);
      const sig = new Set(c.map(x => [x.a, x.l, x.h].join()));
      if (sig.size !== 1) { dup++; continue; }
      const x = c[0];
      pts.push([d, x.a, x.l, x.h]);
    }
    if (pts.length) series.push({ v: s.v, u: s.u, p: pts });
  }
  return { title, dn: keep.map(k => k === '_sec' ? 'Section' : k), series, skippedSecs, dup, nrows: rows.length };
}

function windowFor(cfg) {
  const t = new Date();
  const f = new Date(t.getTime() - (cfg.fam === 'fv' ? 40 : cfg.grp === 'auc' ? 190 : cfg.f === 'd' ? 130 : 760) * 864e5);
  const p = d => String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + String(d.getUTCDate()).padStart(2, '0') + '/' + d.getUTCFullYear();
  return [p(f), p(t)];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const only = process.argv[2] && process.argv[2] !== 'auc' ? process.argv[2].split(',').map(Number) : null;
  let index = { reports: [] };
  try { index = JSON.parse(await readFile(path.join(OUT, 'index.json'), 'utf8')); } catch (e) {}
  const byId = new Map((index.reports || []).map(r => [r.id, r]));
  const log = [];
  let ok = 0, bad = 0;
  const grpArg = process.argv[2] === 'auc';
  const list = REPORTS.filter(c => grpArg ? c.grp === 'auc' : (only ? only.includes(c.id) : c.grp !== 'auc'));
  async function one(cfg) {
    try {
      const [from, to] = windowFor(cfg);
      const secs = await get(cfg.id, from, to);
      const b = build(cfg, secs);
      const maxPts = cfg.grp === 'auc' ? 26 : cfg.fam === 'fv' ? 30 : cfg.f === 'd' ? 130 : 110;
      const latest = b.series.reduce((m, s) => s.p[s.p.length - 1][0] > m ? s.p[s.p.length - 1][0] : m, '');
      const cutoff = new Date(Date.now() - (cfg.fam === 'fv' ? 7 : cfg.grp === 'auc' ? 60 : cfg.f === 'd' ? 150 : 400) * 864e5).toISOString().slice(0, 10);
      const series = b.series.filter(s => s.p[s.p.length - 1][0] >= cutoff && ((cfg.fam !== 'fv' && cfg.grp !== 'auc') || s.p.length >= 3)).map(s => ({ ...s, p: s.p.slice(-maxPts) }));
      series.sort((x, y) => x.v.join('|').localeCompare(y.v.join('|')));
      if (!series.length) { log.push(cfg.id + ' SIN SERIES (filas ' + b.nrows + ', secciones sin precio ' + JSON.stringify(b.skippedSecs) + ')'); bad++; return; }
      const doc = { id: cfg.id, title: b.title || ('Informe ' + cfg.id), fam: cfg.fam, freq: cfg.f, dn: b.dn, lastDate: latest, updated: new Date().toISOString(), series };
      const txt = JSON.stringify(doc);
      await writeFile(path.join(OUT, cfg.id + '.json'), txt + '\n', 'utf8');
      byId.set(cfg.id, { id: cfg.id, title: doc.title, fam: cfg.fam, freq: cfg.f, lastDate: latest, series: series.length, kb: Math.round(txt.length / 1024) });
      log.push(cfg.id + ' OK ' + series.length + ' series, ' + b.nrows + ' filas, ultimo ' + latest + ', ' + Math.round(txt.length / 1024) + ' KB, dims=' + b.dn.join(',') + (b.dup ? ' descartados_por_ambiguedad=' + b.dup : '') + (Object.keys(b.skippedSecs).length ? ' sin_precio=' + JSON.stringify(b.skippedSecs) : ''));
      ok++;
    } catch (e) { log.push(cfg.id + ' ERROR ' + e.message); bad++; }
  }
  let next = 0;
  await Promise.all(Array.from({ length: 3 }, async () => { while (next < list.length) { const c = list[next++]; await one(c); } }));
  const reports = [...byId.values()].sort((a, b) => a.id - b.id);
  await writeFile(path.join(OUT, 'index.json'), JSON.stringify({ schemaVersion: '1.0', generatedAt: new Date().toISOString(), source: 'USDA AMS Market News (MARS API)', reports }, null, 1) + '\n', 'utf8');
  await writeFile(path.join(OUT, '_log.txt'), log.sort().join('\n') + '\n', 'utf8');
  console.log(log.join('\n'));
  console.log('OK ' + ok + ' / fallos ' + bad);
  if (!only && ok < list.length * 0.5) { console.error('Menos de la mitad de los informes se leyeron bien: se aborta'); process.exit(1); }
}
if (process.argv[1] && process.argv[1].endsWith('update-ams.mjs')) main().catch(e => { console.error(e); process.exit(1); });
