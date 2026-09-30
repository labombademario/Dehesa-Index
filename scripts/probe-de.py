import urllib.request,urllib.parse,json,io,re,time,os,http.cookiejar
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
def get(u,raw=False):
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex','Accept':'*/*'}),timeout=90) as r: b=r.read(40000000)
        return b if raw else b.decode('utf-8','replace')
    except Exception as e: return b'ERR %s'%str(e).encode() if raw else 'ERR %s'%e
P('#### packages')
for n in ['kuhmilchpreise-und-mengen-monatsbericht','wochenbericht-uber-schlachtvieh-und-fleisch-nach-der-1-figdv','markt-und-preisbericht-obst-und-gemuse','erzeugerpreisindizes-landwirtschaftlicher-produkte-deutschland-jahre-landwirtschaftliche-produk']:
    try:
        d=json.loads(get('https://www.govdata.de/ckan/api/3/action/package_show?id='+n))['result']
        P('PKG',n[:60],'|',{k:d.get(k) for k in d if 'licen' in k},'|',d.get('metadata_modified'))
        P('  extras',[ (e.get('key'),str(e.get('value'))[:80]) for e in d.get('extras',[])][:12])
        for x in d.get('resources',[]): P('  RES',x.get('format'),x.get('url'),{k:x.get(k) for k in x if 'licen' in k})
    except Exception as e: P('ERR',n,e)
P('#### csv heads')
for u in ['https://open-data.ble.de/dataset/a617636f-28eb-4e6c-abb0-c45cbe8b22f1/resource/a50035d4-a14c-4677-8e65-2fc5b6c1eaf9/download/kuhmilchpreise-mengen.csv',
 'https://open-data.ble.de/dataset/c4eb6408-8cb2-42f9-b341-79fb57f81788/resource/214ea514-205b-4857-a78d-e254fae0983c/download/schlachtpreise-woche.csv',
 'https://open-data.ble.de/dataset/c4eb6408-8cb2-42f9-b341-79fb57f81788/resource/7102aaa8-2401-4dff-b5ce-344b43b069b4/download/schlachtpreise-monat.csv',
 'https://open-data.ble.de/dataset/10824baf-7569-470c-95f2-c78f4facf5f1/resource/d92b81a6-af6a-482f-b1bc-0a7138bf11d1/download/marktundpreis-obstgemuese.csv']:
    b=get(u,raw=True); 
    try: t=b.decode('utf-8-sig')
    except Exception: t=b.decode('cp1252','replace')
    L=t.splitlines(); P('CSV',u.split('/')[-1],len(b),'lines',len(L))
    for l in L[:8]+['...']+L[-4:]: P('   ',l[:300])
    if 'schlacht' in u or 'milch' in u:
        cols=L[0].split(';') if ';' in L[0] else L[0].split(',')
        P('   NCOL',len(cols))
# Francia: listado completo de precios pagados
cj=http.cookiejar.CookieJar(); op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def rq(u,data=None):
    d=urllib.parse.urlencode(data).encode() if data else None
    with op.open(urllib.request.Request(u,data=d,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=90) as x: return x.read().decode('utf-8','replace')
B='https://visionet.franceagrimer.fr/Pages/'
for menu in ['SeriesChronologiques/productions vegetales/grandes cultures/prix payés aux producteurs']:
    rq(B+'SeriesChronologiques.aspx?menuurl='+urllib.parse.quote(menu))
    r=rq(B+'SeriesChronologiquesDetail.aspx',dict(niveau='1',dossierRacine='SeriesChronologiques',menuId='',menuTitre=menu.split('/')[-1],menuUrl=menu,niveauMax='4'))
    P('#### FR listing');
    for f in dict.fromkeys(urllib.parse.unquote(x) for x in re.findall(r'fileurl=([^"\'&<> ]+)',r)): P('  F',f)
    txt=re.sub(r'<[^>]+>',' ',r); txt=re.sub(r'\s+',' ',txt); P(txt[:1800])
os.makedirs('data/probe',exist_ok=True); open('data/probe/de2.txt','w').write('\n'.join(out))
