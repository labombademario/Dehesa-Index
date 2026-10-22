import urllib.request
out=open('probe/out/sco2.txt','w')
for ua in ['Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)','Mozilla/5.0 DehesaIndex']:
  for u in ['https://www.gov.scot/publications/results-from-the-scottish-agricultural-census-june-2026/documents/','https://www.gov.scot/collections/scottish-cereal-harvest-estimates/']:
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':ua}),timeout=60); b=r.read(); out.write('%s %s %s %d %s\n'%(ua[:10],u[-50:],r.status,len(b),b[:200]))
    except Exception as e: out.write('%s %s ERR %r\n'%(ua[:10],u[-50:],e))
