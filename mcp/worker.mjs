// Dehesa Index — servidor MCP remoto (Cloudflare Worker, transporte HTTP «Streamable» sin estado: un POST = un mensaje JSON-RPC).
// NO esta desplegado: ver mcp/README.md. Lee la API publica del propio sitio (DEHESA_BASE_URL, por defecto https://dehesaindex.com).
import { makeApi, handle } from './core.mjs';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type, mcp-session-id, mcp-protocol-version, accept' };
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method === 'GET') return new Response('Dehesa Index MCP server. POST JSON-RPC here. Docs: https://dehesaindex.com/conector-ia', { headers: { ...CORS, 'content-type': 'text/plain; charset=utf-8' } });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });
    const base = ((env && env.DEHESA_BASE_URL) || 'https://dehesaindex.com').replace(/\/$/, '');
    const api = makeApi(async (p) => { const r = await fetch(`${base}/${p}`, { cf: { cacheTtl: 300 } }); if (!r.ok) throw new Error(`HTTP ${r.status} al leer ${p}`); return r.json(); });
    let msg; try { msg = await req.json(); } catch { return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers: CORS }); }
    const batch = Array.isArray(msg) ? msg : [msg], res = (await Promise.all(batch.map((m) => handle(api, m)))).filter(Boolean);
    if (!res.length) return new Response(null, { status: 202, headers: CORS });
    return Response.json(Array.isArray(msg) ? res : res[0], { headers: CORS });
  },
};
