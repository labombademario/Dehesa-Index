import json,re,urllib.request
out=[]
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0'}),timeout=60).read()
api=json.loads(get('https://www.gov.uk/api/content/government/statistics/agricultural-price-indices'))
s=json.dumps(api)
links=sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\\ ]+\.(?:ods|csv|xlsx)',s)))
out.append('links: '+str(links)); out.append('updated: '+str(api.get('public_updated_at')))
for l in links:
    if '2020' in l or 'index' in l.lower() or 'api' in l.lower():
        raw=get(l); open('/tmp/x.'+l.rsplit('.',1)[1],'wb').write(raw); out.append('%s bytes %d'%(l,len(raw)))
import glob,subprocess
subprocess.run(['pip','install','-q','--break-system-packages','odfpy','pandas'])
import pandas as pd
for f in glob.glob('/tmp/x.*'):
    if f.endswith('.csv'):
        out.append('== CSV '+f); out.append(open(f,errors='replace').read()[:2500])
    elif f.endswith('.ods'):
        xl=pd.read_excel(f,engine='odf',sheet_name=None,header=None)
        for n,df in xl.items():
            out.append('== sheet %s %s'%(n,df.shape)); out.append(df.head(8).iloc[:,:12].to_string(max_colwidth=28)[:1500]); out.append(df.tail(3).iloc[:,:12].to_string(max_colwidth=28)[:600])
open('scripts/.probe-output.txt','w').write('\n'.join(out)+'\n')
