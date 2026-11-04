#!/usr/bin/env python3
"""Sonda 13: como sirve GeoClip (Agreste, RA 2020 por comuna) sus datos."""
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
base = "https://stats.agriculture.gouv.fr/cartostat/"
for f in ("js/libs/gco5/gc_core.js", "js/libs/gco5/gc_init.js", "js/libs/gco5/modules/gc_data.js"):
    c = cu(base + f); p("== js", f, len(c))
    for mm in re.finditer(r'.{0,90}(?:ajax|\.php|getJSON|fetch\(|"data/|\'data/|/data|indicatorData|\.json|\.csv|\.gz|apiUrl|baseUrl|dataUrl).{0,110}', c):
        p("   ", mm.group(0).replace("\n", " ")[:210])
        if len(OUT) > 400: break
for f in ("data/", "api/", "index.php", "config.json", "data/config.json", "cartostat.php"):
    c = cu(base + f, 30); p("GET", f, len(c), c[:150].replace("\n", " "))
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
