#!/usr/bin/env node
/* <lastmod> honesto para las paginas estaticas generadas (datos/, precios/, regiones/, en/, fr/, it/). La fecha solo cambia cuando cambia el CONTENIDO de la pagina:
   se guarda un hash del HTML (sin los ?v=hash de los recursos) en sitemap-lastmod.json y la fecha es el dia en que ese hash cambio por primera vez.
   No se emite lastmod para las paginas raiz (se pintan con JS desde los datos: su HTML casi nunca cambia aunque los datos si, y una fecha vieja seria enganosa).
   Uso: node scripts/sitemap-lastmod.mjs   (lo llama build-seo-pages.mjs al final; en CI antes de escribir sitemap.xml ya estan todas las paginas regeneradas) */
import fs from 'node:fs';
import crypto from 'node:crypto';
const SITE = 'https://dehesaindex.com', MF = 'sitemap-lastmod.json';
const today = new Date().toISOString().slice(0, 10);
let man = {}; try { man = JSON.parse(fs.readFileSync(MF, 'utf8')); } catch (e) { /* primera vez */ }
const MARK = /(  <!-- (seo-pages|product-pages|region-pages):start -->\n)([\s\S]*?)(\n  <!-- \2:end -->)/g;
let sm = fs.readFileSync('sitemap.xml', 'utf8'), n = 0, changed = 0, next = {};
sm = sm.replace(MARK, (all, a, name, body, z) => {
  const out = body.split('\n').map(line => {
    const m = /<loc>([^<]+)<\/loc>/.exec(line); if (!m) return line;
    const rel = m[1].replace(SITE + '/', ''), file = rel === '' || rel.endsWith('/') ? rel + 'index.html' : rel;
    let h; try { h = crypto.createHash('sha1').update(fs.readFileSync(file, 'utf8').replace(/\?v=[0-9a-f]{6,}/g, '')).digest('hex').slice(0, 12); } catch (e) { return '  <url><loc>' + m[1] + '</loc></url>'; }
    const old = man[m[1]]; let d = old && old[0] === h ? old[1] : today; if (!old || old[0] !== h) changed++;
    next[m[1]] = [h, d]; n++;
    return '  <url><loc>' + m[1] + '</loc><lastmod>' + d + '</lastmod></url>';
  }).join('\n');
  return a + out + z;
});
fs.writeFileSync('sitemap.xml', sm);
fs.writeFileSync(MF, JSON.stringify(next, Object.keys(next).sort()) .replace(/\],"/g, '],\n"') + '\n');
console.log('sitemap lastmod:', n, 'paginas,', changed, 'con contenido nuevo o cambiado');
