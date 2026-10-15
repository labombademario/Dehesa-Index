#!/usr/bin/env python3
"""España: focos de enfermedades animales de declaración obligatoria (MAPA, RASVE) -> data/spain-health/focos.json
Fuente: «Últimas notificaciones», listado público de los 15 últimos focos. El MAPA no publica ahí el histórico, así que este fichero ACUMULA: cada ejecución añade los focos nuevos
(clave = nº de foco «año/número») y conserva los anteriores. El histórico empieza el día de la primera ejecución; no se rellena hacia atrás. Nada se estima."""
import argparse, datetime, html, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
URL = "https://servicio.mapa.gob.es/rasve/Publico/Publico/ultimosfocos.aspx"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
KIND = [("peste porcina africana", "asf"), ("dermatosis nodular", "lsd"), ("lengua azul", "bluetongue"), ("influenza aviar", "hpai"), ("nilo occidental", "wnv")]
def http(u, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read().decode("utf-8", "replace")
        except Exception as e: last = e; time.sleep(4 * (i + 1))
    raise RuntimeError(str(last)[:160])
def txt(c): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", c))).strip()
def parse(t):
    i = t.find('<table class="data-table"')
    if i < 0: raise ValueError("sin tabla")
    tb = t[i:t.find("</table>", i)]; out = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, re.S):
        c = [txt(x) for x in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if len(c) < 8 or not re.fullmatch(r"\d{4}/\d+", c[0]): continue
        m = re.fullmatch(r"(\d{2})/(\d{2})/(\d{4})", c[3])
        if not m: continue
        dis = c[2]; k = next((v for s, v in KIND if s in dis.lower()), "other")
        out.append({"id": c[0], "type": c[1], "disease": dis, "kind": k, "date": "%s-%s-%s" % (m.group(3), m.group(2), m.group(1)), "ccaa": c[4], "comarca": c[5], "province": c[6], "municipality": c[7], "serotype": c[8] if len(c) > 8 else ""})
    return out
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(ROOT / "data" / "spain-health")); ap.add_argument("--local")
    a = ap.parse_args(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True); f = out / "focos.json"
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = parse(Path(a.local).read_text(encoding="utf-8") if a.local else http(URL))
    if not rows: raise SystemExit("la página no trae focos legibles: no se toca nada")
    prev = json.loads(f.read_text(encoding="utf-8")) if f.exists() else None
    have = {r["id"]: r for r in (prev["focos"] if prev else [])}; new = 0
    for r in rows:
        if r["id"] not in have: r["firstSeen"] = now[:10]; new += 1
        else: r["firstSeen"] = have[r["id"]].get("firstSeen", now[:10])
        have[r["id"]] = r
    focos = sorted(have.values(), key=lambda r: (r["date"], r["id"]), reverse=True)
    doc = {"schemaVersion": 1, "generatedAt": now, "source": {"id": "mapa_es", "name": "MAPA, RASVE (Red de Alerta Sanitaria Veterinaria)", "url": URL}, "since": (prev or {}).get("since", now[:10]), "focos": focos,
           "note": "El MAPA solo publica los 15 últimos focos; este histórico se acumula desde «since» y no incluye focos anteriores."}
    f.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    (ROOT / "data" / "spain-health-log.txt").write_text("focos leídos %d, nuevos %d, total %d\n" % (len(rows), new, len(focos)), encoding="utf-8"); print("focos", len(rows), "nuevos", new); return 0
if __name__ == "__main__": sys.exit(main())
