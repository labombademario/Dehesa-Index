import urllib.request, re, io, json
import openpyxl
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
out=open('probe/out/p9.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def get(u,t=120): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
ON={'cattle':'https://data.ontario.ca/dataset/5fe854bf-3c17-4e60-b2a3-f1dba6732663/resource/b4611924-83c4-4a31-b4db-82b95cdabbda/download/weeklycattleprice_en.xlsx',
'hog':'https://data.ontario.ca/dataset/1ca3b31c-5adc-4d91-b606-c866b71135c2/resource/4399ff21-1719-4ea9-aca8-4f6537ad2389/download/weeklyswineprice_en.xlsx',
'corn':'https://data.ontario.ca/dataset/a33275b4-5ac4-4347-a39c-62adc2b0d510/resource/73072c55-4db4-4287-b467-c217798acfa7/download/weeklycornprice_en.xlsx',
'soy':'https://data.ontario.ca/dataset/f25e730a-0b31-44e5-8f86-78205be465a1/resource/65ca45f1-f8f7-4a7c-90d1-d696251d4466/download/weeklysoybeanprice_en.xlsx',
'wwheat':'https://data.ontario.ca/dataset/e083d20d-8a6d-4864-8c88-21a8fd03949c/resource/062af18a-4e86-49f2-ba5f-4e360eac883e/download/weeklywwheatprice_en.xlsx'}
for k,u in ON.items():
    try:
        b=get(u); wb=openpyxl.load_workbook(io.BytesIO(b),data_only=True); w('## ON %s %d bytes'%(k,len(b)))
        for ws in wb.worksheets:
            rows=list(ws.iter_rows(values_only=True)); w(' sheet %s dims=%s n=%d'%(ws.title,ws.dimensions,len(rows)))
            for r in rows[:6]: w('   '+str(r)[:300])
            for r in rows[-3:]: w('   ..'+str(r)[:300])
    except Exception as e: w('## ON %s ERR %r'%(k,e))
# Manitoba page
for u in ('https://www.gov.mb.ca/agriculture/markets-and-statistics/price-reports/index.html','https://www.gov.mb.ca/agriculture/markets-and-statistics/price-reports/crops-prices.html'):
    try:
        h=get(u).decode('utf-8','replace'); w('## MB page %s len=%d'%(u,len(h)))
        w(' links: '+' | '.join(sorted(set(re.findall(r'href="([^"]*(?:xlsx|csv|pdf)[^"]*)"',h)))[:40]))
        for m in re.finditer(r'(?i)(licen[cs]e|copyright|open data|terms of use)',h): w(' ctx: '+re.sub(r'\s+',' ',h[max(0,m.start()-100):m.end()+160])); 
    except Exception as e: w('## MB page ERR %s %r'%(u,e))
for u in ('https://www.gov.mb.ca/copyright.html','https://www.gov.mb.ca/openmb/licence.html'):
    try:
        h=get(u).decode('utf-8','replace'); t=re.sub(r'<[^>]+>',' ',h); t=re.sub(r'\s+',' ',t); w('## MB lic %s'%u); w(t[:1800])
    except Exception as e: w('## MB lic ERR %s %r'%(u,e))
