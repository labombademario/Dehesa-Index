#!/usr/bin/env node
/* SEO de producto: una pagina estatica e indexable por producto e idioma (es, en, fr, it) con el ULTIMO precio real por mercado (EE. UU., UE, Canada, Reino Unido)
   leido de data/prices/latest/*.json: valor, unidad, periodo, variacion, fuente con enlace (y metodologia en espanol). Titulo y descripcion llevan la cifra actual.
   URLs: es /precios/<producto>/ · en /en/prices/<slug>/ · fr /fr/prix/<slug>/ · it /it/prezzi/<slug>/ (hreflang reciproco + x-default).
   Se ejecuta al final de scripts/build-seo-pages.mjs (workflow "Rebuild SEO landing pages") y reescribe el bloque marcado de sitemap.xml. */
import fs from 'node:fs';
import { seoTitle, seoDesc, socialMeta } from './lib_seo.mjs';
import { createHash as __ch } from 'node:crypto';
import { readFileSync as __rf } from 'node:fs';
import { createHash as __bootHash } from 'node:crypto'; import { readFileSync as __bootRead } from 'node:fs';
const BOOT_V = (() => { try { return __bootHash('sha256').update(__bootRead(new URL('../js/boot.js', import.meta.url))).digest('hex').slice(0, 8); } catch (e) { return 'x'; } })();   // ?v= de js/boot.js
// ?v= de shared.js = hash de su contenido (como scripts/stamp-assets.mjs): sin él, estas páginas servían un shared.js viejo de la caché
const SHARED_V = (() => { try { return __ch('sha256').update(__rf(new URL('../js/shared.js', import.meta.url))).digest('hex').slice(0, 8); } catch (e) { return 'x'; } })();
const read = f => fs.readFileSync(f, 'utf8');
const SITE = 'https://dehesaindex.com';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// clave -> { es, en, fr, it: [nombre, "precio de(l) ..."-genitivo/articulo] , slug en/fr/it }
const P = {
  trigo: { es: ['Trigo', 'del trigo'], en: ['Wheat', 'wheat'], fr: ['Blé', 'du blé'], it: ['Grano', 'del grano'], s: ['wheat', 'ble', 'grano'] },
  maiz: { es: ['Maíz', 'del maíz'], en: ['Corn', 'corn'], fr: ['Maïs', 'du maïs'], it: ['Mais', 'del mais'], s: ['corn', 'mais', 'mais'] },
  trigo_duro: { es: ['Trigo duro', 'del trigo duro'], en: ['Durum wheat', 'durum wheat'], fr: ['Blé dur', 'du blé dur'], it: ['Grano duro', 'del grano duro'], s: ['durum-wheat', 'ble-dur', 'grano-duro'] },
  cebada: { es: ['Cebada', 'de la cebada'], en: ['Barley', 'barley'], fr: ['Orge', 'de l’orge'], it: ['Orzo', 'dell’orzo'], s: ['barley', 'orge', 'orzo'] },
  avena: { es: ['Avena', 'de la avena'], en: ['Oats', 'oats'], fr: ['Avoine', 'de l’avoine'], it: ['Avena', 'dell’avena'], s: ['oats', 'avoine', 'avena'] },
  centeno: { es: ['Centeno', 'del centeno'], en: ['Rye', 'rye'], fr: ['Seigle', 'du seigle'], it: ['Segale', 'della segale'], s: ['rye', 'seigle', 'segale'] },
  arroz: { es: ['Arroz', 'del arroz'], en: ['Rice', 'rice'], fr: ['Riz', 'du riz'], it: ['Riso', 'del riso'], s: ['rice', 'riz', 'riso'] },
  sorgo: { es: ['Sorgo', 'del sorgo'], en: ['Sorghum', 'sorghum'], fr: ['Sorgho', 'du sorgho'], it: ['Sorgo', 'del sorgo'], s: ['sorghum', 'sorgho', 'sorgo'] },
  colza: { es: ['Colza', 'de la colza'], en: ['Rapeseed', 'rapeseed'], fr: ['Colza', 'du colza'], it: ['Colza', 'della colza'], s: ['rapeseed', 'colza', 'colza'] },
  harina_soja: { es: ['Harina de soja', 'de la harina de soja'], en: ['Soybean meal', 'soybean meal'], fr: ['Tourteau de soja', 'du tourteau de soja'], it: ['Farina di soia', 'della farina di soia'], s: ['soybean-meal', 'tourteau-de-soja', 'farina-di-soia'] },
  leche: { es: ['Leche', 'de la leche'], en: ['Milk', 'milk'], fr: ['Lait', 'du lait'], it: ['Latte', 'del latte'], s: ['milk', 'lait', 'latte'] },
  leche_polvo: { es: ['Leche en polvo', 'de la leche en polvo'], en: ['Milk powder', 'milk powder'], fr: ['Lait en poudre', 'du lait en poudre'], it: ['Latte in polvere', 'del latte in polvere'], s: ['milk-powder', 'lait-en-poudre', 'latte-in-polvere'] },
  mantequilla: { es: ['Mantequilla', 'de la mantequilla'], en: ['Butter', 'butter'], fr: ['Beurre', 'du beurre'], it: ['Burro', 'del burro'], s: ['butter', 'beurre', 'burro'] },
  vaca: { es: ['Ganado vacuno', 'del ganado vacuno'], en: ['Cattle', 'cattle'], fr: ['Bovins', 'des bovins'], it: ['Bovini', 'dei bovini'], s: ['cattle', 'bovins', 'bovini'] },
  cerdo: { es: ['Cerdo', 'del cerdo'], en: ['Pork (hogs)', 'hogs and pork'], fr: ['Porc', 'du porc'], it: ['Suino', 'del suino'], s: ['hogs', 'porc', 'suino'] },
  cordero: { es: ['Cordero', 'del cordero'], en: ['Lamb', 'lamb'], fr: ['Agneau', 'de l’agneau'], it: ['Agnello', 'dell’agnello'], s: ['lamb', 'agneau', 'agnello'] },
  pollo: { es: ['Pollo', 'del pollo'], en: ['Chicken', 'chicken'], fr: ['Poulet', 'du poulet'], it: ['Pollo', 'del pollo'], s: ['chicken', 'poulet', 'pollo'] },
  huevos: { es: ['Huevos', 'de los huevos'], en: ['Eggs', 'eggs'], fr: ['Œufs', 'des œufs'], it: ['Uova', 'delle uova'], s: ['eggs', 'oeufs', 'uova'] },
  azucar: { es: ['Azúcar', 'del azúcar'], en: ['Sugar', 'sugar'], fr: ['Sucre', 'du sucre'], it: ['Zucchero', 'dello zucchero'], s: ['sugar', 'sucre', 'zucchero'] },
  oliva: { es: ['Aceite de oliva', 'del aceite de oliva'], en: ['Olive oil', 'olive oil'], fr: ['Huile d’olive', 'de l’huile d’olive'], it: ['Olio d’oliva', 'dell’olio d’oliva'], s: ['olive-oil', 'huile-olive', 'olio-oliva'] },
  urea: { es: ['Urea', 'de la urea'], en: ['Urea', 'urea fertilizer'], fr: ['Urée', 'de l’urée'], it: ['Urea', 'dell’urea'], s: ['urea', 'uree', 'urea'] },
  dap: { es: ['Fosfato DAP', 'del fosfato DAP'], en: ['DAP fertilizer', 'DAP fertilizer'], fr: ['Phosphate DAP', 'du phosphate DAP'], it: ['Fosfato DAP', 'del fosfato DAP'], s: ['dap-fertilizer', 'phosphate-dap', 'fosfato-dap'] },
  potasa: { es: ['Potasa', 'de la potasa'], en: ['Potash', 'potash'], fr: ['Potasse', 'de la potasse'], it: ['Potassio', 'del potassio'], s: ['potash', 'potasse', 'potassio'] },
  diesel: { es: ['Diésel', 'del diésel'], en: ['Diesel', 'diesel'], fr: ['Gazole', 'du gazole'], it: ['Gasolio', 'del gasolio'], s: ['diesel', 'gazole', 'gasolio'] },
  gas_natural: { es: ['Gas natural', 'del gas natural'], en: ['Natural gas', 'natural gas'], fr: ['Gaz naturel', 'du gaz naturel'], it: ['Gas naturale', 'del gas naturale'], s: ['natural-gas', 'gaz-naturel', 'gas-naturale'] },
  petroleo_wti: { es: ['Petróleo WTI', 'del petróleo WTI'], en: ['WTI crude oil', 'WTI crude oil'], fr: ['Pétrole WTI', 'du pétrole WTI'], it: ['Petrolio WTI', 'del petrolio WTI'], s: ['wti-crude-oil', 'petrole-wti', 'petrolio-wti'] },
  petroleo_brent: { es: ['Petróleo Brent', 'del petróleo Brent'], en: ['Brent crude oil', 'Brent crude oil'], fr: ['Pétrole Brent', 'du pétrole Brent'], it: ['Petrolio Brent', 'del petrolio Brent'], s: ['brent-crude-oil', 'petrole-brent', 'petrolio-brent'] }
};
const L = {
  es: { code: 'es', dir: p => 'precios/' + p.es_slug, root: 'precios', up: '../../', locale: 'es-ES',
    reg: { us: 'EE. UU.', eu: 'Unión Europea', ca: 'Canadá', uk: 'Reino Unido' }, regShort: { eu: 'UE' }, mon: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
    unit: { cwt: '/cwt (100 libras)', bushel: '/bushel', tonelada: '/tonelada', '100kg': '/100 kg', litro: '/litro', gal: '/galón', mmbtu: '/MMBtu', docena: '/docena', lb: '/libra', ton_corta: '/tonelada corta', barril: '/barril', kg: '/kg' },
    title: (de, head) => 'Precio ' + de + ' hoy: ' + head, descIntro: de => 'Precio ' + de + ' actualizado: ', descEnd: '. Fuentes oficiales con enlace, unidad y metodología.',
    h1: (de, n) => 'Precio ' + de + ': ' + (n > 1 ? 'último dato por mercado' : 'último dato'), lead: (de, head, per) => 'Último precio ' + de + ' publicado por fuentes oficiales: ' + head + '. Dato más reciente: ' + per + '.',
    th: ['Mercado', 'Precio', 'Unidad', 'Periodo', 'Variación', 'Fuente'], cta: 'Ver gráfica e histórico →', news: n => 'Noticias ' + n, cal: n => 'Calendario de informes ' + n,
    note: 'Los precios de mercados distintos no son directamente comparables: cambian la unidad, la moneda, el punto de la cadena y la calidad del producto. Cifras tal como las publica cada fuente, sin conversión.', meth: 'Metodología', gen: 'Página generada el', what: 'Qué mide exactamente cada precio',
    faqH: 'Preguntas frecuentes', q: (de, m) => '¿Cuál es el precio ' + de + ' en ' + m + '?', a: (v, per, ch, fr) => v + ', dato de ' + per + (ch ? ', con una variación de ' + ch + ' respecto al dato anterior' : '') + '. Frecuencia de la fuente: ' + fr + '.',
    freq: { biweekly: 'quincenal', weekly: 'semanal', daily: 'diaria', monthly: 'mensual' }, regQ: { eu: 'la Unión Europea', us: 'EE. UU.', ca: 'Canadá', uk: 'el Reino Unido' }, others: 'Otros precios', prices: 'Precios', dsName: (de, rs) => 'Precio ' + de + ' en ' + rs, home: 'precios.html', metodo: 'metodologia.html' },
  en: { code: 'en', root: 'en/prices', up: '../../../', locale: 'en-GB',
    reg: { us: 'United States', eu: 'European Union', ca: 'Canada', uk: 'United Kingdom' }, regShort: { us: 'US', eu: 'EU' }, mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    unit: { cwt: '/cwt (100 lb)', bushel: '/bushel', tonelada: '/tonne', '100kg': '/100 kg', litro: '/litre', gal: '/gallon', mmbtu: '/MMBtu', docena: '/dozen', lb: '/lb', ton_corta: '/short ton', barril: '/barrel', kg: '/kg' },
    unitS: { bushel: '/bu', tonelada: '/t', litro: '/l', gal: '/gal', docena: '/doz', ton_corta: '/short ton', barril: '/bbl' },
    title: (de, head) => de[0].toUpperCase() + de.slice(1) + ' price today: ' + head, descIntro: de => 'Current ' + de + ' price: ', descEnd: '. Official sources with links, units and methodology.',
    h1: (de, n) => de[0].toUpperCase() + de.slice(1) + ' price: ' + (n > 1 ? 'latest data by market' : 'latest data'), lead: (de, head, per) => 'Latest ' + de + ' price published by official sources: ' + head + '. Most recent data point: ' + per + '.',
    th: ['Market', 'Price', 'Unit', 'Period', 'Change', 'Source'], cta: 'See chart and history →', news: n => n + ' news', cal: n => n + ' report calendar',
    note: 'Prices from different markets are not directly comparable: unit, currency, point in the supply chain and product quality all differ. Figures are shown as each source publishes them, without conversion.', meth: 'Methodology', gen: 'Page generated on', what: '',
    faqH: 'Frequently asked questions', q: (de, m) => 'What is the price of ' + de + ' in ' + m + '?', a: (v, per, ch, fr) => v + ', data for ' + per + (ch ? ', ' + ch + ' versus the previous data point' : '') + '. Source frequency: ' + fr + '.',
    freq: { biweekly: 'biweekly', weekly: 'weekly', daily: 'daily', monthly: 'monthly' }, regQ: { eu: 'the European Union', us: 'the United States', ca: 'Canada', uk: 'the United Kingdom' }, others: 'Other prices', prices: 'Prices', dsName: (de, rs) => de[0].toUpperCase() + de.slice(1) + ' price in ' + rs, home: 'precios.html', metodo: 'metodologia.html' },
  fr: { code: 'fr', root: 'fr/prix', up: '../../../', locale: 'fr-FR',
    reg: { us: 'États-Unis', eu: 'Union européenne', ca: 'Canada', uk: 'Royaume-Uni' }, regShort: { eu: 'UE', us: 'É.-U.' }, mon: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    unit: { cwt: '/cwt (100 livres)', bushel: '/bushel', tonelada: '/tonne', '100kg': '/100 kg', litro: '/litre', gal: '/gallon', mmbtu: '/MMBtu', docena: '/douzaine', lb: '/livre', ton_corta: '/tonne courte', barril: '/baril', kg: '/kg' },
    unitS: { bushel: '/bu', tonelada: '/t', litro: '/l', gal: '/gal', docena: '/douz.', ton_corta: '/t courte', barril: '/baril' },
    title: (de, head) => 'Prix ' + de + ' aujourd’hui : ' + head, descIntro: de => 'Prix ' + de + ' actualisé : ', descEnd: '. Sources officielles avec liens, unités et méthodologie.',
    h1: (de, n) => 'Prix ' + de + ' : ' + (n > 1 ? 'dernière donnée par marché' : 'dernière donnée'), lead: (de, head, per) => 'Dernier prix ' + de + ' publié par des sources officielles : ' + head + '. Donnée la plus récente : ' + per + '.',
    th: ['Marché', 'Prix', 'Unité', 'Période', 'Variation', 'Source'], cta: 'Voir le graphique et l’historique →', news: n => 'Actualités : ' + n, cal: n => 'Calendrier des rapports : ' + n,
    note: 'Les prix de marchés différents ne sont pas directement comparables : l’unité, la devise, le stade de la chaîne et la qualité du produit changent. Chiffres tels que publiés par chaque source, sans conversion.', meth: 'Méthodologie', gen: 'Page générée le', what: '',
    faqH: 'Questions fréquentes', q: (de, m) => 'Quel est le prix ' + de + ' en ' + m + ' ?', a: (v, per, ch, fr) => v + ', donnée de ' + per + (ch ? ', variation de ' + ch + ' par rapport à la donnée précédente' : '') + '. Fréquence de la source : ' + fr + '.',
    qq: (de, m) => 'Quel est le prix ' + de + ' au quintal (' + m + ') ?', qa: (v, per) => v + ' (1 quintal = 100 kg, soit le prix à la tonne divisé par 10), donnée de ' + per + '.', freq: { biweekly: 'bimensuelle', weekly: 'hebdomadaire', daily: 'quotidienne', monthly: 'mensuelle' }, regQ: { eu: 'l’Union européenne', us: 'aux États-Unis', ca: 'au Canada', uk: 'au Royaume-Uni' }, others: 'Autres prix', prices: 'Prix', dsName: (de, rs) => 'Prix ' + de + ' : ' + rs, home: 'precios.html', metodo: 'metodologia.html' },
  it: { code: 'it', root: 'it/prezzi', up: '../../../', locale: 'it-IT',
    reg: { us: 'Stati Uniti', eu: 'Unione europea', ca: 'Canada', uk: 'Regno Unito' }, regShort: { eu: 'UE', us: 'USA' }, mon: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
    unit: { cwt: '/cwt (100 libbre)', bushel: '/bushel', tonelada: '/tonnellata', '100kg': '/100 kg', litro: '/litro', gal: '/gallone', mmbtu: '/MMBtu', docena: '/dozzina', lb: '/libbra', ton_corta: '/tonnellata corta', barril: '/barile', kg: '/kg' },
    unitS: { bushel: '/bu', tonelada: '/t', litro: '/l', gal: '/gal', docena: '/dozz.', ton_corta: '/t corta', barril: '/barile' },
    title: (de, head) => 'Prezzo ' + de + ' oggi: ' + head, descIntro: de => 'Prezzo ' + de + ' aggiornato: ', descEnd: '. Fonti ufficiali con link, unità e metodologia.',
    h1: (de, n) => 'Prezzo ' + de + ': ' + (n > 1 ? 'ultimo dato per mercato' : 'ultimo dato'), lead: (de, head, per) => 'Ultimo prezzo ' + de + ' pubblicato da fonti ufficiali: ' + head + '. Dato più recente: ' + per + '.',
    th: ['Mercato', 'Prezzo', 'Unità', 'Periodo', 'Variazione', 'Fonte'], cta: 'Vedi grafico e storico →', news: n => 'Notizie: ' + n, cal: n => 'Calendario dei rapporti: ' + n,
    note: 'I prezzi di mercati diversi non sono direttamente confrontabili: cambiano unità, valuta, punto della filiera e qualità del prodotto. Cifre come le pubblica ogni fonte, senza conversione.', meth: 'Metodologia', gen: 'Pagina generata il', what: '',
    faqH: 'Domande frequenti', q: (de, m) => 'Qual è il prezzo ' + de + ' in ' + m + '?', a: (v, per, ch, fr) => v + ', dato di ' + per + (ch ? ', variazione di ' + ch + ' rispetto al dato precedente' : '') + '. Frequenza della fonte: ' + fr + '.',
    qq: (de, m) => 'Qual è il prezzo ' + de + ' al quintale (' + m + ')?', qa: (v, per) => v + ' (1 quintale = 100 kg, cioè il prezzo alla tonnellata diviso per 10), dato di ' + per + '.', freq: { biweekly: 'quindicinale', weekly: 'settimanale', daily: 'giornaliera', monthly: 'mensile' }, regQ: { eu: 'l’Unione europea', us: 'negli Stati Uniti', ca: 'in Canada', uk: 'nel Regno Unito' }, others: 'Altri prezzi', prices: 'Prezzi', dsName: (de, rs) => 'Prezzo ' + de + ': ' + rs, home: 'precios.html', metodo: 'metodologia.html' }
};
const CUR = { USD: 'USD', EUR: 'EUR', CAD: 'CAD', GBP: 'GBP' };
const TOPIC = { urea: 'fertilizantes', dap: 'fertilizantes', potasa: 'fertilizantes' };
const US = { cwt: '/cwt', bushel: '/bu', tonelada: '/t', '100kg': '/100 kg', litro: '/l', gal: '/gal', mmbtu: '/MMBtu', docena: '/docena', lb: '/lb', ton_corta: '/t corta', barril: '/barril', kg: '/kg' };
let cite = {}; try { cite = JSON.parse(read('data/views/license-cite.json')).sources || {}; } catch (e) { /* sin vista de citas: se usa el id */ }
// Alias de fuentes (p. ej. european_commission -> eu_agrifood): se cita con el nombre registrado, no con el id interno
try { const reg = JSON.parse(read('data/license-registry.json')).sources || {}; for (const k in reg) for (const a of (reg[k].aliases || [])) if (!cite[a] && cite[k]) cite[a] = cite[k]; } catch (e) { /* */ }
// Lugar real de cada precio en los cuatro idiomas (Zaragoza (España), Saskatchewan (Canadá), Mercado mundial…): el mismo que usa la app.
// La región de la web («eu», «ca») NO es el lugar: muchos precios «eu» son de España y los de Canadá son de una provincia.
let PLACE = {}; try { for (const x of JSON.parse(read('data/app/v1/prices.json')).prices || []) PLACE[x.id] = x.place; } catch (e) { /* */ }
// Datos viejos para su frecuencia (data/freshness.json, STALE): se rotulan y no cuentan como «hoy»
let STALE = new Set(); try { for (const x of JSON.parse(read('data/freshness.json')).latest.observations || []) if (x.state === 'STALE') STALE.add(x.id); } catch (e) { /* */ }
const STALE_T = { es: 'sin actualizar', en: 'not updated', fr: 'non mis à jour', it: 'non aggiornato' };
const byProd = {};
for (const r of ['us', 'eu', 'ca', 'uk']) {
  let d; try { d = JSON.parse(read('data/prices/latest/' + r + '.json')); } catch (e) { continue; }
  for (const o of d.observations || []) if (P[o.product] && o.currency !== 'INDEX' && typeof o.value === 'number' && !(r === 'eu' && (o.product === 'dap' || o.product === 'potasa')) /* «DAP/potasa» UE = agregado por nutriente, no es DAP ni MOP */) (byProd[o.product] = byProd[o.product] || []).push({ r, ...o });
}
// ---- Historico de 12 meses por mercado (15-oct-2026). Solo datos ya publicados en data/prices/history/<region>/<producto>.json: maximo, minimo, media, variacion
// frente a hace un ano y media por trimestre. Sin estimaciones: si el historico no termina en el ultimo dato publicado o tiene pocos puntos, ese mercado no se muestra.
const DAY = 864e5, MN = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 }, HC = {};
const histPts = o => {
  if (o.histArr) return o.histArr.map(([iso, v]) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return m && typeof v === 'number' && isFinite(v) ? { iso, t: Date.UTC(+m[1], +m[2] - 1, +m[3]), y: +m[1], m: +m[2], v } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
  const f = 'data/prices/history/' + o.r + '/' + o.product + '.json';
  if (!(f in HC)) { try { HC[f] = JSON.parse(read(f)); } catch (e) { HC[f] = null; } }
  const d = HC[f]; if (!d || d.id !== o.id || !Array.isArray(d.history)) return null;
  const out = [];
  for (const h of d.history) {
    if (typeof h.value !== 'number' || !isFinite(h.value)) continue;
    const p = String(h.period).trim().toUpperCase(); let m, dd = null, mm;
    if ((m = /^(\d{2})-(\d{2})$/.exec(p))) { mm = +m[1]; dd = +m[2]; }
    else if (/^\d{1,2}$/.test(p)) mm = +p;
    else if (/^[A-Z]{3}/.test(p) && MN[p.slice(0, 3)]) mm = MN[p.slice(0, 3)];
    else continue;
    if (!(mm >= 1 && mm <= 12) || !(+h.year > 1990)) continue;
    const y = +h.year;
    out.push({ iso: y + '-' + String(mm).padStart(2, '0') + (dd ? '-' + String(dd).padStart(2, '0') : ''), t: Date.UTC(y, mm - 1, dd || 15), y, m: mm, v: h.value });
  }
  return out.sort((a, b) => a.t - b.t);
};
const histStats = o => {
  const pts = histPts(o); if (!pts || pts.length < 8) return null;
  const last = pts[pts.length - 1];
  if (Math.abs(last.v - o.value) > Math.abs(o.value) * 1e-6 + 1e-9) return null;   // el historico debe terminar en el ultimo dato publicado
  const win = pts.filter(x => x.t > last.t - 365 * DAY); if (win.length < 6) return null;
  let hi = win[0], lo = win[0], sum = 0; for (const x of win) { if (x.v > hi.v) hi = x; if (x.v < lo.v) lo = x; sum += x.v; }
  const refT = last.t - 365 * DAY; let ago = null; for (const x of pts) if (Math.abs(x.t - refT) <= 20 * DAY && (!ago || Math.abs(x.t - refT) < Math.abs(ago.t - refT))) ago = x;
  const qs = {}; for (const x of pts) { const k = x.y * 4 + Math.floor((x.m - 1) / 3); (qs[k] = qs[k] || []).push(x.v); }
  const kl = last.y * 4 + Math.floor((last.m - 1) / 3), qm = {};
  for (let k = kl - 5; k <= kl; k++) if (qs[k]) qm[k] = { avg: qs[k].reduce((a, b) => a + b, 0) / qs[k].length, partial: k === kl && last.m % 3 !== 0 };
  return { last, hi, lo, avg: sum / win.length, ago: ago && ago.v > 0 ? ago : null, qm, kl };
};
const HT = {
  es: { h: 'Evolución en los últimos 12 meses', cols: ['Mercado', 'Máximo', 'Mínimo', 'Media', 'Último dato', 'Hace un año'], qh: 'Media por trimestre', q: (q, y) => 'T' + q + ' ' + y, part: '* Trimestre en curso: media de los datos publicados hasta ahora.', note: 'Calculado con los datos que publica la fuente en cada periodo; no hay estimaciones.',
    dir: { up: 'por encima', dn: 'por debajo' }, eq: 'coincide con', sen: (de, r, lo, dlo, hi, dhi, v, x, dir, avg) => r + ': en los últimos 12 meses el precio ' + de + ' ha oscilado entre ' + lo + ' (' + dlo + ') y ' + hi + ' (' + dhi + '). El último dato (' + v + ') ' + (dir === null ? 'coincide con la media del periodo' : 'está un ' + x + ' % ' + dir + ' de la media del periodo') + ' (' + avg + ').' },
  en: { h: 'Last 12 months', cols: ['Market', 'High', 'Low', 'Average', 'Latest', 'A year ago'], qh: 'Average by quarter', q: (q, y) => 'Q' + q + ' ' + y, part: '* Current quarter: average of the data published so far.', note: 'Calculated from the data the source publishes for each period; nothing is estimated.',
    dir: { up: 'above', dn: 'below' }, sen: (de, r, lo, dlo, hi, dhi, v, x, dir, avg) => r + ': over the last 12 months the ' + de + ' price ranged from ' + lo + ' (' + dlo + ') to ' + hi + ' (' + dhi + '). The latest value (' + v + ') ' + (dir === null ? 'is in line with the 12-month average' : 'is ' + x + '% ' + dir + ' the 12-month average') + ' (' + avg + ').' },
  fr: { h: 'Évolution sur les 12 derniers mois', cols: ['Marché', 'Maximum', 'Minimum', 'Moyenne', 'Dernière donnée', 'Il y a un an'], qh: 'Moyenne par trimestre', q: (q, y) => 'T' + q + ' ' + y, part: '* Trimestre en cours : moyenne des données publiées à ce jour.', note: 'Calculé à partir des données que publie la source pour chaque période ; aucune estimation.',
    dir: { up: 'au-dessus de', dn: 'en dessous de' }, sen: (de, r, lo, dlo, hi, dhi, v, x, dir, avg) => r + ' : sur les 12 derniers mois, le prix ' + de + ' a oscillé entre ' + lo + ' (' + dlo + ') et ' + hi + ' (' + dhi + '). La dernière donnée (' + v + ') ' + (dir === null ? 'est égale à la moyenne de la période' : 'est ' + x + ' % ' + dir + ' la moyenne de la période') + ' (' + avg + ').' },
  it: { h: 'Andamento negli ultimi 12 mesi', cols: ['Mercato', 'Massimo', 'Minimo', 'Media', 'Ultimo dato', 'Un anno fa'], qh: 'Media per trimestre', q: (q, y) => 'T' + q + ' ' + y, part: '* Trimestre in corso: media dei dati pubblicati finora.', note: 'Calcolato con i dati che la fonte pubblica per ogni periodo; nessuna stima.',
    dir: { up: 'sopra', dn: 'sotto' }, sen: (de, r, lo, dlo, hi, dhi, v, x, dir, avg) => r + ': negli ultimi 12 mesi il prezzo ' + de + ' è oscillato tra ' + lo + ' (' + dlo + ') e ' + hi + ' (' + dhi + '). L’ultimo dato (' + v + ') ' + (dir === null ? 'coincide con la media del periodo' : 'è ' + x + ' % ' + dir + ' la media del periodo') + ' (' + avg + ').' }
};
// Fertilizantes de EE. UU. por estado (USDA AMS, data/us-fertilizers.json): no hay precio nacional, asi que cada estado es una fila propia con su fecha y su unidad
// (USD por tonelada corta), sin promediar ni mezclar con el precio mundial (USD por tonelada metrica). El historico de cada fila sale del propio fichero.
const STN = {
  'Illinois': { es: 'Illinois (EE. UU.)', en: 'Illinois (US)', fr: 'Illinois (États-Unis)', it: 'Illinois (Stati Uniti)' },
  'Iowa': { es: 'Iowa (EE. UU.)', en: 'Iowa (US)', fr: 'Iowa (États-Unis)', it: 'Iowa (Stati Uniti)' },
  'Maryland': { es: 'Maryland (EE. UU.)', en: 'Maryland (US)', fr: 'Maryland (États-Unis)', it: 'Maryland (Stati Uniti)' },
  'North Carolina': { es: 'Carolina del Norte (EE. UU.)', en: 'North Carolina (US)', fr: 'Caroline du Nord (États-Unis)', it: 'Carolina del Nord (Stati Uniti)' },
  'Oklahoma': { es: 'Oklahoma (EE. UU.)', en: 'Oklahoma (US)', fr: 'Oklahoma (États-Unis)', it: 'Oklahoma (Stati Uniti)' },
  'Inter-Mountain West': { es: 'Inter-Mountain West (Oeste interior, EE. UU.)', en: 'Inter-Mountain West (US)', fr: 'Inter-Mountain West (Ouest intérieur, États-Unis)', it: 'Inter-Mountain West (Ovest interno, Stati Uniti)' }
};
const STR = ['Illinois', 'Iowa', 'Oklahoma', 'North Carolina', 'Maryland', 'Inter-Mountain West'];   // orden de las filas por estado
const POT = { Red: { es: 'roja 0-0-60', en: 'red 0-0-60', fr: 'rouge 0-0-60', it: 'rossa 0-0-60' }, White: { es: 'blanca 0-0-62', en: 'white 0-0-62', fr: 'blanche 0-0-62', it: 'bianca 0-0-62' } };
try {
  const fz = JSON.parse(read('data/us-fertilizers.json'));
  for (const fp of fz.products || []) {
    if (!P[fp.id]) continue;
    for (const st of fp.states || []) {
      if (!STN[st.state] || typeof st.avg !== 'number' || !st.date) continue;
      const id = 'us_ams_' + fp.id + '_' + st.state.toLowerCase().replace(/[^a-z]+/g, '_');
      const pot = fp.id === 'potasa' ? (/White/.test(st.spec) ? POT.White : POT.Red) : null;
      PLACE[id] = {}; for (const lg of ['es', 'en', 'fr', 'it']) PLACE[id][lg] = STN[st.state][lg] + (pot ? ' · ' + pot[lg] : '');
      (byProd[fp.id] = byProd[fp.id] || []).push({ r: 'us', state: true, rank: STR.indexOf(st.state), id, product: fp.id, value: st.avg, currency: 'USD', unit: 'ton_corta', observationDate: st.date, changePct: typeof st.prev === 'number' && st.prev > 0 ? (st.avg / st.prev - 1) * 100 : null, frequency: 'biweekly', sourceId: 'usda_ams_mars', histArr: st.hist });
    }
  }
} catch (e) { /* sin fertilizantes de EE. UU. */ }
const QUINTAL = new Set(['arroz', 'avena', 'cebada', 'centeno', 'colza', 'maiz', 'trigo', 'trigo_duro']);
const ORDER = ['us', 'eu', 'ca', 'uk'];
const keys = Object.keys(byProd).sort();
const urlOf = (lg, k) => SITE + '/' + L[lg].root + '/' + (lg === 'es' ? k : P[k].s[['en', 'fr', 'it'].indexOf(lg)]) + '/';
const lastDay = new Date().toISOString().slice(0, 10), urls = [];
for (const lg of Object.keys(L)) {
  const T = L[lg];
  const per = p => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(p || ''); return m ? (m[3] ? +m[3] + ' ' : '') + T.mon[+m[2] - 1] + ' ' + m[1] : (p || ''); };
  const nf = v => v.toLocaleString(T.locale, { minimumFractionDigits: Math.abs(v) >= 100 ? 0 : 2, maximumFractionDigits: Math.abs(v) >= 100 ? 1 : 2 });
  const pct = v => v == null ? '–' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString(T.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
  for (const p of keys) {
    const obs = byProd[p].sort((a, b) => (a.state ? 1 : 0) - (b.state ? 1 : 0) || (a.rank || 0) - (b.rank || 0) || ORDER.indexOf(a.r) - ORDER.indexOf(b.r)), [name, de] = P[p][lg];
    const url = urlOf(lg, p), up = T.up, rg = o => (PLACE[o.id] && PLACE[o.id][lg]) || T.reg[o.r], un = o => T.unit[o.unit] || '/' + o.unit;
    const line = o => nf(o.value) + ' ' + CUR[o.currency] + ((T.unitS && T.unitS[o.unit]) || US[o.unit] || '/' + o.unit);
    const fresh = obs.filter(o => !STALE.has(o.id)).concat(obs.filter(o => STALE.has(o.id)));   // en el título, primero los datos al día
    const rgs = o => { if (o.state) return rg(o).split(' (')[0].split(' · ')[0]; const r0 = rg(o); return (r0 === T.reg[o.r] || /^(EE\. UU\.|US|États-Unis|Stati Uniti)$/.test(r0)) ? (T.regShort[o.r] || r0) : r0; };   // en el título, abreviatura de país si el lugar es el país entero
    const head = fresh.slice(0, 2).map(o => rgs(o) + ' ' + line(o)).join(' · ');
    const head1 = fresh.slice(0, 1).map(o => rgs(o) + ' ' + line(o)).join(' · ');
    // <= ~62 caracteres: si dos mercados no caben, solo el primero (el resto va en la descripcion); si ni asi cabe en 65 (cifra de precio mas larga), solo la cifra sin el lugar
    const head0 = fresh.length ? line(fresh[0]) : head1, title = seoTitle(T.title(de, T.title(de, head).length <= 62 ? head : T.title(de, head1).length <= 65 ? head1 : head0));
    const latest = obs.reduce((m, o) => o.observationDate > m ? o.observationDate : m, '');
    const desc = (T.descIntro(de) + obs.map(o => rg(o) + ' ' + line(o) + ' (' + per(o.observationDate) + (o.changePct != null ? ', ' + pct(o.changePct) : '') + ')').join('; ') + T.descEnd).slice(0, 300);
    const rows = obs.map(o => { const s = cite[o.sourceId] || {};
      return '<tr><th scope="row" style="text-align:left;padding:8px 6px">' + esc(rg(o)) + '</th><td style="text-align:right;padding:8px 6px"><b>' + esc(nf(o.value)) + '</b></td><td style="padding:8px 6px">' + esc(CUR[o.currency] + un(o)) + '</td><td style="padding:8px 6px">' + esc(per(o.observationDate) + (STALE.has(o.id) ? ' (' + STALE_T[lg] + ')' : '')) + '</td><td style="text-align:right;padding:8px 6px">' + esc(pct(o.changePct)) + '</td><td style="padding:8px 6px">' + (s.url ? '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.short || s.name || o.sourceId) + '</a>' : esc(o.sourceId)) + '</td></tr>'; }).join('\n');
    // Historico de 12 meses (solo mercados con historico completo hasta el ultimo dato publicado)
    const hs = obs.map(o => ({ o, s: histStats(o) })).filter(x => x.s && (Date.parse(lastDay) - x.s.last.t) / DAY <= 200), HL = HT[lg], rgh = o => rg(o) + (STALE.has(o.id) ? ' (' + STALE_T[lg] + ')' : '');   // los datos sin actualizar se resumen rotulados, con las fechas reales del ultimo dato
    let histHtml = '';
    if (hs.length) {
      const fm = (o, v) => nf(v) + ' ' + CUR[o.currency] + ((T.unitS && T.unitS[o.unit]) || US[o.unit] || '/' + o.unit);
      const sens = hs.map(({ o, s }) => { const x = (s.last.v / s.avg - 1) * 100; return '<p>' + esc(HL.sen(de, rgh(o), fm(o, s.lo.v), per(s.lo.iso), fm(o, s.hi.v), per(s.hi.iso), fm(o, s.last.v), pct(x).replace(/^[+−]/, '').replace(' %', ''), Math.abs(x) < 0.1 ? null : (x > 0 ? HL.dir.up : HL.dir.dn), fm(o, s.avg))) + '</p>'; }).join('\n');
      const th = (t, i) => '<th scope="col" style="text-align:' + (i === 0 ? 'left' : 'right') + ';padding:8px 6px;font-size:11px">' + esc(t) + '</th>';
      const trs = hs.map(({ o, s }) => '<tr><th scope="row" style="text-align:left;padding:8px 6px">' + esc(rgh(o)) + '</th>' + [fm(o, s.hi.v) + ' (' + per(s.hi.iso) + ')', fm(o, s.lo.v) + ' (' + per(s.lo.iso) + ')', fm(o, s.avg), fm(o, s.last.v), s.ago ? pct((s.last.v / s.ago.v - 1) * 100) : '–'].map(c => '<td style="text-align:right;padding:8px 6px">' + esc(c) + '</td>').join('') + '</tr>').join('\n');
      const kl = Math.max(...hs.map(x => x.s.kl)), ks = []; for (let k = kl - 5; k <= kl; k++) if (hs.some(x => x.s.qm[k])) ks.push(k);
      const qrows = hs.map(({ o, s }) => '<tr><th scope="row" style="text-align:left;padding:8px 6px">' + esc(rgh(o)) + '</th>' + ks.map(k => '<td style="text-align:right;padding:8px 6px">' + (s.qm[k] ? esc(nf(s.qm[k].avg) + (s.qm[k].partial ? ' *' : '')) : '–') + '</td>').join('') + '</tr>').join('\n');
      const anyPartial = hs.some(x => Object.values(x.s.qm).some(q => q.partial));
      histHtml = '    <h2 style="font-size:17px;margin-top:22px">' + esc(HL.h) + '</h2>\n' + sens + '\n    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px"><thead><tr>' + HL.cols.map(th).join('') + '</tr></thead><tbody>\n' + trs + '\n</tbody></table></div>\n' +
        '    <h3 style="font-size:15px;margin:16px 0 6px">' + esc(HL.qh) + '</h3>\n    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:480px;font-size:14px"><thead><tr>' + [HL.cols[0]].concat(ks.map(k => HL.q(k % 4 + 1, Math.floor(k / 4)))).map(th).join('') + '</tr></thead><tbody>\n' + qrows + '\n</tbody></table></div>\n' +
        '    <p class="di-movers-hint">' + esc(HL.note + (anyPartial ? ' ' + HL.part : '')) + '</p>\n';
    }
    const meth = lg === 'es' ? obs.filter(o => o.methodology).map(o => '<li><b>' + esc(rg(o)) + ':</b> ' + esc(o.methodology) + '</li>').join('\n') : '';
    const faq = obs.map(o => '<h3 style="font-size:15px;margin:14px 0 4px">' + esc(T.q(de, (PLACE[o.id] && PLACE[o.id][lg]) || T.regQ[o.r])) + '</h3><p>' + esc(T.a(nf(o.value) + ' ' + CUR[o.currency] + un(o), per(o.observationDate), o.changePct != null ? pct(o.changePct) : '', T.freq[o.frequency] || o.frequency || '')) + '</p>').join('\n');
    // fr/it: los cereales y oleaginosas se cotizan al quintal (1 q = 100 kg): respuesta directa, conversion exacta
    const qFaq = T.qq && QUINTAL.has(p) ? obs.filter(o => o.unit === 'tonelada' && o.currency === 'EUR').map(o => '<h3 style="font-size:15px;margin:14px 0 4px">' + esc(T.qq(de, rg(o))) + '</h3><p>' + esc(T.qa(nf(o.value / 10) + ' ' + CUR[o.currency] + (lg === 'fr' ? '/quintal' : '/quintale'), per(o.observationDate))) + '</p>').join('\n') : '';
    const others = keys.filter(x => x !== p).map(x => '<a href="../' + (lg === 'es' ? x : P[x].s[['en', 'fr', 'it'].indexOf(lg)]) + '/">' + esc(P[x][lg][0]) + '</a>').join(' · ');
    const alts = Object.keys(L).map(l2 => '<link rel="alternate" hreflang="' + l2 + '" href="' + urlOf(l2, p) + '">').join('\n') + '\n<link rel="alternate" hreflang="x-default" href="' + urlOf('en', p) + '">';
    const topic = TOPIC[p] || p;
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Dataset', name: T.dsName(de, obs.map(rg).join(', ')), description: desc, url, inLanguage: lg, isAccessibleForFree: true, dateModified: lastDay, temporalCoverage: latest, creator: { '@type': 'Organization', name: 'Dehesa Index', url: SITE }, isBasedOn: obs.map(o => (cite[o.sourceId] || {}).url).filter(Boolean), license: (function () { const u = [...new Set(obs.map(o => cite[o.sourceId]).filter(c => c && c.status === 'VERIFIED' && c.licenseUrl).map(c => c.licenseUrl))]; return u.length ? (u.length === 1 ? u[0] : u) : undefined; })() },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Dehesa Index', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: T.prices, item: SITE + '/precios.html' }, { '@type': 'ListItem', position: 3, name, item: url }] }
    ] };
    const html = `<!doctype html>
<html lang="${lg}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seoDesc(desc))}">
<link rel="canonical" href="${url}">
${alts}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(seoDesc(desc))}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="Dehesa Index">${socialMeta(lg)}
<link rel="icon" href="${up}assets/favicon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="${up}assets/icon-192.png">
<link rel="stylesheet" href="${up}css/fonts.css">
<link rel="stylesheet" href="${up}css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div id="di-nav-root"></div>
<main class="di-page">
  <article class="di-main di-content-narrow">
    <div class="di-page-head">
      <h1>${esc(T.h1(de, obs.length))}</h1>
      <p>${esc(T.lead(de, head, per(latest)))}</p>
    </div>
    <div class="di-card" style="padding:6px 16px;overflow-x:auto"><table style="border-collapse:collapse;width:100%;min-width:560px;font-size:14px">
<thead><tr>${T.th.map((h, i) => '<th scope="col" style="text-align:' + (i === 1 || i === 4 ? 'right' : 'left') + ';padding:8px 6px;font-size:11px">' + esc(h) + '</th>').join('')}</tr></thead>
<tbody>
${rows}
</tbody></table></div>
    <p style="margin:14px 0"><a class="di-btn-gold-solid" href="${up}precios.html?product=${esc(p)}">${esc(T.cta)}</a></p>
    <p class="di-movers-hint"><a href="${up}noticias.html?product=${esc(topic)}">${esc(T.news(name))}</a> · <a href="${up}calendario.html?crop=${esc(topic)}">${esc(T.cal(name))}</a></p>
    <p class="di-movers-hint">${esc(T.note)} <a href="${up}${T.metodo}">${esc(T.meth)}</a> · ${esc(T.gen)} ${esc(lastDay)}.</p>
${histHtml}${meth ? '    <h2 style="font-size:17px;margin-top:22px">' + esc(T.what) + '</h2>\n    <ul>' + meth + '</ul>' : ''}
    <h2 style="font-size:17px;margin-top:22px">${esc(T.faqH)}</h2>
${faq}
${qFaq}
    <h2 style="font-size:17px;margin-top:22px">${esc(T.others)}</h2>
    <p>${others}</p>
  </article>
</main>
<div id="di-footer-root"></div>
<script src="${up}js/boot.js?v=${BOOT_V}" data-lang="${lg}"></script>
<script src="${up}js/shared.js?v=${SHARED_V}"></script>
<script src="${up}js/boot.js?v=${BOOT_V}" data-init="informacion"></script>
</body>
</html>
`;
    const dir = url.replace(SITE + '/', '');
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + 'index.html', html); urls.push(url);
  }
}
// sitemap: bloque marcado propio; se quitan las entradas manuales de precios/ que ahora genera este script
let sm = read('sitemap.xml'); const A = '  <!-- product-pages:start -->', B = '  <!-- product-pages:end -->';
sm = sm.replace(/^  <url><loc>https:\/\/dehesaindex\.com\/precios\/[a-z_]+\/<\/loc><\/url>\n/gm, '');
const block = A + '\n' + urls.sort().map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n' + B;
if (sm.includes(A)) sm = sm.replace(new RegExp(A + '[\\s\\S]*?' + B), block); else sm = sm.replace('</urlset>', block + '\n</urlset>');
fs.writeFileSync('sitemap.xml', sm);
console.log('paginas de producto', urls.length);
