// Dehesa Index — conector MCP (nucleo comun al servidor local y al remoto).
// Lee la API publica de https://dehesaindex.com/data/api/v1 (solo series con licencia comercial apta o con condiciones).
// Sin dependencias. Cada respuesta lleva fuente, licencia y atribucion: quien la use debe citarlas.
export const SERVER = { name: 'dehesa-index', version: '1.0.0' };
export const PROTOCOL = '2025-06-18';
const TERMS = 'https://dehesaindex.com/condiciones';
const NOTE = 'Official-source data, nothing estimated. Cite the attribution field. Information only, not financial advice.';
const LANGS = ['es', 'en', 'fr', 'it'];
const DAY = 86400000;
const clamp = (n, lo, hi, d) => { n = Number(n); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.trunc(n))) : d; };
const nm = (o, l) => (o && (o[l] || o.en || o.es)) || '';
function toT(d) {
  let m;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d))) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if ((m = /^(\d{4})-(\d{2})$/.exec(d))) return Date.UTC(+m[1], +m[2] - 1, 15);
  if ((m = /^(\d{4})-Q(\d)$/.exec(d))) return Date.UTC(+m[1], (+m[2] - 1) * 3 + 1, 15);
  return NaN;
}
const TOL = { daily: 20, weekly: 20, monthly: 45, quarterly: 100 };
function yearAgo(s) {
  const P = s.points, last = P[P.length - 1], target = toT(last[0]) - 365 * DAY; let best = null, bd = Infinity;
  for (const p of P) { const d = Math.abs(toT(p[0]) - target); if (d < bd) { bd = d; best = p; } }
  return best && bd <= (TOL[s.frequency] || 45) * DAY ? best : null;
}
const brief = (m, l) => ({ id: m.id, name: nm(m.name, l), place: nm(m.place, l), region: m.region, unit: m.unit, currency: m.currency, frequency: m.frequency, first: m.first, last: m.last, source: m.sourceName, license: m.license, usage: m.verdict });
const cite = (m) => ({ source: m.sourceName, license: m.license, attribution: m.attribution });

