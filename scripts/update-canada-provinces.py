#!/usr/bin/env python3
"""Canada por provincia (Statistics Canada, tablas WDS, Open Government Licence - Canada) -> data/canada-provinces.json.
Cultivos de campo (32-10-0359: superficie sembrada y cosechada, rendimiento, produccion, precio en finca), ganado (32-10-0130 vacuno, 32-10-0160 porcino, 32-10-0129 ovino:
existencias a 1 de enero y 1 de julio), renta agraria (32-10-0052) e ingresos en efectivo por producto (32-10-0045). Diez provincias mas el total de Canada ("CA").
Los territorios no aparecen: Statistics Canada no publica estas tablas para Yukon, Territorios del Noroeste ni Nunavut. Si algo falla el fichero anterior se conserva.
Uso: python3 scripts/update-canada-provinces.py [--out ruta]"""
import datetime, importlib.util, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "canada-provinces.json"
spec = importlib.util.spec_from_file_location("cs", ROOT / "scripts" / "update-canada-stats.py"); S = importlib.util.module_from_spec(spec); spec.loader.exec_module(S)
S.log = lambda *a: print(*a, flush=True)  # no pisar canada-stats-log.txt
GEO = {"Canada": "CA", "Newfoundland and Labrador": "NL", "Prince Edward Island": "PE", "Nova Scotia": "NS", "New Brunswick": "NB", "Quebec": "QC", "Ontario": "ON", "Manitoba": "MB", "Saskatchewan": "SK", "Alberta": "AB", "British Columbia": "BC"}
YEAR = datetime.date.today().year
SPEC = {"Seeded area (hectares)": ("area", 1e-3), "Harvested area (hectares)": ("harea", 1e-3), "Production (metric tonnes)": ("prod", 1e-3), "Average yield (kilograms per hectare)": ("yield", 1), "Average farm price (dollars per tonne)": ("price", 1)}
CATTLE = {"Total cattle": "Total cattle", "Dairy cows": "Dairy cows", "Beef cows": "Beef cows", "Calves, under 1 year": "Calves under 1 year", "Total heifers": "Heifers"}
HOGS = {"Hogs, total": "Total hogs", "Sows and gilts, 6 months and over": "Sows and gilts"}
SHEEP = {"Sheep and lambs, total": "Sheep and lambs", "Ewes": "Ewes", "Lambs for marketing": "Lambs for marketing"}
INCOME = {"Cash receipts, total": "Cash receipts", "Operating expenses after rebates": "Operating expenses", "Net cash income": "Net cash income", "Net income, total": "Net income", "Depreciation charges": "Depreciation", "Supplementary payments": "Supplementary payments"}
SKIP = re.compile(r"Marketing Board|Wheat Board|Deferred|Liquidation|Supplementary|Direct program|Other crop|Interest|Wages", re.I)
def pts(d, keep): return [[p, round(v, 3)] for p, v in sorted(d.items()) if int(p[:4]) >= YEAR - keep]
def crops(out):
    spec = {k: v for k, v in SPEC.items()}
    cell = {}
    for r in S.load(32100359):
        g = GEO.get(r["GEO"]); h = r["Harvest disposition"]
        if not g or h not in spec or r["Type of crop"] not in S.CROPS: continue
        v = S.num(r)
        if v is None: continue
        cell.setdefault((g, r["Type of crop"], spec[h][0]), {})[r["REF_DATE"]] = v * spec[h][1]
    for (g, c, tag), d in cell.items():
        p = pts(d, 30)
        if len(p) >= 3 and int(p[-1][0]) >= YEAR - 3: out[g].setdefault("crops", {}).setdefault(S.slug(c), {"name": S.CROPS[c]})[tag] = p
def stock(out, pid, names, key):
    cell = {}
    for r in S.load(pid):
        g = GEO.get(r["GEO"]); k = r["Livestock"]
        if not g or k not in names or (pid == 32100130 and r["Farm type"] != "On all cattle operations"): continue
        v = S.num(r)
        if v is not None: cell.setdefault((g, k), {})[S.per(r)] = v / 1000
    for (g, k), d in cell.items():
        p = pts(d, 20)
        if len(p) >= 4 and int(p[-1][0][:4]) >= YEAR - 2: out[g].setdefault(key, {})[S.slug(k)] = {"name": names[k], "pts": p}
def income(out):
    cell = {}
    for r in S.load(32100052):
        g = GEO.get(r["GEO"]); k = r["Income components"]
        if not g or k not in INCOME: continue
        v = S.num(r)
        if v is not None: cell.setdefault((g, k), {})[r["REF_DATE"]] = v / 1e6
    for (g, k), d in cell.items():
        p = pts(d, 30)
        if len(p) >= 5 and int(p[-1][0]) >= YEAR - 3: out[g].setdefault("income", {})[S.slug(k)] = {"name": INCOME[k], "pts": p}
def receipts(out):
    cell = {}
    for r in S.load(32100045):
        g = GEO.get(r["GEO"]); k = S.clean(r["Type of cash receipts"])
        if not g or SKIP.search(k): continue
        v = S.num(r)
        if v is not None: cell.setdefault((g, k), {})[r["REF_DATE"]] = v / 1e6
    for (g, k), d in cell.items():
        p = pts(d, 15)
        if len(p) >= 4 and int(p[-1][0]) >= YEAR - 3 and p[-1][1] > 0: out[g].setdefault("receipts", {})[S.slug(k)] = {"name": k, "pts": p}
def main():
    args = sys.argv[1:]; outp = OUT
    if "--out" in args: i = args.index("--out"); outp = Path(args[i + 1])
    try:
        out = {g: {} for g in GEO.values()}
        crops(out); stock(out, 32100130, CATTLE, "cattle"); stock(out, 32100160, HOGS, "hogs"); stock(out, 32100129, SHEEP, "sheep"); income(out); receipts(out)
        n = sum(len(v) for g in out.values() for v in g.values())
        if n < 300 or any(len(out[g]) < 4 for g in ("SK", "AB", "ON", "QC", "CA")): raise ValueError("faltan series: %d bloques" % n)
    except Exception as e: print("FALLO:", repr(e)); return 1
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "source": {"name": "Statistics Canada, tables 32-10-0359, 32-10-0130, 32-10-0160, 32-10-0129, 32-10-0052 and 32-10-0045", "url": "https://www150.statcan.gc.ca/n1/en/type/data", "license": "Open Government Licence - Canada"},
           "units": {"area": "thousand ha", "harea": "thousand ha", "prod": "thousand t", "yield": "kg/ha", "price": "CAD/t", "cattle": "thousand head", "income": "CAD million", "receipts": "CAD million"},
           "provinces": out}
    outp.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("escrito", outp.name, outp.stat().st_size // 1024, "KB;", {g: sorted(v) for g, v in out.items() if g in ("SK", "CA")}); return 0
if __name__ == "__main__": sys.exit(main())
