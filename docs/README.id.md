# invoq JavaScript SDK

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · **Bahasa Indonesia** · [Español](./README.es-419.md) · [Français](./README.fr.md) · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · [ไทย](./README.th.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)

> Dokumen ini terjemahan dari README bahasa Inggris; kalau ada perbedaan, [versi bahasa Inggris](../README.md) yang berlaku.

Terima pembayaran stablecoin di situs Anda lewat jendela checkout yang tertanam di halaman — pembeli tidak perlu pergi ke mana pun. [invoq](https://invoq.money) non-kustodial: dana masuk langsung ke dompet Anda sendiri, invoq tidak pernah memegangnya.

- Buat invoice pembayaran dari server Anda.
- Buka jendela pembayaran stablecoin langsung di halaman situs Anda.
- Proses pesanan dengan aman lewat webhook bertanda tangan.

<img src="../assets/checkout-modal.png" alt="Jendela checkout stablecoin invoq yang tertanam di situs merchant" width="768">

Mau lihat dulu? Beranda [invoq.money](https://invoq.money) menjalankan demo interaktif checkout ini — Anda bisa menyelesaikan pembayaran simulasi dalam hitungan detik.

## Kenapa invoq

- **Dompet Anda, bukan dompet kami.** Setiap pembayaran masuk ke dompet yang hanya Anda kendalikan — invoq tidak bisa mengubah tujuannya.
- **USDC & USDT di sembilan jaringan.** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum.
- **Tanpa gas untuk menerima uang.** Pembeli membayar biaya transfernya sendiri; biaya settlement on-chain ditanggung invoq.
- **Pembeli tidak perlu mendaftar apa pun.** Dompet apa pun bisa bayar — langsung dari bursa juga bisa. Checkout ini tersedia dalam sepuluh bahasa.
- **Harga sederhana.** 10 pembayaran pertama gratis, lalu 0,5%, tanpa biaya lain — lihat harga terbaru di [invoq.money](https://invoq.money).

## SDK server

Buat invoice dan verifikasi webhook dari backend Anda dalam bahasa mana pun berikut — REST API dan tanda tangan webhook-nya sama persis. Repo ini adalah SDK JavaScript.

| Bahasa  | Repositori                                                                   |
| ------- | ---------------------------------------------------------------------------- |
| Node.js | **repo ini** — `@invoq/server`                                               |
| Python  | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP     | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php)       |
| Go      | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go)         |
| Rust    | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust)     |
| Ruby    | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby)     |

Backend mana pun yang Anda pilih, sisi browser-nya sama: **`@invoq/checkout`** (di repo ini) membuka jendela checkout yang tertanam di halaman untuk frontend apa pun.

## Instalasi

Pasang paket server di backend Anda:

```sh
npm install @invoq/server
```

Pasang paket checkout di frontend Anda:

```sh
npm install @invoq/checkout
```

Kedua paket ditulis dalam TypeScript dan menyertakan definisi tipe. `@invoq/server` membutuhkan Node.js 20 atau lebih baru — untuk produksi, gunakan lini LTS Node.js yang masih didukung, misalnya Node.js 22 atau 24. `@invoq/checkout` tidak punya dependensi runtime dan bisa dipakai dengan framework apa pun, atau langsung lewat `<script>` dari CDN.

## Siapkan kunci Anda

1. Masuk ke [dashboard invoq](https://app.invoq.money) dan buat sebuah proyek.
2. Di halaman **API keys**, buat kunci rahasia (secret key). Kunci uji coba diawali `sk_test_`, kunci produksi diawali `sk_live_`. Mode kuncinya menentukan apakah invoice yang dibuat itu uji coba atau produksi.
3. Di pengaturan **webhooks** proyek Anda, simpan URL webhook Anda. Kunci rahasia webhook (`whsec_...`) untuk mode itu hanya ditampilkan sekali, saat webhook pertama kali diaktifkan — langsung simpan. URL webhook harus berupa URL HTTPS yang bisa diakses publik.

Tambahkan keduanya ke lingkungan server Anda:

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

Mulailah dengan kunci uji coba. Ganti ke kunci produksi dan kunci rahasia webhook produksi saat masuk produksi.

## Mulai cepat

Anda akan menambahkan:

- Satu endpoint server untuk membuat invoice.
- Satu endpoint server untuk menerima webhook.
- Satu tombol frontend untuk membuka checkout.

Buat invoice di server Anda dengan kunci rahasia:

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

Catatan:

- Contoh servernya berupa handler rute berbasis Web Fetch API (Next.js App Router, Hono, dan sejenisnya). Di Express, kirim responsnya dengan `res.json({ invoiceId: invoice.id })`.
- Tentukan jumlahnya di sisi server. Jangan percaya jumlah yang dikirim klien.
- `amount` adalah string desimal USD dari `'0.01'` sampai `'999.99'` dengan maksimal 2 angka di belakang koma, misalnya `'129'` atau `'129.99'`.
- Pakai `reference_id` untuk memetakan webhook `invoice.paid` kembali ke pesanan Anda. Ini juga membuat pembuatan invoice aman diulang: membuat lagi dengan `reference_id` yang sama dan ketentuan invoice yang sama mengembalikan invoice yang sudah ada, bukan duplikat, sementara ketentuan yang berbeda gagal dengan error API `409 reference_id_conflict`.

Di frontend, panggil endpoint server Anda dulu, lalu teruskan `invoiceId` yang dikembalikan ke checkout:

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
      // Tampilkan status berhasil di UI Anda.
    } else if (result.status === 'review_required') {
      // Tampilkan status menunggu peninjauan. Jangan proses pesanan dari hasil browser.
    } else if (result.status === 'failed') {
      // Checkout gagal dimuat. Tampilkan error dan tawarkan coba lagi.
    }
  }

  return <button onClick={handlePay}>Bayar dengan stablecoin</button>
}
```

`@invoq/checkout` tidak terikat framework. React, Vue, Svelte, JavaScript polos, dan frontend lain memakai panggilan `openCheckout(invoiceId)` yang sama.

Terima webhook di server Anda:

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // Proses pesanan untuk invoice ini.
    // event.data.invoice.reference_id adalah reference_id Anda.
  }

  return Response.json({ received: true })
}
```

