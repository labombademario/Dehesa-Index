#!/usr/bin/env python3
"""Cataluña: Índex de preus percebuts agraris (IPPA) del Departament d'Agricultura de la Generalitat (DACC) -> data/spain-catalonia-stats.json
(formato de ficheros de estadísticas por país; país ES, grupo «idx_perc», junto a los índices nacionales del MAPA).

Fuente: Observatori Agroalimentari de Preus, «Índexs mensuals i anuals» (fichero XLS «Plantilla_indexs_mensuals_anuals_compostos_2020_<año>_20.xls»,
base 2020=100), enlazado desde
https://agricultura.gencat.cat/ca/departament/observatori-agroambiental/estadistiques/observatori-agroalimentari-preus/index-preus-percebuts-agraris/indexs-mensuals-anuals/
El nombre del fichero lleva el último año: se lee de la propia página. Solo se usa la base 2020: las bases anteriores (2015, 2010, 2005) no se mezclan.
Reutilización: condiciones generales de la Generalitat (gencat.cat/avís-legal; Ley 37/2007; «Llicència oberta d'ús d'informació – Catalunya»),
uso comercial permitido citando la fuente y la fecha de la última actualización, sin alterar el contenido.
Índices tal cual. «-» (sin cotización ese mes, p. ej. fuera de campaña) y celdas vacías = sin punto. La columna anual no se usa.
Uso: update-es-catalonia-ippa.py [--out DIR] [--xls FICHERO]"""
import datetime, json, os, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
PAGE = "https://agricultura.gencat.cat/ca/departament/observatori-agroambiental/estadistiques/observatori-agroalimentari-preus/index-preus-percebuts-agraris/indexs-mensuals-anuals/"
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(url, tries=3):
    last = None
    for i in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180).read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s: %r" % (url[:140], last))
# nombre en catalán de la fuente -> (clave, nombre en español para la etiqueta)
PROD = {"Cereals": ("cereals", "Cereales"), "Lleguminoses": ("pulses", "Leguminosas"), "Conreus industrials": ("industrial", "Cultivos industriales"),
        "Farratges": ("fodder", "Forrajes"), "Cítrics": ("citrus", "Cítricos"), "Fruita Fresca": ("fresh-fruit", "Fruta fresca"), "Fruita Seca": ("nuts", "Frutos secos"),
        "Hortalisses": ("vegetables", "Hortalizas"), "Vi, Most i Raïm": ("wine", "Vino, mosto y uva"), "Oli i Olives": ("olive", "Aceite y aceitunas"),
        "Flor i planta Ornamental": ("flowers", "Flor y planta ornamental"), "PROD. AGRÍCOLES": ("crops", "Productos agrícolas"), "Boví de carn": ("beef", "Vacuno de carne"),
        "Oví de carn": ("sheep", "Ovino de carne"), "Cabrum de carn": ("goats", "Caprino de carne"), "Porcí de carn": ("pigs", "Porcino de carne"),
        "Aviram de carn": ("poultry", "Aves de carne"), "Conill de carn": ("rabbits", "Conejo de carne"), "Bestiar de carn": ("meat-animals", "Ganado de carne"),
        "Llet": ("milk", "Leche"), "Ous": ("eggs", "Huevos"), "Prod. del bestiar": ("animal-products", "Productos del ganado"), "PROD. RAMADERS": ("livestock", "Productos ganaderos"),
        "TOTAL": ("total", "Índice general")}
def find_xls():
    h = get(PAGE).decode("utf-8", "replace")
    c = sorted(set(re.findall(r'href="([^"]*Plantilla_indexs_mensuals_anuals_compostos_2020_(\d{4})_20\.xls)"', h)), key=lambda x: x[1])
    if not c: raise RuntimeError("no se encuentra el fichero de índices base 2020 en la página")
    u = c[-1][0]; return ("https://agricultura.gencat.cat" + u) if u.startswith("/") else u
def parse(path):
    import xlrd
    s = xlrd.open_workbook(path).sheet_by_index(0)
    hdr = [str(s.cell_value(3, c)).strip() for c in range(s.ncols)]
    if hdr[:3] != ["Producte", "Any", "Gen."]: raise ValueError("cabecera inesperada: %s" % hdr[:4])
    out, cur = {}, None
    for r in range(4, s.nrows):
        a = str(s.cell_value(r, 0)).strip()
        if a: cur = a
        try: y = int(float(s.cell_value(r, 1)))
        except Exception: continue
        if cur is None: continue
        for m in range(1, 13):
            v = s.cell_value(r, 1 + m)
            if isinstance(v, float) and v > 0: out.setdefault(cur, {})["%d-%02d" % (y, m)] = round(v, 4)
            elif str(v).strip() not in ("", "-"):
                try: fv = float(str(v).replace(",", "."))
                except ValueError: raise ValueError("%s %d mes %d: valor no numérico %r" % (cur, y, m, v))
                if fv > 0: out.setdefault(cur, {})["%d-%02d" % (y, m)] = round(fv, 4)
    return out
def main():
    outdir = ROOT / "data"
    if "--out" in sys.argv: outdir = Path(sys.argv[sys.argv.index("--out") + 1])
    try:
        if "--xls" in sys.argv: path, url = sys.argv[sys.argv.index("--xls") + 1], PAGE
        else:
            url = find_xls(); log("fichero:", url)
            path = "/tmp/dehesa-ippa-cat.xls"; Path(path).write_bytes(get(url))
        by = parse(path)
    except Exception as e: log("ERROR:", e); return 1
    unknown = [k for k in by if k not in PROD]
    if unknown: log("ERROR: productos desconocidos en la fuente (revisar la tabla PROD):", unknown); return 1
    series = []
    for cat, pts in by.items():
        key, es = PROD[cat]; pl = sorted(pts.items())
        if len(pl) < 12: log("se omite %s: solo %d meses" % (cat, len(pl))); continue
        prev = pl[-2][1] if len(pl) > 1 else None
        series.append({"id": "es-ct-ippa-" + key, "group": "idx_perc", "label": "Índice de precios percibidos, Cataluña (2020=100): %s" % es, "unit": "index 2020=100",
                       "frequency": "monthly", "latestPeriod": pl[-1][0], "latest": pl[-1][1], "changePct": round((pl[-1][1] - prev) / prev * 100, 2) if prev else None,
                       "points": [[p, v] for p, v in pl], "sourceGroup": "DACC IPPA", "region": "Cataluña",
                       "note": "Índice de la Generalitat de Catalunya (DACC). Los meses sin cotización del producto (fuera de campaña) no tienen punto."})
    if len(series) < 20 or not any(s["id"] == "es-ct-ippa-total" for s in series): log("ERROR: solo %d series o falta el índice general" % len(series)); return 1
    src = {"name": "Generalitat de Catalunya, Departament d'Agricultura — Índex de preus percebuts agraris (IPPA)", "url": PAGE, "license": "Llicència oberta d'ús d'informació – Catalunya"}
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "countries": {"ES": {"name": "Spain", "extend": True, "source": src, "series": series}}, "log": LOG[-20:]}
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "spain-catalonia-stats.json.tmp"; tmp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"); os.replace(tmp, outdir / "spain-catalonia-stats.json")
    log("escrito: %d series, último %s" % (len(series), max(s["latestPeriod"] for s in series)))
    return 0
if __name__ == "__main__":
    rc = main()
    if "--out" not in sys.argv:
        try: (ROOT / "data" / "spain-catalonia-log.txt").write_text("\n".join(LOG) + "\n", "utf-8")
        except Exception: pass
    sys.exit(rc)
