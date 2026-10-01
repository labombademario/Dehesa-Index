import urllib.request, json, os
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/eu-trade.txt","w").write("\n".join(out))
def get(u, to=120):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Dehesa-Index-data-bot/1.0"}),timeout=to); return r.status, r.read()
    except Exception as e: return "ERR", repr(e)[:300].encode()
for u in ("https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409?format=JSON&lang=EN&reporter=ES&partner=US&product=1001&flow=2&indicators=VALUE_IN_EUROS&freq=A&time=2024",
          "https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/dataflow/ESTAT/DS-045409/1.0?detail=full",
          "https://ec.europa.eu/eurostat/api/comext/dissemination/sdmx/2.1/data/DS-045409/A.ES.US.1001.2.VALUE_IN_EUROS?startPeriod=2023&format=JSON",
          "https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-059341?format=JSON&lang=EN&reporter=ES&partner=US&product=10&flow=2&indicators=VALUE_IN_EUROS&freq=A&time=2024"):
    s,b=get(u); p("URL",u[:170],s,len(b)); p(b[:1800].decode("utf-8","ignore"))