Gunakan webhook `invoice.paid` untuk memproses pesanan di server Anda. Saat `isInvoicePaid(event)` bernilai true, invoice siap diproses otomatis; pakai `reference_id` dari invoice untuk menemukan dan memproses pesanan Anda. Invoice dengan status `review_required` belum mengirim webhook `invoice.paid`; jika checkout mengembalikan `review_required`, tampilkan status menunggu peninjauan dan tunggu webhook `invoice.paid` berikutnya setelah peninjauan selesai.

Hasil `paid`, `overpaid`, dan `review_required` di browser hanyalah sinyal untuk antarmuka. Jangan memproses pesanan dari hasil browser. Di produksi, tambahkan status memuat dan penanganan error Anda sendiri di sekitar alur ini.

## Halaman checkout yang dihosting

Setiap invoice juga punya halaman checkout yang di-host di `https://pay.invoq.money/<id invoice>` — bagikan tautannya atau alihkan ke sana kalau jendela dalam halaman kurang pas. Anda juga bisa membuat invoice dan menyalin tautan pembayarannya di [dashboard](https://app.invoq.money), tanpa kode sama sekali.

## Uji end-to-end

Invoice uji coba tidak bisa menerima dana sungguhan. Simulasikan pembayarannya dari server Anda:

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` hanya bekerja pada invoice yang dibuat dengan kunci `sk_test_`. Begitu pembayaran mencapai jumlah invoice, invoice menjadi `paid` dan invoq mengirim webhook `invoice.paid` bertanda tangan sungguhan ke URL webhook uji coba Anda — jadi seluruh alur pemrosesan pesanan Anda ikut teruji. Jumlah parsial diperbolehkan dan menghasilkan `partially_paid`.

Untuk menerima webhook di mesin Anda sendiri, buka server lokal lewat tunnel HTTPS seperti ngrok atau cloudflared, lalu simpan URL tunnel-nya sebagai URL webhook uji coba di dashboard. Dashboard juga bisa mengirim `webhook.ping` bertanda tangan untuk mengecek koneksi.

## Webhook di produksi

**Verifikasi isi request mentah.** Tanda tangan dihitung dari byte yang persis dikirim invoq. Kalau framework Anda mem-parse JSON sebelum Anda sempat membaca isi mentahnya, verifikasi gagal. Contohnya di Express:

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
      // Proses pesanannya.
    }

    res.json({ received: true })
  },
)
```

**Proses pesanan secara idempoten.** Pengiriman yang gagal akan diulang (sampai 5 kali selama beberapa jam, dengan jeda yang makin lama), jadi endpoint Anda bisa menerima event yang sama lebih dari sekali. Catat pesanan yang sudah diproses berdasarkan `reference_id` atau `id` invoice, lalu abaikan kiriman ulang.

**Balas 2xx secepatnya.** Status lain dihitung sebagai pengiriman gagal: timeout, `429`, dan `5xx` diulang, sedangkan `4xx` lain tidak.

`verifyWebhook` melempar `InvoqSignatureVerificationError` saat tanda tangan hilang, tidak valid, atau timestamp-nya meleset lebih dari 5 menit — balas dengan 400. Header tanda tangannya `invoq-signature: t=<detik unix>,v1=<HMAC-SHA256 heks dari "<t>.<isi request mentah>">`, jadi Anda bisa memverifikasinya di bahasa apa pun.

## Referensi API

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // opsional, menimpa bawaan
  timeoutMs: 10_000, // opsional, timeout request, bawaan 10 detik
})
```

- `invoq.invoices.create(input)` — membuat invoice. `input`: `amount` (wajib), `currency` (`'USD'`, bawaan), `description`, `reference_id`, `return_url`.
- `invoq.invoices.get(invoiceId)` — mengambil invoice publik.
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — menyimulasikan pembayaran pada invoice uji coba.

`invoices.get()` mengembalikan bentuk invoice publik yang dipakai halaman checkout ter-hosting. Ini mencakup field untuk checkout seperti `amount_paid`, `amount_due`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at`, dan `direct_onchain_rails`, tetapi tidak menyertakan `reference_id`. Gunakan respons pembuatan atau webhook `invoice.paid` saat Anda membutuhkan `reference_id` merchant.

