#!/usr/bin/env python3
"""Tests del lector del CDI del EDO con recortes del NetCDF real (scripts/fixtures/edo/cdinx_slice_{a,b}.nc: decadas 2026-01-01/11 y 2026-09-01/11 del fichero oficial). Sin red.
Requiere numpy, netCDF4 y shapely (el workflow los instala)."""
import importlib.util, json, subprocess, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]; F = ROOT / "scripts" / "fixtures" / "edo"
spec = importlib.util.spec_from_file_location("ed", ROOT / "scripts" / "update-eu-drought.py"); C = importlib.util.module_from_spec(spec); spec.loader.exec_module(C)
import numpy as np
bad = []
def eq(a, b, m):
    if a != b: bad.append("%s: %r != %r" % (m, a, b))
def ok(c, m):
    if not c: bad.append(m)
lon, lat, t, a = C.load(F / "cdinx_slice_b.nc")
eq([d.isoformat() for d in t], ["2026-09-01", "2026-09-11"], "fechas de las decadas"); eq(a.shape, (2, 1200, 1824), "malla"); eq(round(float(lon[0]), 4), -24.9792, "primera longitud (centro de pixel)")
ms, names = C.masks(lon, lat)
ok(all(c in ms for c in ("ES", "FR", "DE", "IT", "PL", "GB", "UA")), "paises presentes")
# el mapa de paises encaja con la malla: Madrid cae en Espana, Paris en Francia, Berlin en Alemania, el centro del Atlantico en ninguno
def at(x, y): return int(np.abs(lat - y).argmin()), int(np.abs(lon - x).argmin())
for c, (x, y) in {"ES": (-3.70, 40.42), "FR": (2.35, 48.85), "DE": (13.40, 52.52), "IT": (12.50, 41.90), "PL": (21.0, 52.2)}.items(): ok(ms[c][at(x, y)], "%s no contiene su capital" % c)
ok(not any(m[at(-20, 40)] for m in ms.values()), "el Atlantico no es de ningun pais")
w = np.cos(np.deg2rad(lat))[:, None] * np.ones((1, len(lon)))
s, cov = C.shares(a[1], ms["ES"], w)
ok(s is not None and 95 <= cov <= 100, "cobertura de Espana"); ok(all(0 <= x <= 100 for x in s) and sum(s) <= 100.05, "porcentajes de Espana")
# sintetico: media imagen en clase 3 -> ~50 % (ponderado, sobre una mascara de dos filas iguales)
img = np.zeros((1200, 1824), np.uint8); m = np.zeros((1200, 1824), bool); m[500:502, :] = True; img[500, :] = 3
s2, c2 = C.shares(img, m, w); ok(abs(s2[2] - 50.0) < 0.5 and c2 == 100.0, "reparto sintetico 50/50: %r" % (s2,))
img[501, :200] = 7; s3, c3 = C.shares(img, m, w); ok(c3 < 100.0, "pixeles sin dato (7) bajan la cobertura y no cuentan como no-sequia")
# ejecucion completa: dos ficheros -> una serie ordenada, con la UE-27 incluida
with tempfile.TemporaryDirectory() as td:
    out = Path(td) / "o.json"; r = subprocess.run([sys.executable, str(ROOT / "scripts" / "update-eu-drought.py"), "--nc", str(F / "cdinx_slice_a.nc"), str(F / "cdinx_slice_b.nc"), "--out", str(out)], capture_output=True, text=True)
    ok(r.returncode == 0, "ejecucion: " + r.stdout + r.stderr)
    if r.returncode == 0:
        d = json.loads(out.read_text()); eq(d["periods"], ["2026-01-01", "2026-01-11", "2026-09-01", "2026-09-11"], "periodos ordenados"); eq(d["asOf"], "2026-09-11", "asOf"); ok("EU27" in d["countries"] and len(d["countries"]) >= 40, "ambitos")
        eq(d["countries"]["ES"]["v"][-1], s, "Espana coincide con el calculo directo")
    bogus = Path(td) / "mal.nc"; bogus.write_bytes(b"no es un netcdf"); r2 = subprocess.run([sys.executable, str(ROOT / "scripts" / "update-eu-drought.py"), "--nc", str(bogus), "--out", str(Path(td) / "n.json")], capture_output=True, text=True)
    ok(r2.returncode == 1 and not (Path(td) / "n.json").exists(), "un fichero roto no escribe nada y falla")
print("OK test-eu-drought" if not bad else "\n".join(bad)); sys.exit(1 if bad else 0)
