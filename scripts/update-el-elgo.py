#!/usr/bin/env python3
"""Grecia (ELGO-Dimitra, via data.gov.gr) -> data/el-elgo/{milk,meat,dairy}.json

Fuente: portal de datos abiertos de Grecia https://data.gov.gr (CKAN), organismo ELGO-DIMITRA (Organismo Helenico de Agricultura).
Tres conjuntos mensuales por Unidad Regional (NUTS 3), 2020 -> mes mas reciente, licencia CC BY 4.0 declarada en cada recurso:
  - milk:  leche entregada a la industria (vaca, oveja, cabra, bufala): kg, valor, precio medio, nº de productores, parte ecologica.
  - meat:  sacrificio de bovino, porcino y ovino/caprino (cabezas y kg de canal), y aves (6 categorias en 16 provincias).
  - dairy: produccion de lacteos por grupo (leche, yogur, quesos, mantequilla...) y de quesos con DOP/IGP (feta, kasseri...).
Nada se estima. Las filas ausentes son meses sin entregas o sin sacrificio (0). Los nombres de unidad se normalizan solo donde ELGO
escribe la misma unidad de dos formas (ARGOLIDAS/ARGOLIDOS, ARTAS/ARTIS). Si algo no cuadra no se escribe nada.
Uso: python3 scripts/update-el-elgo.py [--only milk,meat,dairy] [--local carpeta con milk.json meat.json poultry.json pdo.json dairy.json]"""
import argparse, datetime, json, sys, time, urllib.parse, urllib.request
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "el-elgo"
API = "https://data.gov.gr/api/3/action/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; DehesaIndex/1.0; +https://dehesaindex.com)"}
PACKAGES = {"milk": "diacheirisi-stoicheion-paragogis-nopoy-galaktos", "meat": "diacheirisi-stoicheion-diakinisis-kreatos", "prod": "diacheirisi-stoicheion-paragomenon-proionton"}
# (paquete, texto que debe contener el titulo del recurso) -> clave local
RESOURCES = {"milk": ("milk", "γάλακτος"), "meat": ("meat", "βοοειδών"), "poultry": ("meat", "πουλερικών"), "pdo": ("prod", "ΠΟΠ"), "dairy": ("prod", "γαλακτοκομικών προϊόντων σε κιλά ανά κατηγορία")}
LOG = []
MIN_KG = 5e7   # suelo de entregas nacionales por tipo (cada tipo, salvo bufala, supera 100 kt al año)
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)
def now(): return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def http(u, tries=3, t=120):
    last = None
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            last = e
            if getattr(e, "code", None) in (400, 404): break
            time.sleep(4 * (k + 1))
    raise RuntimeError("%s: %s" % (u[-70:], str(last)[:120]))

