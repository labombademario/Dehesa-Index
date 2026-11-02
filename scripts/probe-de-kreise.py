#!/usr/bin/env python3
"""Sondeo (solo rama research/): comprueba si GENESIS_TOKEN vale en la Regionaldatenbank y que tablas agrarias hay por distrito. No escribe datos."""
import json, os, urllib.parse, urllib.request
tok = os.environ.get("GENESIS_TOKEN", "").strip()
print("token presente:", bool(tok))
def call(host, ep, params):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": tok, "password": "", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    r = urllib.request.Request("https://%s/rest/2020/%s" % (host, ep), data=urllib.parse.urlencode(params).encode(), headers=h)
    try: return urllib.request.urlopen(r, timeout=90).read().decode("utf-8", "replace")
    except Exception as e: return "ERR " + repr(e)[:200]
for host in ("www.regionalstatistik.de/genesisws", "genesis.destatis.de/genesisWS"):
    print("==", host); print(call(host, "helloworld/whoami", {})[:200])
    out = call(host, "catalogue/tables", {"selection": "41*", "pagelength": "200", "language": "de"})
    try:
        d = json.loads(out); print("tablas:", len(d.get("List", [])))
        for t in d.get("List", []):
            if "-4" in t["Code"] or "Kreis" in t["Content"] or "Landkreis" in t["Content"]: print(t["Code"], "|", t["Content"][:100])
    except Exception: print(out[:300])
