#!/usr/bin/env python3
"""Prueba de la retencion de snapshots (7 dias + el ultimo de cada semana anterior)."""
import datetime, importlib.util, os, sys, collections
sp = importlib.util.spec_from_file_location('ps', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prune-snapshots.py')); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
today = datetime.date(2026, 10, 31)
names = [(datetime.date(2026, 9, 29) + datetime.timedelta(days=i)).isoformat() + '.json' for i in range(33)] + ['README.md', 'notes.json', '2026-13-45.json']
drop, keep = m.plan(names, today)
fails = []
def check(msg, ok):
    if not ok: fails.append(msg)
check('el de hoy se conserva', '2026-10-31.json' in keep)
check('ficheros ajenos nunca se tocan', not {'README.md', 'notes.json', '2026-13-45.json'} & set(drop))
check('los ultimos 7 dias completos se conservan', all('2026-10-%02d.json' % d in keep for d in range(24, 32)))
old = [n for n in keep if n[:2] == '20' and (today - datetime.date.fromisoformat(n[:10])).days > 7]
wk = collections.Counter(datetime.date.fromisoformat(n[:10]).isocalendar()[:2] for n in old)
check('una por semana en lo antiguo', wk and max(wk.values()) == 1)
check('lo conservado de cada semana es el ultimo de esa semana', all(n == max(x for x in names if x[:2] == '20' and x[:4].isdigit() and len(x) == 15 and x[5:7] != '13' and datetime.date.fromisoformat(x[:10]).isocalendar()[:2] == datetime.date.fromisoformat(n[:10]).isocalendar()[:2] and (today - datetime.date.fromisoformat(x[:10])).days > 7) for n in old))
check('idempotente', m.plan([n for n in names if n not in drop], today)[0] == [])
if fails: print('FALLAN:', fails); sys.exit(1)
print('test-prune-snapshots OK')
