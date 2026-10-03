import os, json, urllib.request, urllib.parse, zipfile, io
T = os.environ.get("GENESIS_TOKEN", "").strip()
B = "https://genesis.destatis.de/genesisWS/rest/2020/"
def post(path, accept="application/json", **data):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": T, "password": "", "Accept": accept, "User-Agent": "DehesaIndex/1.0"}
    req = urllib.request.Request(B + path, data=urllib.parse.urlencode(data).encode(), headers=h, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=180); return r.status, r.read()
    except Exception as e:
        return getattr(e, "code", "ERR"), (getattr(e, "read", lambda: b"")() or str(e).encode())
def find(term, cat="tables", n="25"):
    c, r = post("find/find", term=term, category=cat, pagelength=n, language="de")
    try:
        j = json.loads(r); print("## find", term, c)
        for t in (j.get("Tables") or []): print("  ", t.get("Code"), "|", (t.get("Content") or "").replace("\n", " ")[:110], "|", t.get("Time", ""))
    except Exception as e: print("find err", r[:200])
def tf(name, **kw):
    c, r = post("data/tablefile", accept="*/*", name=name, format="ffcsv", language="de", compress="false", **kw)
    print("## tablefile", name, kw, c, len(r))
    if r[:2] == b"PK":
        z = zipfile.ZipFile(io.BytesIO(r)); r = z.read(z.namelist()[0])
    t = r.decode("utf-8", "replace"); L = t.splitlines(); print("lines", len(L))
    os.makedirs("probe-out", exist_ok=True); open("probe-out/%s.csv" % name, "w", encoding="utf-8").write(t)
    if len(L) < 3: print(t[:300])
for n in ["41241-0010", "41241-0005", "41241-0001", "41241-0002", "41241-0003", "61521-0001", "61521-0010", "61521-0100", "41141-0010", "41141-0110", "41141-0126"]:
    tf(n, startyear="1950")
