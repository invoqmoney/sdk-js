# invoq JavaScript SDK

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · [Español](./README.es-419.md) · [Français](./README.fr.md) · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · [ไทย](./README.th.md) · [简体中文](./README.zh-Hans.md) · **繁體中文**

> 本文是英文版 README 的繁體中文翻譯；若表述有出入，以[英文版](../README.md)為準。

在你的網站上接收穩定幣付款：結帳彈窗直接嵌在頁面裡，買家全程不用離開。[invoq](https://invoq.money) 是非託管的——資金直達你自己的錢包，invoq 絕不經手。

- 在伺服器端建立收款帳單。
- 在網頁裡直接打開穩定幣結帳彈窗。
- 用帶簽章的 webhook 安全地處理訂單。

<img src="../assets/checkout-modal.png" alt="嵌在商家網站頁面內的 invoq 穩定幣結帳彈窗" width="768">

想先看看效果？[invoq.money](https://invoq.money) 首頁就是這個結帳頁的互動示範——幾秒鐘就能完整走一遍模擬付款。

## 為什麼選 invoq

- **錢包是你的，不是我們的。** 每一筆付款都只進你自己控制的錢包——invoq 改不了去向。
- **USDC 和 USDT，九條網路。** Base、TRON、Solana、BNB Chain、Arbitrum、Polygon、HyperEVM、Morph、Ethereum。
- **收款零 gas。** 轉帳的網路費買家自己出，結算的鏈上費用由 invoq 承擔。
- **買家什麼都不用註冊。** 任何錢包都能付，從交易所直接提幣也行。結帳頁支援十種語言。
- **定價簡單。** 前 10 筆收款免手續費，之後 0.5%，無其他費用——目前定價請見 [invoq.money](https://invoq.money)。

## 伺服器端 SDK

用下面任一種語言，都能從你的後端建立帳單、驗證 webhook——REST API 和 webhook 簽章完全一致。本倉庫是 JavaScript SDK。

| 語言    | 倉庫                                                                         |
| ------- | ---------------------------------------------------------------------------- |
| Node.js | **本倉庫**（`@invoq/server`）                                                |
| Python  | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP     | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php)       |
| Go      | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go)         |
| Rust    | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust)     |
| Ruby    | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby)     |

無論後端選哪種語言，瀏覽器這一側都一樣：**`@invoq/checkout`**（在本倉庫）為任意前端打開嵌在頁面裡的結帳彈窗。

## 安裝

在後端安裝 server 套件：

```sh
npm install @invoq/server
```

在前端安裝 checkout 套件：

```sh
npm install @invoq/checkout
```

兩個套件都以 TypeScript 撰寫，內建型別定義。`@invoq/server` 需要 Node.js 20 以上——正式環境請使用仍在維護中的 Node.js LTS 版本，例如 Node.js 22 或 24。`@invoq/checkout` 零執行期相依，任何框架都能用，也可以直接用 CDN 的 `<script>` 載入。

## 取得金鑰

1. 登入 [invoq 商家後台](https://app.invoq.money)，建立一個專案。
2. 在 **API keys** 頁面建立一組私密金鑰（secret key）。測試金鑰以 `sk_test_` 開頭，正式金鑰以 `sk_live_` 開頭；用哪種金鑰，決定開出的帳單是測試單還是正式單。
3. 在專案的 **webhooks** 設定裡儲存你的 webhook URL。對應模式的 webhook 簽章金鑰（`whsec_...`）只在首次啟用 webhook 時顯示一次——記得馬上存好。webhook URL 必須是可公開存取的 HTTPS 網址。

把兩者都加進伺服器的環境變數：

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

先用測試金鑰跑通，上線時再換成正式金鑰和正式 webhook 簽章金鑰。

## 快速開始

你需要加三樣東西：

- 一個建立帳單的伺服器端點。
- 一個接收 webhook 的伺服器端點。
- 一個打開結帳頁的前端按鈕。

先在伺服器端用私密金鑰建立帳單：

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

說明：

- 伺服器端範例是 Web Fetch API 的路由處理函式（Next.js App Router、Hono 等都適用）。用 Express 的話，改成以 `res.json({ invoiceId: invoice.id })` 回應即可。
- 金額要由伺服器端決定，不要相信用戶端傳來的金額。
- `amount` 是 `'0.01'` 到 `'999.99'` 之間的十進位美元字串，最多兩位小數，例如 `'129'` 或 `'129.99'`。
- 用 `reference_id` 把 `invoice.paid` webhook 對應回你的訂單。它也讓建立動作可以放心重試：用相同的 `reference_id` 和相同的帳單條件再建立一次，回傳的是既有帳單而不是重複開單；條件不同則會回 `409 reference_id_conflict` API 錯誤。

前端先呼叫你自己的伺服器端點，再把回傳的 `invoiceId` 交給結帳頁：

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
      // 在你的 UI 裡顯示付款成功狀態。
    } else if (result.status === 'review_required') {
      // 顯示待人工審核狀態。不要憑瀏覽器結果處理訂單。
    } else if (result.status === 'failed') {
      // 結帳頁沒能載入。顯示錯誤，並讓使用者重試。
    }
  }

  return <button onClick={handlePay}>用穩定幣付款</button>
}
```

`@invoq/checkout` 不挑框架：React、Vue、Svelte、原生 JavaScript 或其他任何前端，用的都是同一個 `openCheckout(invoiceId)`。

在伺服器端接收 webhook：

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // 處理這張帳單對應的訂單。
    // event.data.invoice.reference_id 就是你傳的 reference_id。
  }

  return Response.json({ received: true })
}
```

