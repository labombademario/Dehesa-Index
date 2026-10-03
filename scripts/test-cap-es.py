#!/usr/bin/env python3
"""Pruebas de la PAC de España (data/cap/es/ y scripts/update-cap-es.py).

Usa un extracto del texto consolidado del RD 1048/2022 (scripts/fixtures/cap-es/, texto del BOE bajo sus condiciones de reutilización) y comprueba:
  1. el extractor reproduce EXACTAMENTE los importes y las huellas que hay publicados en data/cap/es/;
  2. el extractor se niega (falla) ante texto corrompido: suma de regiones que no cuadra, mínimo > planificado, fila que falta, anexo que falta, etiqueta que no casa,
     vigencia perdida, lista de modificaciones vacía;
  3. detecta cambios: un artículo vigilado que cambia, un importe de un anexo que cambia (queda en el registro de cambios) y una norma modificadora nueva;
  4. una ejecución sin cambios no escribe cambios espurios;
  5. las reglas curadas solo citan artículos que el seguimiento vigila, y cada ecorrégimen de los importes tiene su ficha de reglas;
  6. ninguna cifra de importes está escrita a mano en el JavaScript de la página.
Uso: python3 scripts/test-cap-es.py"""
import json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FX = ROOT / "scripts" / "fixtures" / "cap-es"
DATA = ROOT / "data" / "cap" / "es"
SCRIPT = ROOT / "scripts" / "update-cap-es.py"
bad = 0


def ok(cond, msg):
    global bad
    print("%-6s %s" % ("OK" if cond else "FALLA", msg))
    if not cond: bad += 1


def run(text_path, out, meta=None, analysis=None):
    return subprocess.run([sys.executable, str(SCRIPT), "--text", str(text_path), "--meta-xml", str(meta or FX / "api-metadatos.xml"),
                           "--analysis-xml", str(analysis or FX / "api-analisis.xml"), "--out", str(out), "--text-date", "2026-10-03"], capture_output=True, text=True)


def load(p): return json.loads(Path(p).read_text(encoding="utf-8"))


base_text = (FX / "rd1048-extract.txt").read_text(encoding="utf-8")
tmp = Path(tempfile.mkdtemp())

# 1) paridad con lo publicado
out = tmp / "parity"; r = run(FX / "rd1048-extract.txt", out)
ok(r.returncode == 0, "el extractor lee el extracto del BOE (%s)" % (r.stderr.strip().splitlines()[-1][:120] if r.returncode else "sin errores"))
if r.returncode == 0:
    a, b = load(out / "amounts.json"), load(DATA / "amounts.json")
    for d in (a, b):
        d.pop("verifiedAt", None); d.pop("changes", None)
    ok(a == b, "los importes extraidos son identicos a data/cap/es/amounts.json")
    ok(load(out / "watch.json")["current"] == load(DATA / "watch.json")["current"], "las huellas del texto son identicas a data/cap/es/watch.json")

# 2) texto corrompido: el extractor debe negarse
def corrupt(name, fn, expect=None):
    t = fn(base_text)
    ok(t != base_text, "mutacion aplicada: %s" % name)
    p = tmp / "m.txt"; p.write_text(t, encoding="utf-8")
    r = run(p, tmp / "mut")
    msg = (r.stderr.strip().splitlines() or [""])[-1]
    ok(r.returncode != 0 and (expect is None or expect in r.stderr), "se niega ante: %s %s" % (name, "" if r.returncode == 0 else "(" + msg[:90] + ")"))


