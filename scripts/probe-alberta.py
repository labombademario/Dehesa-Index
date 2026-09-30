#!/usr/bin/env python3
import re, urllib.request, subprocess, json
from pathlib import Path
OUT = Path("data/probe-alberta"); OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Dehesa-Index-data-bot/1.0"}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90).read()
for name, url in [("crop", "https://open.alberta.ca/publications/3479492"), ("livestock", "https://open.alberta.ca/publications/3479685")]:
    try:
        html = get(url).decode("utf-8", "ignore")
        (OUT / (name + "-listing.html")).write_text(html[:200000])
        links = re.findall(r'href="([^"]+\.pdf[^"]*)"', html)
        links = list(dict.fromkeys(links))
        (OUT / (name + "-links.txt")).write_text("\n".join(links[:60]))
        print(name, len(links), "pdf links")
        if links:
            u = links[0]
            if u.startswith("/"): u = "https://open.alberta.ca" + u
            pdf = OUT / (name + "-latest.pdf"); pdf.write_bytes(get(u))
            subprocess.run(["pdftotext", "-layout", str(pdf), str(OUT / (name + "-latest.txt"))], check=False)
            pdf.unlink()
            print(name, "latest", u)
    except Exception as e:
        (OUT / (name + "-error.txt")).write_text(str(e)); print(name, "FAIL", e)
