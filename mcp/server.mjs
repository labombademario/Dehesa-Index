#!/usr/bin/env node
// Dehesa Index — servidor MCP local (stdio). Uso:  node mcp/server.mjs
// Variables: DEHESA_BASE_URL (por defecto https://dehesaindex.com) o DEHESA_DATA_DIR (carpeta del repositorio, para trabajar sin red).
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { makeApi, handle } from './core.mjs';
const BASE = (process.env.DEHESA_BASE_URL || 'https://dehesaindex.com').replace(/\/$/, ''), DIR = process.env.DEHESA_DATA_DIR || '';
const cache = new Map();
async function load(p) {
  if (cache.has(p)) return cache.get(p);
  let j;
  if (DIR) j = JSON.parse(await readFile(path.join(DIR, p), 'utf8'));
  else { const r = await fetch(`${BASE}/${p}`, { headers: { 'user-agent': 'dehesa-index-mcp/1.0' } }); if (!r.ok) throw new Error(`HTTP ${r.status} al leer ${p}`); j = await r.json(); }
  cache.set(p, j); setTimeout(() => cache.delete(p), 300000).unref();
  return j;
}
const api = makeApi(load);
const rl = createInterface({ input: process.stdin });
rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); return; }
  const batch = Array.isArray(msg) ? msg : [msg], res = (await Promise.all(batch.map((m) => handle(api, m)))).filter(Boolean);
  if (res.length) process.stdout.write(JSON.stringify(Array.isArray(msg) ? res : res[0]) + '\n');
});
