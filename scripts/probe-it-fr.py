#!/usr/bin/env python3
"""Sonda 43: cobertura comuna GeoClip 2020 -> EPCI de geo.api.gouv.fr."""
import importlib.util, json, urllib.request
sp = importlib.util.spec_from_file_location("fc", "scripts/update-fr-communes.py"); fc = importlib.util.module_from_spec(sp); sp.loader.exec_module(fc)
fc.make_bundle()
ref = fc.get("GC_refdata.php?nivgeo=com2020&extent=extent1&lang=fr" + fc.HASH)["content"]["territories"]; codes = ref["codgeo"]
li = fc.get("GC_listIndics.php?lang=fr&obs=main" + fc.HASH)["content"]["indics"]
m = [i for i in li if i["c_id_indicateur"] == "nbexpl20"][0]
v = fc.get("GC_indic.php?indic=nbexpl20&dataset=%s&view=map11&lang=fr%s" % (m["c_id_dataset"], fc.HASH))["content"]["distribution"]["values"]
farms = {c: (x if isinstance(x, (int, float)) and x > 0 else 0) for c, x in zip(codes, v)}
print("comunas", len(codes), "con explotaciones", sum(1 for x in farms.values() if x), "explotaciones", sum(farms.values()))
H = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
def api(u): return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=180).read().decode())
for name, u in [("actuales", "https://geo.api.gouv.fr/communes?fields=code,codeEpci&format=json"),
                ("todos los tipos", "https://geo.api.gouv.fr/communes?fields=code,codeEpci&format=json&type=commune-actuelle,commune-associee,commune-deleguee,arrondissement-municipal")]:
    try: d = api(u)
    except Exception as e: print(name, "ERR", e); continue
    mp = {x["code"]: x.get("codeEpci") for x in d}
    miss = [c for c in codes if farms.get(c) and not mp.get(c)]
    print(name, "filas", len(d), "con EPCI", sum(1 for x in mp.values() if x), "| comunas con explotaciones sin EPCI:", len(miss), "explotaciones:", sum(farms[c] for c in miss), miss[:15])
