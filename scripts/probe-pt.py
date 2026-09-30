import os, json, urllib.request
os.makedirs('data/probe', exist_ok=True)
def get(u):
    try:
        return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 DehesaIndex'}),timeout=90))
    except Exception as e: return 'ERR %s'%e
ids=['%07d'%i for i in list(range(14455,14475))]+['0009865','0009868','0009802','0000874','0000018','0000019','0000020','0000021','0000022','0000023','0000704','0000705','0000708','0000709','0000710','0000711','0011188','0013160','0013162','0000916','0000917','0000918','0000919','0000920','0000921','0013527','0013528','0000537','0000538','0000539','0000540','0000543','0000544','0000545','0000546','0000960','0000961','0000962','0000963','0001327','0001328','0001330','0001331','0001333','0001334','0001336','0001337','0000548','0000549','0000550']
out=[]
for v in ids:
    j=get('https://www.ine.pt/ine/json_indicador/pindicaMeta.jsp?varcd=%s&lang=EN'%v)
    if isinstance(j,str): out.append('%s %s'%(v,j)); continue
    m=j[0]
    if 'IndicadorNome' not in m: out.append('%s no meta %s'%(v,str(m)[:150])); continue
    dims=[]
    cat=m['Dimensoes']['Categoria_Dim']
    for d in m['Dimensoes']['Descricao_Dim']:
        dims.append('%s:%s'%(d['dim_num'],d['abrv']))
    n=[]
    for i,d in enumerate(m['Dimensoes']['Descricao_Dim']):
        pass
    out.append('%s | %s | %s | %s..%s | unit=%s p10=%s | upd %s | %s'%(v,m['IndicadorNome'][:150],m['Periodic'],m['PrimeiroPeriodo'],m['UltimoPeriodo'],m['UnidadeMedida'],m.get('Potencia10'),m.get('DataUltimaAtualizacao'),' ; '.join(dims)))
open('data/probe/pt4.txt','w').write('\n'.join(out))