訂單處理以伺服器端收到的 `invoice.paid` webhook 為準。`isInvoicePaid(event)` 為 true 時，表示帳單可以自動履約；用帳單裡的 `reference_id` 找到並處理對應的訂單。`review_required` 帳單暫時不會發送 `invoice.paid` webhook；如果結帳回傳 `review_required`，請顯示待審核狀態，並等審核通過後的 `invoice.paid` webhook 再履約。

瀏覽器端的 `paid` / `overpaid` / `review_required` 結果只是給使用者介面用的提示，不要憑瀏覽器結果處理訂單。正式環境請圍繞這套流程加上你自己的載入狀態和錯誤處理。

## 託管結帳頁

每張帳單都自帶一個託管結帳頁：`https://pay.invoq.money/<帳單 id>`。頁內彈窗不適合的場景，把連結分享出去或直接導向過去就行。你也可以在[商家後台](https://app.invoq.money)手動開單、複製付款連結，一行程式碼都不用寫。

## 端對端測試

測試帳單收不了真錢，改用伺服器端 API 模擬付款：

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` 只對 `sk_test_` 金鑰建立的帳單有效。累計付款達到帳單金額時，帳單變為 `paid`，invoq 會向你的測試 webhook URL 送出一條真實簽章的 `invoice.paid` webhook——整條訂單處理流程都能測到。也可以只付部分金額，帳單會變成 `partially_paid`。

要在本機收 webhook，用 ngrok、cloudflared 之類的 HTTPS 隧道把本地伺服器公開出去，再把隧道網址存成商家後台裡的測試 webhook URL。後台也能送出一條帶簽章的 `webhook.ping`，幫你確認連線。

## 正式環境中的 webhook

**用原始請求內容驗證簽章。** 簽章是對 invoq 送出的原始位元組計算的。如果框架在你拿到原始內容之前就把 JSON 解析掉了，驗證會失敗。例如在 Express 裡：

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
      // 處理訂單。
    }

    res.json({ received: true })
  },
)
```

**處理訂單要冪等。** 投遞失敗會重試（最多 5 次，退避遞增，共跨約數小時），所以同一事件可能送達不止一次。按 `reference_id` 或帳單 `id` 記錄已處理的訂單，重複送達就直接略過。

**盡快回 2xx。** 任何其他狀態碼都算投遞失敗：逾時、`429`、`5xx` 會重試，其他 `4xx` 則不會。

簽章缺失、無效，或時間戳偏差超過 5 分鐘時，`verifyWebhook` 會擲出 `InvoqSignatureVerificationError`——這時回 400 即可。簽章標頭格式是 `invoq-signature: t=<unix 秒>,v1=<對 "<t>.<原始請求內容>" 計算的 HMAC-SHA256 十六進位值>`，所以用任何語言都能自行驗證。

## API 參考

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // 可選，覆寫預設值
  timeoutMs: 10_000, // 可選的請求逾時，預設 10 秒
})
```

- `invoq.invoices.create(input)` —— 建立帳單。`input`：`amount`（必填）、`currency`（`'USD'`，預設）、`description`、`reference_id`、`return_url`。
- `invoq.invoices.get(invoiceId)` —— 查詢公開帳單。
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` —— 在測試帳單上模擬付款。

`invoices.get()` 回傳託管結帳頁使用的公開帳單結構。它包含面向結帳頁的欄位，例如 `amount_paid`、`amount_due`、`amount_overpaid`、`payment_status`、`project`、`deposit_address`、`monitoring_ends_at`、`monitoring_status`、`transfers` 和 `direct_onchain_rails`，但不包含 `reference_id`。如果需要商家端的 `reference_id`，請使用建立帳單的回應或 `invoice.paid` webhook。

