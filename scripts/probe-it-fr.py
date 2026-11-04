#!/usr/bin/env python3
"""Sonda 39: datos nacionales de los flujos candidatos de ISTAT (combinaciones y valores)."""
import csv, io, time, urllib.request
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)", "Accept": "application/vnd.sdmx.data+csv;version=1.0.0"}
B = "https://esploradati.istat.it/SDMXWS/rest/"
def get(u):
    time.sleep(12)
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=280).read().decode("utf8", "replace")
    except Exception as e: return "ERR " + str(e)
for f in ["SAU_AZONE_ALL", "AGE", "LEGOWN_ALL", "IRRSIS", "SURF_IRR_CONS", "IRRSOU"]:
    t = get(B + "data/IT1,DF_DCAT_CENSAGRIC2020_%s,1.0/A.IT?startPeriod=2020&endPeriod=2020&detail=dataonly" % f)
    print("==", f, len(t), t[:100].replace("\n", " ") if t.startswith("ERR") else "")
    if t.startswith("ERR"): continue
    rd = list(csv.DictReader(io.StringIO(t))); print("   filas", len(rd), "cols", list(rd[0].keys()) if rd else "")
    ks = [k for k in rd[0].keys() if k not in ("DATAFLOW", "FREQ", "REF_AREA", "TIME_PERIOD", "OBS_VALUE", "OBS_STATUS", "BASE_PER", "UNIT_MEAS", "UNIT_MULT", "DECIMALS", "NOTE_DATASET", "NOTE_ISTAT", "NOTE_CENSAGR", "CENSAGR_NOTE", "CONF_STATUS", "OBS_PRE_BREAK", "BREAK")] if rd else []
    for r in rd[:70]: print("   ", [r[k] for k in ks], r["OBS_VALUE"])
