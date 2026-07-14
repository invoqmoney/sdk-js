# SDKs de invoq para JavaScript

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · **Español** · [Français](./README.fr.md) · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · [ไทย](./README.th.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)

> Este documento es una traducción del README en inglés; si algo difiere, vale la [versión en inglés](../README.md).

Acepta pagos en stablecoins en tu sitio web con una ventana de pago integrada en la página, sin que el comprador tenga que salir de ella. [invoq](https://invoq.money) no custodia fondos: el dinero llega directo a tu propia billetera, invoq nunca lo retiene.

- Crea facturas de pago desde tu servidor.
- Abre una ventana de pago en stablecoins dentro de tu sitio.
- Procesa pedidos de forma segura con webhooks firmados.

<img src="../assets/checkout-modal.png" alt="Ventana de pago en stablecoins de invoq dentro del sitio de un comercio" width="768">

¿Quieres verlo primero? La página de inicio de [invoq.money](https://invoq.money) tiene una demo interactiva de este checkout: puedes completar un pago simulado en segundos.

## Por qué invoq

- **Tu billetera, no la nuestra.** Cada pago aterriza en una billetera que solo tú controlas — invoq no puede cambiar su destino.
- **USDC y USDT en nueve redes.** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum.
- **Sin gas para cobrar.** El comprador paga su propia comisión de envío; invoq cubre la liquidación on-chain.
- **Tus compradores no se registran en nada.** Cualquier billetera puede pagar — directo desde un exchange también funciona. El checkout está disponible en diez idiomas.
- **Precios simples.** Los primeros 10 pagos sin comisión, luego 0.5%, sin ningún otro cargo — mira los precios vigentes en [invoq.money](https://invoq.money).

## SDKs de servidor

Crea facturas y verifica webhooks desde tu backend en cualquiera de estos lenguajes — la misma REST API y la misma firma de webhook. Este repositorio es el SDK de JavaScript.

| Lenguaje | Repositorio |
| --- | --- |
| Node.js | **este repositorio** — `@invoq/server` |
| Python | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php) |
| Go | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go) |
| Rust | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust) |
| Ruby | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby) |

Elijas el backend que elijas, el lado del navegador es el mismo: **`@invoq/checkout`** (en este repositorio) abre la ventana de pago integrada en la página para cualquier frontend.

## Instalación

Instala el paquete de servidor en tu backend:

```sh
npm install @invoq/server
```

Instala el paquete de checkout en tu frontend:

```sh
npm install @invoq/checkout
```

Ambos paquetes están escritos en TypeScript e incluyen definiciones de tipos. `@invoq/server` requiere Node.js 20 o más nuevo — en producción, usa una línea LTS de Node.js con soporte vigente, como Node.js 22 o 24. `@invoq/checkout` no tiene dependencias en tiempo de ejecución y funciona con cualquier framework, o directo desde un `<script>` de CDN.

## Consigue tus claves

