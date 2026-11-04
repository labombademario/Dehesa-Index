#!/usr/bin/env python3
"""Sonda 41: OTEX en GeoClip por comuna y relacion comuna->EPCI en geo.api.gouv.fr."""
import importlib.util, json, urllib.request
sp = importlib.util.spec_from_file_location("fc", "scripts/update-fr-communes.py"); fc = importlib.util.module_from_spec(sp); sp.loader.exec_module(fc)
fc.make_bundle()
li = fc.get("GC_listIndics.php?lang=fr&obs=main" + fc.HASH)["content"]["indics"]
for i in li:
    t = (i.get("c_id_indicateur", "") + " " + str(i.get("c_lib_indicateur_court", ""))).lower()
    if "ote" in i.get("c_id_indicateur", "").lower() or "orientation" in t or "otex" in t:
        print("IND", i["c_id_indicateur"], "|", i.get("c_lib_indicateur_court"), "|", i.get("c_id_dataset"), "|", i.get("c_id_view"), "|", i.get("c_type_indicateur") or i.get("c_type"))
for gid in ("otefdd20", "otefda20"):
    c = [i for i in li if i["c_id_indicateur"] == gid]
    if not c: print("sin", gid); continue
    try:
        j = fc.get("GC_indic.php?indic=%s&dataset=%s&view=map11&lang=fr%s" % (gid, c[0]["c_id_dataset"], fc.HASH))["content"]
        print(gid, "claves", list(j.keys())[:12]); d = j.get("distribution", {}); print("  dist", {k: (v if not isinstance(v, list) else (len(v), v[:12])) for k, v in d.items()} if isinstance(d, dict) else str(d)[:300])
        print("  legend", json.dumps(j.get("legend") or j.get("classes") or j.get("modalites") or "", ensure_ascii=False)[:900])
    except Exception as e: print(gid, "ERR", str(e)[:200])
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
for u in ["https://geo.api.gouv.fr/communes?fields=code,codeEpci&format=json", "https://geo.api.gouv.fr/epcis?fields=code,nom,population"]:
    try:
        t = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120).read().decode(); d = json.loads(t); print("API", u[:60], len(d), d[:2])
    except Exception as e: print("API ERR", u[:60], e)