回應裡的金額一律格式化為 4 位小數：用 `'129'` 建立，帳單會回傳 `amount: '129.0000'`。比較金額請按數值比，不要按字串比。
`amount_due` 依 `max(amount - amount_paid, 0)` 衍生，使用和 `amount_paid` 相同的 18 位小數 scale；`amount_overpaid` 與它互為鏡像，即 `max(amount_paid - amount, 0)`，所以你不必自己做減法。`monitoring_status` 取值 `'active'` 或 `'ended'`——一旦變為 `'ended'`，收款位址就不再被監控——而 `transfers` 是已確認的鏈上收款紀錄（每一項都含 `tx_hash`、`amount` 和 `explorer_tx_url`）。測試帳單裡兩者分別為 `null` / `[]`。

所有方法失敗時都會 reject，並帶有下列錯誤：

- `InvoqApiError`：API 回應非 2xx——帶 `status`、`code`、`fields`、`meta` 和原始 `payload`。
- `InvoqError`：連線失敗、逾時和參數不合法。

請求預設 10 秒逾時（`timeoutMs`）。`create` 逾時後用同一個 `reference_id` 重試是安全的——拿回的是既有帳單，不會重複開單。

`verifyWebhook(rawBody, headers, secret)` 的原始請求內容接受字串、`Uint8Array` 或 Node 的 `Buffer`；headers 接受 Fetch 的 `Headers` 物件或 Node 的一般 header 物件。驗證通過回傳解析好的事件，失敗擲出 `InvoqSignatureVerificationError`。用 `isInvoicePaid(event)` 判斷可履約的 `invoice.paid` 事件；它接受可視為已付款的帳單狀態（`paid`、`settling` 或 `settled`），並拒絕 `review_required`。

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // 可選，覆寫預設值
  styleNonce: undefined, // 可選，注入的 <style> 所用的 CSP nonce
  signal: undefined, // 可選，觸發後關閉彈窗的 AbortSignal
})

checkout.invoiceId // 帳單 id
checkout.close() // 以程式碼關閉
const result = await checkout.result
```

`result` 一定會 resolve（絕不 reject），值是下面幾種之一：

- `{ status: 'paid' | 'overpaid', invoiceId, mode }` —— 付款已確認。彈窗會停在內嵌頁的成功畫面，直到買家自己關掉；若你要立刻跳轉頁面，請先呼叫 `checkout.close()`。
- `{ status: 'review_required', invoiceId, mode }` —— 已收到付款，但需要人工審核。顯示待審核狀態；不要憑瀏覽器結果處理訂單。
- `{ status: 'closed', invoiceId, reason }` —— 沒付款就關閉了。`reason` 可能是 `'user'`（按了關閉鈕或 Escape）、`'programmatic'`（呼叫了 `checkout.close()`）、`'replaced'`（又呼叫了一次 `openCheckout`）、`'aborted'`（`signal` 被觸發）。
- `{ status: 'failed', invoiceId }` —— 結帳頁 15 秒內沒有載入完成。

在付款結果裡，`mode` 取值 `'test'` 或 `'live'`——這是一個提示，方便你在瀏覽器裡把模擬的測試付款和真錢區分開。它僅供參考：請務必在你的伺服器端用 `invoice.paid` webhook 確認履約。

`openCheckout` 本身只在參數不合法（`invoiceId` 必須以 `inv_` 開頭）以及瀏覽器不支援 Shadow DOM 時擲錯。同一時間只會有一個結帳彈窗；再開一個，前一個會以 `reason: 'replaced'` 關閉。

不用打包工具的話，直接從 CDN 載入瀏覽器版本，它會提供一個全域物件 `Invoq`：

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## 覆寫環境設定

正式環境預設值：

- API 位址：`https://api.invoq.money`
- 結帳頁位址：`https://embed.invoq.money`

本機開發或預覽測試時可以覆寫：

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

`apiOrigin` 和 `checkoutOrigin` 必須是完整的 `http` 或 `https` origin。伺服器 SDK 會在其後接上 `/v1/...` API 路徑；結帳 SDK 會接上 `/:invoiceId` 和結帳查詢參數。

## 社群與支援

- X：中文 [@invoqcn](https://x.com/invoqcn) · English [@invoqmoney](https://x.com/invoqmoney)
- 聊天：[Discord](https://discord.gg/V8cVrg4dET)
- 公告：[Telegram 頻道](https://telegram.me/invoqmoney)
- 電子郵件：help@invoq.money

如果 invoq 對你有幫助，給這個倉庫一顆星星，能讓更多人找到它。

## 授權條款

[MIT](../LICENSE)
