#!/usr/bin/env node
// El minigrafico de cada tarjeta de Precios abre el historico ampliado (igual que el boton 📈): con el raton, con el teclado (Intro) y en
// las dos vistas (filas y tarjetas), a 1280 y 390 px; Escape lo cierra. Servidor local en :8123.  Uso: node scripts/test-spark-history.mjs [--base URL]
import { execSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
let fail = 0; const ok = (n, c) => { if (!c) { fail++; console.log('FALLA', n); } };
const M = () => { const m = document.getElementById('pr-modal-root'); return m && m.innerText.trim() ? m.innerText : ''; };
for (const view of ['rows', 'cards']) for (const w of [1280, 390]) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: w, height: 900 } });
  await ctx.addInitScript(v => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); localStorage.setItem('dehesaIndexPrView', v); } catch (e) {} }, view);
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const tab of ['avicultura', 'cereales']) {
    const tag = view + '@' + w + ' ' + tab;
    await p.goto(BASE + '/precios.html?tab=' + tab + '&region=us', { waitUntil: 'networkidle' });
    const sp = p.locator('#pr-category [data-action="spark-history"]').first();
    ok(tag + ': hay minigraficos clicables', await p.locator('#pr-category [data-action="spark-history"]').count() > 0);
    const key = await sp.getAttribute('data-key');
    ok(tag + ': el minigrafico apunta al mismo producto que su boton 📈', await p.locator('#pr-category [data-action="history"][data-key="' + key + '"]').count() > 0);
    await sp.click(); await p.waitForTimeout(600);
    ok(tag + ': clic en el minigrafico abre el historico ampliado', /hist/i.test(await p.evaluate(M)));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    ok(tag + ': Escape lo cierra', (await p.evaluate(M)) === '');
    await sp.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
    ok(tag + ': Intro sobre el minigrafico tambien lo abre', /hist/i.test(await p.evaluate(M)));
  }
  ok(view + '@' + w + ': sin errores de pagina', errs.length === 0); if (errs.length) console.log('  ', errs.slice(0, 3));
  await ctx.close();
}
await browser.close(); console.log(fail ? fail + ' fallos' : 'Minigrafico -> historico: OK'); process.exit(fail ? 1 : 0);
