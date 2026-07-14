# invoq JavaScript SDK

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · [Español](./README.es-419.md) · [Français](./README.fr.md) · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · [ไทย](./README.th.md) · **简体中文** · [繁體中文](./README.zh-Hant.md)

> 本文是英文版 README 的简体中文翻译；若表述有出入，以[英文版](../README.md)为准。

在你的网站上接收稳定币付款：收银台直接嵌在页面里，买家全程不用离开。[invoq](https://invoq.money) 是非托管的——资金直达你自己的钱包，invoq 绝不经手。

- 在服务端创建收款账单。
- 在网页里直接打开稳定币付款弹窗。
- 用带签名的 webhook 安全地处理订单。

<img src="../assets/checkout-modal.png" alt="嵌在商家网站页面内的 invoq 稳定币收银台弹窗" width="768">

想先看看效果？[invoq.money](https://invoq.money) 首页就是这个收银台的可交互演示——几秒钟就能完整走一遍模拟付款。

## 为什么选 invoq

- **钱包是你的，不是我们的。** 每一笔付款都只进你自己控制的钱包——invoq 改不了去向。
- **USDC 和 USDT，九条网络。** Base、TRON、Solana、BNB Chain、Arbitrum、Polygon、HyperEVM、Morph、Ethereum。
- **收款零 gas。** 转账的网络费买家自己出，结算的链上费用由 invoq 承担。
- **买家什么都不用注册。** 任何钱包都能付，从交易所直接提币也行。收银台支持十种语言。
- **定价简单。** 前 10 笔收款免手续费，之后 0.5%，无其他费用——当前定价见 [invoq.money](https://invoq.money)。

## 服务端 SDK

用下面任意一种语言，都能从你的后端创建账单、验证 webhook——REST API 和 webhook 签名完全一致。本仓库是 JavaScript SDK。

| 语言    | 仓库                                                                         |
| ------- | ---------------------------------------------------------------------------- |
| Node.js | **本仓库**（`@invoq/server`）                                                |
| Python  | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP     | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php)       |
| Go      | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go)         |
| Rust    | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust)     |
| Ruby    | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby)     |

无论后端选哪种语言，浏览器这一侧都一样：**`@invoq/checkout`**（在本仓库）为任意前端打开嵌在页面里的收银台弹窗。

## 安装

在后端安装 server 包：

```sh
npm install @invoq/server
```

在前端安装 checkout 包：

```sh
npm install @invoq/checkout
```

两个包都用 TypeScript 编写，自带类型定义。`@invoq/server` 要求 Node.js 20 及以上——生产环境请使用仍在维护期内的 Node.js LTS 版本，比如 Node.js 22 或 24。`@invoq/checkout` 没有任何运行时依赖，任何框架都能用，也可以直接通过 CDN 的 `<script>` 引入。

## 获取密钥

1. 登录 [invoq 商户后台](https://app.invoq.money)，创建一个项目。
2. 在 **API keys** 页面创建一把密钥（secret key）。测试密钥以 `sk_test_` 开头，正式密钥以 `sk_live_` 开头；用哪种密钥，决定开出的账单是测试单还是正式单。
3. 在项目的 **webhooks** 设置里保存你的 webhook URL。对应模式的 webhook 签名密钥（`whsec_...`）只在首次启用 webhook 时展示一次——记得马上存好。webhook URL 必须是公网可访问的 HTTPS 地址。

把两者都加进服务端环境变量：

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

先用测试密钥跑通，上线时再换成正式密钥和正式 webhook 签名密钥。

## 快速开始

你需要加三样东西：

- 一个创建账单的服务端接口。
- 一个接收 webhook 的服务端接口。
- 一个打开收银台的前端按钮。

先在服务端用密钥创建账单：

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

说明：

- 服务端示例是 Web Fetch API 的路由处理函数（Next.js App Router、Hono 等都适用）。用 Express 的话，改成 `res.json({ invoiceId: invoice.id })` 返回即可。
- 金额要由服务端决定，不要相信客户端传来的金额。
- `amount` 是 `'0.01'` 到 `'999.99'` 之间的十进制美元字符串，最多两位小数，比如 `'129'` 或 `'129.99'`。
- 用 `reference_id` 把 `invoice.paid` webhook 对应回你的订单。它还让创建操作可以放心重试：用相同的 `reference_id` 和相同的账单条款再次创建，返回的是已有账单而不是重复开单；条款不同则会报 `409 reference_id_conflict` API 错误。

前端先调你自己的服务端接口，再把返回的 `invoiceId` 交给收银台：

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
      // 在你的 UI 里展示支付成功状态。
    } else if (result.status === 'review_required') {
      // 展示待人工审核状态。不要凭浏览器结果处理订单。
    } else if (result.status === 'failed') {
      // 收银台没能加载出来。提示出错，并让用户重试。
    }
  }

  return <button onClick={handlePay}>用稳定币支付</button>
}
```

`@invoq/checkout` 不挑框架：React、Vue、Svelte、原生 JavaScript 或其他任何前端，用的都是同一个 `openCheckout(invoiceId)`。

在服务端接收 webhook：

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // 处理这张账单对应的订单。
    // event.data.invoice.reference_id 就是你传的 reference_id。
  }

  return Response.json({ received: true })
}
```

