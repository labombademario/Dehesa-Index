#!/usr/bin/env python3
"""Sondeo (solo rama research/): comprueba si GENESIS_TOKEN vale en la Regionaldatenbank y que tablas agrarias hay por distrito. No escribe datos."""
import json, os, urllib.error, urllib.parse, urllib.request
tok = os.environ.get("GENESIS_TOKEN", "").strip()
print("token presente:", bool(tok))
def call(host, ep, params):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": tok, "password": "", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    r = urllib.request.Request("https://%s/rest/2020/%s" % (host, ep), data=urllib.parse.urlencode(params).encode(), headers=h)
    try: return urllib.request.urlopen(r, timeout=90).read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e: return "ERR %s %s" % (e.code, e.read().decode("utf-8", "replace")[:300])
    except Exception as e: return "ERR " + repr(e)[:200]
for host in ("www.regionalstatistik.de/genesisws", "genesis.destatis.de/genesisWS"):
    print("==", host)
    for ep, pr in (("helloworld/logincheck", {}), ("catalogue/tables", {"selection": "41141*", "pagelength": "100", "language": "de"}), ("find/find", {"term": "Landkreise Landwirtschaft", "category": "tables", "pagelength": "50", "language": "de"})):
        out = call(host, ep, pr); print("--", ep, "|", out[:250].replace("\n", " "))
        try:
            d = json.loads(out)
            for t in (d.get("List") or d.get("Tables") or [])[:60]: print("   ", t.get("Code"), "|", (t.get("Content") or "")[:110])
        except Exception: pass
