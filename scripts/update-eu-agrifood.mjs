#!/usr/bin/env node
/*
 * Precios de la UE desde el Agri-food Data Portal de la Comisión Europea
 * (API pública, sin clave): https://api.tech.ec.europa.eu/agrifood
 *
 * Uso: node scripts/update-eu-agrifood.mjs cerdo vaca cordero ...
 *
 * Convención de la web: la tarjeta "eu" de cada producto es la referencia de
 * ESPAÑA (la vista de España usa p.eu tal cual) y los demás países se derivan
 * con countryFactors = precio del país / precio de España en la MISMA fecha.
 * Por eso este script, además del precio, recalcula esos factores con datos
 * reales cuando el portal publica todos los países para esa fecha.
 *
 * Por cada producto de PRODUCTS:
 *   1. descarga la serie (Estado miembro base + países de countryFactors),
 *   2. escribe la observación en data/snapshots/<hoy>.json,
 *   3. actualiza en js/data.js el bloque eu:, los countryFactors, la etiqueta
 *      de mercado y la ficha de Data Trust con expresiones regulares ancladas
 *      (si no encuentra un bloque, falla en lugar de escribir a ciegas).
 * No inventa nada: si la API no devuelve datos válidos termina con error sin
 * tocar ningún archivo.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const DATA_JS = path.join(root, 'js', 'data.js');
const SNAP_DIR = path.join(root, 'data', 'snapshots');
const BASE = 'https://api.tech.ec.europa.eu/agrifood/api';
const COUNTRY_CODE = { es: 'ES', de: 'DE', fr: 'FR', it: 'IT' };
const NOTE_PUB = ' La API no publica fecha de publicación: se registra el día en que se recuperó por primera vez.';

export const PRODUCTS = {
  cerdo: {
    catId: 'porcino', id: 'di_porcino_cerdo_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'pigmeat', member: 'ES', unitExpected: '100 KG', obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.pigClass === 'S', recent: true,
    market: 'Comisión Europea (porcino, España, clase S)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cerdo clasificada S (≥60 % magro) en España, EUR/100 kg de canal. Es la referencia española; no es la media de la UE.' + NOTE_PUB
  },
  vaca: {
    catId: 'ganado', id: 'di_ganado_vaca_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'beef', member: 'ES', unitExpected: '€/100Kg', obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.category === 'Young bulls' && r.productCode === 'AR3', recent: true,
    market: 'Comisión Europea (vacuno, España, machos jóvenes A-R3)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de macho joven (categoría A, conformación R3, la referencia UE) en España, EUR/100 kg de canal. No es vaca de desecho ni la media de la UE.' + NOTE_PUB
  },
  cordero: {
    catId: 'ovino', id: 'di_ovino_cordero_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'sheepAndGoat', member: 'ES', unitExpected: '100kg', obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.category === 'Heavy Lamb', recent: true,
    market: 'Comisión Europea (ovino, España, cordero pesado)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la canal de cordero pesado en España, EUR/100 kg de canal. No es la media de la UE ni cordero ligero.' + NOTE_PUB
  },
  pollo: {
    catId: 'avicultura', id: 'di_avicultura_pollo_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'poultry', member: 'ES', unitExpected: 'national currency/100kg', obsUnit: 'kg', divisor: 100, dateField: 'endDate',
    select: r => r.productName === 'Whole broiler (65%)' && r.priceType === 'Selling price', recent: true,
    market: 'Comisión Europea (pollo, España, broiler entero 65 %)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio de venta semanal del pollo broiler entero (65 % de rendimiento) en España; el portal lo da en moneda nacional (EUR) por 100 kg y se divide entre 100 para expresarlo en EUR/kg.' + NOTE_PUB
  },
  maiz: {
    catId: 'cereales', id: 'di_cereales_maiz_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'cereal', member: 'ES', unitExpected: 'TONNES', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.productName === 'Feed maize' && r.marketName === 'Zaragoza' && /^Departure from silo/.test(r.stageName), recent: true,
    market: 'Comisión Europea (maíz pienso, mercado de Zaragoza, salida de silo)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del maíz pienso en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional (la media nacional del portal está desactualizada) ni un futuro de Euronext.' + NOTE_PUB
  },
  cebada: {
    catId: 'cereales', id: 'di_cereales_cebada_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'cereal', member: 'ES', unitExpected: 'TONNES', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.productName === 'Feed barley' && r.marketName === 'Lerida' && /^Departure from silo/.test(r.stageName), recent: true,
    market: 'Comisión Europea (cebada pienso, mercado de Lleida, salida de silo)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la cebada pienso en el mercado de Lleida (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional ni un futuro de Euronext. El portal no publica cebada pienso en Zaragoza.' + NOTE_PUB
  },
  avena: {
    catId: 'cereales', id: 'di_cereales_avena_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'cereal', member: 'EU', unitExpected: 'TONNES', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.productName === 'Feed oats' && /^National Average/.test(r.stageName), recent: true,
    market: 'Comisión Europea (avena pienso, agregado UE)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del agregado de la UE de avena pienso (media nacional de los Estados miembros que la publican), EUR/tonelada. España no publica avena en el portal. Es el agregado de la Comisión, no una media calculada por Dehesa Index.' + NOTE_PUB
  },
  mantequilla: {
    catId: 'lacteos', id: 'di_lacteos_mantequilla_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'dairy', member: 'EU', unitExpected: ['100KG', '100 KG', '€/100Kg', '100kg', '€/100kg'], obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.product === 'BUTTER', recent: true,
    market: 'Comisión Europea (mantequilla, agregado UE)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la mantequilla, agregado de la UE calculado por la Comisión, EUR/100 kg. No es un futuro ni una media calculada por Dehesa Index. La serie de España tiene huecos de varias semanas.' + NOTE_PUB
  },
  leche_polvo: {
    catId: 'lacteos', id: 'di_lacteos_leche_polvo_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'dairy', member: 'EU', unitExpected: ['100KG', '100 KG', '€/100Kg', '100kg', '€/100kg'], obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.product === 'SMP', recent: true,
    market: 'Comisión Europea (leche desnatada en polvo, agregado UE)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la leche desnatada en polvo (SMP), agregado de la UE calculado por la Comisión, EUR/100 kg. No es un futuro ni una media calculada por Dehesa Index. La serie de España tiene huecos de varias semanas.' + NOTE_PUB
  },
  colza: {
    catId: 'cereales', id: 'di_cereales_colza_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'oilseeds', member: 'ES', unitExpected: '€/t', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.product === 'Rapeseed' && r.marketStage === 'DEPSILO' && r.market === 'National Average' && (!r.productType || /^(N\.?A\.?|Not Defined)$/i.test(String(r.productType).trim())), recent: true,
    market: 'Comisión Europea (colza, España, media nacional)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la colza en España (media nacional, salida de silo del agricultor), EUR/tonelada. No es la media de la UE ni el futuro de Euronext.' + NOTE_PUB
  },
  centeno: {
    catId: 'cereales', id: 'di_cereales_centeno_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'cereal', member: 'EU', unitExpected: 'TONNES', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.productName === 'Rye of breadmaking quality' && /^National Average/.test(r.stageName), recent: true,
    market: 'Comisión Europea (centeno panificable, agregado UE)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del agregado de la UE de centeno panificable (media nacional de los Estados miembros que lo publican), EUR/tonelada. España no publica centeno en el portal. Es el agregado de la Comisión, no una media calculada por Dehesa Index.' + NOTE_PUB
  },
  trigo: {
    catId: 'cereales', id: 'di_cereales_trigo_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'cereal', member: 'ES', unitExpected: 'TONNES', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.productName === 'Milling wheat' && r.marketName === 'Zaragoza' && /^Departure from silo/.test(r.stageName), recent: true,
    // Coeficientes por país: un mercado de referencia de trigo panificable por país (misma semana), sobre el de Zaragoza
    countryMarkets: {
      fr: r => r.productName === 'Milling wheat' && r.marketName === 'Rouen',
      de: r => r.productName === 'Milling wheat' && r.marketName === 'Hamburg',
      it: r => r.productName === 'Milling wheat' && r.marketName === 'Bologna'
    },
    market: 'Comisión Europea (trigo panificable, mercado de Zaragoza, salida de silo)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal del trigo blando panificable (milling wheat) en el mercado de Zaragoza (España), salida de silo tras almacenamiento en camión, EUR/tonelada. Es un mercado regional, no la media nacional ni un futuro de Euronext. Los coeficientes de Francia, Alemania e Italia comparan un mercado de referencia de cada país (Rouen, Hamburgo, Bolonia) con Zaragoza la misma semana; las etapas de comercialización no son idénticas.' + NOTE_PUB
  },
  dap: {
    catId: 'fertilizantes', id: 'di_fertilizantes_dap_eu', sourceId: 'eu_agrifood', frequency: 'monthly',
    commodity: 'fertiliser', member: null, unitExpected: '€/tonne', obsUnit: 'tonelada', divisor: 1, dateField: 'yearMonth',
    select: r => r.product === 'P (Phosphorus)', comparability: 'not_comparable', quoteType: 'indice',
    market: 'Comisión Europea (fósforo, precio agregado por nutriente)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual agregado de los fertilizantes fosfatados (P) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es DAP: la Comisión no especifica el producto, así que no es comparable con DAP ni con el índice DTN.' + NOTE_PUB
  },
  potasa: {
    catId: 'fertilizantes', id: 'di_fertilizantes_potasa_eu', sourceId: 'eu_agrifood', frequency: 'monthly',
    commodity: 'fertiliser', member: null, unitExpected: '€/tonne', obsUnit: 'tonelada', divisor: 1, dateField: 'yearMonth',
    select: r => r.product === 'K (Potash)', comparability: 'not_comparable', quoteType: 'indice',
    market: 'Comisión Europea (potasio, precio agregado por nutriente)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual agregado de los fertilizantes potásicos (K) en varios mercados de la UE, EUR/tonelada, a partir de servicios de inteligencia de mercado. NO es MOP: la Comisión no especifica el producto, así que no es comparable con MOP ni con el índice DTN.' + NOTE_PUB
  },
  huevos: {
    catId: 'avicultura', id: 'di_avicultura_huevos_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'poultry/egg', member: 'ES', unitExpected: '€/100Kg', obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.farmingMethod === 'Cage', recent: true,
    // Alemania no publica huevos de jaula: su factor se calcula como cociente Alemania/España con el MISMO método (suelo).
    countryVariants: { de: r => r.farmingMethod === 'Barn' },
    metricUnit: { key: '100kg', kg: 100 },
    market: 'Comisión Europea (huevos, España, gallinas en jaula)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de los huevos de gallinas en jaula (Cage) en España, EUR/100 kg de huevos (el portal no lo da por docena). No es la media de la UE.' + NOTE_PUB
  },
  harina_soja: {
    catId: 'pienso', id: 'di_pienso_harina_soja_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'oilseeds', member: 'ES', unitExpected: 'national currency/ton', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.product === 'Soya meal' && r.productType === '40-50% protein content' && r.market === 'Average', recent: true,
    market: 'Comisión Europea (harina de soja, España, media nacional)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal de la harina de soja de 40-50 % de proteína en España (media, salida de fábrica), EUR/tonelada. Sustituye a la referencia anterior de colza en Euronext.' + NOTE_PUB
  },
  azucar: {
    catId: 'azucar', id: 'di_azucar_azucar_eu', sourceId: 'eu_agrifood', frequency: 'monthly',
    commodity: 'sugar', member: null, unitExpected: 'Tonne', obsUnit: 'tonelada', divisor: 1, dateField: 'ym',
    select: r => r.sugarRegion === 'EU Average' && r.contractType === 'Monthly data',
    market: 'Comisión Europea (azúcar blanco, media UE)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio mensual medio del azúcar en la UE (contratos mensuales), EUR/tonelada. Es la media de la UE, no un precio de España.' + NOTE_PUB
  },
  oliva: {
    catId: 'aceite', id: 'di_aceite_oliva_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'oliveOil', member: 'ES', unitExpected: '€/100kg', obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.product === 'Extra virgin olive oil (up to 0.8%)' && r.market === 'Average national price', recent: true,
    market: 'Comisión Europea (aceite de oliva virgen extra, España, media nacional)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal medio nacional del aceite de oliva virgen extra (hasta 0,8 %) en España, EUR/100 kg. No es la media de la UE.' + NOTE_PUB
  },
  arroz: {
    catId: 'cereales', id: 'di_cereales_arroz_eu', sourceId: 'eu_agrifood', frequency: 'weekly',
    commodity: 'rice', member: 'ES', unitExpected: 'Tonne', obsUnit: 'tonelada', divisor: 1, dateField: 'endDate',
    select: r => r.stage === 'Paddy' && r.type === 'Japonica' && (r.variety === 'Avg' || r.variety === 'Average'), recent: true,
    market: 'Comisión Europea (arroz cáscara japónica, España)',
    methodology: 'Comisión Europea, Agri-food Data Portal: precio semanal medio del arroz cáscara (paddy) tipo japónica en España, EUR/tonelada. No es la media de la UE ni arroz índica.' + NOTE_PUB
  },
  leche: {
    catId: 'lacteos', id: 'di_leche_eu', sourceId: 'european_commission', frequency: 'monthly',
    commodity: 'rawMilk', member: 'ES', unitExpected: '100KG', obsUnit: '100kg', divisor: 1, dateField: 'endDate',
    select: r => r.product === 'Raw milk', completedOnly: true,
    market: 'Comisión Europea (leche cruda de vaca, España)',
    methodology: 'Comisión Europea, Milk Market Observatory (Agri-food Data Portal): precio mensual de la leche cruda de vaca pagada al productor en España, EUR/100 kg, último mes completo. Las cifras del último mes pueden ser provisionales. Es la referencia española; no es la media de la UE.' + NOTE_PUB
  }
};

export function parseEuDate(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
export function parsePrice(s) {
  let t = String(s || '').replace(/[^0-9.,\-]/g, '');
  if (t.includes(',') && t.includes('.')) t = t.replace(/,/g, '');      // 1,234.50
  else if (t.includes(',')) t = t.replace(',', '.');                    // 248,00 (formato del portal en cereales)
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}
const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
function dateOf(r, cfg) {
  if (cfg.dateField === 'yearMonth') return MONTHS[r.month] && r.year ? r.year + '-' + MONTHS[r.month] : null;
  if (cfg.dateField === 'ym') { const m = /^(\d{4})\/(\d{2})$/.exec(String(r.ym || '')); return m ? m[1] + '-' + m[2] : null; }
  return parseEuDate(r[cfg.dateField]);
}

/** Serie [[fecha, precio], ...] ordenada, de un Estado miembro (o null = sin filtro). */
export function buildSeries(rows, cfg, member, today) {
  const byDate = new Map();
  for (const r of rows) {
    if (member && r.memberStateCode !== member) continue;
    if (!cfg.select(r)) continue;
    if (Array.isArray(cfg.unitExpected) ? cfg.unitExpected.indexOf(r.unit) < 0 : r.unit !== cfg.unitExpected) continue;
    const d = dateOf(r, cfg); const p = parsePrice(r.price);
    if (!d || p === null) continue;
    if (cfg.completedOnly && !(parseEuDate(r.endDate) < today)) continue;
    byDate.set(d, Number((p / cfg.divisor).toFixed(4)));
  }
  return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function jsString(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

export function patchDataJs(data, cfg, name, o) {
  // 1) bloque eu: (conserva moneda y kgPerUnit existentes)
  const euRe = new RegExp("(nameKey: '" + name + "',(?:(?!\\{ nameKey:)[\\s\\S])*?\\n\\s*eu: \\{)([^\\n]*?)(\\},\\n)");
  let m = euRe.exec(data);
  if (!m) throw new Error('Bloque eu: de ' + name + ' no encontrado en js/data.js');
  const keep = /currency: '([A-Z]+)', kgPerUnit: ([\d.]+)/.exec(m[2]);
  if (!keep) throw new Error('Formato del bloque eu: de ' + name + ' no reconocido');
  const body = ' price: ' + o.latest[1] + ', changePct: ' + o.changePct + ', history: [' + o.history.join(', ') + "], currency: '" + keep[1] + "', kgPerUnit: " + (cfg.metricUnit ? cfg.metricUnit.kg : keep[2]) + ' ';
  data = data.slice(0, m.index + m[1].length) + body + data.slice(m.index + m[1].length + m[2].length);

  // 1b) unidad métrica propia del producto (p. ej. huevos: el portal publica EUR/100 kg, no por docena)
  if (cfg.metricUnit) {
    const muRe = new RegExp("(nameKey: '" + name + "',(?:(?!\\{ nameKey:)[\\s\\S])*?)metricUnitKey: '[^']*', metricKgPerUnit: [\\d.]+");
    if (!muRe.test(data)) throw new Error('metricUnitKey de ' + name + ' no encontrado');
    data = data.replace(muRe, (_m, a) => a + "metricUnitKey: '" + cfg.metricUnit.key + "', metricKgPerUnit: " + cfg.metricUnit.kg);
  }

  // 2) countryFactors reales (solo si existen en el producto y hay datos de todos los países)
  if (o.factors) {
    const cfRe = new RegExp("(nameKey: '" + name + "',(?:(?!\\{ nameKey:)[\\s\\S])*?countryFactors: \\{)([^}]*)(\\})");
    m = cfRe.exec(data);
    if (m) {
      const text = Object.keys(o.factors).map(k => k + ': ' + o.factors[k]).join(', ');
      data = data.slice(0, m.index + m[1].length) + ' ' + text + ' ' + data.slice(m.index + m[1].length + m[2].length);
    }
  }

  // 3) etiqueta del mercado de la UE
  const qRe = new RegExp("(nameKey: '" + name + "',(?:(?!\\{ nameKey:)[\\s\\S])*?quoteTypes: \\{[^\\n]*?eu: \\{ type: ')[^']*(', market: ')((?:[^'\\\\]|\\\\.)*)(')");
  m = qRe.exec(data);
  if (m) data = data.slice(0, m.index) + m[0].replace(/eu: \{ type: '[^']*', market: '(?:[^'\\]|\\.)*'$/, () => "eu: { type: '" + (cfg.quoteType || 'referencia') + "', market: '" + jsString(cfg.market) + "'") + data.slice(m.index + m[0].length);

  // 4) ficha de Data Trust (se crea si no existe)
  const trustKey = cfg.catId + '-' + name + '-eu';
  const trustRe = new RegExp("('" + esc(trustKey) + "': \\{)([\\s\\S]*?)(\\n    \\})");
  let t = trustRe.exec(data);
  if (!t) {
    const anchor = '\n    }\n  };\n\n  function buildTrustObservation';
    if (data.split(anchor).length !== 2) throw new Error('No encuentro dónde insertar la ficha Data Trust de ' + trustKey);
    const entry = "\n    },\n    '" + trustKey + "': {\n      sourceId: '" + cfg.sourceId + "', frequency: '" + cfg.frequency + "',\n      methodology: '" + jsString(cfg.methodology) + "',\n      comparability: 'directional', observationDate: null, publicationDate: null,\n      status: 'pending', verifiedAt: null\n    }\n  };\n\n  function buildTrustObservation";
    data = data.replace(anchor, () => entry);
    t = trustRe.exec(data);
  }
  const fieldsRe = /comparability: '[^']*',\s*observationDate: [^,]+,\s*publicationDate: [^,]+,\s*status: '[^']*',\s*verifiedAt: [^\n]+/;
  if (!fieldsRe.test(t[2])) throw new Error('Formato de la ficha Data Trust de ' + trustKey + ' no reconocido');
  const newFields = "comparability: '" + (cfg.comparability || 'directional') + "', observationDate: '" + o.latest[0] + "', publicationDate: '" + o.publicationDate + "',\n      status: 'verified', verifiedAt: '" + o.verifiedAt + "'";
  let newBody = t[2].replace(fieldsRe, () => newFields);
  newBody = newBody.replace(/sourceId: '[^']*', frequency: '[^']*'/, () => "sourceId: '" + cfg.sourceId + "', frequency: '" + cfg.frequency + "'");
  newBody = newBody.replace(/methodology: '(?:[^'\\]|\\.)*'/, () => "methodology: '" + jsString(cfg.methodology) + "'");
  return data.slice(0, t.index + t[1].length) + newBody + data.slice(t.index + t[1].length + t[2].length);
}

// Histórico máximo que se pide al portal (por defecto ~20 años) y máximo de puntos que se guardan
const HISTORY_DAYS = Number(process.env.EU_HISTORY_DAYS) || 7300;
const HISTORY_POINTS = Number(process.env.EU_HISTORY_POINTS) || 1200;

function euDate(d) { return d.toISOString().slice(0, 10).split('-').reverse().join('/'); }

async function fetchRows(cfg, members) {
  // El agregado de la UE (código EU) se filtra después: se pide todo el conjunto sin lista de países
  let url = BASE + '/' + cfg.commodity + '/prices' + (members.indexOf('EU') >= 0 ? '?x=1' : '?memberStateCodes=' + members.join(','));
  if (cfg.recent) url += '&beginDate=' + euDate(new Date(Date.now() - HISTORY_DAYS * 864e5));
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) break;
    await new Promise(r => setTimeout(r, 15000 * attempt));
  }
  if (!res.ok) throw new Error('Agri-food API HTTP ' + res.status + ' (' + cfg.commodity + ')');
  return res.json();
}

async function updateProduct(name, today) {
  const cfg = PRODUCTS[name];
  if (!cfg) throw new Error('Producto no configurado: ' + name + ' (' + Object.keys(PRODUCTS).join(', ') + ')');
  let data = await readFile(DATA_JS, 'utf8');
  const cfM = new RegExp("nameKey: '" + name + "',(?:(?!\\{ nameKey:)[\\s\\S])*?countryFactors: \\{([^}]*)\\}").exec(data);
  const countries = cfM ? [...cfM[1].matchAll(/(\w+):\s*[\d.]+/g)].map(x => x[1]).filter(k => COUNTRY_CODE[k]) : [];
  const members = cfg.member ? [...new Set([cfg.member, ...countries.map(k => COUNTRY_CODE[k])])] : ['ES'];
  const rows = await fetchRows(cfg, members);
  const series = buildSeries(rows, cfg, cfg.member, today);
  if (series.length < 12) throw new Error('Serie insuficiente para ' + name + ': ' + series.length + ' puntos');
  const latest = series[series.length - 1], prev = series[series.length - 2];
  const changePct = Number(((latest[1] / prev[1] - 1) * 100).toFixed(4));

  // countryFactors reales: precio del país en la misma fecha / precio base
  let factors = null;
  if (cfg.member && countries.length) {
    factors = {};
    for (const k of countries) {
      const mk = cfg.countryMarkets && cfg.countryMarkets[k];
      const vcfg = mk ? { ...cfg, select: mk } : (cfg.countryVariants && cfg.countryVariants[k] ? { ...cfg, select: cfg.countryVariants[k] } : cfg);
      const s = k === 'es' ? series : buildSeries(rows, vcfg, COUNTRY_CODE[k], today);
      const baseS = (mk || vcfg === cfg) ? series : buildSeries(rows, vcfg, cfg.member, today);
      const hit = s.find(x => x[0] === latest[0]);
      const baseHit = baseS.find(x => x[0] === latest[0]);
      if (!hit || !baseHit) { factors = null; console.log('  aviso: sin dato de ' + COUNTRY_CODE[k] + ' para ' + latest[0] + ', se conservan los countryFactors'); break; }
      factors[k] = Number((hit[1] / baseHit[1]).toFixed(3));
    }
  }

  const verifiedAt = new Date().toISOString();
  let publicationDate = verifiedAt.slice(0, 10);
  try {
    const prevDoc = JSON.parse(await readFile(path.join(root, 'data', 'latest.json'), 'utf8'));
    const prevObs = (prevDoc.observations || []).find(o => o.id === cfg.id && o.observationDate === latest[0] && o.publicationDate);
    if (prevObs) publicationDate = prevObs.publicationDate;
  } catch (e) {}
  const obs = {
    id: cfg.id, product: name, region: 'eu', sourceId: cfg.sourceId,
    observationDate: latest[0], publicationDate, status: 'verified', verifiedAt,
    comparability: cfg.comparability || 'directional', methodology: cfg.methodology,
    value: latest[1], currency: 'EUR', unit: cfg.obsUnit, frequency: cfg.frequency, changePct,
    history: series.slice(-HISTORY_POINTS).map(([d, v]) => ({ period: d.slice(5), year: Number(d.slice(0, 4)), value: v }))
  };
  await mkdir(SNAP_DIR, { recursive: true });
  const file = path.join(SNAP_DIR, verifiedAt.slice(0, 10) + '.json');
  let doc = { schemaVersion: '1.0', generatedAt: verifiedAt, observations: [] };
  try { doc = JSON.parse(await readFile(file, 'utf8')); } catch (e) {}
  doc.observations = (doc.observations || []).filter(o => !(o.product === name && o.region === 'eu')).concat([obs]);
  data = patchDataJs(data, cfg, name, { latest, changePct, history: series.slice(-12).map(x => x[1]), factors, verifiedAt, publicationDate });
  await writeFile(DATA_JS, data, 'utf8');
  await writeFile(file, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(name + ' UE: ' + latest[0] + ' = ' + latest[1] + ' ' + cfg.obsUnit + ' (' + changePct + '%)' + (factors ? ' factores ' + JSON.stringify(factors) : ''));
}

if (process.argv[1] && process.argv[1].endsWith('update-eu-agrifood.mjs')) {
  const names = process.argv.slice(2);
  if (!names.length) { console.error('Uso: node scripts/update-eu-agrifood.mjs <producto...>'); process.exit(1); }
  const today = new Date().toISOString().slice(0, 10);
  for (const n of names) await updateProduct(n, today);
}
