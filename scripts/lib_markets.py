"""Etiqueta de mercado exacto de una observacion (data/market-labels.json). Misma regla que js/shared.js (marketLabel)."""
import json
from pathlib import Path
_P = Path(__file__).resolve().parents[1] / 'data' / 'market-labels.json'
_M = None
def market(o):
    """[es, en, fr, it] o None."""
    global _M
    if _M is None: _M = json.loads(_P.read_text())
    if o.get('id') in _M['byId']: return _M['byId'][o['id']]
    src, oid = str(o.get('sourceId') or ''), str(o.get('id') or '')
    if src in _M['rules']: return _M['rules'][src]
    if src.startswith('defra') or '_defra_' in oid: return _M['rules']['defra']
    if 'eurostat' in src or '_eurostat_' in oid: return _M['rules']['eurostat']
    return None
