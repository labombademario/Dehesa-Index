#!/usr/bin/env python3
"""Sonda 18: como sirve GeoClip (Agreste, RA 2020 por comuna) sus datos."""
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
import json
base = "https://stats.agriculture.gouv.fr/cartostat/"
H = "&prodhash=285aa024"
def struct(o, d=0, k=""):
    pad = "  " * d
    if isinstance(o, dict):
        p(pad + k + " {dict %d}" % len(o))
        if d < 4:
            for a, b in list(o.items())[:14]: struct(b, d + 1, a)
    elif isinstance(o, list):
        p(pad + k + " [list %d] first=%s" % (len(o), json.dumps(o[:6], ensure_ascii=False)[:200]))
    else: p(pad + k + " = " + json.dumps(o, ensure_ascii=False)[:160])
for ind, ds in (("nbexpl20", "stru_2020_1"), ("vaclait20", "elev_2020_2")):
    c = cu(base + "GC_indic.php?indic=%s&dataset=%s&view=map11&lang=fr%s" % (ind, ds, H), 120)
    j = json.loads(c); p("=====", ind, len(c))
    cc = j["content"]
    struct(cc["nivgeo"], 0, "nivgeo"); struct(cc["distribution"], 0, "distribution")
    p("indic keys", sorted(cc["indic"].keys()))
    p("footer", json.dumps(j.get("footer"), ensure_ascii=False)[:600])
    open("data/probe-fr-%s.json" % ind, "w").write(c)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