1. Inicia sesión en el [panel de invoq](https://app.invoq.money) y crea un proyecto.
2. En la página **API keys**, crea una clave secreta. Las claves de prueba empiezan con `sk_test_`, las claves de producción con `sk_live_`. El modo de la clave determina si las facturas son de prueba o de producción.
3. En la configuración de **webhooks** de tu proyecto, guarda tu URL de webhook. El secreto del webhook (`whsec_...`) de ese modo se muestra una sola vez, cuando activas el webhook por primera vez — guárdalo de inmediato. La URL del webhook debe ser HTTPS y pública.

Agrega ambos al entorno de tu servidor:

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

Empieza con las claves de prueba. Cambia a la clave de producción y al secreto de webhook de producción cuando pases a producción.

## Inicio rápido

Vas a agregar:

- Una ruta de servidor para crear la factura.
- Una ruta de servidor para recibir webhooks.
- Un botón en el frontend para abrir el checkout.

Crea una factura en tu servidor con tu clave secreta:

```ts
import { Invoq } from '@invoq/server'

const invoq = new Invoq(process.env.INVOQ_SECRET_KEY!)

export async function POST() {
  const invoice = await invoq.invoices.create({
    amount: '129',
    currency: 'USD',
    description: 'SaaS boilerplate',
    reference_id: 'order_1234',
  })

  return Response.json({ invoiceId: invoice.id })
}
```

Notas:

- Los ejemplos de servidor usan manejadores de rutas basados en la Web Fetch API (Next.js App Router, Hono y similares). En Express, envía la respuesta con `res.json({ invoiceId: invoice.id })`.
- Define el monto en el servidor. No confíes en montos que manda el cliente.
- `amount` es una cadena decimal en USD de `'0.01'` a `'999.99'` con hasta 2 decimales, como `'129'` o `'129.99'`.
- Usa `reference_id` para vincular los webhooks `invoice.paid` con tu pedido. También hace que puedas reintentar la creación sin riesgo: si creas otra factura con el mismo `reference_id` y los mismos términos, recibes la factura existente en lugar de un duplicado; si los términos son distintos, falla con un error de API `409 reference_id_conflict`.

En tu frontend, llama primero a tu ruta de servidor y pasa el `invoiceId` devuelto al checkout:

```tsx
'use client'

import { openCheckout } from '@invoq/checkout'

export function PayButton() {
  async function handlePay() {
    const response = await fetch('/api/invoq/invoices', {
      method: 'POST',
    })
    const { invoiceId } = await response.json()
    const result = await openCheckout(invoiceId).result

    if (result.status === 'paid' || result.status === 'overpaid') {
      // Muestra un estado de éxito en tu UI.
    } else if (result.status === 'review_required') {
      // Muestra un estado pendiente de revisión. No proceses el pedido desde el resultado del navegador.
    } else if (result.status === 'failed') {
      // El checkout no cargó. Muestra un error y ofrece reintentar.
    }
  }

  return <button onClick={handlePay}>Pagar con stablecoin</button>
}
```

`@invoq/checkout` no depende de ningún framework. React, Vue, Svelte, JavaScript puro y cualquier otro frontend usan la misma llamada `openCheckout(invoiceId)`.

Recibe los webhooks en tu servidor:

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // Procesa el pedido de esta factura.
    // event.data.invoice.reference_id es tu reference_id.
  }

  return Response.json({ received: true })
}
```

Usa los webhooks `invoice.paid` para procesar los pedidos en tu servidor. Cuando `isInvoicePaid(event)` es true, la factura está lista para procesarse automáticamente; usa el `reference_id` de la factura para encontrar y procesar tu pedido. Una factura `review_required` aún no emite un webhook `invoice.paid`; si el checkout devuelve `review_required`, muestra un estado pendiente de revisión y espera un webhook `invoice.paid` posterior después de que se apruebe la revisión.

Los resultados `paid`, `overpaid` y `review_required` del navegador son solo señales para la interfaz. No proceses pedidos a partir de resultados del navegador. En producción, agrega tu propio estado de carga y manejo de errores alrededor de este flujo.

## Página de pago alojada

Cada factura también tiene una página de pago alojada en `https://pay.invoq.money/<id de factura>` — comparte el enlace o redirige ahí cuando la ventana integrada no encaje. También puedes crear facturas y copiar sus enlaces de pago en el [panel](https://app.invoq.money), sin escribir código.

## Pruébalo de punta a punta

Las facturas de prueba no pueden recibir fondos reales. Simula el pago desde tu servidor:

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` solo funciona con facturas creadas con una clave `sk_test_`. Cuando los pagos alcanzan el monto de la factura, la factura pasa a `paid` e invoq envía un webhook `invoice.paid` firmado de verdad a tu URL de webhook de prueba, así que pruebas todo tu flujo de procesamiento de pedidos. Se permiten montos parciales, que producen `partially_paid`.

Para recibir webhooks en tu máquina, expón tu servidor local con un túnel HTTPS como ngrok o cloudflared y guarda la URL del túnel como tu URL de webhook de prueba en el panel. El panel también puede enviar un `webhook.ping` firmado para revisar la conectividad.

## Webhooks en producción

**Verifica el cuerpo sin procesar de la solicitud.** Las firmas se calculan sobre los bytes exactos que envía invoq. Si tu framework procesa el JSON antes de que puedas leer el texto sin procesar, la verificación falla. Por ejemplo, en Express:

```ts
import express from 'express'
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

app.post(
  '/invoq/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    let event
    try {
      event = verifyWebhook(
        req.body,
        req.headers,
        process.env.INVOQ_WEBHOOK_SECRET!,
      )
    } catch {
      res.status(400).json({ error: 'invalid signature' })
      return
    }

    if (isInvoicePaid(event)) {
      // Procesa el pedido.
    }

    res.json({ received: true })
  },
)
```

**Procesa de forma idempotente.** Las entregas fallidas se reintentan (hasta 5 intentos a lo largo de unas horas, con espera creciente entre reintentos), así que tu ruta puede recibir el mismo evento más de una vez. Registra los pedidos ya procesados por `reference_id` o por `id` de factura y trata las entregas repetidas como operaciones sin efecto.

**Responde con un 2xx rápido.** Cualquier otro estado cuenta como entrega fallida: los tiempos de espera, `429` y `5xx` se reintentan, mientras que otros `4xx` no.

`verifyWebhook` lanza `InvoqSignatureVerificationError` cuando la firma falta, es inválida o el timestamp está corrido más de 5 minutos — responde con un 400. El encabezado de firma es `invoq-signature: t=<segundos unix>,v1=<HMAC-SHA256 en hex de "<t>.<cuerpo sin procesar>">`, así que puedes verificarlo en cualquier lenguaje.

## Referencia de la API

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // opcional, sobrescribe el valor predeterminado
  timeoutMs: 10_000, // opcional, tiempo de espera de la solicitud, predeterminado 10 s
})
```

