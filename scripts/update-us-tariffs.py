#!/usr/bin/env python3
"""Aranceles de EE. UU. (Harmonized Tariff Schedule, USITC) para productos agroalimentarios: capitulos 01-24 y 31 (fertilizantes).
API publica reststop de la USITC (dominio publico, EE. UU.). Escribe data/us-tariffs.json y data/us-tariffs-log.txt.
Cada linea arancelaria (8 digitos con tipo general) trae: derecho general (NMF), derechos especiales (acuerdos/preferencias), columna 2 (paises sin NMF),
unidades, contingente (quotaQuantity), derechos adicionales y notas. Las acciones recientes (Secciones 122/232/301, IEEPA) NO estan aqui: son medidas
que cambian por orden ejecutiva y se mantienen aparte con fecha de vigencia (data/us-tariff-measures.json)."""
import datetime, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = "https://hts.usitc.gov/reststop/"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0", "Accept": "application/json"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append("%s %s" % (time.strftime("%H:%M:%S"), s)); print(s, flush=True)
    try: (ROOT / "data" / "us-tariffs-log.txt").write_text("\n".join(LOG))
    except Exception: pass
def get(path, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(API + path, headers=H), timeout=120) as r: return json.load(r)
        except Exception as e: last = e; time.sleep(3 * (i + 1))
    raise RuntimeError(repr(last)[:200])
CHAPTERS = ["%02d" % i for i in range(1, 25)] + ["31"]
def rate(s):
    s = (s or "").strip()
    if not s: return None
    d = {"raw": s}
    if re.match(r"^free$", s, re.I): d.update(t="free", adv=0.0)
    elif re.match(r"^\d+(\.\d+)?%$", s): d.update(t="adv", adv=float(s[:-1]))
    elif "+" in s and "%" in s: d.update(t="comp", adv=float(re.search(r"(\d+(?:\.\d+)?)%", s).group(1)))
    elif re.search(r"[¢$]", s): d.update(t="spec")
    else: d.update(t="other")
    return d
def main():
    rel = get("currentRelease")
    prev = None
    try: prev = json.loads((ROOT / "data" / "us-tariffs.json").read_text()).get("release", {}).get("name")
    except Exception: pass
    log("release", rel.get("name"), "previa", prev)
    names = {}; out = []; stack = {}
    for ch in CHAPTERS:
        try: rows = get("exportList?from=%s01&to=%s99&format=JSON&styles=false" % (ch, ch))
        except Exception as e: log("ERROR cap", ch, e); continue
        stack = {}; heading = ""; n0 = len(out)
        for i, r in enumerate(rows):
            ind = int(r.get("indent") or 0); desc = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", r.get("description") or "")).strip(" :")
            stack = {k: v for k, v in stack.items() if k < ind}; stack[ind] = desc
            no = r.get("htsno") or ""
            if len(no) == 4: heading = no; names[no] = desc
            g = (r.get("general") or "").strip()
            if not g or len(re.sub(r"\D", "", no)) < 8: continue
            # unidades: del propio registro o del primer sufijo estadistico hijo
            units = r.get("units") or []
            j = i + 1
            while not units and j < len(rows) and len(re.sub(r"\D", "", rows[j].get("htsno") or "")) >= 10 and int(rows[j].get("indent") or 0) > ind:
                units = rows[j].get("units") or []; j += 1
            path = [stack[k] for k in sorted(stack) if k > 0]
            out.append({"h": no, "c": ch, "hd": heading, "d": " › ".join(path[-3:]) if path else desc, "g": g, "sp": (r.get("special") or "").strip(), "o": (r.get("other") or "").strip(), "u": ",".join(units) if units else "",
                        "q": (r.get("quotaQuantity") or "").strip() if r.get("quotaQuantity") else "", "ad": (r.get("additionalDuties") or "").strip() if r.get("additionalDuties") else "", "f": [re.sub(r"<[^>]+>", "", (f.get("value") if isinstance(f, dict) else str(f)) or "")[:160] for f in (r.get("footnotes") or [])][:3]})
        log("capitulo", ch, len(out) - n0, "lineas")
    if len(out) < 1500: log("demasiado pocas lineas", len(out)); sys.exit(1)
    # estadisticas por capitulo y partida
    chs = {}; hds = {}
    for l in out:
        r = rate(l["g"]); l["r"] = r["t"] if r else "other"; l["a"] = r.get("adv") if r else None
        for key, tab, ident in ((l["c"], chs, l["c"]), (l["hd"], hds, l["hd"])):
            x = tab.setdefault(key, {"n": 0, "free": 0, "adv": 0, "spec": 0, "comp": 0, "other": 0, "sumadv": 0.0, "maxadv": 0.0, "trq": 0, "fta": 0})
            x["n"] += 1; x["free"] += l["r"] == "free"; x["adv"] += l["r"] == "adv"; x["spec"] += l["r"] == "spec"; x["comp"] += l["r"] == "comp"; x["other"] += l["r"] == "other"
            if l["a"] is not None and l["r"] == "adv": x["sumadv"] += l["a"]; x["maxadv"] = max(x["maxadv"], l["a"])
            x["trq"] += bool(l["q"] or re.search(r"9904|quota|tariff-rate", l["g"] + " " + l["o"], re.I)); x["fta"] += bool(l["sp"])
    for t in (chs, hds):
        for x in t.values(): x["avgadv"] = round(x["sumadv"] / x["adv"], 2) if x["adv"] else None; x["sumadv"] = round(x["sumadv"], 1)
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "release": {"name": rel.get("name"), "title": rel.get("title")},
           "source": {"name": "USITC — Harmonized Tariff Schedule of the United States", "url": "https://hts.usitc.gov/", "license": "Public domain (U.S. Government work)"},
           "headings": {k: names.get(k, "") for k in hds}, "chapters": chs, "headingStats": hds, "lines": out}
    (ROOT / "data" / "us-tariffs.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    log("lineas", len(out), "partidas", len(hds), "capitulos", len(chs))
main()
