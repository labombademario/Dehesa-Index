#!/usr/bin/env python3
"""Italia por provincia (~107): 7º Censo General de la Agricultura 2020 (ISTAT) -> data/it-province/<REGION>.json + index.json
Fuente: ISTAT, servicio SDMX https://esploradati.istat.it/SDMXWS/rest/ (banco de datos «IstatData», censimento agricoltura). Licencia: CC BY 4.0 (ISTAT, fuente istat).
Tablas (dataflows IT1) con el territorio a nivel de provincia (codigos NUTS 3 de ISTAT, IT + letra + cifra + cifra o letra, mas IT108-IT111 para Monza e della Brianza, Fermo, Barletta-Andria-Trani y Sud Sardegna):
  DF_DCAT_CENSAGRIC2020_SURF_ALL (S: explotaciones y superficies), DF_DCAT_CENSAGRIC2020_CROPS_ALL (C: superficie agraria utilizada y explotaciones por cultivo),
  DF_DCAT_CENSAGRIC2020_CATTLE_ALL (H cabezas / F explotaciones por especie, solo el total de cada una), DF_DCAT_CENSAGRIC2020_LABCAT_ALL (L: mano de obra, solo total, jefe y familiar),
  SAU_AZONE_ALL (Z: zona altimetrica), AGE (G: edad del jefe), LEGOWN_ALL (T: tenencia de la tierra; F: forma juridica), IRRSIS / IRRSOU / SURF_IRR_CONS (I, W, R: regadio por sistema, origen del agua y superficie regable).
ISTAT limita las consultas (unas 5 por minuto y IP): el script espera 12 s entre peticiones y tarda ~40 min.
Controles (si fallan no se escribe nada): entre 100 y 110 provincias con dato; cada provincia cuelga de una region conocida; sin negativos; la suma de las provincias de cada indicador aditivo
no supera el total nacional (IT) mas un 1 % + 5 y queda dentro de un 2 % + 5 por debajo; la superficie agraria utilizada no supera la superficie total; los cereales no superan la superficie agraria utilizada.
Un valor ausente queda como hueco (nunca se rellena). Las cuatro provincias sardas suprimidas (Olbia-Tempio, Ogliastra, Medio Campidano, Carbonia-Iglesias) no tienen dato en 2020: la isla esta en Sassari, Nuoro, Cagliari, Oristano y Sud Sardegna.
Uso: update-it-province.py [--out DIRECTORIO] [--save-raw | --raw]"""
import csv, datetime, gzip, io, json, re, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
B = "https://esploradati.istat.it/SDMXWS/rest/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
NS = {"s": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure", "c": "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common"}
YEAR = 2020
# codigo NUTS 2 de ISTAT -> codigo de region de Dehesa Index (region-names.js)
REG = {"ITC1": "PIE", "ITC2": "VDA", "ITC3": "LIG", "ITC4": "LOM", "ITD1": "TAA", "ITD2": "TAA", "ITD3": "VEN", "ITD4": "FVG", "ITD5": "EMR", "ITE1": "TOS", "ITE2": "UMB", "ITE3": "MAR", "ITE4": "LAZ",
       "ITF1": "ABR", "ITF2": "MOL", "ITF3": "CAM", "ITF4": "PUG", "ITF5": "BAS", "ITF6": "CAL", "ITG1": "SIC", "ITG2": "SAR", "IT10": "LOM", "IT11": "SAR"}
NEWPROV = {"IT108": "LOM", "IT109": "MAR", "IT110": "PUG", "IT111": "SAR"}
# (clave corta del flujo, dataflow, puntos de la clave, filtro de las dimensiones tras el territorio, nombre de las dimensiones)
FLOWS = [("S", "DF_DCAT_CENSAGRIC2020_SURF_ALL", 1, None, ["DATA_TYPE"]),
         ("C", "DF_DCAT_CENSAGRIC2020_CROPS_ALL", 2, None, ["DATA_TYPE", "TYPE_OF_CROP"]),
         ("H", "DF_DCAT_CENSAGRIC2020_CATTLE_ALL", 3, "..TOTCATT%2BTOTBUFF%2BTOTSH%2BTOTG%2BTOTHOR%2BTOTPIG%2BTOTPOU%2BTOTRAB%2BDAYRICOWS%2BLHE%2BBRO.TOT", ["DATA_TYPE", "TYPE_OF_HERD"]),
         ("L", "DF_DCAT_CENSAGRIC2020_LABCAT_ALL", 3, "..THLF%2BTFLF%2BHOL.9", ["DATA_TYPE", "LABOUR_FORCE_CATEG"]),
         # zona altimetrica (montaña interior y litoral, colina interior y litoral, llanura): explotaciones con SAU y SAU, todas las clases de tamaño juntas
         ("Z", "DF_DCAT_CENSAGRIC2020_SAU_AZONE_ALL", 3, ".FUAA%2BARU.TOT.IM%2BLM%2BIH%2BLH%2BPL", ["DATA_TYPE", "AGRI_AREA_CLASS", "ALTIMETRIC_ZONE"]),
         # edad del jefe de explotación: hasta 40 años y 41 o más (explotaciones sin tierras comunales y SAU)
         ("G", "DF_DCAT_CENSAGRIC2020_AGE", 2, ".HO_FM%2BARU.TOTAL%2BY_UN40%2BY_GE41", ["DATA_TYPE", "AGE"]),
         # tenencia de la tierra: superficie total por régimen (propiedad, alquiler, uso gratuito y mezclas) de todas las formas jurídicas
         ("T", "DF_DCAT_CENSAGRIC2020_LEGOWN_ALL", 3, ".HO%2BART.TOT.ALL%2BOO%2BOR%2BORE%2BOFU%2BOWN%2BRENT%2BFU", ["DATA_TYPE", "LEGAL_FORM", "OWN_USE_MECH_MEANS"]),
         # forma jurídica: explotaciones y superficie total de empresarios individuales, sociedades de personas, de capitales y cooperativas
         ("F", "DF_DCAT_CENSAGRIC2020_LEGOWN_ALL", 3, ".HO%2BART.11_X11%2B12%2B13%2B14.ALL", ["DATA_TYPE", "LEGAL_FORM", "OWN_USE_MECH_MEANS"]),
         # regadío: superficie regada y explotaciones con regadío por sistema y por origen del agua, y superficie regable
         ("I", "DF_DCAT_CENSAGRIC2020_IRRSIS", 2, ".IA%2BFIATED.ALL%2BASPE%2BMICR%2BSSSI%2BFLOO%2BOTSY", ["DATA_TYPE", "IRRIGATION_SYSTEM"]),
         ("W", "DF_DCAT_CENSAGRIC2020_IRRSOU", 2, ".IA.AIRC%2BUWNH%2BSWHB%2BSWHL%2BOTWS", ["DATA_TYPE", "WATER_IRRIG_SOURCE"]),
         ("R", "DF_DCAT_CENSAGRIC2020_SURF_IRR_CONS", 1, None, ["DATA_TYPE"])]
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def get(u, accept, tries=5, timeout=290):
    last = None
    for i in range(tries):
        try:
            time.sleep(12)
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=timeout) as r:
                b = r.read()
            if not b: raise ValueError("respuesta vacia")
            return b
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 404, 422): break
            time.sleep(90 if e.code == 429 else 20 * (i + 1))
        except Exception as e: last = e; time.sleep(20 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-120:], last))
