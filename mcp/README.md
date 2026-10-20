# Conector de Dehesa Index para asistentes de IA (MCP)

Deja que Claude, ChatGPT, Copilot u otro cliente compatible con MCP consulte los precios de Dehesa Index con su fuente, su licencia y su fecha. Lee la API pública (`data/api/v1/`), los avisos (`data/digest/`) y las cestas (`data/indices/`). Solo lectura: no escribe nada ni usa claves.

## Herramientas

| Herramienta | Para qué |
|---|---|
| `search_series` | Buscar series por texto, región o producto |
| `get_latest` | Último dato de una o varias series |
| `get_series` | Histórico de una serie (por defecto los 120 últimos puntos) |
| `compare_markets` | Un producto en todos los mercados que lo publican (las unidades pueden diferir) |
| `price_moves` | Mayores subidas y bajadas recientes |
| `list_baskets` / `get_basket` | Cestas de precios (base 100) con su metodología |

Cada respuesta incluye fuente, licencia, atribución y el enlace a las condiciones de uso. Quien use los datos debe citar la atribución. Nada se estima.

## Uso local (Claude Desktop y similares)

```
git clone https://github.com/labombademario/Dehesa-Index.git
```

En la configuración del cliente:

```json
{ "mcpServers": { "dehesa-index": { "command": "node", "args": ["/ruta/a/Dehesa-Index/mcp/server.mjs"] } } }
```

Sin variables, lee `https://dehesaindex.com`. Con `DEHESA_DATA_DIR=/ruta/a/Dehesa-Index` lee los ficheros del clon. Requiere Node 18 o superior. Pruebas: `node scripts/test-mcp.mjs`.

## Servidor remoto (desplegado)

`worker.mjs` es un Cloudflare Worker sin estado (un POST = un mensaje JSON-RPC), publicado en `https://dehesa-index-mcp.dehesaindex.workers.dev` (un GET devuelve 405; solo admite POST). Es de solo lectura, sin autenticación, y lee los datos de `https://dehesaindex.com`. Está probado con peticiones directas (`initialize`, `tools/list` y las siete herramientas), no con todos los clientes de IA.

Para volver a publicarlo hace falta una cuenta de Cloudflare: `cd mcp && npx wrangler deploy`. La versión desplegada hoy se pegó a mano desde el editor del panel de Cloudflare con el código empaquetado de `worker.mjs` y `core.mjs`; si cambias el código aquí, hay que volver a desplegar.

Límites del plan gratuito de Cloudflare: 100.000 peticiones al día. Al no tener autenticación conviene una regla de límite de peticiones en el panel.
