import os, urllib.request, time
os.makedirs('data/probe', exist_ok=True)
out = []
def get(u, n=1500):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 DehesaIndex'}), timeout=60) as r:
            t = r.read().decode('utf-8', 'replace'); out.append('OK %s\n%s\n' % (u, t[:n]))
    except Exception as e:
        out.append('ERR %s %s\n' % (u, e))
B = 'https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN'
get(B + '/reporter/all/year/all/partner/000/product/100510/indicator/MFN-SMPL-AVRG?format=JSON', 600)
get('https://wits.worldbank.org/API/V1/wits/datasource/trn/country/ALL', 600)
for rep in ('MEX', 'CAN', 'EUN'):
    get(B + '/reporter/%s/year/2020;2021;2022;2023/partner/000/product/10/indicator/MFN-SMPL-AVRG?format=JSON' % rep)
    get(B + '/reporter/%s/year/2022/partner/USA/product/10/indicator/AHS-SMPL-AVRG?format=JSON' % rep)
    get(B + '/reporter/%s/year/2022/partner/USA/product/100510/indicator/AHS-SMPL-AVRG?format=JSON' % rep)
get('https://wits.worldbank.org/API/V1/SDMX/V21/rest/data/DF_WITS_Tariff_TRAINS/A.MEX.USA.100510.AHS-SMPL-AVRG?format=JSON')
open('data/probe/wits.txt', 'w').write('\n'.join(out))
