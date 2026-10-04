"""Motor de relaciones entre mercados (Cross-Market Intelligence 2.0). SOLO estadistica descriptiva: asociacion de CAMBIOS entre una serie de entrada (insumo) y una de mercado.
No predice, no estima causalidad y no se "ajusta" para salir bien. Todo lo que calcula se publica con su n, su periodo, su cobertura y su estabilidad de signo.
Usado por scripts/build-relationships.py y, para recalcular y comparar, por scripts/contract_tests.py.

Definiciones (identicas a las publicadas en data/relationships.json -> methodology):
  indice de periodo : mensual y*12+m-1; trimestral y*4+q-1. Los datos semanales se promedian por mes; las series de cuota/indice trimestral siguen trimestrales.
  cambio            : v_t / v_(t-1) - 1 (solo si ambos periodos consecutivos existen). Si las dos series tienen moneda distinta, ambas se pasan a EUR con el tipo mensual del BCE
                      (mes exacto o el anterior, maximo 2 meses; si no hay, el punto no se usa); si no, se usan en su moneda original.
  correlacion(lag)  : Pearson entre cambio_entrada(t) y cambio_mercado(t+lag) sobre los t con ambos datos. n = numero de pares.
  rezago elegido    : el de mayor |r| entre los rezagos probados con n >= minimo. Es el mejor de K rezagos, por lo que la correlacion es OPTIMISTA (se declara).
  cobertura         : n / numero de periodos del tramo [primer par, ultimo par].
  estabilidad signo : proporcion de ventanas rodantes (W pares, paso W//6) cuya correlacion tiene el mismo signo que la global (null con menos de 3 ventanas).
  confianza         : sobre la ESTABILIDAD de la asociacion estadistica; no es una probabilidad ni valida la hipotesis economica."""
import datetime, math

