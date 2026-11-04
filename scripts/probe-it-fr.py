#!/usr/bin/env python3
"""Sonda 16: como sirve GeoClip (Agreste, RA 2020 por comuna) sus datos."""
import re, subprocess as sp, time, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
def get(u, t=60):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read()
    except Exception as e: p("  error", u[-90:], str(e)[:90]); return b""
r = sp.run("echo | openssl s_client -connect stats.agriculture.gouv.fr:443 -servername stats.agriculture.gouv.fr -showcerts 2>/dev/null", shell=True, capture_output=True, text=True)
certs = re.findall(r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----", r.stdout, re.S); open("/tmp/leaf.pem", "w").write(certs[0])
t = sp.run("openssl x509 -in /tmp/leaf.pem -noout -text | grep -i 'CA Issuers'", shell=True, capture_output=True, text=True).stdout
m = re.search(r"CA Issuers - URI:(\S+)", t); open("/tmp/iss.der", "wb").write(get(m.group(1)))
sp.run("openssl x509 -inform DER -in /tmp/iss.der -out /tmp/iss.pem; cat /etc/ssl/certs/ca-certificates.crt /tmp/iss.pem > /tmp/bundle.pem", shell=True)
def cu(u, n=90): return sp.run(["curl", "-sS", "--compressed", "-m", str(n), "--cacert", "/tmp/bundle.pem", "-A", "Mozilla/5.0", u], capture_output=True, text=True).stdout
import json, re
base = "https://stats.agriculture.gouv.fr/cartostat/"
H = "&prodhash=285aa024"
li = json.loads(cu(base + "GC_listIndics.php?lang=fr&obs=main" + H))["content"]["indics"]
seen = set()
for i in li:
    k = (i.get("c_url_data"), i.get("c_urllib_data"))
    if k not in seen: seen.add(k); p("DATA-URL", i["c_id_dataset"], k)
k = [i for i in li if i["c_id_indicateur"] == "nbexpl20"][0]
p("nbexpl20", json.dumps({a: b for a, b in k.items() if a not in ("c_desc_indicateur",)}, ensure_ascii=False)[:2500])
c = cu(base + "js/libs/gco5/gc_core.js")
for pat in ("getServerRequestVars", "generateUrl:function", "getIndicVars"):
    for mm in list(re.finditer(pat, c))[:3]:
        p("--", pat, c[max(0, mm.start() - 100):mm.start() + 900].replace("\n", " "))
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
