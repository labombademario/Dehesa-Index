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
for term in ["Ernte Feldfrüchte Bundesländer", "Ernteerträge Getreide Bundesland", "Kaufwerte landwirtschaftliche Grundstücke", "Pachtpreise landwirtschaftliche", "Pachtentgelte Landwirtschaft", "Viehbestand Bundesland", "Milcherzeugung Bundesland", "Schweinebestand", "Rinderbestand"]:
    find(term)
def cat(sel):
    c, r = post("catalogue/tables", selection=sel, pagelength="100", language="de")
    try:
        j = json.loads(r); print("## catalogue", sel, c)
        for t in (j.get("List") or []): print("  ", t.get("Code"), "|", (t.get("Content") or "").replace("\n", " ")[:110], "|", t.get("Time", ""))
    except Exception as e: print("cat err", r[:200])
for sel in ["41241*", "41242*", "41261*", "61511*", "61521*", "41311*", "41312*", "41141*", "41151*"]: cat(sel)
def tf(name, **kw):
    c, r = post("data/tablefile", accept="*/*", name=name, format="ffcsv", language="de", compress="false", **kw)
    print("## tablefile", name, kw, c, len(r))
    if r[:2] == b"PK": r = zipfile.ZipFile(io.BytesIO(r)).read(zipfile.ZipFile(io.BytesIO(r)).namelist()[0])
    L = r.decode("utf-8", "replace").splitlines(); print("lines", len(L)); print("\n".join(x[:420] for x in L[:4]))
for n in ["41241-0003", "41241-0004", "41241-0006", "61511-0001", "61511-0002", "61521-0001"]:
    tf(n, startyear="2015")
