# invoq JavaScript SDK'ları

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · [Español](./README.es-419.md) · [Français](./README.fr.md) · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · **Türkçe** · [ไทย](./README.th.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)

> Bu belge İngilizce README'nin çevirisidir; bir fark olursa [İngilizce sürüm](../README.md) esas alınır.

Web sitenizde stablecoin ödemeleri kabul edin. Ödeme, müşterinin siteden hiç ayrılmadığı, sayfa içine gömülü bir pencerede gerçekleşir. [invoq](https://invoq.money) parayı asla tutmaz: fonlar doğrudan kendi cüzdanınıza iner, invoq'ta durmaz.

- Sunucunuzdan ödeme faturaları oluşturun.
- Sitenizde sayfa içi stablecoin ödeme penceresi açın.
- Siparişleri imzalı webhook'larla güvenli şekilde işleyin.

<img src="../assets/checkout-modal.png" alt="Bir satıcı sitesine gömülü invoq sayfa içi stablecoin ödeme penceresi" width="768">

Önce görmek ister misiniz? [invoq.money](https://invoq.money) ana sayfası bu ödeme sayfasının etkileşimli bir demosunu çalıştırıyor — birkaç saniyede simüle bir ödemeyi tamamlayabilirsiniz.

## Neden invoq

- **Cüzdan sizin, bizim değil.** Her ödeme yalnızca sizin kontrol ettiğiniz cüzdana iner — invoq gideceği yeri değiştiremez.
- **Dokuz ağda USDC ve USDT.** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum.
- **Ödeme almak için gas yok.** Alıcı kendi gönderim ücretini öder; zincir üstü aktarımı invoq karşılar.
- **Alıcı için üyelik yok.** Herhangi bir cüzdan ödeyebilir — doğrudan borsadan da olur. Ödeme sayfası on dili destekler.
- **Basit fiyatlandırma.** İlk 10 ödeme ücretsiz, sonrası %0,5, başka hiçbir ücret yok — güncel fiyatlar için [invoq.money](https://invoq.money).

## Sunucu SDK'ları

Bu dillerin herhangi biriyle arka ucunuzdan fatura oluşturun ve webhook'ları doğrulayın — aynı REST API, aynı webhook imzası. Bu repo, JavaScript SDK'sıdır.

| Dil     | Repo                                                                         |
| ------- | ---------------------------------------------------------------------------- |
| Node.js | **bu repo** — `@invoq/server`                                                |
| Python  | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP     | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php)       |
| Go      | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go)         |
| Rust    | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust)     |
| Ruby    | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby)     |

Hangi arka ucu seçerseniz seçin, tarayıcı tarafı aynıdır: **`@invoq/checkout`** (bu repoda) her ön uç için sayfa içi ödeme penceresini açar.

## Kurulum

Sunucu paketini arka ucunuza kurun:

```sh
npm install @invoq/server
```

Checkout paketini ön ucunuza kurun:

```sh
npm install @invoq/checkout
```

İki paket de TypeScript ile yazıldı ve tip tanımlarıyla gelir. `@invoq/server` Node.js 20 veya üstünü ister — canlı ortamda hâlâ desteklenen bir Node.js LTS serisi kullanın, örneğin Node.js 22 ya da 24. `@invoq/checkout`'un hiçbir çalışma zamanı bağımlılığı yok; her framework'le, hatta doğrudan CDN'den bir `<script>` ile çalışır.

## Anahtarlarınızı alın

