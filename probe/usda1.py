import urllib.request, re, json, sys, os, io, zipfile, time
H={"User-Agent":"Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
OUT="probe/usda-out"; os.makedirs(OUT,exist_ok=True)
def get(u,t=90):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=t); return r.status,r.read()
def save(n,b): open(OUT+"/"+n,"wb").write(b)
pages={
 "wasde-node":"https://www.usda.gov/node/42884",
 "wasde-page":"https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report",
 "ers-sap":"https://www.ers.usda.gov/data-products/season-average-price-forecasts",
 "ers-sap-doc":"https://ers.usda.gov/data-products/season-average-price-forecasts/documentation",
 "ers-lm":"https://www.ers.usda.gov/data-products/livestock-and-meat-domestic-data/livestock-and-meat-domestic-data",
 "ers-lm2":"https://www.ers.usda.gov/data-products/livestock-and-meat-domestic-data",
 "esmis-fo":"https://esmis.nal.usda.gov/publication/fats-and-oils-oilseed-crushings-production-consumption-and-stocks",
 "esmis-gc":"https://esmis.nal.usda.gov/publication/grain-crushings-and-co-products-production",
 "esmis-fm":"https://esmis.nal.usda.gov/publication/flour-milling-products",
 "ams-2991":"https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2991",
 "ams-2992":"https://mpr.datamart.ams.usda.gov/services/v1.1/reports/2992",
 "ams-2992b":"https://marsapi.ams.usda.gov/services/v1.2/reports/2992",
}
rep=[]
for k,u in pages.items():
    try:
        s,b=get(u); save(k+".html",b); t=b.decode("utf-8","replace")
        links=sorted(set(re.findall(r'href="([^"]+\.(?:csv|zip|xlsx?|txt|pdf)[^"]*)"',t,re.I)))
        rep.append("%s %s %d bytes, %d file links"%(k,s,len(b),len(links)))
        save(k+".links.txt","\n".join(links).encode())
    except Exception as e: rep.append("%s ERR %r"%(k,e))
# direct guesses WASDE
for y,m in [(2026,10),(2026,9),(2026,8)]:
    for suf in ["","-V2"]:
        for base in ["https://www.usda.gov/sites/default/files/documents/oce-wasde-report-data-%d-%02d%s.csv"%(y,m,suf),"https://www.usda.gov/oce/commodity/wasde/oce-wasde-report-data-%d-%02d%s.csv"%(y,m,suf)]:
            try:
                s,b=get(base); n="wasde-%d-%02d%s.csv"%(y,m,suf); save(n,b); rep.append("OK %s %d bytes"%(base,len(b)))
            except Exception as e: rep.append("NO %s %r"%(base,str(e)[:60]))
open(OUT+"/report1.txt","w").write("\n".join(rep))
