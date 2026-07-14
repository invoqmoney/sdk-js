# invoq JavaScript SDK

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · [Español](./README.es-419.md) · [Français](./README.fr.md) · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · **ไทย** · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)

> เอกสารนี้แปลจาก README ภาษาอังกฤษ หากมีข้อความไม่ตรงกัน ให้ยึด[ฉบับภาษาอังกฤษ](../README.md)เป็นหลัก

รับชำระเงินด้วย stablecoin บนเว็บไซต์ของคุณ ผ่านหน้าชำระเงินแบบฝังในหน้าเว็บที่ผู้ซื้อไม่ต้องออกไปไหนเลย [invoq](https://invoq.money) ไม่ถือครองเงิน: เงินเข้ากระเป๋าเงินของคุณเองโดยตรง invoq ไม่เคยถือเงินไว้

- สร้างใบแจ้งหนี้จากเซิร์ฟเวอร์ของคุณ
- เปิดหน้าชำระเงิน stablecoin แบบฝังในหน้าเว็บของคุณ
- จัดการคำสั่งซื้ออย่างปลอดภัยด้วย webhook ที่มีลายเซ็นกำกับ

<img src="../assets/checkout-modal.png" alt="หน้าชำระเงิน stablecoin ของ invoq แบบฝังในเว็บไซต์ผู้ขาย" width="768">

อยากลองดูก่อน? หน้าแรกของ [invoq.money](https://invoq.money) มีเดโมแบบอินเทอร์แอกทีฟของหน้าชำระเงินนี้ — ลองจ่ายเงินจำลองให้ครบขั้นตอนได้ในไม่กี่วินาที

## ทำไมต้อง invoq

- **กระเป๋าเงินของคุณ ไม่ใช่ของเรา** ทุกการชำระเงินเข้ากระเป๋าเงินที่คุณคนเดียวควบคุม — invoq เปลี่ยนปลายทางไม่ได้
- **USDC และ USDT บนเก้าเครือข่าย** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum
- **รับเงินโดยไม่เสียค่า gas** ค่าโอนผู้ซื้อจ่ายเอง ส่วนค่าใช้จ่ายบนเชนตอนเงินเข้ากระเป๋า invoq ออกให้
- **ผู้ซื้อไม่ต้องสมัครอะไรทั้งนั้น** กระเป๋าเงินไหนก็จ่ายได้ — โอนตรงจากกระดานเทรดก็ได้เหมือนกัน หน้าชำระเงินรองรับสิบภาษา
- **ราคาเข้าใจง่าย** 10 ยอดชำระแรกฟรี หลังจากนั้น 0.5% ไม่มีค่าใช้จ่ายอื่นใดอีก — ดูราคาปัจจุบันได้ที่ [invoq.money](https://invoq.money)

## SDK ฝั่งเซิร์ฟเวอร์

สร้างใบแจ้งหนี้และตรวจสอบ webhook จากแบ็กเอนด์ของคุณด้วยภาษาใดก็ได้เหล่านี้ — REST API และลายเซ็น webhook เหมือนกันทุกภาษา repo นี้คือ SDK สำหรับ JavaScript

| ภาษา    | Repo                                                                         |
| ------- | ---------------------------------------------------------------------------- |
| Node.js | **repo นี้** — `@invoq/server`                                               |
| Python  | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP     | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php)       |
| Go      | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go)         |
| Rust    | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust)     |
| Ruby    | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby)     |

จะเลือกแบ็กเอนด์ตัวไหนก็ตาม ฝั่งเบราว์เซอร์เหมือนกันหมด: **`@invoq/checkout`** (ใน repo นี้) เปิดหน้าชำระเงินแบบฝังในหน้าเว็บให้ฟรอนต์เอนด์ใดก็ได้

## ติดตั้ง

ติดตั้งแพ็กเกจฝั่งเซิร์ฟเวอร์ในแบ็กเอนด์ของคุณ:

```sh
npm install @invoq/server
```

ติดตั้งแพ็กเกจ checkout ในฟรอนต์เอนด์ของคุณ:

```sh
npm install @invoq/checkout
```

ทั้งสองแพ็กเกจเขียนด้วย TypeScript และมีไฟล์กำหนดชนิดข้อมูลมาให้ `@invoq/server` ต้องใช้ Node.js 20 ขึ้นไป — ในสภาพแวดล้อมจริงให้ใช้ Node.js สาย LTS ที่ยังได้รับการดูแล เช่น Node.js 22 หรือ 24 ส่วน `@invoq/checkout` ไม่มีแพ็กเกจที่ต้องพึ่งพาตอนรัน ใช้ได้กับทุกเฟรมเวิร์ก หรือโหลดตรงจาก CDN ผ่านแท็ก `<script>` ก็ได้