1. [invoq paneline](https://app.invoq.money) giriş yapın ve bir proje oluşturun.
2. **API keys** sayfasında bir gizli anahtar oluşturun. Test anahtarları `sk_test_` ile, canlı anahtarlar `sk_live_` ile başlar. Anahtarın modu, faturaların test mi canlı mı olacağını belirler.
3. Projenizin **webhooks** ayarlarında webhook URL'nizi kaydedin. O modun webhook sırrı (`whsec_...`) yalnızca bir kez, webhook'u ilk etkinleştirdiğinizde gösterilir — hemen saklayın. Webhook URL'leri herkese açık HTTPS URL'leri olmalı.

İkisini de sunucu ortamınıza ekleyin:

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

Test anahtarlarıyla başlayın. Canlı ortama geçerken canlı anahtara ve canlı webhook sırrına geçin.

## Hızlı başlangıç

Şunları ekleyeceksiniz:

- Fatura oluşturan bir sunucu uç noktası.
- Webhook'ları alan bir sunucu uç noktası.
- Ödeme sayfasını açan bir ön uç butonu.

Sunucunuzda gizli anahtarınızla bir fatura oluşturun:

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

Notlar:

- Sunucu örnekleri Web Fetch API tabanlı rota işleyicileridir (Next.js App Router, Hono ve benzerleri). Express'te yanıtı `res.json({ invoiceId: invoice.id })` ile gönderin.
- Tutarı sunucu tarafında belirleyin. İstemciden gelen tutarlara güvenmeyin.
- `amount`, `'0.01'` ile `'1000000.00'` arasında, en fazla 2 ondalık basamaklı, USD cinsinden ondalık bir dizedir — örneğin `'129'` veya `'129.99'`.
- `invoice.paid` webhook'larını siparişinize geri bağlamak için `reference_id` kullanın. Oluşturmayı yeniden denemeyi de güvenli kılar: aynı `reference_id` ve aynı fatura koşullarıyla tekrar oluşturursanız kopya yerine mevcut faturayı alırsınız; farklı koşullar ise `409 reference_id_conflict` API hatasıyla başarısız olur.

Ön uçta önce kendi sunucu uç noktanızı çağırın, dönen `invoiceId`'yi ödeme sayfasına verin:

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
      // UI'ınızda başarı durumunu gösterin.
    } else if (result.status === 'review_required') {
      // İnceleme bekleyen durumu gösterin. Tarayıcı sonucuna dayanarak siparişi işlemeyin.
    } else if (result.status === 'failed') {
      // Ödeme sayfası yüklenemedi. Hata gösterin ve yeniden denemeyi önerin.
    }
  }

  return <button onClick={handlePay}>Stablecoin ile öde</button>
}
```

`@invoq/checkout` herhangi bir framework'e bağlı değildir. React, Vue, Svelte, saf JavaScript ve diğer tüm ön uçlar aynı `openCheckout(invoiceId)` çağrısını kullanır.

Webhook'ları sunucunuzda alın:

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // Bu faturanın siparişini işleyin.
    // event.data.invoice.reference_id sizin reference_id'niz.
  }

  return Response.json({ received: true })
}
```

Siparişleri sunucunuzda `invoice.paid` webhook'larıyla işleyin. `isInvoicePaid(event)` true olduğunda fatura otomatik olarak işlenmeye hazırdır; faturadaki `reference_id` ile siparişinizi bulup işleyin. `review_required` durumundaki fatura şu anda `invoice.paid` webhook'u göndermez; checkout `review_required` döndürürse inceleme bekleyen bir durum gösterin ve inceleme onaylandıktan sonra gelecek `invoice.paid` webhook'unu bekleyin.

Tarayıcıdaki `paid`, `overpaid` ve `review_required` sonuçları yalnızca arayüz için sinyaldir. Siparişleri tarayıcı sonuçlarına göre işlemeyin. Canlı ortamda bu akışın etrafına kendi yükleme durumunuzu ve hata yönetiminizi ekleyin.

## Barındırılan ödeme sayfası

