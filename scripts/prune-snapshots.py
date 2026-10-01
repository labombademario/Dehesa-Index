#!/usr/bin/env python3
"""Retencion de data/snapshots/: conserva TODOS los dias de los ultimos 7 dias y, de los anteriores, el ULTIMO snapshot de cada semana ISO.
Por defecto solo muestra lo que haria (dry-run); con --apply borra del arbol de trabajo (siguen en el historial de git). Nunca borra el snapshot de hoy ni ficheros
con nombre que no sea AAAA-MM-DD.json. Decision de Mario (2026-10-01): 7 dias + uno por semana, para mantener data/ por debajo del presupuesto (docs/REPO_GROWTH.md)."""
import datetime, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'data/snapshots')
KEEP_DAYS = 7
def plan(names, today):
    days = {}
    for n in names:
        m = re.match(r'^(\d{4}-\d{2}-\d{2})\.json$', n)
        if m:
            try: days[n] = datetime.date.fromisoformat(m.group(1))
            except ValueError: pass
    cutoff = today - datetime.timedelta(days=KEEP_DAYS)
    old = {n: d for n, d in days.items() if d <= cutoff and d != today}
    weeks = {}
    for n, d in old.items():
        k = d.isocalendar()[:2]
        if k not in weeks or d > weeks[k][1]: weeks[k] = (n, d)
    keep_old = {v[0] for v in weeks.values()}
    return sorted(n for n in old if n not in keep_old), sorted(n for n in days if n not in old or n in keep_old)
def main():
    today = datetime.date.fromisoformat(next((a.split('=')[1] for a in sys.argv if a.startswith('--today=')), datetime.date.today().isoformat()))
    names = sorted(os.listdir(DIR)) if os.path.isdir(DIR) else []
    drop, keep = plan(names, today)
    print('snapshots: %d en total, se conservan %d, se retiran %d%s' % (len(names), len(keep), len(drop), '' if '--apply' in sys.argv else ' (dry-run; usa --apply)'))
    freed = 0
    for n in drop:
        freed += os.path.getsize(os.path.join(DIR, n)); print('  retirar', n)
        if '--apply' in sys.argv: os.remove(os.path.join(DIR, n))
    print('espacio %s: %.1f MB' % ('liberado' if '--apply' in sys.argv else 'a liberar', freed / 1048576.0))
    return 0
if __name__ == '__main__': sys.exit(main())
