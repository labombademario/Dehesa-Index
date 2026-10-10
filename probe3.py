import io, zipfile, csv, urllib.request, os, re, json
os.makedirs('probe',exist_ok=True); S=open('probe/summary3.txt','w')
def log(*a): s=' '.join(str(x) for x in a); print(s); S.write(s+'\n'); S.flush()
b=urllib.request.urlopen(urllib.request.Request('https://bulks-faostat.fao.org/production/Prices_E_Europe.zip',headers={'User-Agent':'DehesaIndex-research'}),timeout=300).read()
z=zipfile.ZipFile(io.BytesIO(b)); log('files',z.namelist())
fl=list(csv.reader(io.TextIOWrapper(z.open('Prices_E_Flags.csv'),encoding='latin-1'))); log('FLAGS',fl)
rd=csv.reader(io.TextIOWrapper(z.open('Prices_E_Europe.csv'),encoding='latin-1')); h=next(rd)
want={('Netherlands (Kingdom of the)','Oats'),('Netherlands (Kingdom of the)','Rye'),('Netherlands (Kingdom of the)','Rape or colza seed'),('Netherlands (Kingdom of the)','Meat of sheep, fresh or chilled'),
 ('Portugal','Wheat'),('Portugal','Barley'),('Portugal','Oats'),('Portugal','Rye'),('Portugal','Sugar beet'),('Portugal','Sugar cane'),('Poland','Rape or colza seed'),('Poland','Soya beans'),('Poland','Sugar beet'),('Austria','Sugar beet'),('Denmark','Sugar beet')}
yrs=['Y2020','Y2021','Y2022','Y2023','Y2024','Y2025']
for r in rd:
    if (r[2],r[5]) in want and ('Index' in r[7] or 'SLC' in r[7]):
        log(r[2],'|',r[5],'|',r[7],'|',' '.join('%s=%s[%s]'%(y[1:],r[h.index(y)],r[h.index(y+'F')]) for y in yrs))
md=urllib.request.urlopen(urllib.request.Request('https://bulks-faostat.fao.org/production/datasets_E.json',headers={'User-Agent':'x'}),timeout=60).read().decode('utf-8','replace')
for m in re.finditer(r'\{[^{}]*"DatasetCode"\s*:\s*"(PP|PI|PA)"[^{}]*\}',md): log('DATASET',m.group(0)[:700])
S.close()