Her faturanın `https://pay.invoq.money/<fatura id>` adresinde barındırılan bir ödeme sayfası da var — sayfa içi pencere uygun olmadığında bağlantıyı paylaşın ya da oraya yönlendirin. Faturaları [panelde](https://app.invoq.money) de oluşturup ödeme bağlantılarını kopyalayabilirsiniz, kod gerekmez.

## Uçtan uca test edin

Test faturaları gerçek para alamaz. Ödemeyi sunucunuzdan simüle edin:

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` yalnızca `sk_test_` anahtarıyla oluşturulmuş faturalarda çalışır. Ödemeler fatura tutarına ulaştığında fatura `paid` olur ve invoq, test webhook URL'nize gerçekten imzalanmış bir `invoice.paid` webhook'u gönderir — yani bütün sipariş işleme yolunuz sınanmış olur. Kısmi tutarlara izin verilir; sonuç `partially_paid` olur.

Webhook'ları kendi makinenizde almak için yerel sunucunuzu ngrok veya cloudflared gibi bir HTTPS tüneliyle dışa açın ve tünel URL'sini panelde test webhook URL'niz olarak kaydedin. Panel, bağlantıyı denetlemek için imzalı bir `webhook.ping` de gönderebilir.

## Canlı ortamda webhook'lar

**Ham istek gövdesiyle doğrulayın.** İmzalar, invoq'un gönderdiği baytların tam üzerinde hesaplanır. Framework'ünüz siz ham metni okuyamadan JSON'u ayrıştırırsa doğrulama başarısız olur. Örneğin Express'te:

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
      // Siparişi işleyin.
    }

    res.json({ received: true })
  },
)
```

**Tekrar geldiğinde güvenli olacak şekilde işleyin.** Başarısız teslimatlar yeniden denenir (birkaç saate yayılan en fazla 5 deneme, denemeler arası süre giderek artar); uç noktanız aynı olayı birden fazla kez alabilir. İşlenmiş siparişleri `reference_id` veya fatura `id`'siyle takip edin, tekrar gelen teslimatları yok sayın.

**Hızla 2xx dönün.** Diğer her durum kodu başarısız teslimat sayılır: zaman aşımları, `429` ve `5xx` yeniden denenir, diğer `4xx` yanıtları denenmez.

İmza eksikse, geçersizse ya da zaman damgası 5 dakikadan fazla kaymışsa `verifyWebhook`, `InvoqSignatureVerificationError` fırlatır — 400 ile yanıtlayın. İmza başlığı `invoq-signature: t=<unix saniye>,v1=<"<t>.<ham gövde>" değerinin onaltılık HMAC-SHA256'sı>` biçimindedir; yani istediğiniz dilde kendiniz de doğrulayabilirsiniz.

## API referansı

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // isteğe bağlı, varsayılanı değiştirir
  timeoutMs: 10_000, // isteğe bağlı istek zaman aşımı, varsayılan 10 sn
})
```

- `invoq.invoices.create(input)` — fatura oluşturur. `input`: `amount` (zorunlu), `currency` (`'USD'`, varsayılan), `description`, `reference_id`, `return_url`.
- `invoq.invoices.get(invoiceId)` — herkese açık faturayı getirir.
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — test faturasında ödeme simüle eder.

`invoices.get()` barındırılan checkout sayfasının kullandığı herkese açık fatura şeklini döndürür. `amount_paid`, `amount_due`, `amount_overpaid`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at`, `monitoring_status`, `transfers` ve `direct_onchain_rails` gibi checkout'a yönelik alanları içerir, ancak `reference_id` içermez. Merchant `reference_id` değeriniz gerektiğinde oluşturma yanıtını veya `invoice.paid` webhook'unu kullanın.

Yanıtlardaki tutarlar 4 ondalık basamağa normalize edilir: `'129'` ile oluşturun, fatura `amount: '129.0000'` döndürür. Tutarları dize olarak değil, sayısal karşılaştırın.
`amount_due`, `max(amount - amount_paid, 0)` olarak türetilir ve `amount_paid` ile aynı 18 ondalık basamak ölçeğini kullanır; `amount_overpaid` ise onun aynasıdır, `max(amount_paid - amount, 0)`, yani parayı kendiniz çıkarmanız hiç gerekmez. `monitoring_status`, `'active'` ya da `'ended'` olur — `'ended'` olduğunda yatırma adresi artık izlenmez — ve `transfers`, onaylanmış zincir üstü tahsilat kaydıdır (her girdide `tx_hash`, `amount` ve `explorer_tx_url` bulunur). İkisi de test faturaları için `null` / `[]` olur.

Hata durumunda tüm metotlar, şu hatalarla reject olan bir `Promise` döndürür:

- 2xx olmayan API yanıtları için `InvoqApiError` — `status`, `code`, `fields`, `meta` ve ham `payload` taşır.
- Bağlantı hataları, zaman aşımı ve geçersiz giriş için `InvoqError`.