# Unidades regionales (NUTS 3) como las escribe ELGO -> (id, nombre en ingles)
NORM = {"ΑΡΓΟΛΙΔΟΣ": "ΑΡΓΟΛΙΔΑΣ", "ΑΡΤΗΣ": "ΑΡΤΑΣ"}
PREF = {
    "ΑΙΤΩΛΟΑΚΑΡΝΑΝΙΑΣ": "Aetolia-Acarnania", "ΑΡΓΟΛΙΔΑΣ": "Argolis", "ΑΡΚΑΔΙΑΣ": "Arcadia", "ΑΡΤΑΣ": "Arta", "ΑΤΤΙΚΗΣ": "Attica (unspecified)", "ΑΧΑΪΑΣ": "Achaea",
    "ΒΟΙΩΤΙΑΣ": "Boeotia", "ΓΡΕΒΕΝΩΝ": "Grevena", "ΔΡΑΜΑΣ": "Drama", "ΔΩΔΕΚΑΝΗΣΟΥ": "Dodecanese", "ΕΒΡΟΥ": "Evros", "ΕΥΒΟΙΑΣ": "Euboea", "ΕΥΡΥΤΑΝΙΑΣ": "Evrytania",
    "ΖΑΚΥΝΘΟΥ": "Zakynthos", "ΗΛΕΙΑΣ": "Elis", "ΗΜΑΘΙΑΣ": "Imathia", "ΗΡΑΚΛΕΙΟΥ": "Heraklion", "ΘΕΣΠΡΩΤΙΑΣ": "Thesprotia", "ΘΕΣΣΑΛΟΝΙΚΗΣ": "Thessaloniki",
    "ΙΩΑΝΝΙΝΩΝ": "Ioannina", "ΚΑΒΑΛΑΣ": "Kavala", "ΚΑΡΔΙΤΣΑΣ": "Karditsa", "ΚΑΣΤΟΡΙΑΣ": "Kastoria", "ΚΕΡΚΥΡΑΣ": "Corfu", "ΚΕΦΑΛΛΟΝΙΑΣ": "Cephalonia", "ΚΙΛΚΙΣ": "Kilkis",
    "ΚΟΖΑΝΗΣ": "Kozani", "ΚΟΡΙΝΘΙΑΣ": "Corinthia", "ΚΥΚΛΑΔΩΝ": "Cyclades", "ΛΑΚΩΝΙΑΣ": "Laconia", "ΛΑΡΙΣΑΣ": "Larissa", "ΛΑΣΙΘΙΟΥ": "Lasithi", "ΛΕΣΒΟΥ": "Lesbos",
    "ΛΕΥΚΑΔΑΣ": "Lefkada", "ΜΑΓΝΗΣΙΑΣ": "Magnesia", "ΜΕΣΣΗΝΙΑΣ": "Messenia", "ΝΟΜΑΡΧΙΑ ΑΘΗΝΩΝ": "Athens (prefecture)", "ΝΟΜΑΡΧΙΑ ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ": "East Attica",
    "ΝΟΜΑΡΧΙΑ ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ": "West Attica", "ΝΟΜΑΡΧΙΑ ΠΕΙΡΑΙΩΣ": "Piraeus", "ΞΑΝΘΗΣ": "Xanthi", "ΠΕΛΛΑΣ": "Pella", "ΠΙΕΡΙΑΣ": "Pieria", "ΠΡΕΒΕΖΑΣ": "Preveza",
    "ΡΕΘΥΜΝΟΥ": "Rethymno", "ΡΟΔΟΠΗΣ": "Rhodope", "ΣΑΜΟΥ": "Samos", "ΣΕΡΡΩΝ": "Serres", "ΤΡΙΚΑΛΩΝ": "Trikala", "ΦΘΙΩΤΙΔΑΣ": "Phthiotis", "ΦΛΩΡΙΝΑΣ": "Florina",
    "ΦΩΚΙΔΑΣ": "Phocis", "ΧΑΛΚΙΔΙΚΗΣ": "Chalkidiki", "ΧΑΝΙΩΝ": "Chania", "ΧΙΟΥ": "Chios"}
PID = {k: "p%02d" % i for i, k in enumerate(sorted(PREF), 1)}
def pref(r):
    k = r["Περιφερειακή Ενότητα"].strip(); k = NORM.get(k, k)
    if k not in PREF: raise RuntimeError("unidad regional desconocida: %r" % k)
    return PID[k]

MILK = {"Αγελαδινό": "cow", "Πρόβειο": "sheep", "Γίδινο": "goat", "Βουβαλίσιο": "buffalo"}
# especies de sacrificio -> (grupo, id)
SPECIES = {"Βόειο": ("cattle", "adult-cattle"), "Βόειο Νεαρό Ζώο": ("cattle", "young-cattle"), "Νεαρό Μοσχάρι": ("cattle", "calf"), "Μόσχος Γάλακτος": ("cattle", "milk-calf"), "Βουβάλι": ("cattle", "buffalo"),
           "Χοίρος": ("pigs", "pig"), "Χοιρομητέρες": ("pigs", "sow"), "Χοιρίδια": ("pigs", "piglet"), "Αγριόχοιρος (εκμ)": ("pigs", "farmed-boar"),
           "Αρνί": ("lamb", "lamb"), "Αρνί Γάλακτος": ("lamb", "milk-lamb"), "Πρόβειο": ("sheep", "sheep"), "Ζυγούρι": ("sheep", "yearling"), "Βετούλι": ("sheep", "vetouli"),
           "Ερίφιο": ("kid", "kid"), "Ερίφιο Γάλακτος": ("kid", "milk-kid"), "Αίγειο": ("goat", "goat")}
