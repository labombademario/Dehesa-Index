import sys, re, os
sys.path.insert(0, "scripts")
from lib_agreste import *
sys.path.insert(0, "scripts")
import importlib.util
spec = importlib.util.spec_from_file_location("fi", "scripts/update-fr-infosrapides.py"); fi = importlib.util.module_from_spec(spec); spec.loader.exec_module(fi)
os.makedirs("probe/files", exist_ok=True)
ids = ["Dos2602", "Dos2601", "Dos2502", "TERUTI-SeriesLongues", "Teruti-SeriesLongues", "TERUTI", "Teruti", "SeriesLonguesTeruti", "TERUTI-SL", "IPAMPA", "FDS_IPAMPA", "IPAMPA-Regional", "VINCONJ", "VinConj", "Vinconj", "VINCONJ-SeriesLongues", "Pri2606", "IPAMPA-SeriesLongues", "ipampa", "TERUTISL", "TerutiSL", "Teruti-SL"]
for i in ids:
    r = fi.probe(i, tries=2)
    if r[0] == "yes":
        print("YES", i, [urllib.parse.unquote(u).split("/")[-1] for u in r[1]], clean_html(r[2])[:120])
        for u in r[1]:
            n = urllib.parse.unquote(u).split("/")[-1]
            if re.search(r"\.(xlsx|xls|zip|csv)$", n):
                try:
                    b = fetch(quote_url(u), "bin", tries=3, wait=15, log=lambda *a: None)
                    if len(b) < 6_000_000: open("probe/files/%s__%s" % (i, n.replace(" ", "_")), "wb").write(b)
                    else: print("   big", n, len(b))
                except Exception as e: print("   ERR", n, str(e)[:80])
    else:
        print(r[0], i)
