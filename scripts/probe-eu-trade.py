import urllib.request, json, os, time
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/eu-trade.txt","w").write("\n".join(out))
B="https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409?format=JSON&lang=EN&indicators=VALUE_IN_EUROS&"
def get(q, to=150):
    t=time.time()
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+q,headers={"User-Agent":"Dehesa-Index-data-bot/1.0"}),timeout=to); return r.status, r.read(), time.time()-t
    except Exception as e: return "ERR", repr(e)[:400].encode(), time.time()-t
def show(tag,q,full=False):
    s,b,dt=get(q); p("==",tag,q[:150],s,len(b),"%.1fs"%dt)
    if s!="ERR" and s==200:
        j=json.loads(b); p("size",dict(zip(j["id"],j["size"])),"values",len(j["value"]))
        for d in ("partner","product","reporter"):
            lab=j["dimension"][d]["category"]["label"]
            p(" ",d,len(lab),list(lab.items())[:40] if full or d!="product" else list(lab.items())[:30])
    else: p(b[:400])
show("partners ES wheat 2024 exp","reporter=ES&product=1001&flow=2&freq=A&time=2024",True)
show("monthly world","reporter=ES&partner=WORLD&product=10&flow=2&freq=M&sinceTimePeriod=2025-01")
show("multi products","reporter=ES&partner=WORLD&product=01&product=02&product=10&product=31&flow=2&freq=M&sinceTimePeriod=2025-01")
show("all HS2 monthly long","reporter=DK&partner=WORLD&product=10&flow=1&freq=M&sinceTimePeriod=1988-01")
show("DK NL partners total chapter","reporter=NL&product=02&flow=2&freq=A&time=2024")
