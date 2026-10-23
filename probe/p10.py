import urllib.request, re, io
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
out=open('probe/out/p10.txt','w')
def w(s): out.write(s+'\n'); out.flush()
def get(u,t=120): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
def txt(h): t=re.sub(r'(?s)<(script|style).*?</\1>',' ',h); t=re.sub(r'<[^>]+>',' ',t); return re.sub(r'\s+',' ',t)
for u in ('https://www.gov.mb.ca/legal/copyright.html','https://www.gov.mb.ca/legal/disclaimer.html'):
    try: w('## %s'%u); w(txt(get(u).decode('utf-8','replace'))[:3500])
    except Exception as e: w('ERR %s %r'%(u,e))
for u in ('https://www.gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/index.html','https://www.gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/crop-prices.html','https://www.gov.mb.ca/agriculture/markets-and-statistics/price-reports/crops-weekly.html'):
    try:
        h=get(u).decode('utf-8','replace'); w('## %s len=%d'%(u,len(h))); w(' links: '+' | '.join(sorted(set(re.findall(r'href="([^"]*(?:xlsx|csv)[^"]*)"',h)))[:30]))
        w(txt(h)[:600])
    except Exception as e: w('ERR %s %r'%(u,e))
import openpyxl
for n in ('manitoba-markets-crops-prices-weekly.xlsx','manitoba-markets-crops-prices-monthly.xlsx'):
    try:
        wb=openpyxl.load_workbook(io.BytesIO(get('https://gov.mb.ca/agriculture/markets-and-statistics/crop-statistics/pubs/'+n)),read_only=True,data_only=True)
        for ws in wb.worksheets:
            rows=list(ws.iter_rows(values_only=True)); w('%s sheet %s n=%d last=%s'%(n,ws.title,len(rows),rows[-1]))
            c=set(r[3] for r in rows[1:]); 
    except Exception as e: w('ERR %s %r'%(n,e))
