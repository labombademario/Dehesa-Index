#!/usr/bin/env node
// Portada = presentacion (decision de Mario, 21-oct-2026): «Mi mercado» NO aparece en la portada, ni vacio ni con una eleccion guardada en el navegador,
// y el modulo de Mi mercado no se descarga alli. El acceso sigue siendo el boton «Mi mercado: tu zona y tu producto» de la cabecera. 4 idiomas, 1280/390.
// Uso: node scripts/test-home-mi-mercado.mjs [--base http://localhost:8123]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const SAVED = JSON.stringify({ v: 1, place: { k: 'es-prov', id: '10', label: 'Cáceres' }, crop: 'citricos' });
for (const lang of ['es', 'en', 'fr', 'it']) for (const w of [1280, 390]) for (const saved of [false, true]) {
  const tag = lang + '@' + w + (saved ? ' con eleccion guardada' : ' sin eleccion');
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([l, sv, S]) => { try { localStorage.setItem('dehesaIndexLang', l); localStorage.setItem('dehesaIndexTourSeen', '1'); if (sv) localStorage.setItem('di-mi-mercado-v1', S); } catch (e) { } }, [lang, saved, SAVED]);
  const page = await ctx.newPage(), errs = [], reqs = []; page.on('pageerror', e => errs.push(e.message)); page.on('request', r => reqs.push(r.url()));
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
  ok(tag + ': sin bloque Mi mercado en la portada', !(await page.$('#home-mi-mercado, #home-mm, [data-mm-body]')));
  ok(tag + ': no se descarga el modulo de Mi mercado', !reqs.some(u => /\/js\/(mi-mercado|home-mi-mercado)\.js/.test(u)));
  ok(tag + ': sigue el acceso a Mi mercado desde la cabecera', !!(await page.$('.di-hero a[href*="mi-mercado"]')));
  ok(tag + ': sin errores', !errs.length);
  await ctx.close();
}
// Mi mercado (pagina completa), España: el titulo dice grupo y cultivo con su nombre (no «citricos» ni el codigo del MAPA) y el aviso de precio dice la razon real
for (const [k, want] of [['CI4000', 'Cítricos · Total limonero'], ['', 'Cítricos']]) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' }); await ctx.addInitScript(([k]) => { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('di-mi-mercado-v1', JSON.stringify({ c: 'ES', r: '10', p: 'citricos', k })); }, [k]);
  const page = await ctx.newPage(); await page.goto(BASE + '/mi-mercado.html', { waitUntil: 'networkidle' }); await page.waitForFunction(() => /No tenemos un precio de mercado/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => { });
  const t = await page.innerText('main'), act = await page.evaluate(() => (document.querySelector('.mm-active') || {}).innerText || '');
  ok('Mi mercado ES ' + (k || 'sin cultivo') + ': titulo «' + want + '»', act.includes('Cáceres · ' + want) && (k || !act.includes('Total')));
  ok('Mi mercado ES ' + (k || 'sin cultivo') + ': sin codigo del MAPA ni «citricos» crudo', !/\bCI\d{4}\b/.test(t) && !/· citricos/.test(t));
  ok('Mi mercado ES ' + (k || 'sin cultivo') + ': el aviso de precio dice la razon real', /No tenemos un precio de mercado de referencia/.test(t) && !/agrupa varios productos/.test(t));
  await ctx.close();
}
await browser.close();
console.log(fail ? 'FALLAN ' + fail : 'test-home-mi-mercado: todo correcto'); process.exit(fail ? 1 : 0);
