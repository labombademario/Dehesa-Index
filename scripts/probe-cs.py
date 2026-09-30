import json,re,urllib.request
def get(u,data=None,n=8000000,t=120,h=None):
    try:
        r=urllib.request.Request(u,data=data,headers=h or {'User-Agent':'Mozilla/5.0 DehesaIndex','Content-Type':'application/json'})
        with urllib.request.urlopen(r,timeout=t) as x: return x.read(n).decode('utf-8-sig','replace')
    except Exception as e: return 'ERR %s'%e
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
for tid in ['ANI61','ANI81','AFG6','HST5','HST89','JORD1','PGKONV1','GOEDSALG','LPRIS38','KAPIT1']:
    s=get('https://api.statbank.dk/v1/tableinfo',json.dumps({'table':tid,'format':'JSON','lang':'en'}).encode())
    try:
        d=json.loads(s); P('##',tid,d['text'])
        for v in d['variables']:
            vals=[(x['id'],x['text'][:70]) for x in v['values']]
            lim=80 if v['id'] in('PRODUKT','AFGRØDE','AFGR','GRØDE','POSTER','ENHED') else 40
            P('  var',v['id'],'|',v['text'],'| n=',len(vals),'|',vals[:lim] if v['id']!='Tid' else (vals[:1],vals[-1:]))
    except Exception as e: P('ERR',tid,s[:150])
for tid in ['84952ENG','83981ENG']:
    s=get('https://opendata.cbs.nl/ODataApi/odata/%s/DataProperties?$format=json'%tid)
    try:
        for x in json.loads(s)['value']: P('CBS',tid,x.get('Key'),'|',x.get('Title'),'|',x.get('Unit'),'|',x.get('Type'))
    except Exception: P('CBS ERR',tid,s[:150])
    for dim in ['Periods']:
        pass
    s=get('https://opendata.cbs.nl/ODataApi/odata/%s/TypedDataSet?$format=json&$top=3'%tid); P(s[:600])
H={'Accept':'application/vnd.sdmx.structure+json','User-Agent':'Mozilla/5.0'}
for df in ['AG_BROADACRE','ITPI_EXP']:
    s=get('https://data.api.abs.gov.au/rest/datastructure/ABS/%s?references=codelist'%df,h=H)
    try:
        d=json.loads(s); P('ABS',df,[x['id'] for x in d['data']['dataStructures'][0]['dataStructureComponents']['dimensionList']['dimensions']])
        for cl in d['data']['codelists']:
            if cl['id'] in('CL_FREQ','CL_UNIT_MEASURE','CL_OBS_STATUS','CL_UNIT_MULT'): continue
            P(' CL',cl['id'],len(cl['codes']))
            for c in cl['codes'][:120 if 'REGION' not in cl['id'] and 'ASGS' not in cl['id'] else 8]:
                n=c['name']
                if df=='ITPI_EXP' and 'ITPI_INDEX' in cl['id'] and not re.search(r'cereal|meat|dairy|live animals|oil|wheat|barley|sugar|wool|cotton|hide|fruit|veget|food|rural',n,re.I): continue
                P('    ',c['id'],'|',n[:95])
    except Exception as e: P('ABS ERR',df,s[:150])
s=get('https://data.api.abs.gov.au/rest/data/AG_BROADACRE/all?startPeriod=2024&format=csvfilewithlabels',h={'User-Agent':'Mozilla/5.0'},n=400000)
P('AGB hdr',s[:300])
P('AGB sample regions', sorted(set(l.split(',')[6] for l in s.split('\n')[1:400] if len(l.split(','))>7))[:10])
open('data/probe/cs.txt','w').write('\n'.join(out))