İstekler varsayılan olarak 10 saniyede zaman aşımına uğrar (`timeoutMs`). Zaman aşımına uğrayan bir `create`, aynı `reference_id` ile güvenle yeniden denenebilir — mevcut faturayı geri alırsınız, asla kopya oluşmaz.

`verifyWebhook(rawBody, headers, secret)` ham gövdeyi dize, `Uint8Array` veya Node `Buffer`'ı olarak; başlıkları Fetch `Headers` nesnesi ya da düz Node başlık nesnesi olarak kabul eder. Ayrıştırılmış olayı döndürür veya `InvoqSignatureVerificationError` fırlatır. İşlenebilir `invoice.paid` olayları için `isInvoicePaid(event)` kullanın; bu yardımcı ödeme tamamlanmış sayılan fatura durumlarını (`paid`, `settling` veya `settled`) kabul eder ve `review_required` durumunu reddeder.

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // isteğe bağlı, varsayılanı değiştirir
  styleNonce: undefined, // isteğe bağlı, enjekte edilen <style> için CSP nonce'u
  signal: undefined, // isteğe bağlı, pencereyi kapatan AbortSignal
})

checkout.invoiceId // fatura id'si
checkout.close() // koddan kapatın
const result = await checkout.result
```

`result` her zaman resolve olur ve asla reject etmez; şunlardan birini döndürür:

- `{ status: 'paid' | 'overpaid', invoiceId, mode }` — ödeme onaylandı. Pencere, müşteri kapatana kadar embed'in başarı ekranında açık kalır; hemen başka sayfaya geçecekseniz önce `checkout.close()` çağırın.
- `{ status: 'review_required', invoiceId, mode }` — ödeme alındı, ancak manuel inceleme gerekiyor. İnceleme bekleyen durumu gösterin; tarayıcı sonucuna dayanarak siparişi işlemeyin.
- `{ status: 'closed', invoiceId, reason }` — ödeme olmadan kapandı. `reason` şunlardan biri: `'user'` (kapat düğmesi veya Escape), `'programmatic'` (`checkout.close()`), `'replaced'` (başka bir `openCheckout` çağrısı), `'aborted'` (`signal` tetiklendi).
- `{ status: 'failed', invoiceId }` — ödeme sayfası 15 saniye içinde yüklenmedi.

Ödeme sonuçlarında `mode`, `'test'` veya `'live'` olur — tarayıcıda simüle edilmiş bir test ödemesini gerçek paradan ayırt edebilmeniz için bir ipucu. Yalnızca bilgilendirme amaçlıdır: siparişin işlendiğini her zaman sunucunuzda `invoice.paid` webhook'uyla doğrulayın.

`openCheckout`'un kendisi geçersiz girdide (`invoiceId` `inv_` ile başlamalı) ve Shadow DOM desteklemeyen tarayıcılarda hata fırlatır. Aynı anda yalnızca bir ödeme penceresi açık olur; bir yenisini açmak öncekini `reason: 'replaced'` ile kapatır.

Bundler olmadan, tarayıcı build'ini CDN'den yükleyin. `Invoq` adlı global bir değişken sunar:

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## Ortam ayarlarını değiştirme

Canlı ortam varsayılanları:

- API origin'i: `https://api.invoq.money`
- Ödeme sayfası origin'i: `https://embed.invoq.money`

Yerel geliştirmede veya önizleme testlerinde bunları değiştirin:

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

`apiOrigin` ve `checkoutOrigin` mutlak `http` veya `https` origin'leri olmalı. Sunucu SDK'sı sonlarına `/v1/...` API yollarını ekler. Checkout SDK'sı `/:invoiceId` ile ödeme sayfası query parametrelerini ekler.

## Topluluk ve destek

- X: [@invoqmoney](https://x.com/invoqmoney) · 中文: [@invoqcn](https://x.com/invoqcn)
- Sohbet: [Discord](https://discord.gg/V8cVrg4dET)
- Duyurular: [Telegram Kanalı](https://telegram.me/invoqmoney)
- E-posta: help@invoq.money

invoq işinize yaradıysa, bu repoya bir yıldız başkalarının da bulmasına yardım eder.

## Lisans

[MIT](../LICENSE)
