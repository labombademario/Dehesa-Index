import urllib.request, json, os, re
os.makedirs("data/probe", exist_ok=True)
out=[]
def p(*a):
    out.append(" ".join(str(x) for x in a)); open("data/probe/eu-trade.txt","w").write("\n".join(out))
B="https://ec.europa.eu/eurostat/api/dissemination/"
def get(u, n=3000, to=90):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Dehesa-Index-data-bot/1.0"}),timeout=to)
        return r.status, r.read()
    except Exception as e: return "ERR", repr(e)[:300].encode()
s,b=get(B+"catalogue/toc/txt?lang=en", to=120)
if s==200:
    for l in b.decode("utf-8","ignore").splitlines():
        if re.search(r"ext_|DS-0|comext|international trade|EU trade",l,re.I): p("TOC",l[:200])
else: p("TOC",s,b[:200])
for u in ("sdmx/2.1/dataflow/ESTAT/DS-059341/latest?detail=full&references=descendants",
          "sdmx/2.1/dataflow/ESTAT/DS-045409/latest?detail=allcompletestubs",
          "statistics/1.0/data/DS-059341?format=JSON&lang=EN&reporter=ES&partner=US&product=10&flow=2&indicators=VALUE_IN_EUROS&freq=A",
          "statistics/1.0/data/DS-045409?format=JSON&lang=EN&reporter=ES&partner=US&product=10&flow=2&indicators=VALUE_IN_EUROS&freq=A",
          "statistics/1.0/data/ext_st_eu27_2020sitc?format=JSON&lang=EN&geo=EU27_2020&partner=US&sitc06=0&indic_et=MIO_EXP_VAL&freq=M&sinceTimePeriod=2025-01"):
    s,b=get(B+u)
    p("URL",u,s,len(b)); p(b[:1500].decode("utf-8","ignore"))
