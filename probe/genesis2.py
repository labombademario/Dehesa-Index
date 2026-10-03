import os, json, io, zipfile, urllib.request, urllib.parse
exec(open("probe/genesis.py").read().split("for n in [")[0])
def tf2(tag, name, **kw):
    c, r = post("data/tablefile", accept="*/*", name=name, format="ffcsv", language="de", compress="false", **kw)
    print("## tablefile", name, kw, c, len(r))
    if r[:2] == b"PK":
        z = zipfile.ZipFile(io.BytesIO(r)); r = z.read(z.namelist()[0])
    t = r.decode("utf-8", "replace"); print("lines", len(t.splitlines()))
    if len(t.splitlines()) < 3: print(t[:400])
    os.makedirs("probe-out", exist_ok=True); open("probe-out/%s.csv" % tag, "w", encoding="utf-8").write(t)
tf2("41141-0110-SH", "41141-0110", startyear="2010", regionalvariable="DLAND", regionalkey="01")
tf2("41141-0110-NI", "41141-0110", startyear="2010", regionalvariable="DLAND", regionalkey="03", classifyingvariable1="BNZAT4", classifyingkey1="BNZAT-2")