Jumlah di respons dinormalkan ke 4 angka desimal: buat dengan `'129'` dan invoice mengembalikan `amount: '129.0000'`. Bandingkan jumlah secara numerik, bukan sebagai string.
`amount_due` diturunkan sebagai `max(amount - amount_paid, 0)` dan memakai skala 18 desimal yang sama dengan `amount_paid`.

Jika gagal, semua metode mengembalikan `Promise` yang di-reject dengan:

- `InvoqApiError` untuk respons API non-2xx — punya `status`, `code`, `fields`, `meta`, dan `payload` mentah.
- `InvoqError` untuk kegagalan koneksi, timeout, dan input tidak valid.

Request akan timeout setelah 10 detik secara bawaan (`timeoutMs`). `create` yang timeout aman diulang dengan `reference_id` yang sama — Anda mendapat kembali invoice yang sudah ada, tidak pernah duplikat.

`verifyWebhook(rawBody, headers, secret)` menerima isi request mentah berupa string, `Uint8Array`, atau `Buffer` Node, dan headers berupa objek `Headers` Fetch atau objek header Node biasa. Fungsi ini mengembalikan event yang sudah di-parse atau melempar `InvoqSignatureVerificationError`. Pakai `isInvoicePaid(event)` untuk event `invoice.paid` yang bisa diproses; fungsi ini menerima status invoice yang setara dengan sudah dibayar (`paid`, `settling`, atau `settled`) dan menolak `review_required`.

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // opsional, menimpa bawaan
  styleNonce: undefined, // opsional, nonce CSP untuk <style> yang disuntikkan
  signal: undefined, // opsional, AbortSignal yang menutup jendela
})

checkout.invoiceId // id invoice-nya
checkout.close() // tutup lewat kode
const result = await checkout.result
```

`result` selalu resolve dan tidak pernah reject, dengan salah satu nilai berikut:

- `{ status: 'paid' | 'overpaid', invoiceId }` — pembayaran terkonfirmasi. Modal tetap terbuka menampilkan layar sukses embed sampai pembeli menutupnya; panggil `checkout.close()` dulu kalau Anda langsung berpindah halaman.
- `{ status: 'review_required', invoiceId }` — pembayaran diterima, tetapi perlu peninjauan manual. Tampilkan status menunggu peninjauan; jangan proses pesanan dari hasil browser.
- `{ status: 'closed', invoiceId, reason }` — ditutup tanpa pembayaran. `reason` bisa `'user'` (tombol tutup atau Escape), `'programmatic'` (`checkout.close()`), `'replaced'` (panggilan `openCheckout` lain), atau `'aborted'` (`signal` terpicu).
- `{ status: 'failed', invoiceId }` — checkout tidak termuat dalam 15 detik.

`openCheckout` sendiri melempar error pada input tidak valid (`invoiceId` harus diawali `inv_`) dan di browser tanpa dukungan Shadow DOM. Hanya satu checkout yang terbuka pada satu waktu; membuka yang lain menutup yang sebelumnya dengan `reason: 'replaced'`.

Tanpa bundler, muat build browser dari CDN. Build ini menyediakan variabel global `Invoq`:

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## Menimpa pengaturan lingkungan

Bawaan produksi:

- Origin API: `https://api.invoq.money`
- Origin checkout: `https://embed.invoq.money`

Timpa keduanya saat pengembangan lokal atau pengujian pratinjau:

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

`apiOrigin` dan `checkoutOrigin` harus berupa origin `http` atau `https` absolut. SDK server menambahkan path API `/v1/...`. SDK checkout menambahkan `/:invoiceId` dan parameter query checkout.

## Komunitas & dukungan

- X: [@invoqmoney](https://x.com/invoqmoney) · 中文: [@invoqcn](https://x.com/invoqcn)
- Obrolan: [Discord](https://discord.gg/V8cVrg4dET)
- Pembaruan: [Kanal Telegram](https://telegram.me/invoqmoney)
- Email: help@invoq.money

Kalau invoq berguna buat Anda, bintang di repo ini membantu orang lain menemukannya.

## Lisensi

[MIT](../LICENSE)