MON = {m: i + 1 for i, m in enumerate('JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split())}
MIN_N = {'monthly': 24, 'quarterly': 12, 'annual': 20}
WINDOW = {'monthly': 36, 'quarterly': 12, 'annual': 12}

def period_index(year, period, freq):
    """Indice entero del periodo de una fila de historico, o None. Mensual: 'JAN', '1', '01', 'MM-DD'; trimestral: 'Qn'."""
    p = str(period).strip().upper()
    if freq == 'annual': return year
    if freq == 'quarterly':
        if len(p) == 2 and p[0] == 'Q' and p[1] in '1234': return year * 4 + int(p[1]) - 1
        return None
    m = None
    if p in MON: m = MON[p]
    elif p.isdigit(): m = int(p)
    elif len(p) == 5 and p[2] == '-' and p[:2].isdigit() and p[3:].isdigit(): m = int(p[:2])
    if m is None or not 1 <= m <= 12: return None
    return year * 12 + m - 1

def ym_of(idx, freq):
    if freq == 'annual': return '%04d' % idx
    if freq == 'quarterly': return '%04d-Q%d' % (idx // 4, idx % 4 + 1)
    return '%04d-%02d' % (idx // 12, idx % 12 + 1)

def aggregate(history, freq):
    """filas {period, year, value} -> {indice: media del periodo}. Semanal/diario -> mensual (media); mensual con varias lecturas en el mes -> media."""
    acc = {}
    for h in history:
        v = h.get('value')
        if not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v): continue
        i = period_index(h['year'], h['period'], freq)
        if i is None: continue
        acc.setdefault(i, []).append(v)
    return {i: sum(v) / len(v) for i, v in acc.items()}

def fx_table(fx):
    """data/fx-history.json -> {moneda: {'YYYY-MM': unidades por EUR}}"""
    return {c: {r[0]: r[1] for r in rows if r[1] and r[1] > 0} for c, rows in (fx or {}).get('currencies', {}).items()}

def to_eur(series, cur, fx, freq):
    """Convierte una serie mensual a EUR con el tipo del mes (o el anterior, maximo 2 meses). Los meses sin tipo se descartan."""
    if cur == 'EUR': return dict(series)
    t = fx.get(cur) or {}
    out = {}
    for i, v in series.items():
        rate = None
        for g in range(0, 3):
            k = ym_of(i - g, 'monthly')
            if k in t: rate = t[k]; break
        if rate: out[i] = v / rate
    return out

def changes(series):
    out = {}
    for i, v in series.items():
        p = series.get(i - 1)
        if p is not None and p > 0: out[i] = v / p - 1
    return out

def pearson(a, b):
    n = len(a)
    if n < 3: return None
    ma = sum(a) / n; mb = sum(b) / n
    xy = sum((x - ma) * (y - mb) for x, y in zip(a, b)); xx = sum((x - ma) ** 2 for x in a); yy = sum((y - mb) ** 2 for y in b)
    if xx <= 0 or yy <= 0: return None
    return xy / math.sqrt(xx * yy)

def pairs_at(xr, yr, lag):
    return [(t, xr[t], yr[t + lag]) for t in sorted(xr) if (t + lag) in yr]

def corr_at(xr, yr, lag):
    p = pairs_at(xr, yr, lag)
    r = pearson([x[1] for x in p], [x[2] for x in p])
    return r, len(p), p

def sign_stability(p, r, freq):
    W = WINDOW[freq]; step = max(1, W // 6)
    if r is None or len(p) < W: return None, 0
    same = tot = 0
    for s in range(0, len(p) - W + 1, step):
        w = p[s:s + W]; rw = pearson([x[1] for x in w], [x[2] for x in w])
        if rw is None: continue
        tot += 1
        if (rw > 0) == (r > 0): same += 1
    return (round(same / tot, 3) if tot >= 3 else None), tot

def strength(r):
    a = abs(r)
    return 'negligible' if a < 0.1 else 'weak' if a < 0.3 else 'moderate' if a < 0.5 else 'strong'

def confidence(n, r, stab, cov, freq):
    """HIGH / MEDIUM / LOW segun muestra, fuerza, estabilidad de signo y cobertura. Describe cuanto se sostiene la ASOCIACION, no la hipotesis economica."""
    if r is None: return 'LOW'
    a = abs(r); big = {'monthly': 60, 'quarterly': 24, 'annual': 25}[freq]; mid = {'monthly': 36, 'quarterly': 16, 'annual': 18}[freq]
    if n >= big and a >= 0.4 and stab is not None and stab >= 0.75 and cov >= 0.8: return 'HIGH'
    if n >= mid and a >= 0.25 and stab is not None and stab >= 0.6: return 'MEDIUM'
    return 'LOW'

def status_of(n, r, stab, freq):
    if r is None or n < MIN_N[freq]: return 'INSUFFICIENT_DATA'
    if abs(r) < 0.2 or (stab is not None and stab < 0.5): return 'WEAK_OR_UNSTABLE'
    return 'OBSERVED_RELATIONSHIP'

def analyse(x, y, freq, lags, recent_pairs=36, xmode='change'):
    """x, y: series {indice: valor} ya en la misma moneda. Devuelve el resultado estadistico completo o None si no hay ningun par."""
    xr, yr = (dict(x) if xmode == 'level' else changes(x)), changes(y)
    prof = []; best = None
    for L in lags:
        r, n, p = corr_at(xr, yr, L)
        prof.append([L, None if r is None else round(r, 4), n])
        if r is not None and n >= MIN_N[freq] and (best is None or abs(r) > abs(best[1])): best = (L, r, n, p)
    if best is None:  # sin ningun rezago con muestra suficiente: se publica el de mayor muestra como INSUFFICIENT_DATA, no se elige por correlacion
        cand = [(n, L) for L, _, n in prof]; nmax, L0 = max(cand)
        if nmax == 0: return None
        r, n, p = corr_at(xr, yr, L0); best = (L0, r, n, p)
    L, r, n, p = best
    first, last = p[0][0], p[-1][0]; span = last - first + 1
    cov = round(n / span, 3) if span > 0 else 0
    stab, nw = sign_stability(p, r, freq)
    rec = p[-recent_pairs:]; rr = pearson([a[1] for a in rec], [a[2] for a in rec]) if len(rec) >= recent_pairs else None
    return {'lag': L, 'r': None if r is None else round(r, 4), 'n': n, 'first': first, 'last': last, 'coverage': cov, 'stability': stab, 'windows': nw,
            'recentR': None if rr is None else round(rr, 4), 'profile': prof, 'lagsTested': len(lags)}

def climate_series(clim, loc_id, kind):
    """data/climate-history.json -> {indice mensual: anomalia}. precip: (precipitacion del mes / climatologia 2001-2020 del mismo mes - 1) x 100 (%); temp: temperatura media - climatologia (grados C).
    Se omite el mes sin dato o sin climatologia. Es un NIVEL de anomalia (no un cambio), por eso se usa con xmode='level'."""
    L = next((l for l in clim['locations'] if l['id'] == loc_id), None)
    if not L: return None
    y0, m0 = int(clim['start'][:4]), int(clim['start'][5:7]); out = {}
    vals, base = (L['precipMmDay'], L['baselinePrecipMmDay']) if kind == 'precip' else (L['tempC'], L['baselineTempC'])
    for k, v in enumerate(vals):
        m = (m0 - 1 + k) % 12; b = base[m]
        if v is None or b is None: continue
        if kind == 'precip':
            if b <= 0: continue
            out[y0 * 12 + m0 - 1 + k] = (v / b - 1) * 100
        else: out[y0 * 12 + m0 - 1 + k] = v - b
    return out

def crop_year_average(history, start_month=8):
    """Serie mensual -> {anio de inicio de campana: media} solo con los 12 meses de la campana (agosto-julio por defecto). Una campana incompleta se descarta."""
    by = {}
    for h in history:
        v = h.get('value')
        if not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v): continue
        i = period_index(h['year'], h['period'], 'monthly')
        if i is None: continue
        cy = (i - (start_month - 1)) // 12
        by.setdefault(cy, {})[i] = v
    return {cy: sum(m.values()) / 12 for cy, m in by.items() if len(m) == 12}
