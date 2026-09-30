#!/usr/bin/env python3
"""Dinamarca: precios agrícolas nacionales de Statistics Denmark (StatBank API, licencia CC BY 4.0).
LPRIS10 (precios de 27 productos agrícolas, mensual desde 2005M01) y ANI71 (leche en granja, øre/kg, mensual desde 1995M01).
Escribe data/denmark-prices.json. Si una tabla falla, no se escribe nada de esa tabla y se anota en el informe (no se inventa)."""
import csv, io, json, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = "https://api.statbank.dk/v1/"
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0", "Content-Type": "application/json"}

def post(path, body):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(), headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read().decode("utf-8-sig", "replace")

def period_iso(p):  # 2026M07 -> 2026-07
    return p[:4] + "-" + p[5:7]

def fetch_series(table, var, ids):
    info = json.loads(post("tableinfo", {"table": table, "format": "JSON", "lang": "en"}))
    names = {}
    for v in info["variables"]:
        if v["id"] == var:
            names = {x["id"]: x["text"] for x in v["values"]}
    body = {"table": table, "format": "CSV", "lang": "en", "valuePresentation": "Code",
            "variables": [{"code": var, "values": ids or ["*"]}, {"code": "Tid", "values": ["*"]}]}
    return info, names, body

report = {"generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "tables": {}}
series = []

# ---- LPRIS10: precios en DKK (precios corrientes, ENHED 320) ----
try:
    info, names, body = fetch_series("LPRIS10", "PRODUKT", ["*"])
    body["variables"].insert(1, {"code": "ENHED", "values": ["320"]})
    rows = list(csv.DictReader(io.StringIO(post("data", body)), delimiter=";"))
    by = {}
    for r in rows:
        v = r.get("INDHOLD", "").replace(",", ".").strip()
        if not v or v in ("..", "-"):
            continue
        by.setdefault(r["PRODUKT"], []).append((period_iso(r["TID"]), float(v)))
    for pid, pts in by.items():
        pts.sort()
        nm = names.get(pid, pid)
        unit = "DKK/100kg" if "per 100 kg" in nm else ("DKK/head" if "per head" in nm else ("DKK/unit" if "per unit" in nm else "DKK"))
        prev = pts[-2][1] if len(pts) > 1 else None
        series.append({"id": "LPRIS10:" + pid, "table": "LPRIS10", "dstId": pid, "label": nm, "unit": unit, "currency": "DKK",
                       "frequency": "monthly", "latestPeriod": pts[-1][0], "latest": pts[-1][1],
                       "changePct": round((pts[-1][1] / prev - 1) * 100, 2) if prev else None,
                       "history": [{"period": p, "value": v} for p, v in pts]})
    report["tables"]["LPRIS10"] = {"ok": True, "products": len(by), "updated": info.get("updated")}
except Exception as e:
    report["tables"]["LPRIS10"] = {"ok": False, "error": str(e)[:200]}

# ---- ANI71: leche en granja ----
try:
    info, names, body = fetch_series("ANI71", "MÆNGDE4", ["MAELK21", "MAELK2", "MAELK11"])
    rows = list(csv.DictReader(io.StringIO(post("data", body)), delimiter=";"))
    key = [k for k in rows[0].keys() if k not in ("TID", "INDHOLD")][0]
    by = {}
    for r in rows:
        v = r.get("INDHOLD", "").replace(",", ".").strip()
        if not v or v in ("..", "-"):
            continue
        by.setdefault(r[key], []).append((period_iso(r["TID"]), float(v)))
    for pid, pts in by.items():
        pts.sort()
        nm = names.get(pid, pid)
        unit = "DKK-ore/kg" if "øre" in nm else ("m kg" if "m kg" in nm else nm)
        prev = pts[-2][1] if len(pts) > 1 else None
        series.append({"id": "ANI71:" + pid, "table": "ANI71", "dstId": pid, "label": nm, "unit": unit, "currency": "DKK" if "øre" in nm else None,
                       "frequency": "monthly", "latestPeriod": pts[-1][0], "latest": pts[-1][1],
                       "changePct": round((pts[-1][1] / prev - 1) * 100, 2) if prev else None,
                       "history": [{"period": p, "value": v} for p, v in pts]})
    report["tables"]["ANI71"] = {"ok": True, "series": len(by), "updated": info.get("updated")}
except Exception as e:
    report["tables"]["ANI71"] = {"ok": False, "error": str(e)[:200]}

if not series:
    print("Sin series: no se escribe data/denmark-prices.json", report, file=sys.stderr)
    sys.exit(1)
out = {"schemaVersion": "1.0", "generatedAt": report["generatedAt"], "country": "DK",
       "source": {"name": "Statistics Denmark (Danmarks Statistik), StatBank", "url": "https://www.statbank.dk/", "license": "CC BY 4.0",
                  "attribution": "Source: Statistics Denmark (StatBank), CC BY 4.0. Processed by Dehesa Index."},
       "report": report["tables"], "series": series}
(ROOT / "data" / "denmark-prices.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Dinamarca:", len(series), "series", report["tables"])
for s in series:
    print(" ", s["id"], "|", s["label"], "|", s["latestPeriod"], s["latest"], "| n=", len(s["history"]))
