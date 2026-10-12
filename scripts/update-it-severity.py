#!/usr/bin/env python3
"""Italia: estado de severidad hidrica por distrito hidrografico -> data/it-water-severity.json
Fuente: ISPRA, «Stato di severità idrica a scala nazionale» (pagina SeverIdrica.html), que recoge lo que deciden los Observatorios
distritales permanentes para los usos del agua de los siete distritos (Alpi Orientali, Po, Appennino Settentrionale, Centrale y Meridionale,
Sardegna, Sicilia). Escenarios oficiales: normal, baja, media, alta. Licencia: datos del sitio ISPRA bajo CC BY 4.0 (note legali).
Se guarda el nivel de cada distrito, la frase que lo matiza (excepciones por zona) y la fecha de actualizacion; cada cambio se anade a un
historico propio. Si la pagina cambia y no se reconocen los siete distritos, el fichero anterior se conserva.
Uso: python3 scripts/update-it-severity.py"""
import datetime, html, json, re, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "it-water-severity.json"
URL = "https://www.isprambiente.gov.it/pre_meteo/idro/SeverIdrica.html"
H = {"User-Agent": "Dehesa-Index-data-bot/1.0 (+https://dehesaindex.com)"}
DIST = [("alpi_orientali", "Alpi Orientali"), ("po", "Fiume Po"), ("app_sett", "Appennino Settentrionale"), ("app_centrale", "Appennino Centrale"),
        ("app_merid", "Appennino Meridionale"), ("sardegna", "Sardegna"), ("sicilia", "Sicilia")]
# regiones (ids de vendor/it-regions.js) de cada distrito, para colorear el mapa por aproximacion: los limites de los distritos son cuencas, no regiones
REG = {"alpi_orientali": ["VEN", "FVG", "TAA"], "po": ["PIE", "VDA", "LOM", "EMR"], "app_sett": ["TOS", "LIG"], "app_centrale": ["LAZ", "UMB", "MAR", "ABR"],
       "app_merid": ["CAM", "PUG", "BAS", "CAL", "MOL"], "sardegna": ["SAR"], "sicilia": ["SIC"]}
LV = {"NORMALE": "normal", "NORMALITÀ": "normal", "NORMALITA": "normal", "BASSA": "low", "BASSO": "low", "MEDIA": "medium", "MEDIO": "medium", "ALTA": "high", "ALTO": "high"}
def get(u, t=120):
    last = None
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=t) as r: return r.read()
        except Exception as e: last = e; time.sleep(5 * (i + 1))
    raise RuntimeError("%s -> %s" % (u[-90:], last))
def main():
    try:
        raw = get(URL)
        try: s = raw.decode("utf-8")
        except UnicodeDecodeError: s = raw.decode("cp1252", "replace")   # la pagina mezcla entidades y bytes en latin-1
        t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", s, flags=re.S); t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
        lines = [re.sub(r"\s+", " ", x).strip() for x in t.split("\n")]; lines = [x for x in lines if x]
        upd = None
        for i, x in enumerate(lines):
            if x.startswith("Ultimo aggiornamento"):
                m = re.search(r"(\d{2})/(\d{2})/(\d{4})", " ".join(lines[i:i + 2]))
                if m: upd = datetime.date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat(); break
        out = {}
        for key, name in DIST:
            i = next((k for k, x in enumerate(lines) if x.startswith("Osservatorio del Distretto idrografico") and name.lower() in x.lower()), None)
            if i is None: raise ValueError("distrito no encontrado: %s" % name)
            lvl = None
            for j in range(i + 1, min(i + 6, len(lines))):
                w = lines[j].upper().strip(" .:")
                if w in LV: lvl = LV[w]; note = lines[j + 1] if j + 1 < len(lines) else ""; break
            if not lvl: raise ValueError("nivel no encontrado para %s" % name)
            note = re.sub(r"^[,;\s–-]+", "", note)
            dm = re.search(r"(\d{2})/(\d{2})/(\d{4})", note)
            out[key] = {"name": name, "level": lvl, "note": re.split(r"\s+[–-]\s+Bollettin", note)[0][:300] if "eccezion" in note.lower() else "",
                        "bulletinDate": datetime.date(int(dm.group(3)), int(dm.group(2)), int(dm.group(1))).isoformat() if dm else None, "regions": REG[key]}
    except Exception as e:
        print("FALLO lectura de la pagina de ISPRA:", e); return 0 if OUT.exists() else 1
    try: old = json.loads(OUT.read_text())
    except Exception: old = {}
    hist = old.get("history", [])
    snap = {k: v["level"] for k, v in out.items()}
    if not hist or hist[-1]["levels"] != snap: hist.append({"date": upd or datetime.date.today().isoformat(), "levels": snap})
    doc = {"schemaVersion": 1, "generatedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "asOf": upd,
           "source": {"name": "ISPRA, Stato di severità idrica a scala nazionale (Osservatori distrettuali permanenti per gli utilizzi idrici)", "url": URL, "license": "CC BY 4.0"},
           "levels": ["normal", "low", "medium", "high"], "districts": out, "history": hist}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("it-water-severity.json a %s: %s" % (upd, {k: v["level"] for k, v in out.items()}))
    return 0
if __name__ == "__main__": sys.exit(main())