export function makeApi(load) {
  let idx = null, man = null;
  const manifest = async () => man || (man = await load('data/catalog/manifest.json'));
  const index = async () => idx || (idx = await load('data/api/v1/index.json'));
  const find = async (id) => { const m = (await index()).series.find((s) => s.id === id); if (!m) throw new Error(`Unknown series "${id}". Use search_series to find valid ids (format region/product, e.g. eu/trigo).`); return m; };
  const series = async (id) => { await find(id); return load(`data/api/v1/series/${id}.json`); };
  const lang = (a) => (LANGS.includes(a.lang) ? a.lang : 'en');
  const out = (o) => ({ ...o, terms: TERMS, note: NOTE });
  const TOOLS = [
    { name: 'search_series', description: 'Find price series by product name, region or source. Returns ids (region/product) to use in the other tools. Names exist in es, en, fr, it.',
      inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Text to match against product, place and source, e.g. "wheat", "trigo", "milk"' }, region: { type: 'string', enum: ['us', 'eu', 'uk', 'ca'] }, lang: { type: 'string', enum: LANGS }, limit: { type: 'integer', minimum: 1, maximum: 100 } } },
      async run(a) {
        const q = String(a.query || '').toLowerCase().trim(), l = lang(a), lim = clamp(a.limit, 1, 100, 25);
        const hit = (await index()).series.filter((m) => (!a.region || m.region === a.region) && (!q || [m.id, ...LANGS.map((x) => nm(m.name, x)), ...LANGS.map((x) => nm(m.place, x)), m.sourceName].join(' ').toLowerCase().includes(q)));
        return out({ count: hit.length, series: hit.slice(0, lim).map((m) => brief(m, l)) });
      } },
    { name: 'get_latest', description: 'Latest value, previous value and % change for one or more series (up to 20 ids). Each result includes the observation date, unit, currency, source and attribution.',
      inputSchema: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 20, description: 'Series ids such as "eu/trigo"' }, lang: { type: 'string', enum: LANGS } } },
      async run(a) {
        if (!Array.isArray(a.ids) || !a.ids.length) throw new Error('ids must be a non-empty array of series ids');
        const l = lang(a), L = await load('data/api/v1/latest.json'), res = [];
        for (const id of a.ids.slice(0, 20)) { const m = await find(id), x = L.series.find((s) => s.id === id); res.push({ ...brief(m, l), date: x.date, value: x.value, previousDate: x.previousDate, previous: x.previous, changePct: x.changePct, attribution: x.attribution }); }
        return out({ generatedAt: L.generatedAt, results: res });
      } },
    { name: 'get_series', description: 'History of one series as [date, value] pairs (oldest first). Dates are YYYY-MM, YYYY-MM-DD or YYYY-Qn. Includes what exactly the series measures (note), source, licence and attribution.',
      inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string', description: 'Series id such as "eu/trigo"' }, from: { type: 'string', description: 'First date to include (YYYY-MM or YYYY-MM-DD)' }, last: { type: 'integer', minimum: 1, maximum: 1000, description: 'Return only the last N points (default 120)' }, lang: { type: 'string', enum: LANGS } } },
      async run(a) {
        const s = await series(a.id), l = lang(a); let P = s.points;
        if (a.from) { const key = (d) => { const m = /^(\d{4})-Q(\d)$/.exec(d); return m ? `${m[1]}-${String((m[2] - 1) * 3 + 1).padStart(2, '0')}` : d; }, f = key(String(a.from)); P = P.filter((p) => key(p[0]) >= f); }   // trimestres: Q1 = enero
        const lim = clamp(a.last, 1, 1000, 120), cut = P.length > lim; P = P.slice(-lim);
        return out({ ...brief(s, l), note: nm(s.note, l) || undefined, comparability: s.comparability, ...cite(s), totalPoints: s.rows, returnedPoints: P.length, truncated: cut, points: P });
      } },
    { name: 'compare_markets', description: 'For one product, list every market (US, EU, UK, Canada) that has it, with latest value and the change over 12 months. Units and currencies differ between markets: compare changes, not prices.',
      inputSchema: { type: 'object', required: ['product'], properties: { product: { type: 'string', description: 'Product key such as "trigo", "leche", "maiz"' }, lang: { type: 'string', enum: LANGS } } },
      async run(a) {
        const l = lang(a), ms = (await index()).series.filter((m) => m.product === String(a.product || '').toLowerCase());
        if (!ms.length) throw new Error(`No series for product "${a.product}". Use search_series to find product keys.`);
        const res = [];
        for (const m of ms) { const s = await load(`data/api/v1/series/${m.id}.json`), last = s.points[s.points.length - 1], ago = yearAgo(s); res.push({ ...brief(m, l), date: last[0], value: last[1], yearAgoDate: ago ? ago[0] : null, yearAgoValue: ago ? ago[1] : null, change12mPct: ago && ago[1] ? Math.round((last[1] / ago[1] - 1) * 1000) / 10 : null, ...cite(m) }); }
        return out({ product: ms[0].product, markets: res, caution: 'Units and currencies differ: compare the 12-month changes, not the prices. Read each series note via get_series.' });
      } },
    { name: 'price_moves', description: 'The biggest recent price rises and falls across all series, one move per series, with source and attribution. Dates are the observation period, not the publication day.',
      inputSchema: { type: 'object', properties: { direction: { type: 'string', enum: ['up', 'down', 'both'] }, lang: { type: 'string', enum: LANGS } } },
      async run(a) {
        const l = lang(a), W = await load('data/digest/weekly.json'), f = (e) => ({ id: e.series, name: nm(e.name, l), place: nm(e.place, l), date: e.date, value: e.value, previousDate: e.previousDate, previous: e.previous, changePct: e.changePct, unit: e.unit, currency: e.currency, source: e.sourceName, attribution: e.attribution });
        const d = a.direction || 'both';
        return out({ generatedAt: W.generatedAt, thresholdsPct: W.thresholdsPct, up: d === 'down' ? undefined : W.topUp.map(f), down: d === 'up' ? undefined : W.topDown.map(f) });
      } },
    { name: 'list_baskets', description: 'Category price indices (cereals, feed, dairy...) with base 100, equal weights and published methodology. Index numbers measure evolution, not prices.',
      inputSchema: { type: 'object', properties: { lang: { type: 'string', enum: LANGS } } },
      async run(a) { const l = lang(a), I = await load('data/indices/index.json'); return out({ generatedAt: I.generatedAt, baskets: I.baskets.map((b) => ({ id: b.id, name: nm(b.name, l), verdict: b.verdict, basePeriod: b.basePeriod, first: b.first, last: b.last, changeMoMPct: b.changeMoMPct, changeYoYPct: b.changeYoYPct, members: b.members })), notPublished: I.excluded.map((e) => ({ id: e.id, reason: e.reason })), methodology: I.methodology[l] || I.methodology.en }); } },
    { name: 'get_basket', description: 'History of one price basket (index base 100) with its member series, weights, sources and licences.',
      inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string', description: 'Basket id such as "eu/cereales"' }, last: { type: 'integer', minimum: 1, maximum: 1000 }, lang: { type: 'string', enum: LANGS } } },
      async run(a) {
        const I = await load('data/indices/index.json'); if (!I.baskets.some((b) => b.id === a.id)) throw new Error(`Unknown basket "${a.id}". Use list_baskets.`);
        const b = await load(`data/indices/${a.id}.json`), l = lang(a), P = b.points.slice(-clamp(a.last, 1, 1000, 120));
        return out({ id: b.id, name: nm(b.name, l), basePeriod: b.basePeriod, base: 100, weighting: b.weighting, usage: b.verdict, first: b.first, last: b.last, members: b.members.map((m) => ({ id: m.id, weightPct: m.weightPct, source: m.sourceName, license: m.license, attribution: m.attribution })), attribution: b.attribution, methodology: b.methodology[l] || b.methodology.en, returnedPoints: P.length, points: P });
      } },

    // ---- Catalogo completo (data/catalog): todos los paises, no solo las series de precios de la API
    { name: 'list_countries', description: 'All countries and aggregates in the full Dehesa Index catalog (about 31,800 official series: crops, production, prices, trade, climate, land, inputs...) with how many series each has, per topic group, and the latest period. Use it first to see what exists for a country (e.g. Argentina, Uruguay, Chile, Switzerland) and which group to search.',
      inputSchema: { type: 'object', properties: { lang: { type: 'string', enum: LANGS } } },
      async run(a) {
        const M = await manifest();
        return out({ generatedAt: M.generatedAt, seriesTotal: M.seriesTotal, countries: Object.entries(M.countries).map(([cc, c]) => ({ code: cc, name: c.displayName || c.name, type: c.entityType, series: c.n, groups: Object.fromEntries(Object.entries(c.metrics || {}).map(([g, v]) => [g, { series: v.n, latest: v.latestPeriod, topics: v.tags }])) })),
          howTo: 'Then call search_catalog with country (code) and a query, and get_catalog_series with the series id. Absence from the catalog means we do not have that data yet, never that it does not exist.' });
      } },
    { name: 'search_catalog', description: 'Search the full catalog of one country by words in the series name (English labels; try "wheat", "milk", "exports", "drought", "price"). Returns series ids, unit, frequency, latest value and period, source and licence. Needs a country code from list_countries (AR, UY, CL, ES, FR, US, EU...).',
      inputSchema: { type: 'object', required: ['country'], properties: { country: { type: 'string', description: 'Country or aggregate code, e.g. "AR", "UY", "EU"' }, query: { type: 'string', description: 'Words to match in the series label, e.g. "barley harvested"' }, group: { type: 'string', description: 'Topic group from list_countries, e.g. "crops", "prices", "trade"' }, limit: { type: 'integer', minimum: 1, maximum: 100 } } },
      async run(a) {
        const cc = String(a.country || '').toUpperCase(), M = await manifest(); if (!M.countries[cc]) throw new Error(`Unknown country code ${cc}. Call list_countries.`);
        const C = await load(`data/catalog/${cc}.json`), q = String(a.query || '').toLowerCase().split(/\s+/).filter(Boolean), lim = clamp(a.limit, 1, 100, 25);
        const hit = C.series.filter((r) => (!a.group || r.group === a.group) && q.every((w) => (r.label + ' ' + (r.tags || []).join(' ')).toLowerCase().includes(w)));
        return out({ country: cc, count: hit.length, series: hit.slice(0, lim).map((r) => ({ id: r.id, label: r.label, unit: r.unit, frequency: r.freq, group: r.group, first: r.first, latestPeriod: r.latestPeriod, latest: r.latest, changePct: r.changePct, sourceId: r.sourceId, license: r.licenseId, freshness: r.fs })), next: 'Call get_catalog_series with country and id for the history and the attribution.' });
      } },
    { name: 'get_catalog_series', description: 'History of one catalog series as [period, value] pairs (oldest first) with its unit, source, licence and attribution text. Use ids from search_catalog. Always cite the attribution.',
      inputSchema: { type: 'object', required: ['country', 'id'], properties: { country: { type: 'string' }, id: { type: 'string' }, last: { type: 'integer', minimum: 1, maximum: 1000, description: 'Only the last N points' } } },
      async run(a) {
        const cc = String(a.country || '').toUpperCase(), C = await load(`data/catalog/${cc}.json`), r = C.series.find((x) => x.id === a.id); if (!r) throw new Error(`Series ${a.id} not found in ${cc}. Use search_catalog.`);
        const files = [r.file, r.file.replace(/\.json$/, '-2.json')]; let s = null;
        for (const f of files) { try { const d = await load('data/' + f); s = (d.series || []).find((x) => x.id === r.id); if (s) break; } catch (e) { /* trozo siguiente */ } }
        if (!s) throw new Error(`Points for ${a.id} not found.`);
        const M = await manifest(), src = (M.provenance && M.provenance.sources && M.provenance.sources[r.sourceId]) || {}, pts = a.last ? s.points.slice(-clamp(a.last, 1, 1000, 100)) : s.points;
        return out({ country: cc, id: r.id, label: r.label, unit: r.unit, frequency: r.freq, points: pts, source: src.name || r.sourceId, sourceUrl: src.officialUrl, license: src.licenseId || r.licenseId, attribution: src.attribution, freshness: r.fs });
      } },
  ];
  async function call(name, args) {
    const t = TOOLS.find((x) => x.name === name); if (!t) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
    try { const r = await t.run(args && typeof args === 'object' ? args : {}); return { content: [{ type: 'text', text: JSON.stringify(r) }] }; }
    catch (e) { return { isError: true, content: [{ type: 'text', text: String(e.message || e) }] }; }
  }
  return { TOOLS, call, list: () => TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) };
}

