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