- `invoq.invoices.create(input)` — crea una factura. `input`: `amount` (requerido), `currency` (`'USD'`, predeterminado), `description`, `reference_id`, `return_url`.
- `invoq.invoices.get(invoiceId)` — trae una factura pública.
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — simula un pago en una factura de prueba.

`invoices.get()` devuelve la forma de factura pública usada por la página de checkout hospedada. Incluye campos orientados al checkout como `amount_paid`, `amount_due`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at` y `direct_onchain_rails`, pero no incluye `reference_id`. Usa la respuesta de creación o el webhook `invoice.paid` cuando necesites tu `reference_id` de comercio.

Los montos en las respuestas se normalizan a 4 decimales: crea con `'129'` y la factura devuelve `amount: '129.0000'`. Compara montos numéricamente, no como cadenas.
`amount_due` se deriva como `max(amount - amount_paid, 0)` y usa la misma escala de 18 decimales que `amount_paid`.

Cuando fallan, los métodos devuelven una promesa rechazada con:

- `InvoqApiError` para respuestas de API no 2xx — tiene `status`, `code`, `fields`, `meta` y el `payload` crudo.
- `InvoqError` para fallas de conexión, tiempos de espera agotados y entradas inválidas.

Las solicitudes expiran a los 10 segundos por defecto (`timeoutMs`). Un `create` que expiró es seguro de reintentar con el mismo `reference_id` — recuperas la factura existente, nunca un duplicado.

`verifyWebhook(rawBody, headers, secret)` acepta el cuerpo sin procesar como cadena, `Uint8Array` o `Buffer` de Node, y los encabezados como un objeto `Headers` de Fetch o un objeto plano de encabezados de Node. Devuelve el evento procesado o lanza `InvoqSignatureVerificationError`. Usa `isInvoicePaid(event)` para eventos `invoice.paid` que permiten procesar pedidos; acepta estados de factura equivalentes a pagada (`paid`, `settling` o `settled`) y rechaza `review_required`.

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // opcional, sobrescribe el valor predeterminado
  styleNonce: undefined, // opcional, nonce CSP para el <style> inyectado
  signal: undefined, // opcional, AbortSignal que cierra la ventana
})

checkout.invoiceId // el id de la factura
checkout.close() // cerrar desde código
const result = await checkout.result
```

La promesa de `result` siempre se resuelve y nunca se rechaza, con uno de estos valores:

- `{ status: 'paid' | 'overpaid', invoiceId }` — pago confirmado. La ventana queda abierta mostrando la pantalla de éxito del embed hasta que el comprador la cierre; llama primero a `checkout.close()` si vas a navegar de inmediato.
- `{ status: 'review_required', invoiceId }` — pago recibido, pero requiere revisión manual. Muestra un estado pendiente de revisión; no proceses el pedido desde el resultado del navegador.
- `{ status: 'closed', invoiceId, reason }` — se cerró sin pago. `reason` es `'user'` (botón de cerrar o Escape), `'programmatic'` (`checkout.close()`), `'replaced'` (otra llamada a `openCheckout`) o `'aborted'` (se disparó el `signal`).
- `{ status: 'failed', invoiceId }` — el checkout no cargó en 15 segundos.

`openCheckout` en sí lanza error con entradas inválidas (`invoiceId` debe empezar con `inv_`) y en navegadores sin soporte de Shadow DOM. Solo hay un checkout abierto a la vez; abrir otro cierra el anterior con `reason: 'replaced'`.

Sin bundler, carga el build de navegador desde un CDN. Expone una variable global `Invoq`:

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## Sobrescribir el entorno

Valores predeterminados de producción:

- Origin de la API: `https://api.invoq.money`
- Origin del checkout: `https://embed.invoq.money`

Sobrescríbelos durante el desarrollo local o las pruebas de previsualización:

```ts
const invoq = new Invoq(process.env.INVOQ_SECRET_KEY!, {
  apiOrigin: 'http://localhost:8787',
})
```

```ts
openCheckout(invoiceId, {
  checkoutOrigin: 'http://localhost:3000',
})
```

`apiOrigin` y `checkoutOrigin` deben ser orígenes `http` o `https` absolutos. El SDK de servidor les agrega las rutas de API `/v1/...`. El SDK de checkout les agrega `/:invoiceId` y los parámetros de consulta del checkout.

## Comunidad y soporte

- X: [@invoqmoney](https://x.com/invoqmoney) · 中文: [@invoqcn](https://x.com/invoqcn)
- Chat: [Discord](https://discord.gg/V8cVrg4dET)
- Novedades: [Canal de Telegram](https://telegram.me/invoqmoney)
- Correo: help@invoq.money

Si invoq te resulta útil, una estrella en este repositorio ayuda a que otros lo encuentren.

## Licencia

[MIT](../LICENSE)