GAME = {"Ζαρκάδι", "Ελάφι", "¶λλα θηράματα", "Αγριογούρουνο (θηρ)"}   # caza: minima, fuera
POULTRY = {"Απλό Κοτόπουλο": "broiler", "Βιολογικό Κοτόπουλο": "organic-broiler", "Ειδικής Εκτροφής": "special-breed", "Κότα": "hen", "Γαλοπούλα Λευκή": "white-turkey", "Γαλοπούλα Μαύρη": "black-turkey"}
GROUPS = {"ΓΑΛΑ ΠΑΣΤΕΡΙΩΜΕΝΟ": "milk-pasteurised", "ΓΑΛΑ ΥΨΗΛΗΣ ΘΕΡΜΙΚΗΣ ΕΠΕΞΕΡΓΑΣΙΑΣ": "milk-uht", "ΓΑΛΑ ΟΞΙΝΙΣΘΕΝΤΑ": "milk-fermented", "ΓΑΛΑ ΣΥΜΠΥΚΝΩΜΕΝΟ": "milk-condensed",
          "ΓΙΑΟΥΡΤΙ ΑΠΛΟ ΑΓΕΛΑΔΙΝΟ": "yogurt-cow", "ΓΙΑΟΥΡΤΙ ΑΠΛΟ ΠΡΟΒΕΙΟ": "yogurt-sheep", "ΓΙΑΟΥΡΤΙ ΑΠΛΟ ΓΙΔΙΝΟ": "yogurt-goat", "ΓΙΑΟΥΡΤΙ ΣΤΡΑΓΓΙΣΤΟ": "yogurt-strained", "ΓΙΑΟΥΡΤΙ ΔΙΑΦΟΡΑ": "yogurt-other",
          "ΤΥΡΙΑ ΜΑΛΑΚΑ": "cheese-soft", "ΤΥΡΙΑ ΣΚΛΗΡΑ-ΗΜΙΣΚΛΗΡΑ": "cheese-hard", "ΤΥΡΙΑ ΤΥΡΟΓΑΛΑΚΤΟΣ": "cheese-whey", "ΤΥΡΙΑ ΤΗΓΜΕΝΑ": "cheese-processed", "ΤΥΡΙΑ ΑΝΑΠΛΗΡΩΜΑΤΑ-ΑΠΟΜΙΜΗΣΗ": "cheese-analogue",
          "ΒΟΥΤΥΡΟ": "butter", "ΚΡΕΜΑ": "cream", "ΔΙΑΦΟΡΑ ΕΠΙΔΟΡΠΙΑ": "desserts", "ΔΙΑΦΟΡΑ ΡΟΦΗΜΑΤΑ": "drinks", "ΔΙΑΦΟΡΑ ΜΗ ΓΑΛΑΚΤΟΚΟΜΙΚΑ": "non-dairy", "ΔΙΑΦΟΡΑ": "other"}

