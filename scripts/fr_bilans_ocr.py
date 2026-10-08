#!/usr/bin/env python3
"""Lectura por OCR (tesseract) de las tablas de «Bilans céréaliers annuels» de FranceAgriMer (PDF sin capa de texto).
Devuelve filas (etiqueta, valores por columna) asignando cada número a su columna por la posición horizontal de la cabecera, y no por el texto,
porque el OCR separa «33 305» en dos palabras. Los valores se validan después en build_supply_balances.build_fr (cuadres del balance)."""
import csv, io, re, subprocess, tempfile
from pathlib import Path


def ocr_page(pdf, page, dpi=400, psm=6):
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["pdftoppm", "-r", str(dpi), "-f", str(page), "-l", str(page), "-png", str(pdf), str(Path(d) / "p")], check=True)
        png = sorted(Path(d).glob("p*.png"))[0]
        out = subprocess.run(["tesseract", str(png), "stdout", "--psm", str(psm), "tsv"], check=True, capture_output=True, text=True).stdout
    words = []
    for r in csv.DictReader(io.StringIO(out), delimiter="\t", quoting=csv.QUOTE_NONE):
        if r["level"] == "5" and (r["text"] or "").strip():
            words.append({"t": r["text"].strip(), "x": int(r["left"]) + int(r["width"]) / 2, "l": int(r["left"]), "y": int(r["top"]) + int(r["height"]) / 2})
    return words


def table(words):
    """-> (cabeceras [(texto, x)], filas [(etiqueta, {col: texto numérico})]) de la primera tabla de la página (la de «Bilan de marché»)."""
    heads = sorted([(w["t"], w["x"], w["y"]) for w in words if re.fullmatch(r"\d{4}/\d{2}", w["t"])], key=lambda h: (round(h[2] / 40), h[1]))
    # La fila de cabecera principal es la que más campañas tiene en la misma altura (la de «Bilan de marché»).
    by_y = {}
    for h in heads: by_y.setdefault(round(h[2] / 25), []).append(h)
    ys = sorted(by_y.values(), key=lambda g: (-len(g), g[0][2]))
    cand = [g for g in ys if len(g) >= 10]
    return cand, words


def rows_of(words, hdr, ymin, ymax=None, label_max_x=None):
    """Agrupa palabras en filas por altura y asigna números a las columnas de hdr [(texto, x)]."""
    cx = [h[1] for h in hdr]
    left = min(cx) - (cx[1] - cx[0]) / 2 if label_max_x is None else label_max_x
    ws = [w for w in words if w["y"] > ymin and (ymax is None or w["y"] < ymax)]
    ws.sort(key=lambda w: w["y"])
    lines, cur = [], []
    for w in ws:
        if cur and abs(w["y"] - cur[-1]["y"]) > 16: lines.append(cur); cur = []
        cur.append(w)
    if cur: lines.append(cur)
    out = []
    for ln in lines:
        lab = " ".join(w["t"] for w in sorted(ln, key=lambda w: w["x"]) if w["x"] < left)
        vals = {}
        for w in sorted(ln, key=lambda w: w["x"]):
            if w["x"] < left or not re.fullmatch(r"[\d,.\-]+", w["t"]): continue
            j = min(range(len(cx)), key=lambda k: abs(cx[k] - w["x"]))
            if abs(cx[j] - w["x"]) > (cx[1] - cx[0]) * 0.65: continue
            vals[j] = vals.get(j, "") + w["t"]
        out.append((lab.strip(), vals, ln[0]["y"]))
    return out
