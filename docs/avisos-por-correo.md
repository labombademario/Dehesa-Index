# Avisos de precio por correo

Qué está hecho y qué falta para que salga el primer correo.

## Hecho (sin cuenta de nadie)
- `scripts/build-digest.py` calcula los movimientos de precio desde la API (`data/api/v1`) y escribe `data/digest/` (`events.json`, `weekly.json` y los feeds `feed.xml` / `feed-en.xml`). Corre en `update-pipeline-status.yml`, justo después de la API.
- La página `avisos.html` enseña los mayores movimientos y ofrece el feed. El formulario de correo **no se muestra** hasta que se configura el proveedor.
- `scripts/send-digest.py` prepara el correo en español o inglés. Por defecto es un ensayo: no envía nada. Solo envía con `--send` y la variable `DIGEST_API_KEY`.
- Cada correo lleva solo movimientos que no se enviaron antes (`data/digest/sent.json`).

## Lo que tiene que hacer una persona (dos pasos)
1. **Crear la cuenta del proveedor** (el script está hecho para Buttondown: https://buttondown.com). Ahí se gestionan las altas, las bajas y el consentimiento. Opcional: crear dos etiquetas, `es` y `en`.
2. **Dos datos:**
   - En `js/shared.js`, campo `digest.action`: la dirección de alta de Buttondown (`https://buttondown.com/api/emails/embed-subscribe/<usuario>`). Con eso el formulario aparece y el aviso legal añade el párrafo de privacidad.
   - En GitHub, *Settings → Secrets → Actions*: crear `DIGEST_API_KEY` con la clave de la API de Buttondown.

## Para enviar cada semana
Añadir un workflow manual o programado que ejecute `python3 scripts/send-digest.py --lang es --send` (y luego `--lang en`) con `DIGEST_API_KEY` en el entorno, y que haga commit de `data/digest/sent.json`. No está añadido todavía a propósito: sin clave no tiene sentido, y cada workflow nuevo exige su entrada en el estado de pipelines.

## Probar sin enviar
```
python3 scripts/send-digest.py --out /tmp/correo.html
python3 scripts/test-digest.py
```

## Envío semanal automático (`.github/workflows/send-digest.yml`)

- Se ejecuta los lunes a las 07:30 UTC y **siempre en ensayo**: no envía nada real mientras la variable del repositorio `DIGEST_LIVE` no valga `true` (Settings → Secrets and variables → Actions → Variables).
- Manual: Actions → «Resumen semanal por correo» → Run workflow. Sin marcar `send` es ensayo. Marcando `send` envía de verdad (no necesita `DIGEST_LIVE`).
- Necesita el secreto `DIGEST_API_KEY` (clave de Buttondown).
- Cada suscriptor recibe solo el correo de su idioma: el formulario lo etiqueta `es` (español) o `en` (inglés, también para francés e italiano) y el envío filtra por esa etiqueta usando el id que Buttondown le da. Si no existe la etiqueta de un idioma, ese idioma no se envía.
- Lo enviado se guarda en `data/digest/sent.json` para que un movimiento no se repita.
- Primer envío recomendado: un Run workflow manual en ensayo, revisar el resumen del job, y después uno con `send`. Para activar el envío programado, crear la variable `DIGEST_LIVE = true`.
- No comprobado contra la API real de Buttondown (solo con una API simulada en `scripts/test-digest.py`): vigilar el primer envío.

## Estado a 26-oct-2026
- La cuenta de Buttondown (`dehesa_index`) ya existe y el formulario de alta de `avisos.html` está conectado a ella.
- El envío del lunes 26-oct fue **ensayo** (el paso «Envío real» salió como omitido): falta una de estas dos cosas en GitHub (*Settings → Secrets and variables → Actions*): el secreto `DIGEST_API_KEY` (clave de la API de Buttondown) y la variable `DIGEST_LIVE` con valor `true`. Hasta entonces nadie recibe nada.
- Lo que se envía es un **resumen semanal** de los mayores movimientos de precio. Los avisos *por umbral* (que cada persona elija «avísame si el trigo baja de X») no existen: necesitan guardar las preferencias de cada suscriptor, y sin servidor eso lo tendría que hacer el proveedor de correo.
- La lista de espera de la API de `/empresas` usa la misma cuenta con la etiqueta `api-empresas`, que no recibe el resumen (ver `docs/formulario-empresas.md`).
