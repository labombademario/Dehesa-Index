#!/usr/bin/env python3
"""Francia (FranceAgriMer, a mano): calidad tecnologica del trigo blando por region y del trigo duro por cuenca (encuesta de calidad a la entrada de silos)
-> data/france-quality-regions.json.
  python3 scripts/build-france-quality-regions.py <SCR-CER-QUALITE_REGION_BT-*.xls> <SCR-CER-QUALITE_BASSIN_BD-*.xls>"""
import datetime, json, re, sys, unicodedata
from pathlib import Path
import xlrd
ROOT = Path(__file__).resolve().parents[1]
INSEE = {"AUVERGNE-RHONE-ALPES": "84", "BOURGOGNE-FRANCHE-COMTE": "27", "BRETAGNE": "53", "CENTRE-VAL DE LOIRE": "24", "GRAND-EST": "44", "HAUTS-DE-FRANCE": "32", "ILE-DE-FRANCE": "11",
         "NORMANDIE": "28", "NOUVELLE-AQUITAINE": "75", "OCCITANIE": "76", "PACA": "93", "PAYS DE LA LOIRE": "52"}
RANGE = {"water": (8, 20), "tw": (60, 90), "protein": (8, 20), "w": (50, 400), "ie": (20, 80), "pl": (0.1, 3), "gmf": (0, 60), "vitr": (20, 100)}
def sheet(s, keys):
    hdr = next(r for r in range(s.nrows) if str(s.cell_value(r, 0)).strip().startswith("Ann"))
    out = {}
    for r in range(hdr + 1, s.nrows):
        y = s.cell_value(r, 0)
        if not isinstance(y, float): continue
        row = []
        for i, k in enumerate(keys):
            v = s.cell_value(r, i + 1)
            if isinstance(v, float):
                lo, hi = RANGE[k]; assert lo <= v <= hi, (s.name, int(y), k, v)
                row.append(round(v, 2 if k == "pl" else 1))
            else: row.append(None)
        out[str(int(y))] = row
    return out
def main(bt, bd):
    kb = ["water", "tw", "protein", "w", "ie", "pl"]; kd = ["water", "tw", "protein", "gmf", "vitr"]
    wb = xlrd.open_workbook(bt); regs = {}
    for n in wb.sheet_names():
        assert n in INSEE, n
        regs[INSEE[n]] = {"name": n.title(), "v": sheet(wb.sheet_by_name(n), kb)}
    wd = xlrd.open_workbook(bd); bas = {}
    for n in wd.sheet_names():
        s = wd.sheet_by_name(n)
        if s.nrows: bas[n] = {"name": n.title(), "v": sheet(s, kd)}
    out = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "country": "FR",
           "source": {"id": "franceagrimer", "name": "FranceAgriMer - enquete qualite collecteur (entree des silos)", "url": "https://www.franceagrimer.fr/", "license": "Licence Ouverte 2.0", "lastHarvest": max(max(r["v"]) for r in regs.values())},
           "softWheat": {"fields": kb, "units": ["%", "kg/hl", "%", "W", "IE", "P/L"], "regions": regs},
           "durum": {"fields": kd, "units": ["%", "kg/hl", "%", "%", "%"], "basins": bas}}
    (ROOT / "data" / "france-quality-regions.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(regs), "regiones,", len(bas), "cuencas, cosecha", out["source"]["lastHarvest"])
main(*sys.argv[1:3])
