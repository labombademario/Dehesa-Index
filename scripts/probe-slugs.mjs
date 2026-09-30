// TEMPORAL: prueba muchos nombres de endpoint del Agri-food Data Portal y escribe el estado HTTP de cada uno.
import { writeFile } from 'node:fs/promises';
const B = 'https://api.tech.ec.europa.eu/agrifood/api';
const bases = ['eggs','egg','eggPrices','eggsPrices','eggprices','eggsprice','eggPrice','egg-prices','eggs-prices','eggsAndPoultry','eggsandpoultry','eggAndPoultry','poultryAndEggs','poultryandeggs','poultryEggs','eggsPoultry','hen','henEggs','table-eggs','tableEggs','eggsMarket','eggMarket','eggs_and_poultry','eggs_poultry','egg_prices','eggs_prices','Eggs','EGGS','poultry/eggs','poultry/egg','eggs/eggs','eggs/egg','eggs/price','eggs/prices','egg/prices','egg/price','poultry_and_eggs','eggsandpoultrymeat','poultrymeat','poultryMeat','eggsProd','henEggsPrices','eggsWeekly'];
const suffixes = ['/prices?memberStateCodes=ES', '?memberStateCodes=ES'];
const out = [];
for (const b of bases) for (const s of suffixes) {
  const url = B + '/' + b + s;
  try { const r = await fetch(url, { headers: { Accept: 'application/json' } }); const t = await r.text(); out.push(r.status + ' ' + url + (r.status === 200 ? '  ' + t.slice(0, 300).replace(/\s+/g, ' ') : '')); }
  catch (e) { out.push('ERR ' + url + ' ' + e.message); }
  await new Promise(r => setTimeout(r, 400));
}
await writeFile('scripts/.probe-output.txt', out.join('\n') + '\n');