def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None
def main():
    args = sys.argv[1:]; out = ROOT / "data" / "it-province"
    if "--out" in args: out = Path(args[args.index("--out") + 1])
    logf = ROOT / "data" / "it-province-log.txt"; RAW = ROOT / "data" / "it-province-raw.json.gz"
    def fail(*m): log("FALLO:", *m); logf.write_text("\n".join(LOG) + "\n"); return 1
    # 1. codigos y nombres de territorio y etiquetas de las tablas
    st = get(B + "dataflow/IT1/DF_DCAT_CENSAGRIC2020_CATTLE_ALL/latest?references=all&detail=full", "application/xml", tries=6)
    root = ET.fromstring(st); lab = {}
    for c in root.iter("{%s}Codelist" % NS["s"]): lab[c.get("id")] = {k.get("id"): (k.find("c:Name", NS).text or "") for k in c.findall("s:Code", NS)}
    st2 = get(B + "dataflow/IT1/DF_DCAT_CENSAGRIC2020_CROPS_ALL/latest?references=all&detail=full", "application/xml", tries=6)
    for c in ET.fromstring(st2).iter("{%s}Codelist" % NS["s"]): lab.setdefault(c.get("id"), {k.get("id"): (k.find("c:Name", NS).text or "") for k in c.findall("s:Code", NS)})
    terr = lab["CL_ITTER107"]
    prov = sorted(k for k in terr if re.match(r"^IT[CDEFG]\d[0-9A-Z]$", k) or k in NEWPROV)
    log("codigos de provincia:", len(prov))
    # 2. descarga (en bruto: lista de filas por flujo)
    if "--raw" in args and RAW.exists(): DATA = json.loads(gzip.decompress(RAW.read_bytes())); log("datos en bruto leidos")
    else:
        DATA = {}
        for key, fid, nd, flt, dims in FLOWS:
            rows = []; t0 = time.time()
            for ch in [prov[i:i + 10] for i in range(0, len(prov), 10)] + [["IT"]]:
                tail = flt if flt else "." * nd
                u = B + "data/IT1,%s,1.0/A.%s%s?startPeriod=%d&endPeriod=%d&detail=dataonly" % (fid, "%2B".join(ch), tail, YEAR, YEAR)
                try: b = get(u, "application/vnd.sdmx.data+csv;version=1.0.0")
                except Exception as e:
                    if "404" in str(e): log("  sin datos", fid, ch[0]); continue   # ninguna serie de ese grupo
                    return fail(fid, ch[0], str(e)[:200])
                for r in csv.DictReader(io.StringIO(b.decode("utf-8", "replace"))):
                    rows.append([r["REF_AREA"]] + [r[d] for d in dims] + [r["OBS_VALUE"]])
            DATA[key] = rows; log("tabla", key, fid, "%d filas, %d s" % (len(rows), time.time() - t0))
        if "--save-raw" in args: RAW.write_bytes(gzip.compress(json.dumps(DATA, separators=(",", ":")).encode()))
    # 3. indicadores por provincia y total nacional
    V, TOT, IND = {}, {}, {}
    for key, fid, nd, flt, dims in FLOWS:
        for r in DATA.get(key, []):
            a, v = r[0], num(r[-1]); ind = key + "." + ".".join(r[1:-1])
            if v is None: continue
            if v < 0: return fail("valor negativo", ind, a)
            if a == "IT": TOT[ind] = v
            elif a in terr: V.setdefault(a, {})[ind] = v
            if ind not in IND:
                parts = r[1:-1]; names = [lab.get({"DATA_TYPE": "CL_TIPO_DATO5", "TYPE_OF_CROP": "CL_AGRI_MADRE_CENS", "TYPE_OF_HERD": "CL_TIPO_ALLEVAMENTO", "LABOUR_FORCE_CATEG": "CL_MANODOPERA"}.get(d, ""), {}).get(p_, p_) for d, p_ in zip(dims, parts)]
                IND[ind] = " | ".join(names)
    prov_ok = sorted(V); log("provincias con dato:", len(prov_ok))
    if not 100 <= len(prov_ok) <= 110: return fail("numero de provincias inesperado:", len(prov_ok))
    for a in prov_ok:
        if (a[:4] if a not in NEWPROV else a) not in REG and a not in NEWPROV: return fail("provincia sin region conocida", a, terr.get(a))
    # 4. controles
    ok = tot = over = 0; bad = []
    for ind, t in TOT.items():
        if t < 100: continue
        s = sum(V[a][ind] for a in prov_ok if ind in V[a]); tol = 0.02 * t + 5
        if s > t * 1.01 + 5: over += 1; bad.append(("DESBORDE", ind, round(s, 1), t))
        tot += 1; g = abs(s - t) <= tol; ok += g
        if not g: bad.append(("DESCUADRE", ind, round(s, 1), t))
    for b in bad[:25]: log(*b)
    log("control nacional: %d de %d indicadores cuadran, %d desbordes" % (ok, tot, over))
    if tot < 40 or ok < 0.9 * tot or over > 0.02 * tot: return fail("el control no cuadra, no se escribe nada")
    nb = 0
    for a in prov_ok:
        v = V[a]
        if "S.ARU" in v and "S.ART" in v and v["S.ARU"] > v["S.ART"] * 1.001 + 1: nb += 1; log("SAU mayor que superficie total", a)
        if "C.ARU.CEREALS" in v and "S.ARU" in v and v["C.ARU.CEREALS"] > v["S.ARU"] * 1.001 + 1: nb += 1; log("cereales mayores que SAU", a)
    if nb: return fail("%d provincias incoherentes" % nb)
    # 5. escritura
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    src = {"id": "istat", "name": "ISTAT, 7° Censimento generale dell'agricoltura 2020 (IstatData)", "url": "https://esploradati.istat.it/databrowser/#/it/censimentoagricoltura", "license": "CC BY 4.0 (ISTAT)"}
    out.mkdir(parents=True, exist_ok=True); per = {}
    for a in prov_ok:
        reg = NEWPROV.get(a) or REG[a[:4]]
        per.setdefault(reg, {})[a] = {"n": terr[a], "v": {k: x for k, x in sorted(V[a].items())}}
    for reg, pr in sorted(per.items()):
        (out / (reg + ".json")).write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "region": reg, "year": YEAR, "provinces": pr}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    used = {k for a in prov_ok for k in V[a]}
    (out / "index.json").write_text(json.dumps({"schemaVersion": 1, "generatedAt": now, "source": src, "year": YEAR, "regions": sorted(per), "indicators": {k: IND[k] for k in sorted(used)}}, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    log("OK: %d provincias en %d regiones, %d indicadores, %d KB" % (len(prov_ok), len(per), len(used), sum(f.stat().st_size for f in out.glob("*.json")) // 1024))
    logf.write_text("\n".join(LOG) + "\n"); return 0
if __name__ == "__main__": sys.exit(main())
