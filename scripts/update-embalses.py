#!/usr/bin/env python3
"""Reserva de agua de los embalses de Espana (MITECO, Boletin Hidrologico, base historica BD-Embalses.mdb) -> data/spain-reservoirs.json
Fuente: https://www.miteco.gob.es/ (Historico de embalses). Datos semanales por embalse (hm3 de capacidad y de agua almacenada) desde 1988, ficheros de Access:
se leen con mdbtools (mdb-export). Licencia: aviso legal del MITECO, que permite reutilizar la informacion sin autorizacion expresa citando la fuente
(Ley 37/2007 de reutilizacion de la informacion del sector publico), salvo derechos de terceros. Los datos del boletin son provisionales (las ultimas semanas pueden revisarse); contrastados el 11-10-2026 con las notas de prensa del MITECO (14-10-2025 y 18-08-2026): capacidad identica y agua almacenada con diferencias de 0,2 % o menos.
Por demarcacion hidrografica ('ambito') y para toda Espana: agua almacenada y capacidad de los embalses que informan esa semana, % de llenado, y por semana del ano
la media, el minimo y el maximo de los ultimos 10 anos completos anteriores al actual (para ver si el nivel esta por encima o por debajo de lo habitual).
Si algo falla (descarga, formato, tabla) el fichero anterior se conserva. Uso: python3 scripts/update-embalses.py [--mdb ruta]"""
import csv, datetime, io, json, subprocess, sys, urllib.request, zipfile
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-reservoirs.json"
OUT_P = ROOT / "data" / "spain-reservoirs-points.json"   # cada embalse en su ultima semana, con su punto para el mapa (scripts/ref/embalses-coords.json)
URL = "https://www.miteco.gob.es/content/dam/miteco/es/agua/temas/evaluacion-de-los-recursos-hidricos/boletin-hidrologico/Historico-de-embalses/BD-Embalses.zip"
TABLE = "T_Datos Embalses 1988-2026"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
KEEP = 156   # semanas que se publican (3 anos)
def num(s):
    try: return float(str(s).replace(".", "").replace(",", ".")) if "," in str(s) else float(s)
    except Exception: return None
def day(s):
    m, d, y = s.split()[0].split("/"); y = int(y); y += 1900 if y >= 80 else 2000
    return datetime.date(y, int(m), int(d))
def rows(mdb):
    p = subprocess.run(["mdb-export", str(mdb), TABLE], capture_output=True, text=True, check=True)
    for r in csv.DictReader(io.StringIO(p.stdout)): yield r