def fetch_all(key, local):
    if local: return json.loads((Path(local) / (key + ".json")).read_text(encoding="utf-8"))
    pk, needle = RESOURCES[key]
    p = http(API + "package_show?id=" + PACKAGES[pk])["result"]
    cand = [r for r in p["resources"] if r.get("datastore_active") and needle in (r.get("name") or "")]
    if key == "dairy": cand = [r for r in cand if "ΠΟΠ" not in (r.get("name") or "")]   # el recurso de productos ΠΟΠ (DOP) repite la misma frase en su titulo
    if len(cand) != 1: raise RuntimeError("%s: %d recursos con %r" % (key, len(cand), needle))
    r = cand[0]
    lic = (r.get("license") or "")
    if not lic.endswith("CC_BY_4_0"): raise RuntimeError("%s: licencia distinta de CC BY 4.0 (%r): no se ingiere" % (key, lic))
    rows, off = [], 0
    while True:
        d = http(API + "datastore_search?resource_id=%s&limit=30000&offset=%d" % (r["id"], off))["result"]
        rows += d["records"]; off += len(d["records"])
        if off >= d["total"] or not d["records"]: break
    if off != d["total"]: raise RuntimeError(key + ": filas leidas distintas del total")
    return rows

def month_axis(rows):
    ms = sorted({(r["Έτος"], r["Μήνας ID"]) for r in rows})
    first, last = ms[0], ms[-1]
    axis, y, m = [], first[0], first[1]
    while (y, m) <= last:
        axis.append("%04d-%02d" % (y, m)); m += 1
        if m == 13: y, m = y + 1, 1
    missing = sorted(set(axis) - {"%04d-%02d" % k for k in ms})
    if missing: raise RuntimeError("meses sin ninguna fila: %s" % missing[:5])
    return axis
def mi(r, idx): return idx["%04d-%02d" % (r["Έτος"], r["Μήνας ID"])]
def n(v): return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else 0.0
def r1(v): return round(v, 1)
def annual(series_by_pref, axis, last_full):
    """suma por año natural de {pref: [valores mensuales]} -> {pref: {año: valor}}; el año en curso lleva solo los meses publicados"""
    out = {}
    for p, v in series_by_pref.items():
        d = defaultdict(float)
        for i, x in enumerate(v): d[axis[i][:4]] += x
        out[p] = {y: round(d[y]) for y in sorted(d)}
    return out
def pnames():
    return {pid: {"el": k, "en": PREF[k]} for k, pid in PID.items()}

def do_milk(rows, out):
    axis = month_axis(rows); idx = {m: i for i, m in enumerate(axis)}; N = len(axis)
    nat = {t: {"kg": [0.0] * N, "eur": [0.0] * N, "prod": [0.0] * N, "orgKg": [0.0] * N, "orgEur": [0.0] * N} for t in MILK.values()}
    byp = {t: defaultdict(lambda: {"kg": [0.0] * N, "eur": [0.0] * N}) for t in MILK.values()}
    seen = set()
    for r in rows:
        t = MILK[r["Είδος Γάλακτος"]]; i = mi(r, idx); p = pref(r); key = (i, p, t)
        if key in seen: raise RuntimeError("fila duplicada %s" % (key,))
        seen.add(key)
        kg, eur = n(r["Ποσότητα Σύνολο (Kg)"]), n(r["Αξία Σύνολο (€)"])
        if abs(kg - n(r["Ποσότητα Βιολογικό (Kg)"]) - n(r["Ποσότητα Συμβατικό (Kg)"])) > 2: raise RuntimeError("ecologico + convencional != total en %s" % (key,))
        a = nat[t]; a["kg"][i] += kg; a["eur"][i] += eur; a["prod"][i] += n(r["Πλήθος Παραγωγών Σύνολο"]); a["orgKg"][i] += n(r["Ποσότητα Βιολογικό (Kg)"]); a["orgEur"][i] += n(r["Αξία Βιολογικό (€)"])
        b = byp[t][p]; b["kg"][i] += kg; b["eur"][i] += eur
    res = {"months": axis, "types": {}, "prefectures": {}}
    for t, a in nat.items():
        price = [round(a["eur"][i] / a["kg"][i], 4) if a["kg"][i] > 0 else None for i in range(N)]
        for i, v in enumerate(price):
            if v is not None and t != "buffalo" and not 0.15 < v < 3.5: raise RuntimeError("precio nacional fuera de rango %s %s: %s" % (t, axis[i], v))
        res["types"][t] = {"kg": [round(x) for x in a["kg"]], "price": price, "producers": [round(x) for x in a["prod"]], "orgKg": [round(x) for x in a["orgKg"]]}
        if t != "buffalo" and sum(a["kg"]) < MIN_KG: raise RuntimeError("volumen nacional demasiado bajo " + t)
    for t in MILK.values():
        ak, ae = annual({p: v["kg"] for p, v in byp[t].items()}, axis, None), annual({p: v["eur"] for p, v in byp[t].items()}, axis, None)
        res["prefectures"][t] = {p: {"kg": ak[p], "eur": ae[p]} for p in ak}
    res["names"] = pnames(); res["lastMonth"] = axis[-1]
    out["milk"] = res; log("milk: %d filas, %d meses (%s..%s)" % (len(rows), N, axis[0], axis[-1]))

