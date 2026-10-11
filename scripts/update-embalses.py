#!/usr/bin/env python3
"""Reserva de agua de los embalses de Espana (MITECO, Boletin Hidrologico, base historica BD-Embalses.mdb) -> data/spain-reservoirs.json
Fuente: https://www.miteco.gob.es/ (Historico de embalses). Datos semanales por embalse (hm3 de capacidad y de agua almacenada) desde 1988, ficheros de Access:
se leen con mdbtools (mdb-export). Licencia: aviso legal del MITECO, que permite reutilizar la informacion sin autorizacion expresa citando la fuente
(Ley 37/2007 de reutilizacion de la informacion del sector publico), salvo derechos de terceros. Los datos del boletin son provisionales y sin validar.
Por demarcacion hidrografica ('ambito') y para toda Espana: agua almacenada y capacidad de los embalses que informan esa semana, % de llenado, y por semana del ano
la media, el minimo y el maximo de los ultimos 10 anos completos anteriores al actual (para ver si el nivel esta por encima o por debajo de lo habitual).
Si algo falla (descarga, formato, tabla) el fichero anterior se conserva. Uso: python3 scripts/update-embalses.py [--mdb ruta]"""
import csv, datetime, io, json, subprocess, sys, urllib.request, zipfile
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "spain-reservoirs.json"
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
            with urllib.request.urlopen(urllib.request.Request(URL, headers=H), timeout=900) as r: z = zipfile.ZipFile(io.BytesIO(r.read()))
            z.extract("BD-Embalses.mdb", "/tmp")
        tot = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0]))   # ambito -> semana -> [almacenado, capacidad, n]
        names = {}; n = 0
        for r in rows(mdb):
            a, c = num(r["AGUA_ACTUAL"]), num(r["AGUA_TOTAL"])
            if a is None or c is None or c <= 0 or a < 0: continue
            d = day(r["FECHA"]); amb = r["AMBITO_NOMBRE"].strip(); n += 1
            for k in (amb, "ES"):
                t = tot[k][d]; t[0] += a; t[1] += c; t[2] += 1
        if n < 100000 or "ES" not in tot or len(tot) < 15: raise ValueError("tabla inesperada: %d filas, %d ambitos" % (n, len(tot)))
        asof = max(tot["ES"]); weeks = sorted(d for d in tot["ES"] if d <= asof)
        if (datetime.date.today() - asof).days > 45: raise ValueError("ultimo dato muy antiguo: %s" % asof)
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
               "note": "Datos provisionales sin validar. Porcentaje = agua almacenada / capacidad de los embalses que informan esa semana. Referencia: media, minimo y maximo de los 10 anos anteriores en la misma semana ISO.",
               "series": series, "climatology": clim}
    except Exception as e: print("FALLO:", e); return 1
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", OUT.name, len(series), "ambitos, ultima semana", asof); return 0
if __name__ == "__main__": sys.exit(main())
