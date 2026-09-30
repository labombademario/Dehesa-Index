import time,urllib.request,urllib.parse,re,http.cookiejar,json,io
cj=http.cookiejar.CookieJar()
op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
def req(u,data=None,n=8000000):
    last=''
    for i in range(3):
        try:
            d=urllib.parse.urlencode(data).encode() if data else None
            r=urllib.request.Request(u,data=d,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) DehesaIndex','Accept':'*/*','Accept-Language':'fr,en','X-Requested-With':'XMLHttpRequest' if data else ''})
            with op.open(r,timeout=120) as x: return x.read(n).decode('utf-8','replace')
        except Exception as e: last='ERR %s'%e; time.sleep(4)
    return last
out=[]
def P(*a): out.append(' '.join(str(x) for x in a))
B='https://visionet.franceagrimer.fr/Pages/'
menu='SeriesChronologiques/productions vegetales/grandes cultures/cotations'
s=req(B+'SeriesChronologiques.aspx?menuurl='+urllib.parse.quote(menu))
for v in ['dossierRacine','menuId','menuTitre','menuUrl','niveauMax']:
    for m in list(re.finditer(r'(var\s+)?'+v+r'\s*=\s*[^;]{0,200};',s))[:4]: P('VAR',re.sub(r'\s+',' ',m.group(0))[:250])
# atributos del menu de la izquierda
for m in list(re.finditer(r'<(?:a|span|li)[^>]*menuurl="[^"]*grandes cultures[^"]*"[^>]*>',s))[:15]: P('MENU',m.group(0)[:300])
# intento POST
for cfg in [dict(niveau='1',dossierRacine='SeriesChronologiques',menuId='',menuTitre='cotations',menuUrl=menu,niveauMax='4'),
            dict(niveau='1',dossierRacine='SeriesChronologiques/productions vegetales/grandes cultures/cotations',menuId='',menuTitre='cotations',menuUrl=menu,niveauMax='4')]:
    r=req(B+'SeriesChronologiquesDetail.aspx',cfg); P('POST',json.dumps(cfg)[:150],len(r)); 
    for m in list(dict.fromkeys(re.findall(r'fileurl=[^"\'&<> ]+',r)))[:40]: P('  F',urllib.parse.unquote(m)[:230])
    P('  TXT',re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',r))[:400])
open('data/probe/fr5.txt','w').write('\n'.join(out))
