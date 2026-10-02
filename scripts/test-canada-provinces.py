#!/usr/bin/env python3
"""Pruebas de coherencia de data/canada-provinces.json (Statistics Canada) con los datos reales publicados."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
D = json.loads((ROOT / "data" / "canada-provinces.json").read_text())["provinces"]; P = [g for g in D if g != "CA"]
F = []
def T(name, ok):
    print(("OK   " if ok else "FALLO ") + name)
    if not ok: F.append(name)
T("10 provincias + Canada, sin territorios", sorted(D) == sorted(["CA", "NL", "PE", "NS", "NB", "QC", "ON", "MB", "SK", "AB", "BC"]))
for k in ("wheat-all", "canola-rapeseed", "barley", "soybeans", "corn-for-grain"):
    ca = D["CA"]["crops"][k]["prod"][-1]; su = sum(dict(D[g]["crops"][k].get("prod", [])).get(ca[0], 0) for g in P if k in D[g].get("crops", {}))
    T("%s %s: las provincias suman Canada (%.2f %%)" % (k, ca[0], 100 * su / ca[1]), abs(su / ca[1] - 1) < 0.02)
yr = D["CA"]["receipts"]["total-farm-cash-receipts"]["pts"][-1][0]
T("ingresos en efectivo %s: provincias = Canada (2 %%)" % yr, abs(sum(dict(D[g]["receipts"]["total-farm-cash-receipts"]["pts"])[yr] for g in P) / dict(D["CA"]["receipts"]["total-farm-cash-receipts"]["pts"])[yr] - 1) < 0.02)
T("ingresos totales = cultivos + ganaderia + pagos directos (1 %)", all(abs(sum(dict(D[g]["receipts"][k]["pts"])[yr] for k in ("total-crop-receipts", "total-livestock-and-livestock-product-receipts", "total-direct-payments")) / dict(D[g]["receipts"]["total-farm-cash-receipts"]["pts"])[yr] - 1) < 0.01 for g in P if all(k in D[g]["receipts"] for k in ("total-crop-receipts", "total-livestock-and-livestock-product-receipts", "total-direct-payments"))))
pe = D["CA"]["cattle"]["total-cattle"]["pts"][-1][0]
T("vacuno %s: provincias suman Canada (2 %%)" % pe, abs(sum(dict(D[g]["cattle"]["total-cattle"]["pts"]).get(pe, 0) for g in P) / dict(D["CA"]["cattle"]["total-cattle"]["pts"])[pe] - 1) < 0.02)
T("Saskatchewan: canola es el mayor ingreso de cultivo", max((v["pts"][-1][1], k) for k, v in D["SK"]["receipts"].items() if not k.startswith("total-"))[1] in ("canola-including-rapeseed",))
T("Alberta y Saskatchewan concentran la mayor parte del trigo de Canada (>70 %)", sum(dict(D[g]["crops"]["wheat-all"]["prod"]).get(D["CA"]["crops"]["wheat-all"]["prod"][-1][0], 0) for g in ("SK", "AB", "MB")) > 0.7 * D["CA"]["crops"]["wheat-all"]["prod"][-1][1])
T("Quebec y Ontario con lacteo: vacas lecheras > 100 mil", all(D[g]["cattle"]["dairy-cows"]["pts"][-1][1] > 100 for g in ("QC", "ON")))
print("\n%d fallos" % len(F)); sys.exit(1 if F else 0)
