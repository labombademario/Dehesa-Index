import json,re,urllib.request,io
out=[]
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Dehesa-Index-data-bot/1.0'}),timeout=60).read()
api=json.loads(get('https://www.gov.uk/api/content/government/statistics/uk-milk-prices-and-composition-of-milk'))
out.append('keys: '+','.join(api.keys()))
s=json.dumps(api)
links=sorted(set(re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\\ ]+\.ods',s)))
out.append('ods links: '+str(links))
for t in ['first_published_at','public_updated_at']:
    out.append(t+': '+str(api.get(t)))
if links:
    raw=get(links[-1]); open('/tmp/m.ods','wb').write(raw); out.append('bytes %d'%len(raw))
    import subprocess; subprocess.run(['pip','install','-q','--break-system-packages','odfpy','pandas'])
    import pandas as pd
    xl=pd.read_excel('/tmp/m.ods',engine='odf',sheet_name=None,header=None)
    for n,df in xl.items():
        out.append('== sheet %s %s'%(n,df.shape))
        out.append(df.head(14).to_string(max_colwidth=40)[:1800])
        out.append('...tail'); out.append(df.tail(4).to_string(max_colwidth=40)[:700])
open('scripts/.probe-output.txt','w').write('\n'.join(out)+'\n')
