#!/usr/bin/env python3
"""Sonda 2: dataflows de ISTAT (censo agrario) y GeoClip (RA 2020 por comuna)."""
import json, re, subprocess, sys, time, urllib.request
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
OUT = []
def p(*a):
    s = " ".join(str(x) for x in a); OUT.append(s); print(s, flush=True)
def get(u, accept="*/*", t=120, tries=2):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=dict(UA, Accept=accept)), timeout=t) as r: return r.read()
        except Exception as e:
            p("  error", k, accept[:40], u[-90:], str(e)[:100]); time.sleep(6)
    return b""
B = "https://esploradati.istat.it/SDMXWS/rest/"
p("== ISTAT dataflows")
b = b""
for u in ("dataflow/IT1?detail=allstubs", "dataflow/all/all/latest?detail=allstubs"):
    b = get(B + u, "application/xml", t=280, tries=2)
    if b: p("ok:", u, len(b)); break
txt = b.decode("utf-8", "replace")
ids = re.findall(r'<structure:Dataflow[^>]*id="([^"]+)"[^>]*>(.*?)</structure:Dataflow>', txt, re.S)
p("dataflows:", len(ids))
for i, body in ids:
    names = re.findall(r'<common:Name xml:lang="(\w+)">([^<]*)', body)
    nm = " | ".join(x[1] for x in names if x[0] in ("it", "en"))
    if re.search(r"agricol|censimento|aziend|colt|allev|bestiame", nm, re.I): p("  ", i, nm[:160])
p("== GeoClip")
b = get("https://agreste.agriculture.gouv.fr/agreste-web/download/publication/publie/GeoclipAir2020/Liste-des-indicateurs-cartographiques-du-RA2020.xlsx")
p("xlsx bytes", len(b))
if b:
    open("/tmp/ind.xlsx", "wb").write(b)
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "--break-system-packages", "openpyxl"], check=False)
    try:
        import openpyxl
        wb = openpyxl.load_workbook("/tmp/ind.xlsx", read_only=True)
        for ws in wb.worksheets:
            p("hoja", ws.title, ws.max_row, ws.max_column)
            for k, row in enumerate(ws.iter_rows(values_only=True)):
                if k < 400: p("  ", " | ".join(str(c)[:70] for c in row if c is not None))
    except Exception as e: p("fallo xlsx", e)
import subprocess as sp
r = sp.run(["curl", "-sS", "-m", "60", "-A", "Mozilla/5.0", "-o", "/tmp/carto.html", "-w", "%{http_code}", "https://stats.agriculture.gouv.fr/cartostat/"], capture_output=True, text=True); p("curl cartostat", r.stdout, r.stderr[:300])
h = open("/tmp/carto.html", "rb").read() if r.returncode == 0 else b""
p("cartostat html bytes", len(h)); t = h.decode("utf-8", "replace"); p(t[:1500].replace("\n", " "))
js = re.findall(r'(?:src|href)="([^"]+\.(?:js|json))"', t); p("scripts", js[:20])
for s in js[:6]:
    u = s if s.startswith("http") else "https://stats.agriculture.gouv.fr" + (s if s.startswith("/") else "/cartostat/" + s)
    c = sp.run(["curl", "-sS", "-m", "60", u], capture_output=True, text=True).stdout; p("  js", u, len(c))
    for m in sorted(set(re.findall(r'["\'](/?[\w./-]*(?:api|data|indicator|serie|download|csv)[\w./?=&-]*)["\']', c)))[:40]: p("      url?", m)
open("data/probe-it-fr-log.txt", "w").write("\n".join(OUT) + "\n")