订单处理以服务端收到的 `invoice.paid` webhook 为准。`isInvoicePaid(event)` 为 true 时，表示账单可以自动履约；用账单里的 `reference_id` 找到并处理对应的订单。`review_required` 账单暂时不会发送 `invoice.paid` webhook；如果收银台返回 `review_required`，请展示待审核状态，并等审核通过后的 `invoice.paid` webhook 再履约。

浏览器端的 `paid` / `overpaid` / `review_required` 结果只是给用户界面用的提示，不要凭浏览器结果处理订单。生产环境里，请围绕这套流程加上你自己的加载状态和错误处理。

## 托管收银页

每张账单都自带一个托管收银页：`https://pay.invoq.money/<账单 id>`。页内弹窗不合适的场景，把链接发出去或直接跳转过去就行。你也可以在[商户后台](https://app.invoq.money)手动开单、复制付款链接，一行代码都不用写。

## 端到端测试

测试账单收不了真钱，改用服务端接口模拟付款：

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` 只对 `sk_test_` 密钥创建的账单有效。累计付款达到账单金额时，账单变为 `paid`，invoq 会向你的测试 webhook URL 发送一条真实签名的 `invoice.paid` webhook——整条履约链路都能测到。也可以只付部分金额，账单会变成 `partially_paid`。

要在本机收 webhook，用 ngrok、cloudflared 之类的 HTTPS 隧道把本地服务暴露出去，再把隧道地址保存为商户后台里的测试 webhook URL。后台还能发送一条带签名的 `webhook.ping`，帮你确认连通性。

## 生产环境中的 webhook

**用原始请求体来验签。** 签名是对 invoq 发出的原始字节计算的。如果框架在你拿到原始文本之前就把 JSON 解析掉了，验签会失败。比如在 Express 里：

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
      // 处理订单。
    }

    res.json({ received: true })
  },
)
```

**处理订单要幂等。** 投递失败会重试（最多 5 次，退避递增，共跨约几个小时），所以同一事件可能送达不止一次。按 `reference_id` 或账单 `id` 记录已处理的订单，重复送达直接忽略即可。

**尽快返回 2xx。** 任何其他状态码都算投递失败：超时、`429`、`5xx` 会重试，其他 `4xx` 则不会。

签名缺失、无效，或时间戳偏差超过 5 分钟时，`verifyWebhook` 会抛出 `InvoqSignatureVerificationError`——这时返回 400 即可。签名头格式是 `invoq-signature: t=<unix 秒>,v1=<对 "<t>.<原始请求体>" 计算的 HMAC-SHA256 十六进制值>`，所以用任何语言都能自行验签。

## API 参考

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // 可选，覆盖默认值
  timeoutMs: 10_000, // 可选的请求超时，默认 10 秒
})
```

- `invoq.invoices.create(input)` —— 创建账单。`input`：`amount`（必填）、`currency`（`'USD'`，默认值）、`description`、`reference_id`、`return_url`。
- `invoq.invoices.get(invoiceId)` —— 查询公开账单。
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` —— 在测试账单上模拟付款。