corrupt("suma de regiones que no cuadra (Anexo VII)", lambda t: t.replace("366.680.383,45", "366.690.383,45", 1), "no cuadra")
corrupt("minimo mayor que planificado (Anexo IX)", lambda t: re.sub(r"(Región 1\.\s+Importe unitario mínimo\.\s+)77,4", r"\g<1>99,4", t, count=1))
corrupt("fila que falta (Anexo IX)", lambda t: re.sub(r"^.*Región 3\.    Importe unitario máximo\.[^\n]*\n", "", t, count=1, flags=re.M) if "Región 3.    Importe unitario máximo." in t else t.replace("Importe unitario máximo.            149,33     149,6      143,36     143,64     143,64\n", "", 1))
corrupt("ecorregimen: planificado fuera de rango (Anexo X)", lambda t: t.replace("62,16 59,09 56,31 53,80 51,42", "62,16 59,09 56,31 153,80 51,42", 1))
corrupt("etiqueta que no casa (Anexo X)", lambda t: t.replace("SIEGA SOSTENIBLE.", "SIEGA RARA.", 1))
corrupt("anexo que falta", lambda t: re.sub(r"^\s*ANEXO XII\s*$", "", t, count=1, flags=re.M), "Anexo XII")
corrupt("tramo de hectareas que falta (Anexo VIII)", lambda t: t.replace("0 ha a 11,92 ha.         16,38", "", 1))
corrupt("umbral de degresividad que falta (Anexo XII)", lambda t: re.sub(r"Pastos mediterráneos\.\s+95\n", "", t, count=1))
corrupt("ayuda asociada: maximo menor que minimo (Anexo XX)", lambda t: re.sub(r"(Máximo Peninsular\.\s+)120,00 120,00", r"\g<1>10,00 120,00", t, count=1))

# 2b) API del BOE
bad_meta = FX / "api-metadatos.xml"
txt = bad_meta.read_text(encoding="utf-8")
(tmp / "meta-derogado.xml").write_text(txt.replace("<estatus_derogacion>N<", "<estatus_derogacion>S<"), encoding="utf-8")
r = run(FX / "rd1048-extract.txt", tmp / "o1", meta=tmp / "meta-derogado.xml")
ok(r.returncode != 0, "se niega si el BOE da la norma como derogada")
(tmp / "meta-fecha.xml").write_text(txt.replace("20260708T093926Z", "hoy"), encoding="utf-8")
r = run(FX / "rd1048-extract.txt", tmp / "o2", meta=tmp / "meta-fecha.xml")
ok(r.returncode != 0, "se niega ante una fecha de actualizacion ilegible")
an = (FX / "api-analisis.xml").read_text(encoding="utf-8")
(tmp / "an-vacio.xml").write_text(re.sub(r"<posteriores>.*</posteriores>", "<posteriores></posteriores>", an, flags=re.S), encoding="utf-8")
r = run(FX / "rd1048-extract.txt", tmp / "o3", analysis=tmp / "an-vacio.xml")
ok(r.returncode != 0, "se niega si la lista de modificaciones llega vacia")

# 3) deteccion de cambios (sobre una copia de lo publicado)
def fresh_dir(name):
    d = tmp / name; shutil.copytree(DATA, d); (d / "rules.json").unlink(); return d

d = fresh_dir("sin-cambios"); before = (load(d / "amounts.json"), load(d / "watch.json"))
r = run(FX / "rd1048-extract.txt", d)
after = (load(d / "amounts.json"), load(d / "watch.json"))
ok(r.returncode == 0 and after[0]["changes"] == before[0]["changes"] and after[1]["reviewNeeded"] == [], "sin cambios en el BOE: no hay cambios espurios ni revisiones pedidas")

d = fresh_dir("articulo")
p = tmp / "art.txt"; t = base_text.replace("sea inferior a 300 euros", "sea inferior a 250 euros", 1); p.write_text(t, encoding="utf-8")
ok(t != base_text, "mutacion aplicada: umbral minimo del articulo 13")
r = run(p, d); w = load(d / "watch.json")
ok(r.returncode == 0 and any("Artículo 13" in x for x in w["reviewNeeded"]), "un cambio en el articulo 13 queda en reviewNeeded (%s)" % w["reviewNeeded"][:3])
ok(load(d / "amounts.json")["changes"] == before[0]["changes"], "un cambio de articulo no se anota como cambio de importes")

