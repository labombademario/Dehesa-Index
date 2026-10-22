import urllib.request, io, openpyxl
B='https://www.gov.scot/binaries/content/documents/govscot/publications/statistics/2025/12/cereal-and-oilseed-rape-harvest-final-estimates---2025/documents/first-published-11-december-2025/'
U={'ts':B+'timeseries-for-cereal-and-oilseed-rape-harvest-final-estimates-1991-to-2025/timeseries-for-cereal-and-oilseed-rape-harvest-final-estimates-1991-to-2025/govscot%3Adocument/Cereal%2Band%2BOilseed%2BRape%2BHarvest%2B-%2B2025-26%2B-%2BFinal%2BEstimates%2B-%2BPublication%2B-%2BTables%2B-%2BCereals%2BTimeseries%2B1991-2025.xlsx',
   'coll':'https://www.gov.scot/collections/scottish-cereal-harvest-estimates/'}
out=open('probe/out/sco.txt','w')
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=60).read()
try:
    wb=openpyxl.load_workbook(io.BytesIO(get(U['ts'])),read_only=True,data_only=True)
    for ws in wb.worksheets:
        out.write('=== %s\n'%ws.title)
        for i,r in enumerate(ws.iter_rows(values_only=True)):
            if i>45: break
            out.write(repr(r[:14])+'\n')
except Exception as e: out.write('ERR ts %r\n'%e)
try:
    import re; h=get(U['coll']).decode('utf8','replace'); out.write('\n'.join(sorted(set(re.findall(r'href="(/publications/cereal[^"]+)"',h))))+'\n')
except Exception as e: out.write('ERR coll %r\n'%e)
