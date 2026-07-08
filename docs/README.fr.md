# SDK JavaScript invoq

[![npm — @invoq/server](https://img.shields.io/npm/v/@invoq/server?label=%40invoq%2Fserver)](https://www.npmjs.com/package/@invoq/server)
[![npm — @invoq/checkout](https://img.shields.io/npm/v/@invoq/checkout?label=%40invoq%2Fcheckout)](https://www.npmjs.com/package/@invoq/checkout)
[![CI](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/invoqmoney/sdk-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)

[English](../README.md) · [Bahasa Indonesia](./README.id.md) · [Español](./README.es-419.md) · **Français** · [Português](./README.pt-BR.md) · [Tiếng Việt](./README.vi.md) · [Türkçe](./README.tr.md) · [ไทย](./README.th.md) · [简体中文](./README.zh-Hans.md) · [繁體中文](./README.zh-Hant.md)

> Ce document est une traduction du README anglais ; en cas de divergence, la [version anglaise](../README.md) fait foi.

Acceptez des paiements en stablecoins sur votre site grâce à une fenêtre de paiement intégrée à la page, sans que le client ait besoin de la quitter. [invoq](https://invoq.money) ne conserve pas les fonds : ils arrivent directement dans votre propre portefeuille, invoq ne les détient jamais.

- Créez des factures de paiement depuis votre serveur.
- Ouvrez une fenêtre de paiement en stablecoins directement sur votre site.
- Traitez vos commandes en toute sécurité avec des webhooks signés.

<img src="../assets/checkout-modal.png" alt="Fenêtre de paiement en stablecoins invoq intégrée au site d’un marchand" width="768">

Envie de le voir d’abord ? La page d’accueil d’[invoq.money](https://invoq.money) propose une démo interactive de cette page de paiement : vous pouvez y effectuer un paiement simulé en quelques secondes.

## Pourquoi invoq

- **Votre portefeuille, pas le nôtre.** Chaque paiement atterrit dans un portefeuille que vous seul contrôlez — invoq ne peut pas en changer la destination.
- **USDC et USDT sur neuf réseaux.** Base, TRON, Solana, BNB Chain, Arbitrum, Polygon, HyperEVM, Morph, Ethereum.
- **Pas de gas pour encaisser.** L’acheteur paie ses propres frais d’envoi ; invoq couvre le règlement on-chain.
- **Aucun compte à créer pour l’acheteur.** N’importe quel portefeuille peut payer — directement depuis un exchange aussi. La page de paiement est disponible en dix langues.
- **Des tarifs simples.** Vos 10 premiers paiements sont sans frais, puis 0,5 %, sans autres frais — les tarifs en vigueur sont sur [invoq.money](https://invoq.money).

## Installation

Installez le paquet serveur dans votre backend :

```sh
npm install @invoq/server
```

Installez le paquet checkout dans votre frontend :

```sh
npm install @invoq/checkout
```

Les deux paquets sont écrits en TypeScript et livrés avec leurs définitions de types. `@invoq/server` nécessite Node.js 20 ou plus récent — en production, utilisez une ligne LTS de Node.js encore maintenue, comme Node.js 22 ou 24. `@invoq/checkout` n’a aucune dépendance à l’exécution et fonctionne avec n’importe quel framework, ou directement via un `<script>` de CDN.

## Récupérez vos clés

1. Connectez-vous au [tableau de bord invoq](https://app.invoq.money) et créez un projet.
2. Sur la page **API keys**, créez une clé secrète. Les clés de test commencent par `sk_test_`, les clés de production par `sk_live_`. Le mode de la clé détermine si les factures sont de test ou de production.
3. Dans les réglages **webhooks** de votre projet, enregistrez votre URL de webhook. Le secret du webhook (`whsec_...`) pour ce mode ne s’affiche qu’une seule fois, à la première activation du webhook — notez-le tout de suite. L’URL du webhook doit être une URL HTTPS publique.

Ajoutez les deux à l’environnement de votre serveur :

```sh
INVOQ_SECRET_KEY=sk_test_...
INVOQ_WEBHOOK_SECRET=whsec_...
```

Commencez avec les clés de test. Passez à la clé de production et au secret de webhook de production au moment de la mise en production.

## Démarrage rapide

Vous allez ajouter :

- Une route serveur pour créer une facture.
- Une route serveur pour recevoir les webhooks.
- Un bouton côté frontend pour ouvrir la page de paiement.

Créez une facture sur votre serveur avec votre clé secrète :

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

Notes :

- Les exemples serveur utilisent des gestionnaires de route basés sur la Web Fetch API (Next.js App Router, Hono et similaires). Avec Express, renvoyez la réponse avec `res.json({ invoiceId: invoice.id })`.
- Définissez le montant côté serveur. Ne faites pas confiance aux montants envoyés par le client.
- `amount` est une chaîne décimale en USD de `'0.01'` à `'999.99'`, avec au plus 2 décimales, comme `'129'` ou `'129.99'`.
- Utilisez `reference_id` pour relier les webhooks `invoice.paid` à votre commande. Il permet aussi de relancer la création sans risque : si vous recréez avec le même `reference_id` et les mêmes conditions, vous récupérez la facture existante au lieu d’un doublon ; avec des conditions différentes, l’appel échoue avec une erreur d’API `409 reference_id_conflict`.

Côté frontend, appelez d’abord votre route serveur, puis passez l’`invoiceId` renvoyé à la page de paiement :

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
      // Affichez un état de succès dans votre UI.
    } else if (result.status === 'review_required') {
      // Affichez un état en attente de vérification. Ne traitez pas la commande à partir du résultat navigateur.
    } else if (result.status === 'failed') {
      // La page de paiement n’a pas chargé. Affichez une erreur et proposez de réessayer.
    }
  }

  return <button onClick={handlePay}>Payer en stablecoin</button>
}
```

`@invoq/checkout` ne dépend d’aucun framework. React, Vue, Svelte, JavaScript pur et tout autre frontend utilisent le même appel `openCheckout(invoiceId)`.

Recevez les webhooks sur votre serveur :

```ts
import { isInvoicePaid, verifyWebhook } from '@invoq/server'

export async function POST(request: Request) {
  const event = verifyWebhook(
    await request.text(),
    request.headers,
    process.env.INVOQ_WEBHOOK_SECRET!,
  )

  if (isInvoicePaid(event)) {
    // Traitez la commande liée à cette facture.
    // event.data.invoice.reference_id est votre reference_id.
  }

  return Response.json({ received: true })
}
```

Traitez les commandes à partir des webhooks `invoice.paid` reçus côté serveur. Quand `isInvoicePaid(event)` est vrai, la facture peut être traitée automatiquement ; utilisez son `reference_id` pour retrouver et traiter votre commande. Une facture `review_required` n’émet pas encore de webhook `invoice.paid` ; si le checkout renvoie `review_required`, affichez un état en attente de vérification et attendez un webhook `invoice.paid` ultérieur après validation.

Les résultats `paid`, `overpaid` et `review_required` du navigateur ne sont que des indications pour l’interface. Ne traitez jamais une commande à partir d’un résultat navigateur. En production, ajoutez votre propre état de chargement et votre gestion d’erreurs autour de ce flux.

## Page de paiement hébergée

Chaque facture a aussi une page de paiement hébergée sur `https://pay.invoq.money/<id de facture>` — partagez le lien ou redirigez-y quand la fenêtre intégrée ne convient pas. Vous pouvez aussi créer des factures et copier leurs liens de paiement dans le [tableau de bord](https://app.invoq.money), sans écrire de code.

## Testez de bout en bout

Les factures de test ne peuvent pas recevoir de vrais fonds. Simulez le paiement depuis votre serveur :

```ts
const paid = await invoq.invoices.createTestPayment(invoice.id, {
  amount: invoice.amount,
})

console.log(paid.status) // 'paid'
```

`createTestPayment` ne fonctionne que sur les factures créées avec une clé `sk_test_`. Quand les paiements atteignent le montant de la facture, celle-ci passe à `paid` et invoq envoie un vrai webhook `invoice.paid` signé à votre URL de webhook de test — tout votre flux de traitement est donc testé. Les montants partiels sont autorisés et produisent `partially_paid`.

Pour recevoir des webhooks sur votre machine, exposez votre serveur local via un tunnel HTTPS comme ngrok ou cloudflared, et enregistrez l’URL du tunnel comme URL de webhook de test dans le tableau de bord. Le tableau de bord peut aussi envoyer un `webhook.ping` signé pour vérifier la connectivité.

## Les webhooks en production

**Vérifiez le corps brut de la requête.** Les signatures sont calculées sur les octets exacts envoyés par invoq. Si votre framework analyse le JSON avant que vous puissiez lire le texte brut, la vérification échoue. Par exemple, sous Express :

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
      // Traitez la commande.
    }

    res.json({ received: true })
  },
)
```

**Traitez les événements de façon idempotente.** Les livraisons échouées sont retentées (jusqu’à 5 tentatives sur quelques heures, avec un délai croissant entre les tentatives) ; votre route peut donc recevoir le même événement plusieurs fois. Suivez les commandes déjà traitées par `reference_id` ou par `id` de facture, et ignorez les livraisons répétées.

**Répondez vite avec un 2xx.** Tout autre statut compte comme une livraison échouée : les délais dépassés, `429` et `5xx` sont retentés, les autres `4xx` ne le sont pas.

`verifyWebhook` lève `InvoqSignatureVerificationError` quand la signature est absente, invalide, ou que l’horodatage est décalé de plus de 5 minutes — répondez alors par un 400. L’en-tête de signature est `invoq-signature: t=<secondes unix>,v1=<HMAC-SHA256 hexadécimal de "<t>.<corps brut>">`, vous pouvez donc le vérifier dans n’importe quel langage.

## Référence de l’API

### `@invoq/server`

```ts
const invoq = new Invoq(apiKey, {
  apiOrigin: 'https://api.invoq.money', // optionnel, remplace le défaut
  timeoutMs: 10_000, // optionnel, délai des requêtes, 10 s par défaut
})
```

- `invoq.invoices.create(input)` — crée une facture. `input` : `amount` (requis), `currency` (`'USD'`, défaut), `description`, `reference_id`, `return_url`.
- `invoq.invoices.get(invoiceId)` — récupère une facture publique.
- `invoq.invoices.createTestPayment(invoiceId, { amount, reference_id? })` — simule un paiement sur une facture de test.

`invoices.get()` renvoie la forme de facture publique utilisée par la page de checkout hébergée. Elle inclut les champs côté checkout, comme `amount_paid`, `amount_due`, `payment_status`, `project`, `deposit_address`, `monitoring_ends_at` et `direct_onchain_rails`, mais n’inclut pas `reference_id`. Utilisez la réponse de création ou le webhook `invoice.paid` quand vous avez besoin de votre `reference_id` marchand.

Les montants des réponses sont normalisés à 4 décimales : créez avec `'129'` et la facture renvoie `amount: '129.0000'`. Comparez les montants numériquement, pas comme des chaînes.
`amount_due` est dérivé sous la forme `max(amount - amount_paid, 0)` et utilise la même échelle à 18 décimales que `amount_paid`.

En cas d’échec, les méthodes renvoient une `Promise` rejetée avec :

- `InvoqApiError` pour les réponses d’API non 2xx — porte `status`, `code`, `fields`, `meta` et le `payload` brut.
- `InvoqError` pour les échecs de connexion, les délais d’attente dépassés et les entrées invalides.

Les requêtes expirent au bout de 10 secondes par défaut (`timeoutMs`). Un `create` expiré peut être réessayé sans risque avec le même `reference_id` — vous récupérez la facture existante, jamais un doublon.

`verifyWebhook(rawBody, headers, secret)` accepte le corps brut sous forme de chaîne, de `Uint8Array` ou de `Buffer` Node, et les en-têtes sous forme d’objet `Headers` Fetch ou d’objet d’en-têtes Node classique. Il renvoie l’événement analysé ou lève `InvoqSignatureVerificationError`. Utilisez `isInvoicePaid(event)` pour les événements `invoice.paid` permettant de traiter une commande ; il accepte les statuts de facture assimilables à un paiement validé (`paid`, `settling` ou `settled`) et rejette `review_required`.

### `@invoq/checkout`

```ts
const checkout = openCheckout(invoiceId, {
  checkoutOrigin: 'https://embed.invoq.money', // optionnel, remplace le défaut
  styleNonce: undefined, // optionnel, nonce CSP pour le <style> injecté
  signal: undefined, // optionnel, AbortSignal qui ferme la fenêtre
})

checkout.invoiceId // l’id de la facture
checkout.close() // fermer par le code
const result = await checkout.result
```

`result` se résout toujours (il ne rejette jamais) avec l’un de ces objets :

- `{ status: 'paid' | 'overpaid', invoiceId }` — paiement confirmé. La fenêtre reste ouverte sur l’écran de succès intégré jusqu’à ce que le client la ferme ; appelez d’abord `checkout.close()` si vous naviguez immédiatement.
- `{ status: 'review_required', invoiceId }` — paiement reçu, mais vérification manuelle requise. Affichez un état en attente de vérification ; ne traitez pas la commande à partir du résultat navigateur.
- `{ status: 'closed', invoiceId, reason }` — fermée sans paiement. `reason` vaut `'user'` (bouton de fermeture ou Échap), `'programmatic'` (`checkout.close()`), `'replaced'` (un autre appel à `openCheckout`) ou `'aborted'` (le `signal` s’est déclenché).
- `{ status: 'failed', invoiceId }` — la page de paiement n’a pas chargé sous 15 secondes.

`openCheckout` lui-même lève une erreur sur entrée invalide (`invoiceId` doit commencer par `inv_`) et dans les navigateurs sans Shadow DOM. Une seule page de paiement est ouverte à la fois ; en ouvrir une autre ferme la précédente avec `reason: 'replaced'`.

Sans bundler, chargez le build navigateur depuis un CDN. Il expose une variable globale `Invoq` :

```html
<script src="https://unpkg.com/@invoq/checkout"></script>
<script>
  Invoq.openCheckout(invoiceId)
</script>
```

## Surcharger l’environnement

Valeurs par défaut en production :

- Origin de l’API : `https://api.invoq.money`
- Origin de la page de paiement : `https://embed.invoq.money`

Surchargez-les en développement local ou pour tester une préversion :

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

`apiOrigin` et `checkoutOrigin` doivent être des origines `http` ou `https` absolues. Le SDK serveur y ajoute les chemins d’API `/v1/...`. Le SDK checkout y ajoute `/:invoiceId` et les paramètres de requête de la page de paiement.

## Communauté et support

- X : [@invoqmoney](https://x.com/invoqmoney) · 中文 : [@invoqcn](https://x.com/invoqcn)
- Chat : [Discord](https://discord.gg/V8cVrg4dET)
- Annonces : [Chaîne Telegram](https://t.me/invoqmoney)
- E-mail : help@invoq.money

Les SDK serveur invoq existent aussi pour Go, PHP, Python, Ruby et Rust. Si invoq vous est utile, une étoile sur ce dépôt aide les autres à le trouver.

## Licence

[MIT](../LICENSE)
