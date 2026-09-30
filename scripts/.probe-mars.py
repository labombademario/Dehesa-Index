import json,os,base64,urllib.request,urllib.parse,collections,sys,time
K=os.environ['MARS_API_KEY']
H={'Authorization':'Basic '+base64.b64encode((K+':').encode()).decode()}
B='https://marsapi.ams.usda.gov/services/v1.2/reports/'
ids="""3510 3511 3512 3618 3616 3617 2920 2887 2914 1655 3046 3223 3043 2917 3804 2850 2711 2771 2886 3192 3225 3463 3878 3148
1034 1035 1036 1038 1039 1041 1043 1044 1045 1046 1047 1048 1049 1050 1051 1052 1053 1082 1083 1084 1085 1089 1090 1091 1092 1098 1099 1100 1095
1427 1624 1665 2734 2842 2843 2844 2848 3645 3646 3647 3888
2810 2907 2911 3641 2833 2838 2839 2835 3208 3658 3486 2708 2709 2710 2770 2906 2940 3059 3096 3097 3098 3184 3237 3455 2808
2707 2769 2807 2885 2904 2905 2929 2935 2939 3056 3057 3058 3095 3236 3731 3784 3793 3926
2823 1602 1603 3159 2863""".split()
out=open('scripts/.probe-output.txt','w')
def get(u):
    for i in range(2):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=90))
        except Exception as e: err=str(e)
    return {'err':err}
for i in ids:
    d=get(B+i+'?q='+urllib.parse.quote('report_begin_date=09/01/2026:09/30/2026',safe='=:/')+'&allSections=true')
    if isinstance(d,dict) and 'err' in d: out.write('%s ERR %s\n'%(i,d['err'])); continue
    secs={s.get('reportSection'):s for s in (d if isinstance(d,list) else [d])}
    det=secs.get('Report Detail',{}).get('results',[]) or []
    hd=secs.get('Report Header',{}).get('results',[]) or []
    title=(hd[0].get('report_title') if hd else '?')
    out.write('== %s | %s | sections=%s | detail=%d | header=%d\n'%(i,title,list(secs),len(det),len(hd)))
    if det:
        nn=collections.Counter(k for r in det for k,v in r.items() if v not in (None,''))
        skip={'office_name','office_city','office_state','published_date','slug_id','slug_name','report_title','market_type'}
        out.write('  keys: '+','.join(k for k in nn if k not in skip)+'\n')
        for k in ('commodity','class','grade','variety','trade Loc','market_location_name','price_unit','quote_type','sale_type','freight','trans_mode','pkg','category','grp'):
            vals=collections.Counter(str(r.get(k)) for r in det if r.get(k) not in (None,''))
            if vals: out.write('  %s(%d): %s\n'%(k,len(vals),'; '.join('%s×%d'%(a,b) for a,b in vals.most_common(6))))
        r=det[0]; out.write('  sample: '+json.dumps({k:v for k,v in r.items() if v not in (None,'') and k not in skip})[:600]+'\n')
    else:
        keys=[s for s in secs]; 
        for s,v in secs.items():
            if s not in('Report Header','Report Detail'): out.write('  %s rows=%d\n'%(s,len(v.get('results',[]) or [])))
    out.flush()
