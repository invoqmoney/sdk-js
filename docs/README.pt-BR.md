# SDKs JavaScript da invoq

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · [Español](./README.es-419.md) · [Français](./README.fr.md) · **Português** · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · [ไทย](./README.th.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)

> Este documento é uma tradução do README em inglês; se algo divergir, vale a [versão em inglês](../README.md).

Aceite pagamentos em stablecoin no seu site, em uma janela de checkout dentro da própria página — o comprador não precisa sair dali. A [invoq](https://invoq.money) não faz custódia: o dinheiro cai direto na sua própria carteira, a invoq nunca o retém.

- Crie faturas de pagamento a partir do seu servidor.
- Abra uma janela de pagamento em stablecoin dentro do seu site.
- Processe pedidos com segurança usando webhooks assinados.

<img src="../assets/checkout-modal.png" alt="Janela de checkout em stablecoin da invoq dentro do site de um lojista" width="768">

Quer ver primeiro? A página inicial de [invoq.money](https://invoq.money) roda uma demo interativa desse checkout — dá para completar um pagamento simulado em segundos.

## Por que a invoq

- **Sua carteira, não a nossa.** Cada pagamento cai numa carteira que só você controla — a invoq não consegue mudar o destino.
- **USDC e USDT em nove redes.** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum.
- **Zero gas para receber.** O comprador paga a própria taxa de envio; a invoq banca a liquidação on-chain.
- **O comprador não se cadastra em nada.** Qualquer carteira paga — direto de uma exchange também funciona. O checkout está disponível em dez idiomas.
- **Preço simples.** Os 10 primeiros pagamentos sem taxa, depois 0,5%, nenhuma outra taxa — veja os preços vigentes em [invoq.money](https://invoq.money).

## SDKs de servidor

Crie faturas e verifique webhooks a partir do seu backend em qualquer uma destas linguagens — mesma REST API, mesma assinatura de webhook. Este repositório é o SDK de JavaScript.

| Linguagem | Repositório                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| Node.js   | **este repositório** — `@invoq/server`                                       |
| Python    | [github.com/invoqmoney/sdk-python](https://github.com/invoqmoney/sdk-python) |
| PHP       | [github.com/invoqmoney/sdk-php](https://github.com/invoqmoney/sdk-php)       |
| Go        | [github.com/invoqmoney/sdk-go](https://github.com/invoqmoney/sdk-go)         |
| Rust      | [github.com/invoqmoney/sdk-rust](https://github.com/invoqmoney/sdk-rust)     |
| Ruby      | [github.com/invoqmoney/sdk-ruby](https://github.com/invoqmoney/sdk-ruby)     |

Qualquer que seja o backend escolhido, o lado do navegador é o mesmo: **`@invoq/checkout`** (neste repositório) abre a janela de checkout dentro da página para qualquer frontend.

## Instalação

Instale o pacote de servidor no seu backend:

```sh
npm install @invoq/server
```

Instale o pacote de checkout no seu frontend:

```sh
npm install @invoq/checkout
```

Os dois pacotes são escritos em TypeScript e já vêm com definições de tipos. O `@invoq/server` exige Node.js 20 ou mais novo — em produção, use uma versão LTS do Node.js ainda suportada, como Node.js 22 ou 24. O `@invoq/checkout` não tem nenhuma dependência em tempo de execução e funciona com qualquer framework, ou direto de um `<script>` de CDN.

## Pegue suas chaves

1. Entre no [painel da invoq](https://app.invoq.money) e crie um projeto.
2. Na página **API keys**, crie uma chave secreta. Chaves de teste começam com `sk_test_`, chaves de produção com `sk_live_`. O modo da chave define se as faturas são de teste ou de produção.
3. Nas configurações de **webhooks** do projeto, salve a URL do seu webhook. O segredo do webhook (`whsec_...`) daquele modo aparece uma única vez, quando você ativa o webhook pela primeira vez — guarde na hora. A URL do webhook precisa ser HTTPS e pública.

Adicione os dois ao ambiente do seu servidor:

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

Comece com as chaves de teste. Troque para a chave de produção e o segredo de webhook de produção quando for para produção.

## Início rápido

Você vai adicionar:

- Uma rota no servidor para criar a fatura.
- Uma rota no servidor para receber webhooks.
- Um botão no frontend para abrir o checkout.

Crie uma fatura no seu servidor com a chave secreta:

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

- Os exemplos de servidor usam handlers de rota baseados na Web Fetch API (Next.js App Router, Hono e afins). No Express, envie a resposta com `res.json({ invoiceId: invoice.id })`.
- Defina o valor no servidor. Não confie em valores vindos do cliente.
- `amount` é uma string decimal em USD de `'0.01'` a `'999.99'`, com até 2 casas decimais, como `'129'` ou `'129.99'`.
- Use o `reference_id` para ligar os webhooks `invoice.paid` ao seu pedido. Ele também deixa a criação segura para repetir: se você criar de novo com o mesmo `reference_id` e os mesmos termos, recebe a fatura existente em vez de uma duplicata; com termos diferentes, a chamada falha com o erro de API `409 reference_id_conflict`.

No frontend, chame primeiro a sua rota e passe o `invoiceId` retornado para o checkout:

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
      // Mostre um estado de sucesso na sua UI.
    } else if (result.status === 'review_required') {
      // Mostre um estado de revisão pendente. Não processe o pedido a partir do resultado no navegador.
    } else if (result.status === 'failed') {
      // O checkout não carregou. Mostre um erro e ofereça tentar de novo.
    }
  }

  return <button onClick={handlePay}>Pagar com stablecoin</button>
}
```

O `@invoq/checkout` não depende de framework. React, Vue, Svelte, JavaScript puro e qualquer outro frontend usam a mesma chamada `openCheckout(invoiceId)`.

Receba os webhooks no seu servidor:

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // Libere o pedido desta fatura.
    // event.data.invoice.reference_id é o seu reference_id.
  }

  return Response.json({ received: true })
}
```

Use os webhooks `invoice.paid` para processar os pedidos no servidor. Quando `isInvoicePaid(event)` for true, a fatura está pronta para processamento automático; use o `reference_id` da fatura para achar e processar o pedido. Uma fatura `review_required` ainda não envia um webhook `invoice.paid`; se o checkout retornar `review_required`, mostre um estado de revisão pendente e aguarde um webhook `invoice.paid` posterior depois que a revisão for aprovada.

Os resultados `paid`, `overpaid` e `review_required` do navegador são só sinais para a interface. Não processe pedidos a partir de resultados do navegador. Em produção, adicione seu próprio estado de carregamento e tratamento de erros em volta desse fluxo.

## Página de checkout hospedada

Toda fatura também tem uma página de checkout hospedada em `https://pay.invoq.money/<id da fatura>` — compartilhe o link ou redirecione para lá quando a janela dentro da página não encaixar. Você também pode criar faturas e copiar os links de pagamento no [painel](https://app.invoq.money), sem escrever código.

## Teste de ponta a ponta

Faturas de teste não recebem dinheiro de verdade. Simule o pagamento a partir do servidor:

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

O `createTestPayment` só funciona em faturas criadas com chave `sk_test_`. Quando os pagamentos atingem o valor da fatura, ela vira `paid` e a invoq envia um webhook `invoice.paid` assinado de verdade para a sua URL de webhook de teste — ou seja, todo o seu fluxo de processamento de pedido é testado. Valores parciais são permitidos e produzem `partially_paid`.

Para receber webhooks na sua máquina, exponha o servidor local com um túnel HTTPS como ngrok ou cloudflared e salve a URL do túnel como URL de webhook de teste no painel. O painel também consegue enviar um `webhook.ping` assinado para checar a conectividade.

## Webhooks em produção

**Verifique o corpo bruto da requisição.** As assinaturas são calculadas sobre os bytes exatos que a invoq envia. Se o seu framework interpreta o JSON antes de você conseguir ler o texto bruto, a verificação falha. Por exemplo, no Express:

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
      // Processe o pedido.
    }

    res.json({ received: true })
  },
)
```

**Processe de forma idempotente.** Entregas que falham são reenviadas (até 5 tentativas ao longo de algumas horas, com intervalo crescente entre as tentativas), então a sua rota pode receber o mesmo evento mais de uma vez. Registre os pedidos já processados por `reference_id` ou pelo `id` da fatura e trate entregas repetidas como operações sem efeito.

**Responda com 2xx rápido.** Qualquer outro status conta como entrega falhada: timeouts, `429` e `5xx` são reenviados, enquanto outros `4xx` não.

O `verifyWebhook` lança `InvoqSignatureVerificationError` quando a assinatura está faltando, é inválida ou o timestamp está deslocado em mais de 5 minutos — responda com 400. O cabeçalho de assinatura é `invoq-signature: t=<segundos unix>,v1=<HMAC-SHA256 em hex de "<t>.<corpo bruto>">`, então dá para verificá-lo em qualquer linguagem.

## Referência da API

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // opcional, sobrescreve o padrão
  timeoutMs: 10_000, // opcional, timeout da requisição, padrão 10 s
})
```

- `invoq.invoices.create(input)` — cria uma fatura. `input`: `amount` (obrigatório), `currency` (`'USD'`, padrão), `description`, `reference_id`, `return_url`.
- `invoq.invoices.get(invoiceId)` — busca uma fatura pública.
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — simula um pagamento numa fatura de teste.

`invoices.get()` retorna o formato de fatura pública usado pela página de checkout hospedada. Ele inclui campos voltados ao checkout, como `amount_paid`, `amount_due`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at` e `direct_onchain_rails`, mas não inclui `reference_id`. Use a resposta de criação ou o webhook `invoice.paid` quando precisar do seu `reference_id` de comerciante.

Os valores nas respostas são normalizados para 4 casas decimais: crie com `'129'` e a fatura devolve `amount: '129.0000'`. Compare valores numericamente, não como texto.
`amount_due` é derivado como `max(amount - amount_paid, 0)` e usa a mesma escala de 18 casas decimais de `amount_paid`.

Quando falham, os métodos retornam uma `Promise` rejeitada com:

- `InvoqApiError` para respostas de API não 2xx — tem `status`, `code`, `fields`, `meta` e o `payload` bruto.
- `InvoqError` para falhas de conexão, tempos de espera esgotados e entrada inválida.

As requisições expiram em 10 segundos por padrão (`timeoutMs`). Um `create` que expirou é seguro de repetir com o mesmo `reference_id` — você recebe de volta a fatura existente, nunca uma duplicata.

`verifyWebhook(rawBody, headers, secret)` aceita o corpo bruto como string, `Uint8Array` ou `Buffer` do Node, e os headers como um objeto `Headers` do Fetch ou um objeto de headers comum do Node. Ele retorna o evento interpretado ou lança `InvoqSignatureVerificationError`. Use `isInvoicePaid(event)` para eventos `invoice.paid` que permitem processar pedidos; ele aceita status de fatura equivalentes a pagamento confirmado (`paid`, `settling` ou `settled`) e rejeita `review_required`.

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // opcional, sobrescreve o padrão
  styleNonce: undefined, // opcional, nonce de CSP para o <style> injetado
  signal: undefined, // opcional, AbortSignal que fecha a janela
})

checkout.invoiceId // o id da fatura
checkout.close() // fechar via código
const result = await checkout.result
```

A `Promise` de `result` sempre resolve e nunca rejeita, com um destes valores:

- `{ status: 'paid' | 'overpaid', invoiceId }` — pagamento confirmado. A janela continua aberta mostrando a tela de sucesso do embed até o comprador fechá-la; chame `checkout.close()` antes se você for navegar imediatamente.
- `{ status: 'review_required', invoiceId }` — pagamento recebido, mas precisa de revisão manual. Mostre um estado de revisão pendente; não processe o pedido a partir do resultado no navegador.
- `{ status: 'closed', invoiceId, reason }` — fechado sem pagamento. `reason` é `'user'` (botão de fechar ou Esc), `'programmatic'` (`checkout.close()`), `'replaced'` (outra chamada de `openCheckout`) ou `'aborted'` (o `signal` disparou).
- `{ status: 'failed', invoiceId }` — o checkout não carregou em 15 segundos.

O próprio `openCheckout` lança erro com entrada inválida (`invoiceId` precisa começar com `inv_`) e em navegadores sem suporte a Shadow DOM. Só um checkout fica aberto por vez; abrir outro fecha o anterior com `reason: 'replaced'`.

Sem bundler, carregue o build de navegador de um CDN. Ele expõe uma variável global `Invoq`:

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## Sobrescrever o ambiente

Padrões de produção:

- Origin da API: `https://api.invoq.money`
- Origin do checkout: `https://embed.invoq.money`

Sobrescreva-os no desenvolvimento local ou em testes de pré-visualização:

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

`apiOrigin` e `checkoutOrigin` precisam ser origins `http` ou `https` absolutos. O SDK de servidor anexa os caminhos de API `/v1/...`. O SDK de checkout anexa `/:invoiceId` e os parâmetros de query do checkout.

## Comunidade e suporte

- X: [@invoqmoney](https://x.com/invoqmoney) · 中文: [@invoqcn](https://x.com/invoqcn)
- Chat: [Discord](https://discord.gg/V8cVrg4dET)
- Atualizações: [Canal do Telegram](https://telegram.me/invoqmoney)
- E-mail: help@invoq.money

Se a invoq for útil para você, uma estrela neste repositório ajuda outras pessoas a encontrá-lo.

## Licença

[MIT](../LICENSE)
