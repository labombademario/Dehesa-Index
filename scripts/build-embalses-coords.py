#!/usr/bin/env python3
"""Ubicacion de los embalses del Boletin Hidrologico -> scripts/ref/embalses-coords.json (se ejecuta a mano, no en cada actualizacion).
Lee los embalses de data/spain-reservoirs-points.json (nombre y demarcacion del MITECO) y los empareja con los embalses y presas de Espana
en Wikidata (CC0) por nombre. Reglas: nombre igual (sin articulos ni tildes) o contenido en la etiqueta de Wikidata; si hay varios candidatos,
el mas cercano al centro de su demarcacion y con capacidad compatible (Wikidata mezcla hm3, dam3 y m3); descarta los que caen a mas de ~3 grados
de su demarcacion, los de capacidad incompatible y los elementos de Wikidata asignados a dos embalses. Lo dudoso se queda sin punto.
Uso: python3 scripts/build-embalses-coords.py"""
import json, re, unicodedata, collections, statistics, urllib.parse, urllib.request, math, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
STOP = {'embalse','pantano','presa','del','de','la','las','los','el','lago','azud','contraembalse','encoro','embassament','panta','urtegia','urtegi','y','o','a','as','os','da','do','das','dos','san','santa','santo','sa','n','ss','na','nuestra','senora','sra','virgen'}
def toks(s):
    s = unicodedata.normalize('NFKD', s.lower()); s = ''.join(c for c in s if not unicodedata.combining(c))
    s = s.replace('ó', ' ').replace(' o ', ' ')
    return [t for t in re.sub(r'[^a-z0-9]+', ' ', s).split() if t not in STOP]
def wd(cls):
    q = """SELECT ?item ?l ?alt ?coord ?cap WHERE { ?item wdt:P31/wdt:P279* wd:%s; wdt:P17 wd:Q29; wdt:P625 ?coord.
      OPTIONAL { ?item rdfs:label ?l. FILTER(LANG(?l)="es") } OPTIONAL { ?item skos:altLabel ?alt. FILTER(LANG(?alt)="es") } OPTIONAL { ?item wdt:P2234 ?cap. } }""" % cls
    r = urllib.request.urlopen(urllib.request.Request('https://query.wikidata.org/sparql?format=json&query=' + urllib.parse.quote(q), headers={'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Accept': 'application/sparql-results+json'}), timeout=180)
    return [{k: v['value'] for k, v in x.items()} for x in json.load(r)['results']['bindings']]
def num(x): return float(str(x).replace(',', '.')) if not isinstance(x, (int, float)) else float(x)
L = [{'amb': x[1], 'name': x[0], 'cap': x[2]} for x in json.loads((ROOT / 'data' / 'spain-reservoirs-points.json').read_text())['items']]
WD = []
for cls, kind in (('Q131681', 'res'), ('Q12323', 'dam')):
    for x in wd(cls):
        m = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', x['coord'])
        if not m: continue
        lon, lat = float(m.group(1)), float(m.group(2))
        if not (-19 < lon < 5 and 27 < lat < 44.5): continue
        for lab in (x.get('l'), x.get('alt')):
            if lab and toks(lab): WD.append(dict(kind=kind, q=x['item'].split('/')[-1], lat=lat, lon=lon, cap=x.get('cap'), lab=lab, t=frozenset(toks(lab))))
byset = collections.defaultdict(list)
for w in WD: byset[w['t']].append(w)
def cands(e):
    t = frozenset(toks(e['name']))
    if not t: return []
    if t in byset: return byset[t]
    # partes: «Tremp o Talarn», «Torrejón (Tajo - Tietar)»
    parts = [frozenset(toks(p)) for p in re.split(r'\s+[oó]\s+|\(|\)|\s-\s|/', e['name']) if toks(p)]
    for p in parts:
        if p in byset: return byset[p]
    # contencion: todos los tokens propios dentro de la etiqueta de Wikidata (o al reves), con al menos un token largo
    OK_EXTRA = {'ii', 'i', 'iii', 'sistema', 'canon'}
    out = [w for w in WD if (t <= w['t'] or (w['t'] <= t and (t - w['t']) <= OK_EXTRA)) and max(len(x) for x in (t & w['t']) or {''}) >= 5]
    return out
res = {}; amb = []
for e in L:
    cs = cands(e)
    if not cs: continue
    qs = {}
    for w in cs: qs.setdefault(w['q'], w)
    res[(e['amb'], e['name'])] = list(qs.values())
# centro de cada demarcacion con las coincidencias unicas
cen = collections.defaultdict(list)
for k, v in res.items():
    if len(v) == 1: cen[k[0]].append((v[0]['lat'], v[0]['lon']))
C = {a: (statistics.median(p[0] for p in v), statistics.median(p[1] for p in v)) for a, v in cen.items() if v}
def dist(a, w):
    if a not in C: return 0
    return ((C[a][0] - w['lat']) ** 2 + ((C[a][1] - w['lon']) * 0.8) ** 2) ** 0.5
out = {}; rej = []
for e in L:
    k = (e['amb'], e['name']); v = res.get(k)
    if not v: continue
    cap = num(e['cap'])
    def sc(w):
        s = dist(e['amb'], w) + (0 if w['kind'] == 'res' else 0.3)
        try: s += min(2, abs(float(w['cap']) - cap) / max(cap, 1))
        except Exception: s += 0.3
        return s
    w = min(v, key=sc)
    if dist(e['amb'], w) > 3.2: rej.append((k, w['lab'], round(dist(e['amb'], w), 1))); continue
    try:
        r = float(w['cap']) / cap
        r = min((abs(__import__('math').log10(r / f)), r / f) for f in (1, 1e3, 1e6))[1]   # Wikidata mezcla hm3, dam3 y m3
        if not 0.2 <= r <= 5: rej.append((k, w['lab'], 'cap %s vs %s' % (w['cap'], cap))); continue
    except Exception: pass
    out['%s|%s' % k] = {'q': w['q'], 'lat': round(w['lat'], 4), 'lon': round(w['lon'], 4), 'lab': w['lab'], 'n': len(v)}
byq = collections.defaultdict(list)
for k, v in out.items(): byq[v['q']].append(k)
for q, ks in byq.items():
    if len(ks) > 1:
        lab = out[ks[0]]['lab']
        def exact(k): return set(toks(k.split('|')[1])) == set(toks(lab))
        keep = [k for k in ks if exact(k)]
        keep = keep[0] if len(keep) == 1 else None
        for k in ks:
            if k != keep: rej.append((k, lab, 'QID repetido')); del out[k]
out_doc = {"_doc": "Ubicacion de los embalses del Boletin Hidrologico (MITECO) para el mapa de data/spain-reservoirs-points.json. Coordenadas de Wikidata (CC0, dominio publico), emparejadas por nombre con scripts/build-embalses-coords.py: coincidencia de nombre, cercania a la demarcacion, capacidad compatible y un elemento de Wikidata por embalse. Los embalses sin coincidencia segura no tienen punto (no se adivina). Clave: 'demarcacion|nombre' tal como los publica el MITECO.",
           "generatedAt": datetime.date.today().isoformat(), "source": "Wikidata (CC0)", "items": {k: [v['lat'], v['lon'], v['q']] for k, v in sorted(out.items())}}
(ROOT / 'scripts' / 'ref' / 'embalses-coords.json').write_text(json.dumps(out_doc, ensure_ascii=False, indent=0), encoding='utf-8')
print('embalses con punto', len(out), 'de', len(L), '; descartados', len(rej))
