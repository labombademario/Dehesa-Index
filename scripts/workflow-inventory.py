#!/usr/bin/env python3
"""Inventario de workflows: familia, script/fuente, frecuencia, ficheros de salida y uso de acciones compuestas, con deteccion de duplicados y huerfanos.
Genera docs/WORKFLOWS.md (determinista; el ultimo estado y la duracion de cada ejecucion viven en data/pipeline-status.json, no se copian aqui para no
generar commits por cada ejecucion). Solo informa: no borra ni fusiona nada. Una fusion solo se justifica por duplicacion real (mismo script, mismas salidas)
y se hace con acciones compuestas (.github/actions/).
Uso: python3 scripts/workflow-inventory.py [--check]"""
import re, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]; W = ROOT / '.github' / 'workflows'; OUT = ROOT / 'docs' / 'WORKFLOWS.md'
FAM = [('update-us-', 'US'), ('update-ca', 'CA'), ('update-canada', 'CA'), ('update-au', 'AU'), ('update-uk', 'UK'), ('update-eu', 'EU'), ('update-cap', 'PAC'), ('update-nass', 'US'), ('update-ams', 'US'), ('update-ers', 'US'),
       ('update-news', 'Noticias y blog'), ('update-weekly-blog', 'Noticias y blog'), ('update-pipeline', 'Derivados y estado'), ('update-seo', 'Derivados y estado'), ('verify-', 'Calidad'), ('quality', 'Calidad'), ('qa-', 'Calidad'), ('ux-', 'Calidad')]
COUNTRY = {'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT', 'nl': 'NL', 'dk': 'DK', 'pt': 'PT', 'be': 'BE', 'at': 'AT', 'ie': 'IE', 'pl': 'PL', 'manitoba': 'CA', 'alberta': 'CA', 'saskatchewan': 'CA', 'mx': 'MX', 'br': 'BR', 'ar': 'AR'}
def family(n):
    for pre, f in FAM:
        if n.startswith(pre): return f
    m = re.match(r'update-([a-z]+)', n)
    return COUNTRY.get(m.group(1), 'Otros') if m else 'Otros'
def freq(crons):
    if not crons: return 'manual / por evento'
    c = crons[0].split()
    if len(c) != 5: return crons[0]
    mi, h, dom, mo, dow = c
    if dow != '*' and dom == '*': return 'semanal (%s)' % dow if len(crons) == 1 else '%d veces/semana' % len(crons)
    if dom != '*': return 'mensual'
    if '/' in h or ',' in h or '*' in h: return 'varias veces al dia'
    return 'diaria' if len(crons) == 1 else '%d veces al dia' % len(crons)
rows, scripts_used, outs = [], {}, {}
for f in sorted(W.glob('*.yml')):
    t = f.read_text(encoding='utf-8'); d = yaml.safe_load(t) or {}; on = d.get(True) or d.get('on') or {}
    crons = [x['cron'] for x in (on.get('schedule') or [])] if isinstance(on, dict) else []
    scr = sorted(set(re.findall(r'scripts/[\w.-]+\.(?:py|mjs)', t)))
    data = sorted(set(re.findall(r'data/[\w./*-]+', "\n".join(l for l in t.splitlines() if 'git add' in l or 'files:' in l))))
    acts = sorted(set(re.findall(r'uses: \./\.github/actions/([\w-]+)', t)))
    for s in scr:
        if s.startswith('scripts/update'): scripts_used.setdefault(s, []).append(f.name)
    for o in data: outs.setdefault(o, []).append(f.name)
    rows.append((family(f.name), f.name, freq(crons), scr, data, acts, 'generado' if t.startswith('# GENERADO') else 'a mano'))
issues = []
for s, w in sorted(scripts_used.items()):
    if len(w) > 1 and not all(x in ('quality.yml',) for x in w): issues.append('script %s usado por varios workflows: %s (duplicado o fan-out intencionado: revisar)' % (s, ', '.join(w)))
for o, w in sorted(outs.items()):   # data/revisions.json lo comparten todos por diseno (detect-revisions.py)
    ws = [x for x in w if x.startswith('update-')]
    if len(ws) > 1 and o != 'data/revisions.json' and '*' not in o: issues.append('salida %s publicada por varios workflows: %s' % (o, ', '.join(ws)))
allscr = {p.relative_to(ROOT).as_posix() for p in (ROOT / 'scripts').glob('update-*') if p.suffix in ('.py', '.mjs')}
used_any = set(); 
for f in list(W.glob('*.yml')) + list((ROOT / '.github' / 'actions').rglob('*.yml')): used_any |= set(re.findall(r'scripts/[\w.-]+\.(?:py|mjs)', f.read_text(encoding='utf-8')))
refd = set()
for p in list((ROOT / 'scripts').glob('*.py')) + list((ROOT / 'scripts').glob('*.mjs')):
    refd |= set(re.findall(r'scripts/[\w.-]+\.(?:py|mjs)', p.read_text(encoding='utf-8', errors='ignore')))
for s in sorted(allscr - used_any - refd): issues.append('script %s no lo usa ningun workflow ni otro script (huerfano)' % s)
for f in sorted(W.glob('*.yml')):
    for s in set(re.findall(r'scripts/[\w.-]+\.(?:py|mjs)', f.read_text(encoding='utf-8'))):
        if not (ROOT / s).exists(): issues.append('%s referencia %s, que no existe' % (f.name, s))
lines = ['# Inventario de workflows', '', 'Generado por `scripts/workflow-inventory.py` (no editar a mano). El ultimo estado, la duracion y la proxima ejecucion de cada uno estan en `data/pipeline-status.json`.', '',
         '%d workflows (%d generados desde `sources.yml`, %d escritos a mano). Acciones compuestas: %s.' % (len(rows), sum(1 for r in rows if r[6] == 'generado'), sum(1 for r in rows if r[6] == 'a mano'), ', '.join(sorted(p.name for p in (ROOT / '.github' / 'actions').iterdir() if p.is_dir()))), '',
         '## Hallazgos a revisar (no son fallos: un script o una salida compartida puede ser intencionado)', ''] + (['- ' + i for i in issues] or ['Sin duplicados ni huerfanos detectados.']) + ['']
for fam in sorted({r[0] for r in rows}):
    lines += ['## ' + fam, '', '| Workflow | Origen | Frecuencia | Scripts | Salidas | Acciones |', '|---|---|---|---|---|---|']
    for r in [x for x in rows if x[0] == fam]:
        lines.append('| %s | %s | %s | %s | %s | %s |' % (r[1], r[6], r[2], ', '.join(s[8:] for s in r[3][:3]) or '-', ', '.join(o[5:] for o in r[4][:3]) + (' …' if len(r[4]) > 3 else '') if r[4] else '-', ', '.join(r[5]) or '-'))
    lines.append('')
txt = '\n'.join(lines)
if '--check' in sys.argv:
    if not OUT.exists() or OUT.read_text(encoding='utf-8') != txt: print('docs/WORKFLOWS.md desactualizado: python3 scripts/workflow-inventory.py'); sys.exit(1)
    print('inventario OK'); sys.exit(0)
OUT.write_text(txt, encoding='utf-8'); print('docs/WORKFLOWS.md: %d workflows, %d hallazgos' % (len(rows), len(issues)))
for i in issues: print(' -', i)