## รับคีย์ของคุณ

1. เข้าสู่ระบบ[แดชบอร์ด invoq](https://app.invoq.money) แล้วสร้างโปรเจกต์
2. ที่หน้า **API keys** สร้างคีย์ลับ (secret key) ขึ้นมา คีย์ทดสอบขึ้นต้นด้วย `sk_test_` คีย์จริงขึ้นต้นด้วย `sk_live_` โหมดของคีย์เป็นตัวกำหนดว่าใบแจ้งหนี้ที่สร้างจะเป็นแบบทดสอบหรือของจริง
3. ในการตั้งค่า **webhooks** ของโปรเจกต์ บันทึก URL ของ webhook ที่จะใช้ ซีเคร็ตของ webhook (`whsec_...`) สำหรับโหมดนั้นจะแสดงแค่ครั้งเดียวตอนเปิดใช้ webhook ครั้งแรก — รีบเก็บไว้ทันที URL ของ webhook ต้องเป็น HTTPS ที่เข้าถึงได้แบบสาธารณะ

เพิ่มทั้งสองค่าเข้าเป็นตัวแปรสภาพแวดล้อมของเซิร์ฟเวอร์:

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

เริ่มจากคีย์ทดสอบก่อน แล้วค่อยสลับเป็นคีย์จริงกับซีเคร็ต webhook ของจริงตอนใช้งานจริง

## เริ่มต้นอย่างรวดเร็ว

สิ่งที่คุณจะเพิ่มมีสามอย่าง:

- ปลายทางฝั่งเซิร์ฟเวอร์สำหรับสร้างใบแจ้งหนี้
- ปลายทางฝั่งเซิร์ฟเวอร์สำหรับรับ webhook
- ปุ่มฝั่งฟรอนต์เอนด์สำหรับเปิดหน้าชำระเงิน

สร้างใบแจ้งหนี้บนเซิร์ฟเวอร์ด้วยคีย์ลับของคุณ:

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

หมายเหตุ:

- ตัวอย่างฝั่งเซิร์ฟเวอร์เป็นตัวจัดการ route แบบ Web Fetch API (Next.js App Router, Hono และอื่น ๆ ทำนองนี้) ถ้าใช้ Express ให้ตอบกลับด้วย `res.json({ invoiceId: invoice.id })` แทน
- กำหนดยอดเงินที่ฝั่งเซิร์ฟเวอร์เท่านั้น อย่าเชื่อยอดเงินที่ส่งมาจากฝั่งไคลเอนต์
- `amount` เป็นสตริงเลขทศนิยมสกุล USD ตั้งแต่ `'0.01'` ถึง `'999.99'` ทศนิยมไม่เกิน 2 ตำแหน่ง เช่น `'129'` หรือ `'129.99'`
- ใช้ `reference_id` เพื่อโยง webhook `invoice.paid` กลับไปหาคำสั่งซื้อของคุณ และยังทำให้การสร้างใบแจ้งหนี้ลองใหม่ได้อย่างปลอดภัย: ถ้าสร้างซ้ำด้วย `reference_id` เดิมและเงื่อนไขเดิม จะได้ใบแจ้งหนี้ใบเดิมกลับมาแทนที่จะเกิดใบซ้ำ ส่วนเงื่อนไขที่ต่างกันจะล้มเหลวด้วยข้อผิดพลาด API `409 reference_id_conflict`

ที่ฟรอนต์เอนด์ ให้เรียกปลายทางของเซิร์ฟเวอร์คุณก่อน แล้วส่ง `invoiceId` ที่ได้ไปเปิดหน้าชำระเงิน:

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
      // แสดงสถานะจ่ายสำเร็จใน UI ของคุณ
    } else if (result.status === 'review_required') {
      // แสดงสถานะรอตรวจสอบ อย่าใช้ผลจากเบราว์เซอร์เพื่อจัดการคำสั่งซื้อ
    } else if (result.status === 'failed') {
      // หน้าชำระเงินโหลดไม่ขึ้น แสดงข้อผิดพลาดและให้ลองใหม่
    }
  }

  return <button onClick={handlePay}>จ่ายด้วย stablecoin</button>
}
```

`@invoq/checkout` ไม่ผูกกับเฟรมเวิร์กไหน React, Vue, Svelte, JavaScript ล้วน ๆ หรือฟรอนต์เอนด์อื่นใดก็เรียก `openCheckout(invoiceId)` แบบเดียวกันหมด

รับ webhook ที่เซิร์ฟเวอร์ของคุณ:

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // จัดการคำสั่งซื้อของใบแจ้งหนี้ใบนี้
    // event.data.invoice.reference_id คือ reference_id ของคุณ
  }

  return Response.json({ received: true })
}
```

