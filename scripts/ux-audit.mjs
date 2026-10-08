#!/usr/bin/env node
// Auditoria de UX responsive con navegador real: desbordes horizontales, objetivos tactiles pequenos, texto truncado sin titulo, foco visible,
// graficos/tablas mas anchos que su contenedor. Informa (no falla salvo --strict). Uso: node scripts/ux-audit.mjs [--only index,precios] [--shots dir] [--strict]
import { mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:8123'), ONLY = (arg('--only', '') || '').split(',').filter(Boolean), SHOTS = arg('--shots', null), STRICT = process.argv.includes('--strict');
let pw; try { pw = await import('playwright'); } catch (e) { pw = await import(process.env.PLAYWRIGHT_MODULE || execSync('npm root -g').toString().trim() + '/playwright/index.mjs'); }
const PAGES = [['index', '/'], ['precios', '/precios.html'], ['producto', '/producto.html'], ['paises', '/paises.html?c=ES'], ['comparador', '/comparador.html'], ['calculadora', '/calculadora.html'],
  ['mi-seguimiento', '/mi-seguimiento.html'], ['mi-explotacion', '/mi-explotacion.html'], ['brief', '/brief.html'], ['precios-locales', '/precios-locales.html'], ['mi-mercado', '/mi-mercado.html?c=US&r=KS&p=cattle'], ['observatorio', '/observatorio.html'], ['pac', '/pac.html'], ['siembra', '/siembra.html?c=US&r=IA']];
const VPS = [375, 390, 430, 768, 1280];
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => pw.chromium.launch());
if (SHOTS) await mkdir(SHOTS, { recursive: true });
const out = [];
for (const [n, url] of PAGES) {
  if (ONLY.length && !ONLY.includes(n)) continue;
  for (const w of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block', hasTouch: w < 800 });
    await ctx.addInitScript(() => { try { localStorage.setItem('dehesaIndexLang', 'es'); localStorage.setItem('dehesaIndexTourSeen', '1'); } catch (e) {} });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 120)); });
    await page.goto(BASE + url, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth, sel = el => { let s = el.tagName.toLowerCase(); if (el.id) return s + '#' + el.id; if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s; };
      const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
      const scrollAncestor = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll' || o === 'hidden') && p.scrollWidth > p.clientWidth + 1) return true; } return false; };
      const TARGETS = [...document.body.querySelectorAll('a[href],button,select,input,textarea,summary,[role=button],[role=tab]')].filter(e => vis(e) && !e.disabled && !(e.closest('details') && !e.closest('details').open && !e.closest('summary') && e.tagName !== 'SUMMARY'));
      // excepcion de espaciado de WCAG 2.2 (2.5.8): un circulo de 24 px centrado en el objetivo pequeno no corta a ningun otro objetivo (ni al circulo de otro objetivo pequeno)
      const spacingOk = (el, r) => { const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        for (const o of TARGETS) { if (o === el || el.contains(o) || o.contains(el)) continue; const q = o.getBoundingClientRect();
          if (q.width < 24 || q.height < 24) { const dx = cx - (q.left + q.width / 2), dy = cy - (q.top + q.height / 2); if (Math.hypot(dx, dy) < 24) return false; }
          else { const dx = Math.max(q.left - cx, 0, cx - q.right), dy = Math.max(q.top - cy, 0, cy - q.bottom); if (Math.hypot(dx, dy) < 12) return false; } }
        return true; };
      const res = { docOverflow: document.documentElement.scrollWidth - vw, overflowers: [], small: [], truncated: [], wide: [] };
      const hiddenInDetails = el => { const d = el.closest('details'); return d && !d.open && !el.closest('summary'); };
      for (const el of document.body.querySelectorAll('*')) {
        if (!vis(el) || hiddenInDetails(el)) continue; const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && !scrollAncestor(el) && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).position !== 'fixed') res.overflowers.push(sel(el) + ' +' + Math.round(r.right - vw));
        if (/^(A|BUTTON|SELECT|INPUT|TEXTAREA|SUMMARY)$/.test(el.tagName) || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'tab') {
          // WCAG 2.5.8 (equivalente): un objetivo pequeno con data-equiv="<id>" es valido si ese control (p. ej. el selector de estado) existe y es visible
          if (el.getAttribute('data-equiv') && document.getElementById(el.getAttribute('data-equiv')) && vis(document.getElementById(el.getAttribute('data-equiv')))) continue;
          if ((el.tagName === 'INPUT' && /hidden|checkbox|radio/.test(el.type)) || el.disabled) continue;
          if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && (!el.closest('nav,button,li,td,th') || (el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 3))) continue;  // enlaces en linea de un parrafo: exentos en WCAG 2.2
          if ((r.width < 24 || r.height < 24) && !spacingOk(el, r)) res.small.push(sel(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18) + '"');
        }
        const cs = getComputedStyle(el);
        if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && !el.getAttribute('title') && !el.getAttribute('aria-label') && !el.querySelector('[title]')) res.truncated.push(sel(el) + ' "' + el.textContent.trim().slice(0, 24) + '"');
        if ((el.tagName === 'TABLE' || el.tagName === 'CANVAS' || el.tagName === 'SVG' || el.tagName === 'svg' || el.tagName === 'IMG') && r.width > vw + 1 && !scrollAncestor(el)) res.wide.push(sel(el) + ' ' + Math.round(r.width));
      }
      return res;
    });
    // foco visible en los primeros 30 elementos enfocables
    const focus = await page.evaluate(async () => {
      const bad = []; const els = [...document.querySelectorAll('a[href],button,select,input:not([type=hidden]),textarea,[tabindex]:not([tabindex="-1"])')].filter(e => { const r = e.getBoundingClientRect(), d = e.closest('details'); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.disabled && !(d && !d.open && !e.closest('summary')); }).slice(0, 30);
      for (const e of els) { e.focus({ preventScroll: true }); if (document.activeElement !== e) continue; const cs = getComputedStyle(e); const ok = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none') || cs.borderColor !== ''; if (!(cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) && !(cs.boxShadow && cs.boxShadow !== 'none')) bad.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ' "' + (e.textContent || '').trim().slice(0, 14) + '"'); }
      return { checked: els.length, noIndicator: bad };
    });
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, n + '-' + w + '.png'), fullPage: true }).catch(() => {});
    out.push({ page: n, w, errs, ...r, focus });
    await ctx.close();
  }
}
await browser.close();
if (arg('--json', null)) (await import('node:fs')).writeFileSync(arg('--json'), JSON.stringify(out));
let issues = 0;
for (const o of out) {
  const bits = [];
  if (o.docOverflow > 0) bits.push('docOverflow +' + o.docOverflow);
  if (o.overflowers.length) bits.push('overflow:' + o.overflowers.slice(0, 3).join(' | '));
  if (o.wide.length) bits.push('wide:' + o.wide.slice(0, 3).join(' | '));
  if (o.small.length) bits.push('small(' + o.small.length + '):' + o.small.slice(0, 4).join(' | '));
  if (o.truncated.length) bits.push('trunc(' + o.truncated.length + '):' + o.truncated.slice(0, 3).join(' | '));
  if (o.focus.noIndicator.length) bits.push('focus(' + o.focus.noIndicator.length + '/' + o.focus.checked + '):' + o.focus.noIndicator.slice(0, 3).join(' | '));
  if (o.errs.length) bits.push('errors:' + o.errs.join(' | '));
  if (bits.length) { issues++; console.log(o.page + ' @' + o.w + ': ' + bits.join('  ;  ')); }
}
console.log(issues ? issues + ' combinaciones pagina x ancho con avisos de ' + out.length : 'UX OK: ' + out.length + ' combinaciones sin avisos');
process.exit(STRICT && issues ? 1 : 0);
