import urllib.request, urllib.parse, os, json, re, collections
H={"User-Agent":"Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)","Accept":"*/*"}
OUT="probe/usda-out5"; os.makedirs(OUT,exist_ok=True); rep=[]
def get(u,rng=None,t=90):
    h=dict(H); 
    if rng: h["Range"]=rng
    r=urllib.request.urlopen(urllib.request.Request(u,headers=h),timeout=t); return r.status,r.read()
B="https://mpr.datamart.ams.usda.gov/services/v1.1/reports/3355/"
for q in ["","?q=report_year=2026","?q=report_year=2025","?q=report_year=2012","?q=report_year=2012:2014","?q=report_month=Aug"]:
    try:
        s,b=get(B+urllib.parse.quote("Final Class Prices by Order")+q); d=json.loads(b)["results"]
        yrs=collections.Counter(x["report_year"] for x in d)
        rep.append("3355 %s rows=%d years=%s"%(q,len(d),dict(sorted(yrs.items()))))
        if q=="?q=report_year=2026":
            open(OUT+"/3355-2026.json","w").write(json.dumps(d))
            rep.append("areas "+"; ".join(sorted(set(x["MarketingArea"]+"|"+str(x["order_no"]) for x in d))))
    except Exception as e: rep.append("3355 %s ERR %r"%(q,str(e)[:100]))
# WASDE xml availability
for y in (2022,2023,2024,2025,2026):
    for m in range(1,13):
        if y==2026 and m>10: break
        u="https://www.usda.gov/oce/commodity/wasde/wasde%02d%02d.xml"%(m,y%100)
        try: s,b=get(u,"bytes=0-120"); rep.append("WX %02d%02d %s %s"%(m,y%100,s,b[:60].decode('utf8','replace').replace('\n',' ')))
        except Exception as e: rep.append("WX %02d%02d NO %s"%(m,y%100,str(e)[:50]))
# ESMIS pagination
for key,slug in [("fo","fats-and-oils-oilseed-crushings-production-consumption-and-stocks"),("gc","grain-crushings-and-co-products-production")]:
    codes=[]
    for p in range(0,12):
        try:
            s,b=get("https://esmis.nal.usda.gov/publication/%s?page=%d"%(slug,p)); t=b.decode("utf8","replace")
            L=re.findall(r'release-files/\d+/(ca%s\d{4})\.txt'%("fo" if key=="fo" else "gc"),t); codes.append((p,L))
        except Exception as e: codes.append((p,"ERR "+str(e)[:40]))
    rep.append(key+" pages: "+json.dumps(codes))
open(OUT+"/report5.txt","w").write("\n".join(rep))
