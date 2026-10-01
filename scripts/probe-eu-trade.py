import urllib.request, json, os, time
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/eu-trade.txt","w").write("\n".join(out))
B="https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409?format=JSON&lang=EN&indicators=VALUE_IN_EUROS&"
def get(q):
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+q,headers={"User-Agent":"Dehesa-Index-data-bot/1.0"}),timeout=150); return json.load(r)
    except Exception as e: return repr(e)[:300]
j=get("reporter=ES&product=10&flow=2&freq=A&time=2024")
if isinstance(j,dict):
    lab=j["dimension"]["partner"]["category"]["label"]
    p("NON2",[(k,v) for k,v in lab.items() if len(k)!=2])
    idx=j["dimension"]["partner"]["category"]["index"]
    vals=j["value"]; inv={v:k for k,v in idx.items()}
    p("VALS_NON2",[(inv[int(k)],v) for k,v in vals.items() if len(inv[int(k)])!=2])
else: p("ERR",j)
for c in ("EU27_2020","EXT_EU27_2020","EU27_2020_EXTRA","EXTRA_EU27_2020","EU27_2020_INTRA","INT_EU27_2020"):
    j=get("reporter=ES&partner=%s&product=10&flow=2&freq=A&time=2024"%c); p(c, "OK %s"%list(j["value"].values()) if isinstance(j,dict) else j)
