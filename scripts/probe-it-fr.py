#!/usr/bin/env python3
"""Sonda 14: como sirve GeoClip (Agreste, RA 2020 por comuna) sus datos."""
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
def show(name, u, n=1500):
    c = cu(base + u, 60); p("==", name, u, len(c)); p(c[:n].replace("\n", " "))
    return c
idx = cu(base + "index.php"); p("== index.php"); p(idx[:6000].replace("\n", " "))
ini = show("init", "GC_init.php?lang=fr&obs=main", 4000)
show("listIndics", "GC_listIndics.php?lang=fr&obs=main&prodhash=285aa024", 3000)
show("listIndics2", "GC_listIndics.php?lang=fr&prodhash=285aa024&dataset=stru_2020_1", 3000)
show("refdata COM", "GC_refdata.php?nivgeo=COM&lang=fr&prodhash=285aa024", 800)
show("refdata EPCI", "GC_refdata.php?nivgeo=EPCI&lang=fr&prodhash=285aa024", 800)
show("refdata DEP", "GC_refdata.php?nivgeo=DEP&lang=fr&prodhash=285aa024", 800)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