`invoices.get()` 返回托管收银页使用的公开账单结构。它包含面向收银台的字段，例如 `amount_paid`、`amount_due`、`payment_status`、`project`、`deposit_address`、`monitoring_ends_at` 和 `direct_onchain_rails`，但不包含 `reference_id`。如果需要商户侧的 `reference_id`，请使用创建账单的响应或 `invoice.paid` webhook。

响应里的金额统一格式化为 4 位小数：用 `'129'` 创建，账单返回 `amount: '129.0000'`。比较金额请按数值比，不要按字符串比。
`amount_due` 按 `max(amount - amount_paid, 0)` 派生，使用和 `amount_paid` 相同的 18 位小数 scale。

所有方法失败时都会 reject，并带上以下错误：

- `InvoqApiError`：API 返回非 2xx——带 `status`、`code`、`fields`、`meta` 和原始 `payload`。
- `InvoqError`：连接失败、超时和入参不合法。

请求默认 10 秒超时（`timeoutMs`）。`create` 超时后用同一个 `reference_id` 重试是安全的——拿回的是已有账单，不会重复开单。

`verifyWebhook(rawBody, headers, secret)` 的原始请求体接受字符串、`Uint8Array` 或 Node 的 `Buffer`；headers 接受 Fetch 的 `Headers` 对象或 Node 的普通 header 对象。验签通过返回解析好的事件，失败抛出 `InvoqSignatureVerificationError`。用 `isInvoicePaid(event)` 判断可履约的 `invoice.paid` 事件；它接受可视为已付款的账单状态（`paid`、`settling` 或 `settled`），并拒绝 `review_required`。

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // 可选，覆盖默认值
  styleNonce: undefined, // 可选，注入的 <style> 所用的 CSP nonce
  signal: undefined, // 可选，触发后关闭弹窗的 AbortSignal
})

checkout.invoiceId // 账单 id
checkout.close() // 用代码主动关闭
const result = await checkout.result
```

`result` 一定会 resolve（绝不 reject），取值是下面几种之一：

- `{ status: 'paid' | 'overpaid', invoiceId }` —— 付款已确认。弹窗会停留在内嵌页的成功画面，直到买家自己关掉；如果你要立刻跳转页面，先调用 `checkout.close()`。
- `{ status: 'review_required', invoiceId }` —— 已收到付款，但需要人工审核。展示待审核状态；不要凭浏览器结果处理订单。
- `{ status: 'closed', invoiceId, reason }` —— 没付款就关闭了。`reason` 取值：`'user'`（点了关闭按钮或按了 Escape）、`'programmatic'`（调用了 `checkout.close()`）、`'replaced'`（又调用了一次 `openCheckout`）、`'aborted'`（`signal` 被触发）。
- `{ status: 'failed', invoiceId }` —— 收银台 15 秒内没有加载出来。

`openCheckout` 本身只在入参不合法（`invoiceId` 必须以 `inv_` 开头）以及浏览器不支持 Shadow DOM 时抛错。同一时间只会有一个收银台弹窗；再开一个，前一个会以 `reason: 'replaced'` 关闭。

不用打包器的话，直接从 CDN 加载浏览器构建，它会暴露一个全局对象 `Invoq`：

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## 覆盖环境配置

生产环境默认值：

- API 地址：`https://api.invoq.money`
- 收银台地址：`https://embed.invoq.money`

本地开发或预览测试时可以覆盖：

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

`apiOrigin` 和 `checkoutOrigin` 必须是完整的 `http` 或 `https` origin。服务端 SDK 会在其后拼接 `/v1/...` API 路径；收银台 SDK 会拼接 `/:invoiceId` 和收银台查询参数。

## 社区与支持

- X：中文 [@invoqcn](https://x.com/invoqcn) · English [@invoqmoney](https://x.com/invoqmoney)
- 聊天：[Discord](https://discord.gg/V8cVrg4dET)
- 公告：[Telegram 频道](https://telegram.me/invoqmoney)
- 邮箱：help@invoq.money

如果 invoq 帮到了你，给仓库点个 star，能让更多人找到它。

## 许可证

[MIT](../LICENSE)
