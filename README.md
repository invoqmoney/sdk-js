# invoq JavaScript SDKs

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**English** · [Bahasa Indonesia](./docs/README.id.md) · [Español](./docs/README.es-419.md) · [Français](./docs/README.fr.md) · [Português](./docs/README.pt-BR.md) · [Tiếng Việt](./docs/README.vi.md) · [Türkçe](./docs/README.tr.md) · [ไทย](./docs/README.th.md) · [简体中文](./docs/README.zh-Hans.md) · [繁體中文](./docs/README.zh-Hant.md)

Accept stablecoin payments on your website with an in-page checkout modal that customers never have to leave. [invoq](https://invoq.money) is non-custodial: funds settle straight to your own wallet, and invoq never holds them.

- Create payment invoices from your server.
- Open an in-page stablecoin payment modal on your website.
- Fulfill orders safely with signed webhooks.

<img src="./assets/checkout-modal.png" alt="invoq in-page stablecoin checkout modal on a merchant website" width="768">

Want to see it first? The [invoq.money](https://invoq.money) homepage runs an interactive demo of this checkout — you can complete a simulated payment in seconds.

## Why invoq

- **Your wallet, not ours.** Every payment settles to a wallet only you control — invoq can't change where it goes.
- **USDC & USDT on nine networks.** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum.
- **No gas to get paid.** Buyers pay their own transfer fee; invoq covers the on-chain settlement.
- **Nothing for buyers to sign up for.** Any wallet can pay — straight from an exchange works too. The checkout supports ten languages.
- **Simple pricing.** First 10 payments free, then 0.5%, no other fees — see [invoq.money](https://invoq.money) for current pricing.

## Server SDKs

Create invoices and verify webhooks from your backend in any of these languages — same REST API, same webhook signature. This repo is the JavaScript SDK.

| Language | Repository |
| --- | --- |
| Node.js | **this repo** — `@invoq/server` |
| Python | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php) |
| Go | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go) |
| Rust | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust) |
| Ruby | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby) |

Whichever backend you pick, the browser side is the same: **`@invoq/checkout`** (in this repo) opens the in-page checkout modal for any frontend.

## Install

Install the server package in your backend:

```sh
npm install @invoq/server
```

Install the checkout package in your frontend:

```sh
npm install @invoq/checkout
```

Both packages are written in TypeScript and ship type definitions. `@invoq/server` requires Node.js 20 or newer — for production, use a currently supported Node.js LTS line, such as Node.js 22 or 24. `@invoq/checkout` has no runtime dependencies and works with any framework, or straight from a CDN `<script>`.

## Get your keys

1. Sign in to the [invoq dashboard](https://app.invoq.money) and create a project.
2. On the **API keys** page, create a secret key. Test keys start with `sk_test_`, live keys with `sk_live_`. The key mode determines whether invoices are test or live.
3. In your project's **webhooks** settings, save your webhook URL. The webhook secret (`whsec_...`) for that mode is shown once, when you first enable the webhook — store it right away. Webhook URLs must be public HTTPS URLs.

Add both to your server environment:

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

Start with test keys. Switch to the live key and live webhook secret when you go to production.

## Quickstart

You will add:

- One server endpoint to create an invoice.
- One server endpoint to receive webhooks.
- One frontend button to open checkout.

Create an invoice on your server with your secret key:

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

Notes:

- The server examples are Web Fetch API route handlers (Next.js App Router, Hono, and similar). In Express, send the response with `res.json({ invoiceId: invoice.id })` instead.
- Use a server-side amount. Do not trust client-supplied amounts.
- `amount` is a decimal USD string from `'0.01'` to `'999.99'` with up to 2 decimal places, such as `'129'` or `'129.99'`.
- Use `reference_id` to map `invoice.paid` webhooks back to your order. It also makes creation retry-safe: creating again with the same `reference_id` and the same invoice terms returns the existing invoice instead of a duplicate, while different terms fail with a `409 reference_id_conflict` API error.

In your frontend, call your server endpoint first, then pass the returned `invoiceId` to checkout:

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
      // Show a success state in your UI.
    } else if (result.status === 'review_required') {
      // Show a pending-review state. Do not fulfill from the browser.
    } else if (result.status === 'failed') {
      // Checkout did not load. Show an error and offer to retry.
    }
  }

  return <button onClick={handlePay}>Pay with stablecoin</button>
}
```

`@invoq/checkout` is framework-agnostic. React, Vue, Svelte, plain JavaScript, and any other frontend can use the same `openCheckout(invoiceId)` call.

Receive webhooks on your server:

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // Fulfill the order for this invoice.
    // event.data.invoice.reference_id is your reference_id.
  }

  return Response.json({ received: true })
}
```

Use `invoice.paid` webhooks to fulfill orders on your server. When `isInvoicePaid(event)` is true, the invoice is ready for automatic fulfillment; use the invoice `reference_id` to find and fulfill your order. A `review_required` invoice does not emit an `invoice.paid` webhook yet; if checkout reports `review_required`, show a pending-review state and wait for a later `invoice.paid` webhook after review is approved.

Browser `paid`, `overpaid`, and `review_required` results are UX signals only. Do not fulfill orders from browser results. In production, add your own loading state and error handling around this flow.

## Hosted checkout page