d = fresh_dir("importe")
p = tmp / "imp.txt"; t = base_text.replace("62,16 59,09 56,31 53,80 51,42", "62,16 59,09 56,31 53,90 51,42", 1); p.write_text(t, encoding="utf-8")
r = run(p, d); a2 = load(d / "amounts.json"); w = load(d / "watch.json")
ok(r.returncode == 0 and len(a2["changes"]) == len(before[0]["changes"]) + 1 and a2["ecoschemes"][0]["planned"][3] == 53.9, "un importe nuevo en el Anexo X se extrae y queda en el registro de cambios")
ok(any("Anexo X" in x for x in w["reviewNeeded"]), "y el Anexo X queda pendiente de revision")
ok(w["baseline"] == load(DATA / "watch.json")["baseline"], "la linea base no se mueve sola")

d = fresh_dir("norma")
(tmp / "an-nueva.xml").write_text(an.replace("</posteriores>", "<posterior><id_norma>BOE-A-2026-99999</id_norma><relacion codigo=\"270\">SE MODIFICA</relacion><texto>de prueba</texto></posterior></posteriores>", 1), encoding="utf-8")
r = run(FX / "rd1048-extract.txt", d, analysis=tmp / "an-nueva.xml"); w = load(d / "watch.json")
ok(r.returncode == 0 and any("BOE-A-2026-99999" in x for x in w["reviewNeeded"]), "una norma modificadora nueva queda en reviewNeeded")
r2 = subprocess.run([sys.executable, str(SCRIPT), "--accept", "--text", str(FX / "rd1048-extract.txt"), "--meta-xml", str(FX / "api-metadatos.xml"), "--analysis-xml", str(tmp / "an-nueva.xml"), "--out", str(d), "--text-date", "2026-10-03"], capture_output=True, text=True)
ok(r2.returncode == 0 and load(d / "watch.json")["reviewNeeded"] == [], "--accept da por revisado y limpia reviewNeeded")

# 5) coherencia entre ficheros
rules, amounts, watch = load(DATA / "rules.json"), load(DATA / "amounts.json"), load(DATA / "watch.json")
cited = set()
for grp in ("rules", "calendar", "ecoschemes"):
    for x in rules[grp]: cited |= set(x.get("articles", []))
ok(cited <= set(watch["current"]["articles"]), "las reglas solo citan articulos vigilados por el seguimiento (faltan: %s)" % sorted(cited - set(watch["current"]["articles"])))
annexes = {a for x in rules["rules"] for a in x.get("annexes", [])}
ok(annexes <= set(watch["current"]["annexes"]), "los anexos citados por las reglas estan vigilados")
surf_rules = {s for e in rules["ecoschemes"] for s in e["surfaceTypes"]}
ok({e["surfaceType"] for e in amounts["ecoschemes"]} == surf_rules, "cada tipo de superficie de los importes tiene su ficha de reglas y viceversa")
ok({e["scheme"] for e in amounts["ecoschemes"]} == {e["code"] for e in rules["ecoschemes"]}, "los 9 ecorregimenes de las reglas son los de los importes")
ok(all(re.match(r"^RD 1048/2022", x["legalBasis"]) for grp in ("rules", "calendar", "campaignOverrides", "ecoschemes") for x in rules[grp]), "toda regla, hito, excepcion y ecorregimen cita el RD 1048/2022")
ok(rules["source"]["boeRef"] == amounts["source"]["boeRef"] == watch["boeRef"], "los tres ficheros citan la misma norma del BOE")

# 6) ninguna cifra de importes en el JavaScript
vals = set()
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k not in ("campaigns", "discrepancies", "changes"): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
    elif isinstance(o, float) and round(o, 2) != int(o) and o > 9: vals.add(o)
walk(amounts)
js = ROOT / "js" / "pac.js"
if js.exists():
    src = js.read_text(encoding="utf-8")
    nums = set(re.findall(r"(?<![\w.])\d{2,}[.,]\d{2}(?![\w])", src))
    hard = sorted(n for n in nums if float(n.replace(",", ".")) in vals)
    ok(not hard, "js/pac.js no lleva importes escritos a mano (%s)" % hard[:5])
else:
    print("AVISO  js/pac.js todavia no existe: se omite la comprobacion de cifras en el JavaScript")

shutil.rmtree(tmp, ignore_errors=True)
print("%d fallos" % bad); sys.exit(1 if bad else 0)
