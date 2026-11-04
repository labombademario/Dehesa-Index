#!/usr/bin/env python3
"""Sonda 19: como sirve GeoClip (Agreste, RA 2020 por comuna) sus datos."""
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
c = cu(base + "js/libs/gco5/gc_core.js")
for pat in ("GC_coldata.php", "getColdata", "loadColData", "getIndicDataURL", "indicdata"):
    for mm in list(re.finditer(pat, c))[:2]:
        p("--", pat, c[max(0, mm.start() - 700):mm.start() + 500].replace("\n", " "))
j = json.loads(cu(base + "GC_indic.php?indic=nbexpl20&dataset=stru_2020_1&view=map11&lang=fr" + H, 120))
ind = j["content"]["indic"]
p("indic non-meta", {k: str(v)[:150] for k, v in ind.items() if k in ("c_formule", "c_output", "c_default_view", "c_id_datatable", "c_nbdec", "c_vars", "vars", "c_classes")})
p("indic list-like", {k: (type(v).__name__, len(v)) for k, v in ind.items() if isinstance(v, (list, dict))})
p("all keys", sorted(ind.keys()))
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
