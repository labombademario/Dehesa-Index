#!/usr/bin/env python3
"""Sonda 15: como sirve GeoClip (Agreste, RA 2020 por comuna) sus datos."""
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
ini = json.loads(cu(base + "GC_init.php?lang=fr&obs=main"))["content"]
p("views", json.dumps(ini.get("views"))[:1500]); p("extents", json.dumps(ini.get("extents"))[:800])
p("datasets", json.dumps(ini.get("datasets"))[:1500]); p("legals", json.dumps(ini.get("legals"))[:800]); p("options", json.dumps(ini.get("options"))[:600])
li = json.loads(cu(base + "GC_listIndics.php?lang=fr&obs=main" + H))["content"]["indics"]
p("n indics", len(li)); 
for i in li[:400]: p("  ", i["c_id_dataset"], i["c_id_indicateur"], i["c_id_typind"], i.get("c_unite"), "|", i["c_lib_indicateur_court"][:70])
k = li[0]; p("keys", sorted(k.keys())); p("licence-ish", {a: str(b)[:200] for a, b in k.items() if "lic" in a.lower() or "limut" in a.lower() or "source" in a.lower() or "mention" in a.lower()})
def show(name, u, n=1200):
    c = cu(base + u, 60); p("==", name, u[:150], len(c)); p(c[:n].replace("\n", " "))
for ng in ("com2020", "epci2020", "dep2020"):
    show("refdata " + ng, "GC_refdata.php?nivgeo=" + ng + "&lang=fr" + H, 600)
v = (ini.get("views") or [{}])[0]; vid = v.get("c_id_view") or ""
for u in ("GC_refdata.php?nivgeo=com2020&view=" + vid + "&lang=fr" + H, "GC_indic.php?indic=stru_2020_1.nbexpl20&nivgeo=com2020&lang=fr" + H, "GC_indic.php?indics=stru_2020_1.nbexpl20&nivgeo=com2020&view=" + vid + "&lang=fr" + H, "GC_coldata.php?indic=stru_2020_1.nbexpl20&nivgeo=com2020&lang=fr" + H):
    show("try", u, 1000)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
