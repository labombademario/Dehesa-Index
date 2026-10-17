import urllib.request, re, os, io, zipfile
H={"User-Agent":"Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)"}
OUT="probe/usda-out2"; os.makedirs(OUT,exist_ok=True)
rep=[]
def get(u,t=120):
    return urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=t).read()
def tryget(name,u):
    try:
        b=get(u); open(OUT+"/"+name,"wb").write(b); rep.append("OK %s %d %s"%(name,len(b),u)); return b
    except Exception as e: rep.append("NO %s %s %r"%(name,u,str(e)[:80])); return None
def head(name,n=40,cut=1500):
    p=OUT+"/"+name
    if not os.path.exists(p): return
    t=open(p,"rb").read().decode("utf-8-sig","replace").splitlines()
    open(OUT+"/"+name+".head","w").write("lines=%d\n"%len(t)+"\n".join(l[:cut] for l in t[:n]))
b=tryget("hist.html","https://www.usda.gov/oce/commodity-markets/wasde/historical-wasde-report-data")
if b:
    t=b.decode("utf-8","replace")
    links=sorted(set(re.findall(r'href="([^"]+\.(?:csv|zip|xlsx?)[^"]*)"',t,re.I)))
    open(OUT+"/hist.links.txt","w").write("\n".join(links)); rep.append("hist links %d"%len(links))
    for l in links:
        if l.endswith(".csv") and ("2026-09" in l or "2026-10" in l or "2026-08" in l):
            u=l if l.startswith("http") else "https://www.usda.gov"+l
            n=os.path.basename(l); tryget(n,u); head(n,60)
# ERS
for n,u in [("outputfc.csv","https://www.ers.usda.gov/media/6497/output-forecast-csv-file.csv"),("inputdata.csv","https://www.ers.usda.gov/media/6498/input-data-csv-file.csv")]:
    tryget(n,u); head(n,60)
z=tryget("lm.zip","https://www.ers.usda.gov/media/5539/livestock-domestic-data-machine-readable-files.zip")
if z:
    zf=zipfile.ZipFile(io.BytesIO(z)); rep.append("lm.zip: "+"; ".join("%s=%d"%(i.filename,i.file_size) for i in zf.infolist()))
    for i in zf.infolist():
        if i.filename.lower().endswith(".csv"):
            d=zf.read(i).decode("utf-8-sig","replace").splitlines()
            open(OUT+"/lm_"+os.path.basename(i.filename)+".head","w").write("lines=%d\n"%len(d)+"\n".join(l[:600] for l in d[:25]))
        elif i.filename.lower().endswith((".txt",".md",".pdf")) and i.file_size<20000:
            open(OUT+"/lm_"+os.path.basename(i.filename),"wb").write(zf.read(i))
# ERS dairy page
b=tryget("dairy.html","https://www.ers.usda.gov/data-products/dairy-data")
if b:
    t=b.decode("utf-8","replace"); l=sorted(set(re.findall(r'href="([^"]+\.(?:csv|zip|xlsx?)[^"]*)"',t,re.I)))
    open(OUT+"/dairy.links.txt","w").write("\n".join(l))
# ESMIS
for code,key in [("cafo","fo"),("cagc","gc")]:
    pg=open("probe/usda-out/esmis-%s.html"%key,"rb").read().decode("utf-8","replace") if os.path.exists("probe/usda-out/esmis-%s.html"%key) else ""
    txts=re.findall(r'href="([^"]+%s\d{4}\.txt)"'%code,pg)
    rep.append(code+" txts "+",".join(txts))
    if txts:
        u=txts[-1]; u=u if u.startswith("http") else "https://esmis.nal.usda.gov"+u
        tryget(code+"-latest.txt",u); head(code+"-latest.txt",140,200)
        u=txts[0]; u=u if u.startswith("http") else "https://esmis.nal.usda.gov"+u
        tryget(code+"-first.txt",u); head(code+"-first.txt",10,200)
# WASDE xml/xls samples
for n,u in [("wasde1026.xml","https://www.usda.gov/oce/commodity/wasde/wasde1026.xml"),("wasde1026.txt","https://www.usda.gov/oce/commodity/wasde/wasde1026.txt")]:
    tryget(n,u); head(n,40,200)
open(OUT+"/report2.txt","w").write("\n".join(rep))
