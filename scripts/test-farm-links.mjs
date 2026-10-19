#!/usr/bin/env node
/* Prueba en navegador de los costes vinculados de «Mi explotación» (js/mi-explotacion.js) contra el monitor de insumos.
   Comprueba: vincular fija la referencia vigente (sin escenario); con una referencia de partida antigua aparece el escenario,
   el importe NO cambia solo, «Usar» lo cambia y «Deshacer» lo restaura; las líneas que no están en EUR no se pueden vincular.
   Necesita un servidor estático en :8123 (python3 -m http.server 8123). Uso: node scripts/test-farm-links.mjs */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const BASE = process.env.BASE || 'http://localhost:8123';
const mon = JSON.parse(readFileSync(new URL('../data/views/input-monitor.json', import.meta.url)));
const urea = mon.groups.flatMap(g => g.items).find(i => i.id === 'es-pag-urea-46');
if (!urea) { console.log('test-farm-links: sin urea en el monitor, nada que probar'); process.exit(0); }
const fails = []; const ok = (n, c) => { if (!c) { fails.push(n); console.log('FALLA', n); } };
const browser = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
const line = (lk, cur = 'EUR') => JSON.stringify({ v: 1, n: 1, lines: [{ id: 'l1', c: { crop: 'trigo', cur, area: '10', areaU: 'ha', y: '3', yU: 't_ha', p: '220', pUnit: 't', pSrc: 'manual', costs: { fert: '200' } }, lk }] });
const open = async (state) => { await page.goto(BASE + '/mi-explotacion.html'); await page.evaluate(s => { localStorage.setItem('di-farm-v1', s); localStorage.setItem('dehesaIndexLang', 'es'); }, state); await page.reload(); await page.waitForSelector('#fx-l1-lk-fert', { timeout: 15000 }).catch(() => null); };
const val = () => page.inputValue('#fx-l1-c-fert');

// 1) referencia de partida antigua: escenario visible, importe intacto
await open(line({ fert: { id: urea.id, v: urea.value / 1.25, period: '2020-01', at: '2020-02-01' } }));
await page.locator('#fx-sec-l1 details').first().evaluate(d => { d.open = true; });
const txt = await page.textContent('#fx-lk-l1-fert');
ok('escenario visible con referencia antigua', /Escenario/.test(txt || ''));
ok('escenario +25 % → 250', /250/.test(txt || '') && /\+25,0 %/.test(txt || ''));
ok('el importe no cambia solo', (await val()) === '200');
ok('aparece en «Qué ha cambiado»', /Fertilizantes/.test(await page.textContent('#fx-changes')));
// 2) Usar y Deshacer
await page.click('[data-act="lkapply"]');
ok('«Usar» cambia el importe a 250', (await val()) === '250');
ok('tras «Usar» la referencia queda al día (sin escenario)', !/Escenario/.test(await page.textContent('#fx-lk-l1-fert')));
ok('se guarda el importe nuevo', JSON.parse(await page.evaluate(() => localStorage.getItem('di-farm-v1'))).lines[0].c.costs.fert === '250');
await page.click('[data-act="lkundo"]');
ok('«Deshacer» restaura 200', (await val()) === '200');
ok('«Deshacer» restaura la referencia de partida', /Escenario/.test(await page.textContent('#fx-lk-l1-fert')));
// 3) escribir el importe vuelve a fijar la referencia
await page.fill('#fx-l1-c-fert', '210');
ok('al escribir el importe se fija la referencia vigente', /Sin dato nuevo/.test(await page.textContent('#fx-lk-l1-fert')));
// 4) vincular desde cero
await open(line(undefined));
await page.locator('#fx-sec-l1 details').first().evaluate(d => { d.open = true; });
await page.selectOption('#fx-l1-lk-fert', urea.id);
const st = JSON.parse(await page.evaluate(() => localStorage.getItem('di-farm-v1')));
ok('vincular guarda la referencia vigente', st.lines[0].lk && st.lines[0].lk.fert.v === urea.value && st.lines[0].lk.fert.period === urea.last);
ok('vincular no muestra escenario', /Sin dato nuevo/.test(await page.textContent('#fx-lk-l1-fert')));
// 5) linea en USD: sin selector
await open(line(undefined, 'USD'));
ok('línea en USD: sin selector de referencia', (await page.$('#fx-l1-lk-fert')) === null && /solo se pueden vincular/.test(await page.textContent('#fx-sec-l1')));
ok('sin errores de JavaScript', !errs.length);
if (errs.length) console.log(errs.join('\n'));
await browser.close();
console.log('test-farm-links:', fails.length ? fails.length + ' fallos' : 'OK'); process.exit(fails.length ? 1 : 0);