ให้ยึด webhook `invoice.paid` เป็นหลักในการจัดการคำสั่งซื้อบนเซิร์ฟเวอร์ เมื่อ `isInvoicePaid(event)` เป็น true แปลว่าใบแจ้งหนี้พร้อมให้จัดการอัตโนมัติแล้ว ให้ใช้ `reference_id` ในใบแจ้งหนี้ไปหาและจัดการคำสั่งซื้อของคุณ ใบแจ้งหนี้สถานะ `review_required` จะยังไม่ส่ง webhook `invoice.paid` หาก checkout ส่งผลลัพธ์เป็น `review_required` ให้แสดงสถานะรอตรวจสอบ และรอ webhook `invoice.paid` หลังการตรวจสอบผ่าน

ผล `paid`, `overpaid` และ `review_required` ฝั่งเบราว์เซอร์เป็นแค่สัญญาณสำหรับหน้าจอเท่านั้น อย่าจัดการคำสั่งซื้อโดยอิงผลจากเบราว์เซอร์ ในสภาพแวดล้อมจริงให้เพิ่มสถานะกำลังโหลดและการจัดการข้อผิดพลาดของคุณเองรอบขั้นตอนนี้ด้วย

## หน้าชำระเงินที่โฮสต์ให้

ใบแจ้งหนี้ทุกใบมีหน้าชำระเงินที่โฮสต์ให้อยู่แล้วที่ `https://pay.invoq.money/<id ใบแจ้งหนี้>` — แชร์ลิงก์หรือเปลี่ยนเส้นทางไปที่นั่นได้เลยเมื่อหน้าฝังในเว็บไม่ตอบโจทย์ และคุณยังสร้างใบแจ้งหนี้พร้อมคัดลอกลิงก์ชำระเงินได้จาก[แดชบอร์ด](https://app.invoq.money)โดยไม่ต้องเขียนโค้ดสักบรรทัด

## ทดสอบตั้งแต่ต้นจนจบ

ใบแจ้งหนี้ทดสอบรับเงินจริงไม่ได้ ให้จำลองการจ่ายจากเซิร์ฟเวอร์แทน:

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` ใช้ได้เฉพาะกับใบแจ้งหนี้ที่สร้างด้วยคีย์ `sk_test_` เมื่อยอดจ่ายครบตามจำนวนของใบแจ้งหนี้ ใบแจ้งหนี้จะกลายเป็น `paid` แล้ว invoq จะส่ง webhook `invoice.paid` ที่ลงลายเซ็นจริงไปยัง URL webhook ทดสอบของคุณ — เท่ากับได้ทดสอบเส้นทางจัดการคำสั่งซื้อของคุณทั้งเส้น จ่ายบางส่วนก็ได้ ผลจะเป็น `partially_paid`

ถ้าอยากรับ webhook บนเครื่องตัวเอง ให้เปิดเซิร์ฟเวอร์ในเครื่องออกสู่ภายนอกผ่าน HTTPS tunnel อย่าง ngrok หรือ cloudflared แล้วบันทึก URL ของ tunnel เป็น URL webhook ทดสอบในแดชบอร์ด แดชบอร์ดยังส่ง `webhook.ping` แบบมีลายเซ็นมาให้เช็กการเชื่อมต่อได้ด้วย

## Webhook ในสภาพแวดล้อมจริง

**ตรวจสอบลายเซ็นกับเนื้อหา request ดิบ** ลายเซ็นคำนวณจากไบต์ตรงตามที่ invoq ส่งมา ถ้าเฟรมเวิร์กของคุณแปลง JSON ไปก่อนที่คุณจะได้อ่านข้อความดิบ การตรวจสอบจะล้มเหลว ตัวอย่างใน Express:

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
      // จัดการคำสั่งซื้อ
    }

    res.json({ received: true })
  },
)
```

**จัดการคำสั่งซื้อให้ปลอดภัยเมื่อรับซ้ำ** การส่งที่ล้มเหลวจะถูกส่งซ้ำ (สูงสุด 5 ครั้งภายในไม่กี่ชั่วโมง โดยเว้นระยะห่างเพิ่มขึ้นเรื่อย ๆ) ปลายทางของคุณจึงอาจได้รับเหตุการณ์เดียวกันมากกว่าหนึ่งครั้ง ให้บันทึกคำสั่งซื้อที่จัดการแล้วด้วย `reference_id` หรือ `id` ของใบแจ้งหนี้ แล้วข้ามการส่งซ้ำไปได้เลย

**ตอบ 2xx ให้เร็ว** สถานะอื่นใดถือว่าส่งไม่สำเร็จ โดยกรณี timeout, `429` และ `5xx` จะถูกส่งซ้ำ ส่วน `4xx` อื่นจะไม่ส่งซ้ำ

`verifyWebhook` จะโยน `InvoqSignatureVerificationError` เมื่อลายเซ็นหายไป ไม่ถูกต้อง หรือ timestamp คลาดเคลื่อนเกิน 5 นาที — ให้ตอบกลับด้วย 400 ส่วนเฮดเดอร์ลายเซ็นมีรูปแบบ `invoq-signature: t=<วินาที unix>,v1=<HMAC-SHA256 ฐานสิบหกของ "<t>.<เนื้อหา request ดิบ>">` จึงตรวจสอบเองด้วยภาษาอะไรก็ได้

## ข้อมูลอ้างอิง API

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // ระบุได้ถ้าต้องการทับค่าเริ่มต้น
  timeoutMs: 10_000, // timeout ของ request ระบุได้ ค่าเริ่มต้น 10 วินาที
})
```

- `invoq.invoices.create(input)` — สร้างใบแจ้งหนี้ โดย `input` ประกอบด้วย `amount` (จำเป็น), `currency` (`'USD'` เป็นค่าเริ่มต้น), `description`, `reference_id`, `return_url`
- `invoq.invoices.get(invoiceId)` — ดึงข้อมูลใบแจ้งหนี้สาธารณะ
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — จำลองการจ่ายบนใบแจ้งหนี้ทดสอบ

`invoices.get()` จะคืนรูปแบบใบแจ้งหนี้สาธารณะที่หน้า checkout แบบโฮสต์ใช้ โดยมีฟิลด์สำหรับ checkout เช่น `amount_paid`, `amount_due`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at` และ `direct_onchain_rails` แต่ไม่มี `reference_id` ถ้าต้องใช้ `reference_id` ฝั่ง merchant ให้ใช้ response ตอนสร้างใบแจ้งหนี้หรือ webhook `invoice.paid`

