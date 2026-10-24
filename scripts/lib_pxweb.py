"""Ayudantes comunes de las APIs PxWeb (Jordbruksverket, SCB, Luke, Statistics Finland) que usan los scripts update-se-*.py y update-fi-*.py.
Solo contiene lo que era identico en los cuatro scripts: cliente HTTP con pausa y reintentos, normalizacion de textos, numeros y meses, y la seleccion
por texto exacto de los valores de una variable. Lo especifico de cada fuente (URL base, pausas, bloques de series) se queda en su script.
Uso: from lib_pxweb import UA, make_say, make_call, num, clean, slug, var, pick, month"""
import json, re, sys, time, urllib.request

UA = {'User-Agent': 'DehesaIndex/1.0 (+https://dehesaindex.com)', 'Content-Type': 'application/json'}


def make_say(log):
    """say(*args): imprime y apunta en `log` (que el script escribe luego en data/<fuente>-log.txt)."""
    def say(*a):
        s = ' '.join(str(x) for x in a); log.append(s); print(s, flush=True)
    return say


def make_call(pause=0.0, tries=3, backoff=5, base=''):
    """Devuelve call(u, data=None) -> JSON. `pause`: espera antes de cada intento (limite de la API); `backoff`: segundos x n.o de intento tras un fallo.
    `base` se antepone a u (vacio si el script ya pasa la URL completa)."""
    def call(u, data=None):
        err = None
        for k in range(tries):
            if pause: time.sleep(pause)
            try:
                with urllib.request.urlopen(urllib.request.Request(base + u, data=data, headers=UA), timeout=120) as r:
                    return json.loads(r.read().decode('utf-8-sig'))
            except Exception as e:
                err = e; time.sleep(backoff * (k + 1))
        raise RuntimeError('%s -> %s' % (u, err))
    return call


def clean(t):
    return re.sub(r'\s+', ' ', t).strip()


def slug(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def num(x):
    """Numero de una celda PxWeb: coma decimal, espacios de millar; '..', '-' o vacio -> None."""
    try:
        v = float(str(x).replace(',', '.').replace(' ', '')); return v if v == v else None
    except Exception:
        return None


def month(t):
    """'2026M08' -> '2026-08'; cualquier otra cosa -> None."""
    m = re.match(r'^(\d{4})M(\d{2})$', t.strip()); return '%s-%s' % m.groups() if m else None


def var(m, code):
    return next(v for v in m['variables'] if v['code'] == code)


def pick(v, wanted, what):
    """Codigos de los valores de la variable `v` cuyo texto (espacios normalizados) coincide exactamente con `wanted`; si falta alguno, error claro (la tabla cambio)."""
    t2c = {clean(x): c for c, x in zip(v['values'], v['valueTexts'])}
    miss = [w for w in wanted if clean(w) not in t2c]
    if miss: raise RuntimeError('%s: valores que ya no existen en la fuente: %s' % (what, miss))
    return [t2c[clean(w)] for w in wanted]
