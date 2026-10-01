"""Freshness Engine 2.0 (Python). MISMO algoritmo que js/freshness.js; scripts/test-freshness-parity.mjs lo comprueba.
Politica en data/freshness-policy.json. Estados: LIVE, FRESH, EXPECTED_DELAY, DELAYED, STALE, PENDING."""
import calendar, datetime, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / "data/freshness-policy.json").read_text(encoding="utf-8"))
_DAY = datetime.date(1970, 1, 1)
def _ord(d): return (d - _DAY).days
def parse_end(s, freq):
    """Dias (desde 1970-01-01, UTC) del FIN del periodo observado, o None. Acepta YYYY, YYYY-MM, YYYY-MM-DD, YYYY-Qn, YYYY-Sn."""
    m = re.match(r"^(\d{4})(?:-(\d{2}|Q[1-4]|S[12]))?(?:-(\d{2}))?", str(s or ""))
    if not m: return None
    y = int(m.group(1)); p = m.group(2); dd = m.group(3)
    try:
        if p and p[0] == "Q": mo = int(p[1]) * 3; return _ord(datetime.date(y, mo, calendar.monthrange(y, mo)[1]))
        if p and p[0] == "S": mo = int(p[1]) * 6; return _ord(datetime.date(y, mo, calendar.monthrange(y, mo)[1]))
        if freq == "annual": return _ord(datetime.date(y, 12, 31))
        if not p: return _ord(datetime.date(y, 12, 31)) if freq in ("annual", "monthly", "quarterly", "semiannual") else _ord(datetime.date(y, 1, 1))
        mo = int(p)
        if freq == "quarterly": mo = (mo - 1) // 3 * 3 + 3
        elif freq == "semiannual": mo = (mo - 1) // 6 * 6 + 6
        if freq in ("monthly", "quarterly", "semiannual", "annual"): return _ord(datetime.date(y, mo, calendar.monthrange(y, mo)[1]))
        return _ord(datetime.date(y, mo, int(dd or 1)))
    except ValueError: return None
def lag_for(source, freq):
    s = POLICY["sources"].get(source or "", {}).get("lagDays", {})
    return s.get(freq, POLICY["defaultLagDays"].get(freq, POLICY["defaultLagDays"]["monthly"]))
def _rnd(x): return int(x + 0.5)
def evaluate(date, freq, source, now_day):
    """-> dict(state, ageDays, periodEnd, lagDays, due, liveUntil, graceUntil, staleAfter) en dias-ordinales; now_day = dias desde 1970-01-01 UTC (entero)."""
    end = parse_end(date, freq)
    if end is None: return {"state": "PENDING", "ageDays": None}
    P = POLICY; period = P["periodDays"].get(freq, P["periodDays"]["monthly"]); lag = lag_for(source, freq)
    due = end + period + lag
    live = end + lag + max(2, _rnd(P["liveFactor"] * period))
    grace = due + max(P["grace"]["minDays"], min(P["grace"]["maxDays"], _rnd(P["grace"]["factor"] * period)))
    stale = due + min(P["staleAfter"]["maxDays"], _rnd(P["staleAfter"]["factor"] * period))
    st = "LIVE" if now_day <= live else "FRESH" if now_day <= due else "EXPECTED_DELAY" if now_day <= grace else "DELAYED" if now_day <= stale else "STALE"
    return {"state": st, "ageDays": now_day - end, "periodEnd": end, "lagDays": lag, "due": due, "liveUntil": live, "graceUntil": grace, "staleAfter": stale}
def iso(day): return (_DAY + datetime.timedelta(days=day)).isoformat()
def today_ord(now_ms=None):
    t = datetime.datetime.now(datetime.timezone.utc) if now_ms is None else datetime.datetime.fromtimestamp(now_ms / 1000, datetime.timezone.utc)
    return _ord(t.date())
def explain(r, freq):
    if r["state"] == "PENDING": return "sin fecha de observacion valida"
    return "periodo cerrado el %s; con el rezago habitual de la fuente (%d d) el siguiente dato %s se espera el %s" % (iso(r["periodEnd"]), r["lagDays"], freq, iso(r["due"]))