def main():
    args = sys.argv[1:]
    try:
        if args[:1] == ["--mdb"]: mdb = Path(args[1])
        else:
            mdb = Path("/tmp/BD-Embalses.mdb")
            z = None
            for i in range(4):   # la descarga (~40 MB) se corta a veces (IncompleteRead): se reintenta
                try:
                    with urllib.request.urlopen(urllib.request.Request(URL, headers=H), timeout=900) as r: z = zipfile.ZipFile(io.BytesIO(r.read())); break
                except Exception as e:
                    print("reintento descarga", i + 1, repr(e)[:120]); __import__("time").sleep(20 * (i + 1))
            if z is None: raise RuntimeError("descarga de BD-Embalses fallida tras 4 intentos")
            z.extract("BD-Embalses.mdb", "/tmp")
        tot = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0]))   # ambito -> semana -> [almacenado, capacidad, n]
        names = {}; n = 0; per = defaultdict(dict)   # (demarcacion, embalse) -> fecha -> (almacenada, capacidad, hidroelectrico)
        for r in rows(mdb):
            a, c = num(r["AGUA_ACTUAL"]), num(r["AGUA_TOTAL"])
            if a is None or c is None or c <= 0 or a < 0: continue
            d = day(r["FECHA"]); amb = r["AMBITO_NOMBRE"].strip(); n += 1
            if d.year >= datetime.date.today().year - 2: per[(amb, r["EMBALSE_NOMBRE"].strip())][d] = (a, c, r.get("ELECTRICO_FLAG", "") == "1")
            for k in (amb, "ES"):
                t = tot[k][d]; t[0] += a; t[1] += c; t[2] += 1
        if n < 100000 or "ES" not in tot or len(tot) < 15: raise ValueError("tabla inesperada: %d filas, %d ambitos" % (n, len(tot)))
        asof = max(tot["ES"]); weeks = sorted(d for d in tot["ES"] if d <= asof)
        if (datetime.date.today() - asof).days > 45: raise ValueError("ultimo dato muy antiguo: %s" % asof)
        # controles de coherencia: capacidad total estable (~56.000 hm3), cambio semanal razonable y llenado entre 0 y 100 %
        wk = weeks[-12:]
        for a, b in zip(wk, wk[1:]):
            if abs(tot["ES"][b][0] - tot["ES"][a][0]) > 8000: raise ValueError("salto semanal sospechoso en %s" % b)
        cap = tot["ES"][asof][1]
        if not 54000 <= cap <= 58000 or tot["ES"][asof][0] > cap: raise ValueError("capacidad o llenado incoherentes: %.0f / %.0f hm3" % (tot["ES"][asof][0], cap))
        if tot["ES"][asof][2] < 300: raise ValueError("pocos embalses informan en %s: %d" % (asof, tot["ES"][asof][2]))
        recent = [d for d in weeks if d >= weeks[-1] - datetime.timedelta(weeks=KEEP - 1)]
        series = {}; clim = {}
        for k, t in tot.items():
            ds = [d for d in recent if d in t]
            if len(ds) < KEEP // 2: continue
            series[k] = {"name": "Espana" if k == "ES" else k, "dates": [d.isoformat() for d in ds], "stored": [round(t[d][0], 1) for d in ds], "capacity": [round(t[d][1], 1) for d in ds], "n": t[ds[-1]][2]}
            # semana del ano (ISO) -> % de los 10 anos completos anteriores al del ultimo dato
            by = defaultdict(list)
            for d, v in t.items():
                y, w, _ = d.isocalendar()
                if asof.year - 10 <= y < asof.year and v[1] > 0: by[w].append(100.0 * v[0] / v[1])
            clim[k] = {str(w): [round(sum(v) / len(v), 1), round(min(v), 1), round(max(v), 1)] for w, v in by.items() if len(v) >= 6}
        doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": asof.isoformat(), "unit": "hm3",
               "source": {"name": "MITECO, Boletin Hidrologico (BD-Embalses)", "url": "https://www.miteco.gob.es/es/agua/temas/evaluacion-de-los-recursos-hidricos/boletin-hidrologico.html", "license": "Aviso legal del MITECO: reutilizacion libre citando la fuente (Ley 37/2007)"},
               "note": "Datos provisionales (pueden revisarse las ultimas semanas); contrastados con las notas de prensa del MITECO. Porcentaje = agua almacenada / capacidad de los embalses que informan esa semana. Referencia: media, minimo y maximo de los 10 anos anteriores en la misma semana ISO.",
               "series": series, "climatology": clim}
        # Embalse a embalse en la ultima semana, con el mismo embalse hace un ano (semana mas cercana, +-3 dias) y su punto si se conoce
        try: coords = json.loads((ROOT / "scripts" / "ref" / "embalses-coords.json").read_text(encoding="utf-8"))["items"]
        except Exception: coords = {}
        items = []; ago = asof - datetime.timedelta(days=364)
        for (amb, nm), ser in sorted(per.items()):
            if asof not in ser: continue
            a, c, el = ser[asof]
            py = min((dd for dd in ser if abs((dd - ago).days) <= 3), key=lambda dd: abs((dd - ago).days), default=None)
            pa = round(100.0 * ser[py][0] / ser[py][1], 1) if py and ser[py][1] > 0 else None
            pt = coords.get("%s|%s" % (amb, nm))
            items.append([nm, amb, round(c, 1), round(a, 1), pa, pt[0] if pt else None, pt[1] if pt else None, pt[2] if pt else None, 1 if el else 0])
        if len(items) < 300: raise ValueError("solo %d embalses en la ultima semana" % len(items))
        pdoc = {"schemaVersion": 1, "generatedAt": doc["generatedAt"], "asOf": asof.isoformat(), "unit": "hm3", "source": doc["source"],
                "coordsSource": {"name": "Wikidata (ubicacion de cada embalse)", "url": "https://www.wikidata.org/", "license": "CC0 1.0 (dominio publico)"},
                "fields": ["name", "basin", "capacity", "stored", "pctYearAgo", "lat", "lon", "wikidata", "hydro"], "items": items}
    except Exception as e: print("FALLO:", e); return 1
    OUT_P.write_text(json.dumps(pdoc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", OUT_P.name, len(items), "embalses,", sum(1 for x in items if x[5] is not None), "con punto")
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", OUT.name, len(series), "ambitos, ultima semana", asof); return 0
if __name__ == "__main__": sys.exit(main())
