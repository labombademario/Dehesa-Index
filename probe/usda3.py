import urllib.request, re, os, json
H={"User-Agent":"Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
OUT="probe/usda-out3"; os.makedirs(OUT,exist_ok=True); rep=[]
def tryget(name,u,t=120):
    try:
        b=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=t).read(); open(OUT+"/"+name,"wb").write(b); rep.append("OK %s %d %s"%(name,len(b),u)); return b
    except Exception as e: rep.append("NO %s %s %r"%(name,u,str(e)[:80])); return None
b=tryget("datamart-reports.json","https://mpr.datamart.ams.usda.gov/services/v1.1/reports")
if b:
    try:
        d=json.loads(b); L=d if isinstance(d,list) else d.get("results",d)
        hits=[x for x in L if re.search(r"class|component|federal|fmmo|milk price|nonfat|butterfat|dairy",json.dumps(x),re.I)]
        open(OUT+"/dairy-hits.json","w").write(json.dumps(hits,indent=0)[:60000]); rep.append("reports %d hits %d"%(len(L),len(hits)))
    except Exception as e: rep.append("parse "+repr(e))
for n,u in [("ams-class.html","https://www.ams.usda.gov/resources/class-and-component-prices"),
            ("ams-fmmo-prices.html","https://www.ams.usda.gov/rules-regulations/moa/dairy/class-prices"),
            ("ams-prices.html","https://www.ams.usda.gov/market-news/dairy-market-news"),
            ("fred-class3.csv","https://fred.stlouisfed.org/graph/fredgraph.csv?id=WPU01790201"),
            ("fmmo-prices-page.html","https://www.fmmone.com/"),]:
    tryget(n,u)
open(OUT+"/report3.txt","w").write("\n".join(rep))