Every invoice also has a hosted checkout page at `https://pay.invoq.money/<invoice id>` — share the link or redirect to it when the in-page modal is not a fit. You can also create invoices and copy their payment links in the [dashboard](https://app.invoq.money), no code required.

## Test it end to end

Test invoices cannot receive real funds. Simulate the payment from your server instead:

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` only works on invoices created with a `sk_test_` key. When the payments reach the invoice amount, the invoice becomes `paid` and invoq sends a real signed `invoice.paid` webhook to your test webhook URL, so it exercises your whole fulfillment path. Partial amounts are allowed and produce `partially_paid`.

To receive webhooks on your machine, expose your local server with an HTTPS tunnel such as ngrok or cloudflared and save the tunnel URL as your test webhook URL in the dashboard. The dashboard can also send a signed `webhook.ping` to check connectivity.

## Webhooks in production

**Verify against the raw request body.** Signatures are computed over the exact bytes invoq sends. If your framework parses JSON before you can read the raw text, verification fails. For example, in Express:

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
      // Fulfill the order.
    }

    res.json({ received: true })
  },
)
```

**Fulfill idempotently.** Failed deliveries are retried (up to 5 attempts over a few hours, with increasing backoff), so your endpoint can receive the same event more than once. Track fulfilled orders by `reference_id` or invoice `id` and make repeat deliveries a no-op.

**Respond with a 2xx quickly.** Any other status counts as a failed delivery. Transient failures (timeouts, `429`, `5xx`) are retried; other `4xx` responses are not.

`verifyWebhook` throws `InvoqSignatureVerificationError` when the signature is missing, invalid, or the timestamp is more than 5 minutes off — respond with a 400. The signature header is `invoq-signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">`, so you can verify it in any language.

## API reference

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // optional override
  timeoutMs: 10_000, // optional request timeout, default 10s
})
```

- `invoq.invoices.create(input)` — creates an invoice. `input`: `amount` (required), `currency` (`'USD'`, default), `description`, `reference_id`, `return_url`.
- `invoq.invoices.get(invoiceId)` — fetches a public invoice.
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — simulates payment on a test invoice.

`invoices.get()` returns the public invoice shape from the hosted checkout endpoint. It includes checkout-facing fields such as `amount_paid`, `amount_due`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at`, and `direct_onchain_rails`, but does not include `reference_id`. Use the create response or the `invoice.paid` webhook when you need your merchant `reference_id`.

Amounts in responses are normalized to 4 decimal places: create with `'129'` and the invoice returns `amount: '129.0000'`. Compare amounts numerically, not as strings.
`amount_due` is derived as `max(amount - amount_paid, 0)` and uses the same 18-decimal scale as `amount_paid`.

When they fail, all methods reject with:

- `InvoqApiError` for non-2xx API responses — has `status`, `code`, `fields`, `meta`, and the raw `payload`.
- `InvoqError` for connection failures, timeouts, and invalid input.

Requests time out after 10 seconds by default (`timeoutMs`). A timed-out `create` is safe to retry with the same `reference_id` — you get the existing invoice back, never a duplicate.

`verifyWebhook(rawBody, headers, secret)` accepts the raw body as a string, `Uint8Array`, or Node `Buffer`, and headers as a Fetch `Headers` object or a plain Node header object. It returns the parsed event or throws `InvoqSignatureVerificationError`. Use `isInvoicePaid(event)` for fulfillable `invoice.paid` events; it accepts paid-equivalent invoice statuses (`paid`, `settling`, or `settled`) and rejects `review_required`.

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // optional override
  styleNonce: undefined, // optional CSP nonce for the injected <style>
  signal: undefined, // optional AbortSignal that closes the modal
})

checkout.invoiceId // the invoice id
checkout.close() // close programmatically
const result = await checkout.result
```

`result` always resolves (it never rejects) with one of:

- `{ status: 'paid' | 'overpaid', invoiceId }` — payment confirmed. The modal stays open showing the embed's success screen until the customer dismisses it; call `checkout.close()` first if you navigate away immediately.
- `{ status: 'review_required', invoiceId }` — payment was received but needs manual review. Show a pending-review state; do not fulfill from the browser result.
- `{ status: 'closed', invoiceId, reason }` — closed without payment. `reason` is `'user'` (close button or Escape), `'programmatic'` (`checkout.close()`), `'replaced'` (another `openCheckout` call), or `'aborted'` (the `signal` fired).
- `{ status: 'failed', invoiceId }` — the checkout did not load within 15 seconds.

`openCheckout` itself throws on invalid input (`invoiceId` must start with `inv_`) and in browsers without Shadow DOM support. Only one checkout is open at a time; opening another closes the previous one with `reason: 'replaced'`.

Without a bundler, load the browser build from a CDN. It exposes a global `Invoq` object:

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## Environment overrides

Production defaults:

- API origin: `https://api.invoq.money`
- Checkout origin: `https://embed.invoq.money`

Override them during local development or preview testing:

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

`apiOrigin` and `checkoutOrigin` must be absolute `http` or `https` origins. The server SDK appends `/v1/...` API paths. The checkout SDK appends `/:invoiceId` and checkout query parameters.

## Community and support

- X: [@invoqmoney](https://x.com/invoqmoney) · 中文: [@invoqcn](https://x.com/invoqcn)
- Chat: [Discord](https://discord.gg/V8cVrg4dET)
- Updates: [Telegram Channel](https://telegram.me/invoqmoney)
- Email: help@invoq.money

If invoq is useful to you, a star on this repo helps others find it.

## License

[MIT](./LICENSE)
