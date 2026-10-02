import os, json, urllib.request, urllib.parse, zipfile, io
T = os.environ.get("GENESIS_TOKEN", "").strip()
print("token len", len(T))
B = "https://genesis.destatis.de/genesisWS/rest/2020/"
def post(path, **data):
    h = {"Content-Type": "application/x-www-form-urlencoded", "username": T, "password": "", "Accept": "application/json", "User-Agent": "DehesaIndex/1.0 (+https://dehesaindex.com)"}
    req = urllib.request.Request(B + path, data=urllib.parse.urlencode(data).encode(), headers=h, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=180); return r.status, r.read()
    except Exception as e:
        return getattr(e, "code", "ERR"), (getattr(e, "read", lambda: b"")() or str(e).encode())
c, r = post("helloworld/logincheck", language="de"); print("logincheck", c, r[:400].decode("utf-8", "replace"))
c, r = post("find/find", term="Erzeugerpreisindex landwirtschaftliche Produkte", category="tables", pagelength="20", language="de")
print("find", c)
try:
    j = json.loads(r); 
    for t in (j.get("Tables") or j.get("List") or [])[:20]: print(" ", t.get("Code"), "|", (t.get("Content") or "")[:100])
    print(str(j.get("Status"))[:200])
except Exception as e: print(r[:400])
def tf(name, **kw):
    c, r = post("data/tablefile", name=name, format="ffcsv", language="de", compress="false", **kw)
    print("tablefile", name, kw, c, len(r))
    txt = r.decode("utf-8", "replace") if isinstance(r, bytes) else str(r)
    print(txt[:1200])
    open("genesis-%s.csv" % name, "w").write(txt)
tf("61211-0003", startyear="1968")
tf("61221-0003", startyear="1968")
tf("61211-0001", startyear="1968")
