import urllib.request, re, io, csv, sys, zipfile, traceback
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
def get(u,t=120):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t); return r.read()
B='https://www.ers.usda.gov'
PAGES={'fert':'/data-products/fertilizer-use-and-price','dollar':'/data-products/food-dollar-series','exp':'/data-products/food-expenditure-series','bio':'/data-products/us-bioenergy-statistics','prod':'/data-products/agricultural-productivity-in-the-us','intl':'/data-products/international-agricultural-productivity','excr':'/data-products/agricultural-exchange-rate-data-set','mult':'/data-products/agricultural-trade-multipliers','macro':'/data-products/international-macroeconomic-data-set','sec':'/data-products/international-food-security'}
out=open('probe/out/files.txt','w')
def w(s): out.write(s+'\n'); out.flush()
for k,p in PAGES.items():
    try: h=get(B+p).decode('utf-8','replace')
    except Exception as e: w('## %s PAGE ERR %r'%(k,e)); continue
    links=sorted(set(re.findall(r'href="(/media/\d+/[^"?]+\.(?:csv|xlsx?|zip))',h)))
    w('## %s : %d files'%(k,len(links)))
    for l in links:
        name=l.split('/')[-1]
        try: b=get(B+l)
        except Exception as e: w('  %s ERR %r'%(name[:90],e)); continue
        w('  %s  bytes=%d'%(name[:110],len(b)))
        if l.endswith('.csv'):
            t=b.decode('utf-8-sig','replace').splitlines()
            w('    rows=%d'%len(t))
            for x in t[:3]+t[-2:]: w('    | '+x[:230])
        elif l.endswith('.xlsx') or l.endswith('.xls'):
            try:
                if l.endswith('.xlsx'):
                    import openpyxl; wb=openpyxl.load_workbook(io.BytesIO(b),read_only=True,data_only=True)
                    for ws in wb.worksheets[:12]: w('    sheet %s dims=%s'%(ws.title,ws.dimensions))
                else:
                    import xlrd; wb=xlrd.open_workbook(file_contents=b)
                    for s in wb.sheets()[:14]: w('    sheet %s %dx%d | %s'%(s.name,s.nrows,s.ncols,' ; '.join(str(c) for c in s.row_values(0)[:6])[:150]))
            except Exception as e: w('    XL ERR %r'%e)
# CDL
try:
    for fips,yr in (('19',2025),('19',2024),('00',2025)):
        r=get('https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLStat?year=%d&fips=%s&format=csv'%(yr,fips)).decode()
        u=re.search(r'<returnURL>([^<]+)',r)
        w('## CDL %s %s -> %s'%(fips,yr,u.group(1) if u else r[:200]))
        if u:
            c=get(u.group(1)).decode('utf-8','replace').splitlines(); w('   rows=%d'%len(c))
            for x in c[:6]: w('   | '+x[:200])
except Exception as e: w('CDL ERR %r'%e)
out.close()