// Procesa UN mensaje JSON-RPC; devuelve la respuesta o null si era una notificacion.
export async function handle(api, msg) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return { jsonrpc: '2.0', id: msg && msg.id !== undefined ? msg.id : null, error: { code: -32600, message: 'Invalid Request' } };
  const reply = (result) => ({ jsonrpc: '2.0', id: msg.id, result }), fail = (code, message) => ({ jsonrpc: '2.0', id: msg.id, error: { code, message } });
  if (msg.id === undefined) return null;   // notificacion (initialized, cancelled...): sin respuesta
  try {
    switch (msg.method) {
      case 'initialize': return reply({ protocolVersion: PROTOCOL, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER, instructions: 'Official agricultural data from Dehesa Index (dehesaindex.com), no estimates. Two layers. (1) Market prices for US, EU, UK and Canada: search_series, get_latest, get_series, compare_markets, price_moves, list_baskets, get_basket. (2) The full catalog of about 31,800 series for 35 countries (including Argentina, Uruguay, Chile, Switzerland and every EU member): start with list_countries to see what exists, then search_catalog (country + words) and get_catalog_series. If something is not in the catalog we do not have it yet; say so instead of guessing. Cite the attribution field of everything you report. Information only, not financial advice.' });
      case 'ping': return reply({});
      case 'tools/list': return reply({ tools: api.list() });
      case 'tools/call': return reply(await api.call(msg.params && msg.params.name, msg.params && msg.params.arguments));
      default: return fail(-32601, `Method not found: ${msg.method}`);
    }
  } catch (e) { return fail(e.code || -32603, String(e.message || e)); }
}
