#!/usr/bin/env python3
"""Genera los workflows de datos "estandar" a partir de sources.yml (un solo sitio donde cambiar cron, script, ficheros y mensaje).
Uso: python3 scripts/gen-workflows.py          # escribe .github/workflows/update-<id>.yml
     python3 scripts/gen-workflows.py --check  # sale con 1 si algun workflow generado difiere de sources.yml (para CI)
Cada workflow generado: checkout -> (pre) -> script -> validar con esquema y tests (descarta el cambio si falla) -> detectar revisiones -> commit con reintentos."""
import json, sys
from pathlib import Path
import yaml
ROOT = Path(__file__).resolve().parents[1]
def q(s): return "'" + str(s).replace("'", "''") + "'"
def files_of(x): return {(f[1:] if f.startswith("!") else "data/" + f) for f in x["data"] + x.get("extra", [])} | ({"data/" + x["log"]} if x.get("log") else set())
SHARED_OK = {"data/revisions.json"}   # registro comun: lo mezcla scripts/merge-shared.py al publicar, no obliga a serializar
def groups(cfg):
    """Grupo de concurrencia de cada workflow generado. Dos workflows que escriben el MISMO fichero comparten grupo (se serializan);
    el resto tienen grupo propio, asi una ejecucion no cancela a otra distinta. `group: heavy` = el grupo comun de los que construyen derivados."""
    src = cfg["sources"]; par = {x["id"]: x["id"] for x in src}
    def find(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    owner = {}
    for x in src:
        for f in files_of(x) - SHARED_OK:
            if f in owner: par[find(x["id"])] = find(owner[f])
            else: owner[f] = x["id"]
    members = {}
    for x in src: members.setdefault(find(x["id"]), []).append(x["id"])
    return {i: ("dehesa-data-writes" if next(y for y in src if y["id"] == i).get("group") == "heavy" else "dehesa-" + min(m)) for m in members.values() for i in m}
def render(x, group="dehesa-data-writes"):
    L = ["# GENERADO por scripts/gen-workflows.py a partir de sources.yml. No editar a mano.", "name: " + x["name"], "on:", "  schedule:"]
    L += ["    - cron: " + q(c) for c in x["cron"]]
    L += ["  workflow_dispatch:"]
    if x.get("dispatch_inputs"):
        L.append("    inputs:")
        for k, v in x["dispatch_inputs"].items():
            L += ["      %s:" % k, "        description: " + q(v["description"]), "        required: " + ("true" if v.get("required") else "false"), "        default: " + q(v.get("default", ""))]
    L += ["permissions:", "  contents: write", "concurrency:", "  group: " + group, "  cancel-in-progress: false", "jobs:", "  update:", "    runs-on: ubuntu-24.04"]
    if x.get("timeout"): L.append("    timeout-minutes: %d" % x["timeout"])
    L += ["    steps:", "      - uses: actions/checkout@v6"]
    for p in x.get("pre", []): L.append("      - run: " + p)
    cmd = (x.get("runner", "python3") + " " + x["script"] + (" " + x["args"] if x.get("args") else "")).strip()
    L.append("      - id: fetch"); L.append("        run: bash scripts/annotate-failure.sh " + cmd)   # si falla, las ultimas lineas quedan como anotacion legible por la API
    if x.get("env"):
        L.append("        env:"); L += ["          %s: %s" % (k, v) for k, v in x["env"].items()]
    if x.get("script_timeout"): L.append("        timeout-minutes: %d" % x["script_timeout"])
    if x.get("continue"): L.append("        continue-on-error: true")
    fs = x.get("failsafe")  # el script publica source=unavailable cuando el PROVEEDOR no responde: no se valida, no se detectan revisiones y no se publica nada
    always = ["        if: always()" + (" && steps.fetch.outputs.source != 'unavailable'" if fs else "")] if x.get("continue") else []
    reg = json.loads((ROOT / "schemas" / "registry.json").read_text())["files"]
    vlist = [f for f in x["data"] if f.endswith(".json")] + [e for e in x.get("extra", []) if not e.startswith("!") and e in reg]  # tambien los ficheros extra con contrato
    files = " ".join("data/" + f for f in vlist)
    if vlist:
        L += ["      - name: Validar datos (esquema y tests); lo invalido se descarta y la ejecucion queda en rojo"] + always + ["        uses: ./.github/actions/validate-files", "        with:", "          files: " + files,
              "      - name: Detectar revisiones oficiales"] + always + ["        run: python3 scripts/detect-revisions.py " + files]
    qa = x.get("check")  # control previo a publicar (falla cerrado: si falla, no se publica y la ejecucion queda en rojo)
    if qa:
        L += ["      - id: qa", "        name: Control de calidad antes de publicar (si falla, no se publica)"] + always + ["        run: " + qa, "        continue-on-error: true"]
    adds = " ".join([(f[1:] if f.startswith("!") else "data/" + f) for f in x["data"] + x.get("extra", [])] + (["data/" + x["log"]] if x.get("log") else []) + (["data/revisions.json"] if vlist else []))
    pub_if = ["        if: always() && steps.qa.outcome != 'failure'" + (" && steps.fetch.outputs.source != 'unavailable'" if fs else "")] if qa else always
    L += ["      - name: Publicar"] + pub_if + ["        run: bash scripts/publish-data.sh " + json.dumps(x["message"], ensure_ascii=False) + " " + adds]
    if fs:
        L += ["      - name: Estado de la fuente (un corte del proveedor se registra como retraso, no como error de Dehesa Index)", "        if: always()", "        env:", "          REASON: ${{ steps.fetch.outputs.reason }}",
              "        run: python3 scripts/source-status.py ${{ steps.fetch.outputs.source == 'unavailable' && 'mark' || (steps.fetch.outcome == 'success' && 'clear' || 'none') }} update-%s.yml \"$REASON\"" % x["id"],
              "      - name: Publicar estado de la fuente", "        if: always()", "        uses: ./.github/actions/publish", "        with:", "          optional: data/source-status.json", "          message: " + q("Estado de la fuente: " + x["id"])]
    if vlist or x.get("continue"):
        L += ["      - name: Cierre (rojo si hubo datos invalidos o un paso fallo)", "        if: always()", "        uses: ./.github/actions/finish", "        with:", "          outcomes: ${{ steps.fetch.outcome }}" + (" ${{ steps.qa.outcome }}" if qa else "")]
    return "\n".join(L) + "\n"
def main():
    cfg = yaml.safe_load((ROOT / "sources.yml").read_text(encoding="utf-8")); bad = 0; GR = groups(cfg)
    for x in cfg["sources"]:
        out = ROOT / ".github" / "workflows" / ("update-%s.yml" % x["id"]); txt = render(x, GR[x["id"]])
        yaml.safe_load(txt)
        if "--check" in sys.argv:
            if not out.exists() or out.read_text(encoding="utf-8") != txt: print("DESINCRONIZADO:", out.name); bad += 1
        else: out.write_text(txt, encoding="utf-8"); print("generado", out.name)
    sys.exit(1 if bad else 0)
main()
