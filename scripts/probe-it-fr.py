#!/usr/bin/env python3
"""Sonda 42: etiquetas de las OTEX de GeoClip."""
import importlib.util, json
sp = importlib.util.spec_from_file_location("fc", "scripts/update-fr-communes.py"); fc = importlib.util.module_from_spec(sp); sp.loader.exec_module(fc)
fc.make_bundle()
li = fc.get("GC_listIndics.php?lang=fr&obs=main" + fc.HASH)["content"]["indics"]
for gid in ("otefda20", "otefdd20"):
    m = [i for i in li if i["c_id_indicateur"] == gid][0]
    print("META", gid, json.dumps(m, ensure_ascii=False)[:2500])
    j = fc.get("GC_indic.php?indic=%s&dataset=%s&view=map11&lang=fr%s" % (gid, m["c_id_dataset"], fc.HASH))["content"]
    print("OPTIONS", json.dumps(j.get("options"), ensure_ascii=False)[:3000])
    print("ZONREFS", json.dumps(j.get("zonrefs"), ensure_ascii=False)[:300])
    d = j["distribution"]; print("FREQ", json.dumps(d["frequences"], ensure_ascii=False)); print("ncodes", len(d["codes"]), [k for k in d.keys()])