ยอดเงินในการตอบกลับถูกปรับให้เป็นทศนิยม 4 ตำแหน่งเสมอ: สร้างด้วย `'129'` ใบแจ้งหนี้จะตอบกลับ `amount: '129.0000'` เวลาจะเทียบยอดเงินให้เทียบเป็นตัวเลข อย่าเทียบเป็นสตริง
`amount_due` คำนวณจาก `max(amount - amount_paid, 0)` และใช้สเกลทศนิยม 18 ตำแหน่งเหมือน `amount_paid`

ถ้าเกิดข้อผิดพลาด ทุกเมธอดจะคืน `Promise` ที่ reject พร้อมข้อผิดพลาดต่อไปนี้:

- `InvoqApiError` สำหรับการตอบกลับ API ที่ไม่ใช่ 2xx — มี `status`, `code`, `fields`, `meta` และ `payload` ดิบ
- `InvoqError` สำหรับการเชื่อมต่อล้มเหลว หมดเวลารอ และอินพุตไม่ถูกต้อง

request จะหมดเวลารอที่ 10 วินาทีโดยค่าเริ่มต้น (`timeoutMs`) `create` ที่หมดเวลารอสามารถลองใหม่ด้วย `reference_id` เดิมได้อย่างปลอดภัย — จะได้ใบแจ้งหนี้ใบเดิมกลับมา ไม่มีทางเกิดใบซ้ำ

