#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises'; import path from 'node:path';
const root=process.cwd(); const h=JSON.parse(await readFile(path.join(root,'data','history.json'),'utf8')).observations||[];
const factors={bushel:27.2155,cwt:45.3592,tonelada:1000,'100kg':100,kg:1,gal:3.78541,litro:1};
const rows=h.map(o=>{const kg=factors[o.unit]||null; return {...o,normalization:{kgPerUnit:kg,baseUnit:kg?'USD_per_kg_or_index':'not_available',method:kg?'unit mass anchor only; currency and quote basis remain unchanged':'source-specific'}}});
const currencies=[...new Set(rows.map(o=>o.currency).filter(Boolean))].sort();
const units=[...new Set(rows.map(o=>o.unit).filter(Boolean))].sort();
const out={schemaVersion:'1.0',generatedAt:new Date().toISOString(),policy:{neverConvertQuoteBasis:true,neverTreatIndexAsPrice:true,fxRequiredForCurrencyConversion:true},currencies,units,observations:rows};
await writeFile(path.join(root,'data','normalized.json'),JSON.stringify(out,null,2)+'\n'); console.log('Normalized layer: '+rows.length+' observations.');
