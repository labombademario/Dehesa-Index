import urllib.request, re, io, csv, collections
UA={'User-Agent':'Mozilla/5.0 (compatible; Dehesa-Index-data-bot/1.0; +https://dehesaindex.com)'}
def get(u,t=120): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=t).read()
B='https://www.ers.usda.gov'
def link(page,pat):
    h=get(B+page).decode('utf-8','replace'); return B+re.search(r'href="(/media/\d+/[^"?]*%s[^"?]*)'%pat,h).group(1)
out=open('probe/out/p3.txt','w')
def w(s): out.write(s+'\n'); out.flush()
try:
    rows=list(csv.DictReader(io.StringIO(get(link('/data-products/us-bioenergy-statistics','bioenergy-statistics\\.csv')).decode('utf-8-sig','replace'))))
    w('BIO rows=%d'%len(rows))
    T=collections.OrderedDict()
    for r in rows: T.setdefault((r['table'],r['table_name']),[]).append(r)
    for (t,n),rs in T.items():
        c=lambda k: collections.Counter(r[k] for r in rs)
        w('T%s %s n=%d'%(t,n[:110],len(rs)))
        for k in ('year_cat','period','period_cat','period_desc','geographic_level','units'): w('   %s: %s'%(k,dict(list(c(k).most_common(8)))))
        w('   location: %d distinct %s'%(len(c('location')),list(c('location'))[:5]))
        w('   commodity: %d %s'%(len(c('commodity')),list(c('commodity'))[:6]))
        w('   item: %d %s'%(len(c('data_item_desc')),list(c('data_item_desc'))[:6]))
        w('   years %s..%s | ROW %s'%(min(r['year'] for r in rs),max(r['year'] for r in rs),'|'.join(rs[0][k] for k in rs[0])[:230]))
except Exception as e: w('BIO ERR %r'%e)
try:
    import xlrd
    wb=xlrd.open_workbook(file_contents=get(link('/data-products/fertilizer-use-and-price','all-fertilizer')))
    for nm in ('Table1','Table2','Table4','Table5','Table7','Table8','Table9','Table10'):
        s=wb.sheet_by_name(nm); w('== %s %dx%d'%(nm,s.nrows,s.ncols))
        idx=list(range(0,16))+list(range(max(16,s.nrows-5),s.nrows))
        for i in idx:
            if i<s.nrows: w('%3d | %s'%(i,' ; '.join(str(c)[:22] for c in s.row_values(i)[:12])))
except Exception as e: w('FERT ERR %r'%e)
