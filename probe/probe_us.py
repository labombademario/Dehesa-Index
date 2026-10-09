import urllib.request, urllib.parse, json, re
LOG=[]
def log(*a):
    LOG.append(' '.join(str(x) for x in a)); open('probe/probe-log.txt','w').write('\n'.join(LOG)+'\n')
def get(u, t=60):
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 (dehesaindex probe)'}),timeout=t)
        return r.status, r.read()
    except Exception as e: return 'ERR '+repr(e)[:120], b''
def show(u,n=600):
    s,b=get(u); log('GET',u[:140],s,len(b)); 
    if b: log('   ',re.sub(r'\s+',' ',b[:n].decode('utf8','replace')))
    return b
# SNOTEL: mediana y semimensual
A='https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/'
show(A+'data?stationTriplets=713:CO:SNTL&elements=WTEQ&duration=SEMIMONTHLY&beginDate=2025-01-01&endDate=2025-05-01&centralTendencyType=MEDIAN',900)
show(A+'data?stationTriplets=713:CO:SNTL&elements=WTEQ&duration=SEMIMONTHLY&beginDate=2025-01-01&endDate=2025-05-01',500)
show(A+'data?stationTriplets=713:CO:SNTL&elements=WTEQ&duration=MONTHLY&beginDate=2025-01-01&endDate=2025-05-01&centralTendencyType=MEDIAN',900)
b=show(A+'stations?stationTriplets=*:*:SNTL&activeOnly=true',200)
try:
    st=json.loads(b); import collections; log('SNOTEL activas',len(st),collections.Counter(s['stateCode'] for s in st).most_common(20))
except Exception as e: log('parse',e)
show(A+'reference-data?referenceLists=elements',300)
show(A+'forecasts?stationTriplets=713:CO:SNTL&elementCodes=SRVO&forecastPeriods=APR-JUL',500)
# percentiles/ index: PREC cumulative water-year, median
show(A+'data?stationTriplets=713:CO:SNTL&elements=PREC&duration=MONTHLY&beginDate=2025-01-01&endDate=2025-05-01&centralTendencyType=MEDIAN',600)
# KC Fed terms
b=show('https://www.kansascityfed.org/terms-of-use/',200)
t=re.sub(r'<script.*?</script>|<style.*?</style>','',b.decode('utf8','replace'),flags=re.S); t=re.sub(r'<[^>]+>',' ',t); t=re.sub(r'\s+',' ',t)
for m in re.finditer(r'.{300}(?:reproduc|copyright|permission|attribution).{400}',t,re.I): log('  TERMS',m.group(0)); break
b=show('https://www.kansascityfed.org/about-us/website-terms-and-conditions/',200)
log('done1')