`verifyWebhook(rawBody, headers, secret)` รับเนื้อหา request ดิบเป็นสตริง, `Uint8Array` หรือ `Buffer` ของ Node และรับ headers เป็นออบเจกต์ `Headers` ของ Fetch หรือออบเจกต์ header ธรรมดาของ Node คืนค่าเป็นเหตุการณ์ที่แปลงแล้ว หรือโยน `InvoqSignatureVerificationError` ใช้ `isInvoicePaid(event)` สำหรับเหตุการณ์ `invoice.paid` ที่จัดการคำสั่งซื้อได้ โดย helper นี้รับสถานะใบแจ้งหนี้ที่ถือว่าชำระแล้ว (`paid`, `settling` หรือ `settled`) และปฏิเสธ `review_required`

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // ระบุได้ถ้าต้องการทับค่าเริ่มต้น
  styleNonce: undefined, // CSP nonce สำหรับแท็ก <style> ที่ถูกแทรก ระบุได้
  signal: undefined, // AbortSignal สำหรับสั่งปิดหน้าชำระเงิน ระบุได้
})

checkout.invoiceId // id ของใบแจ้งหนี้
checkout.close() // สั่งปิดจากโค้ด
const result = await checkout.result
```

`Promise` ของ `result` จะ resolve เสมอและไม่มีวัน reject ด้วยค่าใดค่าหนึ่งต่อไปนี้:

- `{ status: 'paid' | 'overpaid', invoiceId }` — ยืนยันการจ่ายแล้ว หน้าชำระเงินจะค้างอยู่ที่หน้าจอสำเร็จจนกว่าผู้ซื้อจะปิดเอง ถ้าคุณจะเปลี่ยนหน้าทันทีให้เรียก `checkout.close()` ก่อน
- `{ status: 'review_required', invoiceId }` — ได้รับการชำระเงินแล้ว แต่ต้องผ่านการตรวจสอบโดยเจ้าหน้าที่ก่อน แสดงสถานะรอตรวจสอบ และอย่าใช้ผลจากเบราว์เซอร์เพื่อจัดการคำสั่งซื้อ
- `{ status: 'closed', invoiceId, reason }` — ปิดไปโดยยังไม่จ่าย `reason` เป็นได้ทั้ง `'user'` (กดปุ่มปิดหรือ Escape), `'programmatic'` (`checkout.close()`), `'replaced'` (มีการเรียก `openCheckout` ครั้งใหม่), หรือ `'aborted'` (`signal` ถูกยิง)
- `{ status: 'failed', invoiceId }` — หน้าชำระเงินโหลดไม่เสร็จภายใน 15 วินาที

ตัว `openCheckout` เองจะโยนข้อผิดพลาดเมื่ออินพุตไม่ถูกต้อง (`invoiceId` ต้องขึ้นต้นด้วย `inv_`) และบนเบราว์เซอร์ที่ไม่รองรับ Shadow DOM หน้าชำระเงินเปิดได้ทีละหนึ่งเท่านั้น เปิดอันใหม่จะปิดอันเก่าด้วย `reason: 'replaced'`

ถ้าไม่ใช้ bundler ให้โหลดบิลด์สำหรับเบราว์เซอร์จาก CDN ซึ่งจะมีตัวแปร global ชื่อ `Invoq` ให้ใช้:

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## ปรับค่าสภาพแวดล้อม

ค่าเริ่มต้นในสภาพแวดล้อมจริง:

- origin ของ API: `https://api.invoq.money`
- origin ของหน้าชำระเงิน: `https://embed.invoq.money`

ตอนพัฒนาบนเครื่องหรือทดสอบพรีวิว ให้ปรับทับค่าเริ่มต้นได้:

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

`apiOrigin` และ `checkoutOrigin` ต้องเป็น origin แบบ `http` หรือ `https` เต็มรูปแบบ SDK ฝั่งเซิร์ฟเวอร์จะต่อท้ายด้วยพาธ API `/v1/...` ส่วน SDK ฝั่ง checkout จะต่อท้ายด้วย `/:invoiceId` และพารามิเตอร์ query ของหน้าชำระเงิน

## ชุมชนและความช่วยเหลือ

- X: [@invoqmoney](https://x.com/invoqmoney) · 中文: [@invoqcn](https://x.com/invoqcn)
- แชท: [Discord](https://discord.gg/V8cVrg4dET)
- ประกาศ: [ช่อง Telegram](https://telegram.me/invoqmoney)
- อีเมล: help@invoq.money

ถ้า invoq มีประโยชน์กับคุณ ดาวหนึ่งดวงบน repo นี้ช่วยให้คนอื่นเจอมันง่ายขึ้น

## สัญญาอนุญาต

[MIT](../LICENSE)