def do_meat(rows, prow, out):
    axis = month_axis(rows); idx = {m: i for i, m in enumerate(axis)}; N = len(axis)
    sp = defaultdict(lambda: {"heads": [0.0] * N, "kg": [0.0] * N}); grp = defaultdict(lambda: {"heads": [0.0] * N, "kg": [0.0] * N, "imp": [0.0] * N})
    byp = defaultdict(lambda: defaultdict(lambda: {"heads": [0.0] * N, "kg": [0.0] * N}))
    for r in rows:
        e = r["Είδος"].strip()
        if e in GAME: continue
        if e not in SPECIES: raise RuntimeError("especie de sacrificio desconocida: %r" % e)
        g, sid = SPECIES[e]; i = mi(r, idx); h, kg = n(r["Πλήθος Ζώων"]), n(r["Βάρος(Kg)"])
        if kg < 0 or h < 0: raise RuntimeError("valor negativo en sacrificio")
        s = sp[sid]; s["heads"][i] += h; s["kg"][i] += kg
        a = grp[g]; a["heads"][i] += h; a["kg"][i] += kg
        if r["Καταγωγή ID"] != 1: a["imp"][i] += kg
        b = byp[g][pref(r)]; b["heads"][i] += h; b["kg"][i] += kg
    res = {"months": axis, "groups": {}, "species": {}, "prefectures": {}}
    for g, a in grp.items():
        res["groups"][g] = {"heads": [round(x) for x in a["heads"]], "kg": [round(x) for x in a["kg"]], "importedKg": [round(x) for x in a["imp"]]}
    for s, a in sp.items(): res["species"][s] = {"group": next(v[0] for k, v in SPECIES.items() if v[1] == s), "heads": [round(x) for x in a["heads"]], "kg": [round(x) for x in a["kg"]]}
    for g in grp:
        ak, ah = annual({p: v["kg"] for p, v in byp[g].items()}, axis, None), annual({p: v["heads"] for p, v in byp[g].items()}, axis, None)
        res["prefectures"][g] = {p: {"kg": ak[p], "heads": ah[p]} for p in ak}
    # aves
    pa = month_axis(prow); pidx = {m: i for i, m in enumerate(pa)}; PN = len(pa)
    pl = {k: {"heads": [0.0] * PN, "kg": [0.0] * PN} for k in POULTRY.values()}; ppref = defaultdict(lambda: [0.0] * PN)
    for r in prow:
        i = mi(r, pidx)
        for lab, k in POULTRY.items():
            h, kg = n(r.get("Πλήθος Ζώων " + lab)), n(r.get("Βάρος " + lab + " (Kg)"))
            pl[k]["heads"][i] += h; pl[k]["kg"][i] += kg; ppref[pref(r)][i] += kg
    res["poultry"] = {"months": pa, "types": {k: {"heads": [round(x) for x in v["heads"]], "kg": [round(x) for x in v["kg"]]} for k, v in pl.items()}}
    pk = annual(ppref, pa, None); res["poultry"]["prefectures"] = pk
    res["names"] = pnames(); res["lastMonth"] = axis[-1]
    for g, a in res["groups"].items():
        if sum(a["kg"]) <= 0: raise RuntimeError("grupo sin kg: " + g)
    out["meat"] = res; log("meat: %d filas, %d meses; aves %d filas" % (len(rows), N, len(prow)))

