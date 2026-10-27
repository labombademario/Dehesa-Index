#!/usr/bin/env python3
"""Precios internacionales de la madera tropical (Banco Mundial, Commodity Price Data "Pink Sheet", mensual) -> data/worldbank-timber.json
Mismo fichero mensual que usa update-worldbank-fertilizers.py (hoja "Monthly Prices"). Columnas: troncos de Camerun y de Malasia y madera aserrada de Camerun
y de Malasia (USD/m3, FOB) y contrachapado (centavos de dolar por hoja, Asia). Son precios de exportacion de maderas tropicales, no de la madera europea.
Si una columna no se encuentra, se omite; si no aparece ninguna, el script falla. Licencia: CC BY 4.0 (World Bank). Uso: python3 scripts/update-worldbank-timber.py"""
import json, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from openpyxl import load_workbook
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/worldbank-timber.json'
LANDING = 'https://www.worldbank.org/en/research/commodity-markets'
WANT = [  # id, comprobacion del encabezado (minusculas), unidad, nombres es/en/fr/it
    ('logs-cameroon', lambda h: h.startswith('logs') and 'cameroon' in h, 'USD/m3', ('Troncos tropicales (Camerún)', 'Tropical logs (Cameroon)', 'Grumes tropicales (Cameroun)', 'Tronchi tropicali (Camerun)')),
    ('logs-malaysia', lambda h: h.startswith('logs') and 'malaysia' in h, 'USD/m3', ('Troncos tropicales (Malasia)', 'Tropical logs (Malaysia)', 'Grumes tropicales (Malaisie)', 'Tronchi tropicali (Malesia)')),
    ('sawnwood-cameroon', lambda h: h.startswith('sawnwood') and 'cameroon' in h, 'USD/m3', ('Madera aserrada tropical (Camerún)', 'Tropical sawnwood (Cameroon)', 'Sciages tropicaux (Cameroun)', 'Legname segato tropicale (Camerun)')),
    ('sawnwood-malaysia', lambda h: h.startswith('sawnwood') and 'malaysia' in h, 'USD/m3', ('Madera aserrada tropical (Malasia)', 'Tropical sawnwood (Malaysia)', 'Sciages tropicaux (Malaisie)', 'Legname segato tropicale (Malesia)')),
    ('plywood', lambda h: h == 'plywood', 'USc/sheet', ('Contrachapado (Asia)', 'Plywood (Asia)', 'Contreplaqué (Asie)', 'Compensato (Asia)')),
]
def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Dehesa-Index-data-bot/1.0'}), timeout=90) as r: return r.read()
html = fetch(LANDING).decode('utf-8', 'ignore')
m = re.findall(r'https://thedocs\.worldbank\.org/[^"\']+CMO-Historical-Data-Monthly\.xlsx', html)
if not m: raise RuntimeError('No se encuentra el enlace del XLSX mensual del Banco Mundial')
url = m[0].replace('&amp;', '&')
pub = re.search(r'\((\d{2}/\d{2}/\d{4})\)', re.sub(r'<[^>]+>', ' ', html))
publication = datetime.strptime(pub.group(1), '%m/%d/%Y').date().isoformat() if pub else None
tmp = ROOT / '.worldbank-monthly-timber.xlsx'
tmp.write_bytes(fetch(url))
wb = load_workbook(tmp, read_only=True, data_only=True)
rows = list(wb['Monthly Prices'].iter_rows(values_only=True))
tmp.unlink()
hdr = None
for i, row in enumerate(rows[:100]):
    if any(re.sub(r'\s+', ' ', str(v or '').strip().lower()).startswith('logs') for v in row): hdr = i; break
if hdr is None: raise RuntimeError('Fila de encabezados no encontrada (logs)')
units = rows[hdr + 1] if hdr + 1 < len(rows) else []
series, found = [], []
for sid, test, unit, names in WANT:
    col = None
    for c, v in enumerate(rows[hdr]):
        h = re.sub(r'\s+', ' ', str(v or '').strip().lower())
        if h and test(h): col = c; found.append('%s=%r %r' % (sid, str(rows[hdr][c]).strip(), str(units[c] if c < len(units) else '').strip())); break
    if col is None: continue
    u = str(units[col] if col < len(units) else '').lower()
    if (unit == 'USD/m3') != ('cubic' in u): raise RuntimeError('%s: unidad inesperada %r' % (sid, u))
    pts = []
    for row in rows[hdr + 2:]:
        if not row: continue
        p = str(row[0] or '').strip()
        if not re.fullmatch(r'\d{4}M\d{2}', p, re.I): continue
        v = row[col] if col < len(row) else None
        if isinstance(v, (int, float)): pts.append(['%s-%s' % (p[:4], p[5:7]), round(float(v), 2)])
    pts = [x for x in pts if int(x[0][:4]) >= 2005]
    if len(pts) < 24: raise RuntimeError('%s: solo %d puntos' % (sid, len(pts)))
    series.append({'id': sid, 'name': dict(zip(('es', 'en', 'fr', 'it'), names)), 'unit': unit, 'points': pts})
if len(series) < 3: raise RuntimeError('Solo %d series de madera encontradas' % len(series))
doc = {'schemaVersion': 1, 'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'publication': publication,
       'source': {'id': 'world_bank', 'name': 'World Bank Commodity Price Data (The Pink Sheet)', 'url': LANDING, 'license': 'CC BY 4.0'},
       'frequency': 'monthly', 'series': series}
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print('World Bank timber: %d series, last %s; %s' % (len(series), series[0]['points'][-1][0], '; '.join(found)))
