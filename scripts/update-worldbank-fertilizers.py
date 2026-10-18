#!/usr/bin/env python3
"""Precios internacionales de fertilizantes (Banco Mundial, Commodity Price Data "Pink Sheet", mensual, USD/t) -> data/worldbank-fertilizers.json
Referencia común para el monitor de insumos de cualquier país: son precios de exportación/mercado internacional, no lo que paga el agricultor.
Serie por columna de la hoja "Monthly Prices": urea, DAP, TSP, cloruro potásico y roca fosfórica. Si una columna no se encuentra, se omite (nada se inventa);
si no aparece la urea el script falla. Licencia: CC BY 4.0 (World Bank Open Data). Uso: python3 scripts/update-worldbank-fertilizers.py"""
import json, re, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/worldbank-fertilizers.json'
LANDING = 'https://www.worldbank.org/en/research/commodity-markets'
WANT = [  # id, patrón del encabezado (minúsculas), nombres en es/en/fr/it
    ('urea', lambda h: h.startswith('urea'), ('Urea (Europa del Este / Mar Negro)', 'Urea (Eastern Europe / Black Sea)', 'Urée (Europe de l’Est / mer Noire)', 'Urea (Europa orientale / Mar Nero)')),
    ('dap', lambda h: h == 'dap' or h.startswith('dap '), ('Fosfato diamónico (DAP)', 'Diammonium phosphate (DAP)', 'Phosphate diammonique (DAP)', 'Fosfato biammonico (DAP)')),
    ('tsp', lambda h: h == 'tsp' or h.startswith('tsp '), ('Superfosfato triple (TSP)', 'Triple superphosphate (TSP)', 'Superphosphate triple (TSP)', 'Perfosfato triplo (TSP)')),
    ('potash', lambda h: 'potassium chloride' in h or h.startswith('potash'), ('Cloruro potásico', 'Potassium chloride', 'Chlorure de potassium', 'Cloruro di potassio')),
    ('rock', lambda h: 'phosphate rock' in h, ('Roca fosfórica', 'Phosphate rock', 'Phosphate naturel', 'Roccia fosfatica')),
]

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Dehesa-Index-data-bot/1.0'})
    with urllib.request.urlopen(req, timeout=90) as r: return r.read()

html = fetch(LANDING).decode('utf-8', 'ignore')
m = re.findall(r'https://thedocs\.worldbank\.org/[^"\']+CMO-Historical-Data-Monthly\.xlsx', html)
if not m: raise RuntimeError('No se encuentra el enlace del XLSX mensual del Banco Mundial')
url = m[0].replace('&amp;', '&')
pub = re.search(r'\((\d{2}/\d{2}/\d{4})\)', re.sub(r'<[^>]+>', ' ', html))
publication = datetime.strptime(pub.group(1), '%m/%d/%Y').date().isoformat() if pub else None
tmp = ROOT / '.worldbank-monthly-fert.xlsx'
tmp.write_bytes(fetch(url))
wb = load_workbook(tmp, read_only=True, data_only=True)
rows = list(wb['Monthly Prices'].iter_rows(values_only=True))
tmp.unlink()

# fila de encabezados: la que contiene "urea" (los nombres de materias primas) ; la de unidades va justo debajo
hdr = None
for i, row in enumerate(rows[:100]):
    if any(re.sub(r'\s+', ' ', str(v or '').strip().lower()).startswith('urea') for v in row): hdr = i; break
if hdr is None: raise RuntimeError('Fila de encabezados no encontrada (urea)')
units = rows[hdr + 1] if hdr + 1 < len(rows) else []
series, found = [], []
for sid, test, names in WANT:
    col = None
    for c, v in enumerate(rows[hdr]):
        h = re.sub(r'\s+', ' ', str(v or '').strip().lower())
        if h and test(h): col = c; found.append('%s=%r %r' % (sid, str(rows[hdr][c]).strip(), str(units[c] if c < len(units) else '').strip())); break
    if col is None:
        if sid == 'urea': raise RuntimeError('Serie de urea no encontrada')
        continue
    pts = []
    for row in rows[hdr + 2:]:
        if not row: continue
        p = str(row[0] or '').strip()
        if not re.fullmatch(r'\d{4}M\d{2}', p, re.I): continue
        v = row[col] if col < len(row) else None
        if isinstance(v, (int, float)): pts.append(['%s-%s' % (p[:4], p[5:7]), round(float(v), 2)])
    pts = [x for x in pts if int(x[0][:4]) >= 2005]
    if len(pts) < 24: raise RuntimeError('%s: solo %d puntos' % (sid, len(pts)))
    series.append({'id': sid, 'name': dict(zip(('es', 'en', 'fr', 'it'), names)), 'unit': 'USD/t', 'points': pts})
doc = {'schemaVersion': 1, 'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'publication': publication,
       'source': {'id': 'world_bank', 'name': 'World Bank Commodity Price Data (The Pink Sheet)', 'url': LANDING, 'license': 'CC BY 4.0'},
       'unit': 'USD/t', 'frequency': 'monthly', 'series': series}
OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print('::notice::Banco Mundial fertilizantes: ' + '; '.join(found))
print('World Bank fertilisers: %d series, last %s' % (len(series), series[0]['points'][-1][0]))
