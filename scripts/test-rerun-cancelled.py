#!/usr/bin/env python3
"""Test sin red de la decision del vigilante de cancelaciones."""
import datetime, importlib.util
from pathlib import Path
sp = importlib.util.spec_from_file_location("rc", Path(__file__).resolve().parent / "rerun-cancelled.py"); rc = importlib.util.module_from_spec(sp); sp.loader.exec_module(rc)
NOW = datetime.datetime(2026, 10, 9, 23, 0, tzinfo=datetime.timezone.utc)
def run(i, wf, created, status="completed", concl="cancelled", event="schedule", actor="github-actions[bot]"):
    return {"id": i, "path": ".github/workflows/%s" % wf, "created_at": created, "status": status, "conclusion": concl, "event": event, "actor": {"login": actor}}
J = {1: 0, 2: 0, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
jobs = lambda i: J[i]
cases = [
    ("cancelada de cola, reciente -> relanzar", [run(1, "update-a.yml", "2026-10-09T21:57:49Z")], ["update-a.yml"]),
    ("cancelada pero llego a tener jobs -> no", [run(3, "update-b.yml", "2026-10-09T21:57:49Z")], []),
    ("ultima ejecucion ya fue bien -> no", [run(5, "update-c.yml", "2026-10-09T22:30:00Z", concl="success"), run(4, "update-c.yml", "2026-10-09T21:57:49Z")], []),
    ("hay otra en cola/curso -> no", [run(6, "update-d.yml", "2026-10-09T22:30:00Z", status="queued", concl=None), run(7, "update-d.yml", "2026-10-09T21:57:49Z")], []),
    ("demasiado vieja -> no", [run(8, "update-e.yml", "2026-10-07T21:57:49Z")], []),
    ("workflow que no es de datos -> no", [run(9, "quality.yml", "2026-10-09T21:57:49Z")], []),
    ("ya relanzada 3 veces hoy -> no", [run(10, "update-f.yml", "2026-10-09T22:50:00Z")] + [run(100 + k, "update-f.yml", "2026-10-09T1%d:00:00Z" % k, concl="failure", event="workflow_dispatch") for k in range(3)], []),
]
for k in range(100, 103): J[k] = 1
bad = 0
for name, runs, want in cases:
    got = [p.split("/")[-1] for p in rc.decide(runs, jobs, NOW)]
    ok = got == want; bad += not ok; print(("OK   " if ok else "FALLO"), name, got)
many = [run(200 + k, "update-m%d.yml" % k, "2026-10-09T22:00:00Z") for k in range(9)]
for k in range(9): J[200 + k] = 0
n = len(rc.decide(many, jobs, NOW)); ok = n == rc.MAX_PER_RUN; bad += not ok; print(("OK   " if ok else "FALLO"), "tope por pasada", n)
raise SystemExit(1 if bad else 0)