def do_dairy(rows, drows, out):
    axis = month_axis(rows); idx = {m: i for i, m in enumerate(axis)}; N = len(axis)
    gr = {k: [0.0] * N for k in GROUPS.values()}
    for r in rows:
        g = r["Περιγραφή Ομάδας"].strip()
        if g not in GROUPS: raise RuntimeError("grupo lacteo desconocido: %r" % g)
        if n(r["Ποσότητα(Kg)"]) < 0: raise RuntimeError("kg negativos en lacteos")
        gr[GROUPS[g]][mi(r, idx)] += n(r["Ποσότητα(Kg)"])
    # DOP/IGP: nombre del producto tal como lo publica ELGO (sin el prefijo BIOLOGICO), con la parte ecologica aparte
    da = month_axis(drows); didx = {m: i for i, m in enumerate(da)}; DN = len(da)
    pdo = {}; fetaP = defaultdict(lambda: [0.0] * DN)
    for r in drows:
        raw = r["Περιγραφή Προϊόντος"].strip(); org = raw.startswith("ΒΙΟΛΟΓΙΚ")
        name = raw.replace("ΒΙΟΛΟΓΙΚΟ ", "").replace("ΒΙΟΛΟΓΙΚΗ ", "").strip(); code = r["Κωδικός Προϊόντος"]
        e = pdo.setdefault(name, {"code": code.lstrip(), "kg": [0.0] * DN, "orgKg": [0.0] * DN})
        e["kg"][mi(r, didx)] += n(r["Ποσότητα(Kg)"])
        if org: e["orgKg"][mi(r, didx)] += n(r["Ποσότητα(Kg)"])
        if "ΦΕΤΑ" in name: fetaP[pref(r)][mi(r, didx)] += n(r["Ποσότητα(Kg)"])
    res = {"months": axis, "groups": {k: [round(x) for x in v] for k, v in gr.items()},
           "pdo": {"months": da, "products": {k: {"code": v["code"], "kg": [round(x) for x in v["kg"]], "orgKg": [round(x) for x in v["orgKg"]]} for k, v in pdo.items()}},
           "fetaPrefectures": annual(fetaP, da, None), "names": pnames(), "lastMonth": axis[-1]}
    feta = res["pdo"]["products"].get("Π.Ο.Π. ΦΕΤΑ")
    if not feta or sum(feta["kg"]) < 1e7: raise RuntimeError("feta DOP ausente o demasiado baja")
    out["dairy"] = res; log("dairy: %d filas lacteos, %d filas DOP, %d meses" % (len(rows), len(drows), N))

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--local"); a = ap.parse_args()
    want = set((a.only or "milk,meat,dairy").split(","))
    out, errs = {}, []
    try:
        if "milk" in want: do_milk(fetch_all("milk", a.local), out)
        if "meat" in want: do_meat(fetch_all("meat", a.local), fetch_all("poultry", a.local), out)
        if "dairy" in want: do_dairy(fetch_all("dairy", a.local), fetch_all("pdo", a.local), out)
    except Exception as e:
        errs.append(str(e)); log("ERROR:", e)
    if errs or not out:
        log("no se escribe nada (falla cerrado)"); sys.exit(1)
    OUT.mkdir(parents=True, exist_ok=True)
    src = {"id": "elgo_dimitra", "name": "ELGO-DIMITRA (Hellenic Agricultural Organisation), via data.gov.gr", "url": "https://data.gov.gr/dataset/diacheirisi-stoicheion-paragogis-nopoy-galaktos"}
    for k, d in out.items():
        d = {"schemaVersion": 1, "generatedAt": now(), "source": src, "kind": k, **d}
        (OUT / (k + ".json")).write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        log("escrito", k, (OUT / (k + ".json")).stat().st_size, "bytes")
    (ROOT / "data" / "el-elgo-log.txt").write_text("\n".join(LOG) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
